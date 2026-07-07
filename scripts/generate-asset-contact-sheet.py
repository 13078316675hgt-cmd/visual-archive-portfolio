from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "review" / "assets-contact-sheet.jpg"
ASSETS = [
    ("title-architecture-00.png", "TITLE"),
    ("hero-artwork-primary-v3.png", "KEY VISUAL 01"),
    ("hero-eclipse-v3.png", "KEY VISUAL 02"),
    ("character-sheet-01.png", "CHARACTER SHEETS / CONTENTS 03"),
    ("character-sheet-02.png", "CHARACTER SHEETS"),
    ("character-sheet-03.png", "CHARACTER SHEETS / COSTUME DETAIL / CONTENTS 04"),
    ("character-sheet-04.png", "CHARACTER SHEETS"),
    ("portrait-01.png", "PORTRAIT STUDY 01"),
    ("portrait-white-hair.png", "PORTRAIT STUDY 02 / CONTENTS 06"),
    ("selected-illustration-green.png", "SELECTED WORKS / CONTENTS 07"),
    ("character-presentation-purple.png", "SELECTED WORKS"),
    ("study-red-profile.png", "SELECTED WORKS"),
    ("study-blue-sky.png", "SELECTED WORKS"),
    ("character-design-14.jpg", "ADDITIONAL CHARACTER DESIGNS"),
    ("character-design-15.jpg", "ADDITIONAL CHARACTER DESIGNS"),
    ("character-design-16.png", "ADDITIONAL CHARACTER DESIGNS"),
    ("character-design-tianzi.png", "ADDITIONAL CHARACTER DESIGNS / CONTENTS 08"),
]

W, PAD, GAP, COLS = 1800, 72, 28, 3
CARD_W = (W - PAD * 2 - GAP * (COLS - 1)) // COLS
IMAGE_H, LABEL_H = 420, 92
ROWS = (len(ASSETS) + COLS - 1) // COLS
H = PAD * 2 + 90 + ROWS * (IMAGE_H + LABEL_H) + (ROWS - 1) * GAP

sheet = Image.new("RGB", (W, H), "#F4F3EF")
draw = ImageDraw.Draw(sheet)
regular_path = Path("C:/Windows/Fonts/arial.ttf")
bold_path = Path("C:/Windows/Fonts/arialbd.ttf")
regular = ImageFont.truetype(str(regular_path), 20) if regular_path.exists() else ImageFont.load_default()
small = ImageFont.truetype(str(regular_path), 16) if regular_path.exists() else ImageFont.load_default()
bold = ImageFont.truetype(str(bold_path), 34) if bold_path.exists() else regular
draw.text((PAD, PAD), "PORTFOLIO V3.14 / ACTIVE ARTWORK", fill="#17191C", font=bold)
draw.rectangle((PAD, PAD + 56, PAD + 88, PAD + 62), fill="#B53B32")

for index, (filename, section) in enumerate(ASSETS):
    row, col = divmod(index, COLS)
    x = PAD + col * (CARD_W + GAP)
    y = PAD + 90 + row * (IMAGE_H + LABEL_H + GAP)
    source = ROOT / "public" / "assets" / "approved" / filename
    image = Image.open(source).convert("RGB")
    thumb = ImageOps.contain(image, (CARD_W, IMAGE_H))
    field = Image.new("RGB", (CARD_W, IMAGE_H), "#FFFFFF")
    field.paste(thumb, ((CARD_W - thumb.width) // 2, (IMAGE_H - thumb.height) // 2))
    sheet.paste(field, (x, y))
    draw.line((x, y + IMAGE_H + 14, x + CARD_W, y + IMAGE_H + 14), fill="#17191C", width=1)
    draw.text((x, y + IMAGE_H + 27), filename, fill="#17191C", font=regular)
    draw.text((x, y + IMAGE_H + 57), section, fill="#4F5359", font=small)

OUT.parent.mkdir(parents=True, exist_ok=True)
sheet.save(OUT, "JPEG", quality=92, optimize=True)
print(OUT)
