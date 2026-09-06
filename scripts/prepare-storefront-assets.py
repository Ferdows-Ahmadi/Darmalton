"""Build optimized runtime assets from the supplied archives; never ship references."""
import argparse
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

from PIL import Image, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archives", type=Path, required=True)
    parser.add_argument("--brand", type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    public = root / "website/public"
    manifest = json.loads((root / "docs/product_image_manifest.json").read_text())
    sources = {}
    for archive in args.archives.glob("*.zip"):
        if archive.name.startswith("Darmalton_Assets_Batch_") or archive.name == "photos.zip":
            with zipfile.ZipFile(archive) as z:
                for name in z.namelist():
                    if Path(name).suffix.lower() in {".png", ".jpg"}:
                        sources[f"{archive.name}/{name}"] = z.read(name)

    def deliver(data, target, edge):
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(io.BytesIO(data)) as original:
            im = ImageOps.exif_transpose(original).convert("RGBA")
            im.thumbnail((edge, edge), Image.Resampling.LANCZOS)
            im.save(target, "WEBP", quality=85, method=6)

    for sku, row in manifest.items():
        if row["source"]:
            data = sources[row["source"]]
            deliver(data, public / row["stored_path"].lstrip("/"), 720)
            row["source_sha256"] = hashlib.sha256(data).hexdigest()
    for name, data in sources.items():
        stem = Path(name).stem
        folder = "icons" if stem.startswith("ICON-") else "categories" if "_Category_" in stem else "campaigns" if "_Campaign-Banner" in stem else None
        if folder:
            deliver(data, public / folder / f"{stem}.webp", 160 if folder == "icons" else 1280)
    # Text-free lifestyle source; the alternate supplied hero has baked-in controls/text.
    hero = next(data for name, data in sources.items() if name.endswith("ChatGPT Image Sep 6, 2026, 03_52_51 PM (1).png"))
    deliver(hero, public / "campaigns/health-delivered.webp", 1600)
    (public / "brand").mkdir(exist_ok=True)
    for source, target in [("11-darmalton-logo.png", "darmalton-logo.png"), ("12-darmalton-android-icon.png", "android-icon.png")]:
        (public / "brand" / target).write_bytes((args.brand / source).read_bytes())
    (root / "docs/product_image_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Prepared {sum(bool(r['source']) for r in manifest.values())} product images; 2 intentional fallbacks.")


if __name__ == "__main__":
    main()
