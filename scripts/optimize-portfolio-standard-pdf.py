from __future__ import annotations

import argparse
from io import BytesIO
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, NumberObject


def quality_for_page(page_number: int) -> int:
    if page_number in {3, 4, 6, 7, 10, 12}:
        return 94
    if page_number in {5}:
        return 93
    return 91


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    reader = PdfReader(args.source)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    converted: list[dict[str, object]] = []
    seen: set[tuple[int, int]] = set()

    for page_number, page in enumerate(writer.pages, start=1):
        for image_file in page.images:
            reference = image_file.indirect_reference
            if reference is None:
                continue
            key = (reference.idnum, reference.generation)
            if key in seen:
                continue
            seen.add(key)
            image_object = reference.get_object()
            if image_object.get("/Filter") != "/FlateDecode":
                continue
            if not image_object.get("/SMask"):
                continue
            compressed_bytes = len(getattr(image_object, "_data", b""))
            if compressed_bytes < 80_000:
                continue

            image = image_file.image
            if image.mode not in {"RGBA", "LA"}:
                continue
            rgb = image.convert("RGB")
            output = BytesIO()
            quality = quality_for_page(page_number)
            rgb.save(
                output,
                format="JPEG",
                quality=quality,
                subsampling=0,
                optimize=True,
                progressive=True,
            )
            jpeg_bytes = output.getvalue()
            if len(jpeg_bytes) >= compressed_bytes:
                continue

            image_object._data = jpeg_bytes
            image_object[NameObject("/Filter")] = NameObject("/DCTDecode")
            image_object[NameObject("/ColorSpace")] = NameObject("/DeviceRGB")
            image_object[NameObject("/BitsPerComponent")] = NumberObject(8)
            image_object.pop(NameObject("/DecodeParms"), None)
            image_object.pop(NameObject("/Decode"), None)
            converted.append(
                {
                    "page": page_number,
                    "name": image_file.name,
                    "width": image.width,
                    "height": image.height,
                    "quality": quality,
                    "beforeBytes": compressed_bytes,
                    "afterBytes": len(jpeg_bytes),
                    "alphaMaskPreserved": True,
                }
            )

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    with args.destination.open("wb") as stream:
        writer.write(stream)

    print(
        {
            "source": str(args.source),
            "destination": str(args.destination),
            "converted": converted,
        }
    )


if __name__ == "__main__":
    main()
