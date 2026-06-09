#!/usr/bin/env python3
"""Convert Soul Online runtime raster assets to WebP.

Usage:
  python scripts/optimize_assets.py

The script keeps the original files. Pass --delete-originals only after references
have been changed to .webp in assetManifest/style files.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image

ROOTS = [Path('src/assets'), Path('public/assets/soulpack')]
EXTS = {'.png', '.jpg', '.jpeg'}


def quality_for(path: Path) -> int:
    parts = set(path.parts)
    if 'characters' in parts or 'monsters' in parts:
        return 74
    if 'ui' in parts or 'cards' in parts or 'souls' in parts or 'weapons' in parts:
        return 82
    return 80


def convert(path: Path) -> tuple[int, int, Path]:
    out = path.with_suffix('.webp')
    image = Image.open(path)
    if image.mode not in ('RGB', 'RGBA'):
        image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
    image.save(out, 'WEBP', quality=quality_for(path), method=3, lossless=False)
    return path.stat().st_size, out.stat().st_size, out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--delete-originals', action='store_true', help='delete PNG/JPG files when a WebP was written')
    args = parser.parse_args()

    total_before = 0
    total_after = 0
    converted = 0
    for root in ROOTS:
      if not root.exists():
        continue
      for path in root.rglob('*'):
        if path.suffix.lower() not in EXTS:
          continue
        before, after, out = convert(path)
        total_before += before
        total_after += after
        converted += 1
        print(f'{path} -> {out}  {before/1024:.1f}KB -> {after/1024:.1f}KB')
        if args.delete_originals:
          path.unlink()
    saved = total_before - total_after
    print(f'converted={converted} before={total_before/1048576:.2f}MB after={total_after/1048576:.2f}MB saved={saved/1048576:.2f}MB')


if __name__ == '__main__':
    main()
