from __future__ import annotations

import argparse
from pathlib import Path

from pypdf import PdfReader, PdfWriter


METADATA = {
    "/Title": "黄国泰｜角色概念设计作品集",
    "/Author": "黄国泰",
    "/Subject": "Character Concept Art Portfolio",
    "/Keywords": (
        "角色概念设计, 游戏原画, 角色立绘, 角色三视图, "
        "Character Concept Art, Portfolio"
    ),
    "/Creator": "Visual Archive Portfolio",
    "/Producer": "Chromium / Playwright PDF Export",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    reader = PdfReader(args.source)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.add_metadata(METADATA)

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    with args.destination.open("wb") as stream:
        writer.write(stream)

    check = PdfReader(args.destination)
    actual = {key: str((check.metadata or {}).get(key, "")) for key in METADATA}
    if actual != METADATA:
        raise RuntimeError(f"PDF metadata verification failed: {actual!r}")
    if len(check.pages) != 13:
        raise RuntimeError(f"Expected 13 pages, found {len(check.pages)}")

    print(
        {
            "path": str(args.destination),
            "pages": len(check.pages),
            "metadata": actual,
        }
    )


if __name__ == "__main__":
    main()
