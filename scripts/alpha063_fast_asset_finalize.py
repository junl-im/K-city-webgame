from __future__ import annotations

from pathlib import Path
import shutil
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageChops

from alpha063_asset_upgrade import (
    ROOT, CHAR_ACCENTS, MONSTER_ACCENTS, safe_open, save_webp, grade_flat,
    create_ui_063_assets, create_taoist_male_portrait, update_pack_metadata
)


def copy_to_public(src_path: Path, relative_after_2p5d: str) -> None:
    dest = ROOT / 'public/assets/soulpack' / relative_after_2p5d
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src_path, dest)


def fast_sprite_grade(img: Image.Image, accent: tuple[int, int, int], strength: float = 1.0) -> Image.Image:
    img = img.convert('RGBA')
    alpha = img.getchannel('A')
    rgb = img.convert('RGB')
    rgb = ImageEnhance.Color(rgb).enhance(1.13 + strength * 0.04)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.055 + strength * 0.02)
    rgb = ImageEnhance.Brightness(rgb).enhance(1.025)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.14)
    out = rgb.convert('RGBA')
    out.putalpha(alpha)

    # Fast top-light without expensive morphology. Gives the sheets a clean reference-grade rim.
    w, h = out.size
    top = Image.new('L', (1, h))
    top.putdata([int(70 * (1 - y / max(1, h - 1))) for y in range(h)])
    top = ImageChops.multiply(alpha, top.resize((w, h))).point(lambda p: int(p * 0.38))
    light = Image.new('RGBA', out.size, (255, 255, 255, 0))
    light.putalpha(top)

    aura = Image.new('RGBA', out.size, accent + (0,))
    aura.putalpha(alpha.filter(ImageFilter.GaussianBlur(2)).point(lambda p: min(36, int(p * 0.16))))
    return Image.alpha_composite(Image.alpha_composite(aura, out), light)


def fast_icon_grade(path: Path, accent: tuple[int, int, int]) -> None:
    img = safe_open(path)
    if img is None:
        return
    out = grade_flat(img, accent, 0.75)
    save_webp(out, path, 88)


def process_sprite_sheets() -> None:
    for cls, accent in CHAR_ACCENTS.items():
        for gender in ('male', 'female'):
            rel = f'characters/hero-{cls}-{gender}-sheet.webp'
            src = ROOT / 'src/assets/2p5d' / rel
            img = safe_open(src)
            if img is None:
                continue
            out = fast_sprite_grade(img, accent, 1.1)
            save_webp(out, src, 88)
            copy_to_public(src, rel)
            print(f'[063-fast] character {rel}', flush=True)

    for src in sorted((ROOT / 'src/assets/2p5d/monsters').glob('*.webp')):
        name = src.name.removeprefix('monster-').removeprefix('boss-').removesuffix('-sheet.webp')
        accent = MONSTER_ACCENTS.get(name, (127, 218, 255))
        img = safe_open(src)
        if img is None:
            continue
        out = fast_sprite_grade(img, accent, 1.0)
        save_webp(out, src, 87)
        copy_to_public(src, f'monsters/{src.name}')
        print(f'[063-fast] monster {src.name}', flush=True)


def process_world_assets() -> None:
    folders = [
        ('tiles', (118, 220, 255), 89),
        ('props', (144, 230, 255), 88),
        ('buildings', (255, 220, 146), 88),
    ]
    for folder, accent, quality in folders:
        for src in sorted((ROOT / f'src/assets/2p5d/{folder}').glob('*.webp')):
            img = safe_open(src)
            if img is None:
                continue
            out = grade_flat(img, accent, 0.9)
            save_webp(out, src, quality)
            copy_to_public(src, f'{folder}/{src.name}')
            print(f'[063-fast] {folder} {src.name}', flush=True)


def process_runtime_small_assets() -> None:
    targets = [
        (ROOT / 'public/assets/soulpack/ui/icons', (118, 220, 255)),
        (ROOT / 'public/assets/soulpack/souls', (139, 237, 255)),
        (ROOT / 'public/assets/soulpack/items', (255, 220, 142)),
        (ROOT / 'public/assets/soulpack/weapons', (255, 220, 142)),
        (ROOT / 'public/assets/soulpack/cards', (127, 218, 255)),
        (ROOT / 'src/assets/items', (255, 220, 142)),
        (ROOT / 'src/assets/cards', (127, 218, 255)),
        (ROOT / 'src/assets/effects', (255, 230, 160)),
        (ROOT / 'public/assets/soulpack/effects', (255, 230, 160)),
    ]
    for folder, accent in targets:
        if not folder.exists():
            continue
        for path in sorted(folder.glob('*.webp')):
            if path.stat().st_size == 0:
                continue
            fast_icon_grade(path, accent)
        print(f'[063-fast] small folder {folder.relative_to(ROOT)}', flush=True)


def repair_known_zero_assets() -> None:
    # Original alpha had a few placeholder/corrupt files. Replace them with styled nearby assets.
    tree5 = ROOT / 'src/assets/2p5d/props/prop-tree-05.webp'
    if not tree5.exists() or tree5.stat().st_size == 0:
        src = ROOT / 'src/assets/2p5d/props/prop-tree-04.webp'
        img = safe_open(src)
        if img:
            out = ImageEnhance.Brightness(img).enhance(1.04)
            out = ImageEnhance.Color(out).enhance(1.08)
            save_webp(out, tree5, 88)
            copy_to_public(tree5, 'props/prop-tree-05.webp')
            print('[063-fast] repaired prop-tree-05.webp', flush=True)

    robe = ROOT / 'public/assets/soulpack/items/nightmare-robe.webp'
    if not robe.exists() or robe.stat().st_size == 0:
        base = safe_open(ROOT / 'public/assets/soulpack/items/nightmare-robe.webp') or safe_open(ROOT / 'public/assets/soulpack/items/abyss-armor.webp') or safe_open(ROOT / 'src/assets/items/nightmare-robe.webp')
        if base:
            out = grade_flat(base, (174, 124, 255), 1.0)
            save_webp(out, robe, 88)
            src_copy = ROOT / 'src/assets/items/nightmare-robe.webp'
            if src_copy.exists():
                shutil.copyfile(robe, src_copy)
            print('[063-fast] repaired nightmare-robe.webp', flush=True)


def main() -> None:
    for tmp in ROOT.rglob('*.webp.tmp'):
        tmp.unlink(missing_ok=True)
    process_sprite_sheets()
    process_world_assets()
    repair_known_zero_assets()
    process_runtime_small_assets()
    create_ui_063_assets()
    create_taoist_male_portrait()
    update_pack_metadata()
    print('[063-fast] finalized', flush=True)


if __name__ == '__main__':
    main()
