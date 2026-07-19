from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "docs" / "screenshots"
OUTPUT = ROOT / "docs" / "drawingflow-preview.gif"
FRAME_SIZE = (960, 640)


def prepare_frame(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    width, height = image.size
    crop_height = min(height, int(width * FRAME_SIZE[1] / FRAME_SIZE[0]))
    image = image.crop((0, 0, width, crop_height))
    image.thumbnail(FRAME_SIZE, Image.Resampling.LANCZOS)

    frame = Image.new("RGB", FRAME_SIZE, "#f4f7fa")
    frame.paste(image, ((FRAME_SIZE[0] - image.width) // 2, 0))
    return frame.quantize(colors=192, method=Image.Quantize.MEDIANCUT)


frames = [
    prepare_frame(SCREENSHOTS / name)
    for name in (
        "01-dashboard.png",
        "03-revision-evidence.png",
        "04-integrations.png",
        "05-audit-trail.png",
    )
]
frames[0].save(
    OUTPUT,
    save_all=True,
    append_images=frames[1:],
    duration=[1800, 1800, 1800, 1800],
    loop=0,
    optimize=True,
)
print(f"Built {OUTPUT.relative_to(ROOT)}")
