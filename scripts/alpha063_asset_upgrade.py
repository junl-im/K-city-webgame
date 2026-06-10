from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, UnidentifiedImageError
import json
import math
import random
import shutil

ROOT = Path(__file__).resolve().parents[1]
random.seed(63)

CHAR_ACCENTS = {
    'warrior': (255, 218, 127),
    'taoist': (111, 226, 255),
    'cleric': (255, 236, 171),
}
MONSTER_ACCENTS = {
    'slime': (119, 235, 203),
    'wolf': (146, 220, 255),
    'goblin': (255, 191, 104),
    'bear': (171, 148, 255),
    'dragon': (255, 127, 82),
    'imp': (204, 132, 255),
    'golem': (134, 235, 204),
    'wraith': (184, 224, 255),
    'firedrake': (255, 136, 67),
    'harpy': (130, 229, 255),
    'grave-knight': (255, 221, 139),
    'fieldboss': (255, 194, 92),
    'orc-berserker': (255, 155, 80),
    'nightmare-bat': (177, 145, 255),
    'lava-golem': (255, 118, 70),
    'ice-witch': (166, 238, 255),
    'royal-guard': (255, 224, 151),
    'rift-beast': (203, 150, 255),
}


def safe_open(path: Path) -> Image.Image | None:
    try:
        return Image.open(path).convert('RGBA')
    except (FileNotFoundError, UnidentifiedImageError, OSError) as exc:
        print(f'[skip] {path.relative_to(ROOT)}: {exc}')
        return None


def save_webp(img: Image.Image, path: Path, quality: int = 88) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    img.save(tmp, 'WEBP', quality=quality, method=0)
    tmp.replace(path)


def alpha_outline(mask: Image.Image, radius: int) -> Image.Image:
    size = max(3, radius * 2 + 1)
    dilated = mask.filter(ImageFilter.MaxFilter(size))
    return ImageChops.subtract(dilated, mask)


def vertical_mask(size: tuple[int, int], top: int = 180, bottom: int = 20) -> Image.Image:
    w, h = size
    strip = Image.new('L', (1, h))
    strip.putdata([max(0, min(255, int(top + (bottom - top) * (y / max(1, h - 1))))) for y in range(h)])
    return strip.resize((w, h))


def diagonal_sheen(size: tuple[int, int], strength: int = 95) -> Image.Image:
    w, h = size
    small = Image.new('L', (max(1, w // 8), max(1, h // 8)), 0)
    d = ImageDraw.Draw(small)
    sw, sh = small.size
    for offset in range(-sh, sw, max(18, sw // 5)):
        d.line((offset, sh, offset + sh, 0), fill=strength, width=max(1, sw // 34))
    return small.resize(size, Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(max(1, min(w, h) // 96)))


def asset_grade(img: Image.Image, accent: tuple[int, int, int], outline_radius: int = 3, glow_radius: int = 8,
                outline_alpha: int = 145, glow_alpha: int = 74, contrast: float = 1.06,
                saturation: float = 1.12, brightness: float = 1.03, sharpness: float = 1.14) -> Image.Image:
    img = img.convert('RGBA')
    alpha = img.getchannel('A')
    rgb = img.convert('RGB')
    rgb = ImageEnhance.Color(rgb).enhance(saturation)
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    rgb = ImageEnhance.Brightness(rgb).enhance(brightness)
    rgb = ImageEnhance.Sharpness(rgb).enhance(sharpness)
    base = rgb.convert('RGBA')
    base.putalpha(alpha)

    glow_mask = alpha.filter(ImageFilter.GaussianBlur(glow_radius)).point(lambda p: min(glow_alpha, int(p * 0.34)))
    glow = Image.new('RGBA', img.size, accent + (0,))
    glow.putalpha(glow_mask)

    outline_mask = alpha_outline(alpha, outline_radius).filter(ImageFilter.GaussianBlur(0.55)).point(lambda p: min(outline_alpha, int(p * 0.92)))
    outline = Image.new('RGBA', img.size, (255, 232, 166, 0))
    outline.putalpha(outline_mask)

    top = ImageChops.multiply(alpha, vertical_mask(img.size, 128, 8)).point(lambda p: int(p * 0.32))
    top_light = Image.new('RGBA', img.size, (255, 255, 255, 0))
    top_light.putalpha(top)

    color_rim = ImageChops.multiply(alpha, diagonal_sheen(img.size, 72)).point(lambda p: int(p * 0.28))
    rim = Image.new('RGBA', img.size, accent + (0,))
    rim.putalpha(color_rim)

    out = Image.alpha_composite(glow, outline)
    out = Image.alpha_composite(out, base)
    out = Image.alpha_composite(out, rim)
    out = Image.alpha_composite(out, top_light)
    return out


def grade_flat(img: Image.Image, accent: tuple[int, int, int], strength: float = 1.0) -> Image.Image:
    img = img.convert('RGBA')
    alpha = img.getchannel('A')
    rgb = img.convert('RGB')
    rgb = ImageEnhance.Color(rgb).enhance(1.08 + 0.05 * strength)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.04 + 0.03 * strength)
    rgb = ImageEnhance.Brightness(rgb).enhance(1.02)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.08 + 0.03 * strength)
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    sheen = Image.new('RGBA', img.size, (255, 255, 255, 0))
    sheen.putalpha(ImageChops.multiply(alpha, diagonal_sheen(img.size, 55)).point(lambda p: int(p * 0.18)))
    aura = Image.new('RGBA', img.size, accent + (0,))
    aura.putalpha(alpha.filter(ImageFilter.GaussianBlur(6)).point(lambda p: min(52, int(p * 0.22))))
    return Image.alpha_composite(Image.alpha_composite(aura, out), sheen)


def process_pair(relative: str, accent: tuple[int, int, int], kind: str = 'sprite') -> None:
    src = ROOT / 'src/assets/2p5d' / relative
    pub = ROOT / 'public/assets/soulpack' / relative
    base = safe_open(src) or safe_open(pub)
    if not base:
        return
    if kind == 'sprite':
        upgraded = asset_grade(base, accent, outline_radius=1, glow_radius=4, outline_alpha=96, glow_alpha=58,
                               contrast=1.055, saturation=1.10, brightness=1.025, sharpness=1.13)
        quality = 91
    elif kind == 'tile':
        upgraded = asset_grade(base, accent, outline_radius=1, glow_radius=3, outline_alpha=72, glow_alpha=28,
                               contrast=1.08, saturation=1.15, brightness=1.04, sharpness=1.12)
        quality = 90
    else:
        upgraded = asset_grade(base, accent, outline_radius=1, glow_radius=3, outline_alpha=74, glow_alpha=30,
                               contrast=1.06, saturation=1.10, brightness=1.03, sharpness=1.11)
        quality = 90
    save_webp(upgraded, src, quality)
    pub.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, pub)
    print(f'[063] upgraded {relative}')


def process_characters() -> None:
    for cls, accent in CHAR_ACCENTS.items():
        for gender in ('male', 'female'):
            process_pair(f'characters/hero-{cls}-{gender}-sheet.webp', accent, 'sprite')


def accent_for_monster(name: str) -> tuple[int, int, int]:
    clean = name.removeprefix('monster-').removesuffix('-sheet.webp').removeprefix('boss-')
    return MONSTER_ACCENTS.get(clean, (127, 218, 255))


def process_monsters() -> None:
    for f in sorted((ROOT / 'src/assets/2p5d/monsters').glob('*.webp')):
        process_pair(f'monsters/{f.name}', accent_for_monster(f.name), 'sprite')


def process_tiles_props_buildings() -> None:
    tile_accents = {
        'tile-grass.webp': (145, 238, 152),
        'tile-dirt.webp': (255, 207, 122),
        'tile-moss.webp': (117, 238, 215),
        'tile-stone.webp': (238, 220, 165),
        'tile-crystal.webp': (127, 229, 255),
        'tile-water.webp': (120, 220, 255),
        'tile-cliff.webp': (216, 191, 144),
        'tile-portal.webp': (168, 142, 255),
    }
    for f in sorted((ROOT / 'src/assets/2p5d/tiles').glob('*.webp')):
        process_pair(f'tiles/{f.name}', tile_accents.get(f.name, (127, 218, 255)), 'tile')
    for folder in ('props', 'buildings'):
        for f in sorted((ROOT / f'src/assets/2p5d/{folder}').glob('*.webp')):
            accent = (255, 218, 142) if folder == 'buildings' else (137, 226, 255)
            process_pair(f'{folder}/{f.name}', accent, 'prop')


def process_small_runtime_folders() -> None:
    folders = [
        ROOT / 'public/assets/soulpack/ui/icons',
        ROOT / 'public/assets/soulpack/souls',
        ROOT / 'public/assets/soulpack/items',
        ROOT / 'public/assets/soulpack/weapons',
        ROOT / 'public/assets/soulpack/cards',
        ROOT / 'src/assets/items',
        ROOT / 'src/assets/cards',
        ROOT / 'src/assets/effects',
        ROOT / 'public/assets/soulpack/effects',
    ]
    for folder in folders:
        if not folder.exists():
            continue
        for path in sorted(folder.glob('*.webp')):
            img = safe_open(path)
            if img is None:
                continue
            accent = (127, 218, 255)
            if 'item' in str(path) or 'weapon' in str(path):
                accent = (255, 220, 142)
            if 'souls' in str(path):
                accent = (139, 237, 255)
            if 'effects' in str(path):
                accent = (255, 230, 160)
            out = grade_flat(img, accent, 0.8)
            save_webp(out, path, 90)
            print(f'[063] graded {path.relative_to(ROOT)}')


def make_panel(size: tuple[int, int], rounded: int = 34) -> Image.Image:
    w, h = size
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # soft shadow and glass body
    shadow = Image.new('RGBA', size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((18, 22, w - 18, h - 10), rounded, fill=(0, 62, 132, 72))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    img.alpha_composite(shadow)
    d.rounded_rectangle((14, 10, w - 14, h - 18), rounded, fill=(255, 253, 244, 216), outline=(255, 255, 255, 220), width=3)
    d.rounded_rectangle((22, 18, w - 22, h - 26), max(10, rounded - 10), outline=(229, 176, 77, 145), width=2)
    for i in range(0, h, 4):
        alpha = int(36 * (1 - i / max(1, h)))
        d.line((34, 24 + i, w - 34, 24 + i), fill=(114, 208, 255, max(0, alpha)), width=1)
    d.arc((18, 12, 78, 72), 180, 270, fill=(255, 232, 166, 210), width=3)
    d.arc((w - 78, 12, w - 18, 72), 270, 360, fill=(255, 232, 166, 210), width=3)
    d.arc((18, h - 78, 78, h - 18), 90, 180, fill=(255, 232, 166, 180), width=3)
    d.arc((w - 78, h - 78, w - 18, h - 18), 0, 90, fill=(255, 232, 166, 180), width=3)
    glow = Image.new('RGBA', size, (117, 218, 255, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((w * .18, -h * .24, w * .82, h * .46), fill=(117, 218, 255, 62))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(28)))
    return img


def make_button(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((10, 14, w - 10, h - 10), h // 2, fill=(0, 61, 140, 86))
    d.rounded_rectangle((12, 8, w - 12, h - 16), h // 2, fill=(16, 121, 218, 238), outline=(255, 255, 255, 224), width=3)
    d.rounded_rectangle((20, 16, w - 20, h - 24), max(8, h // 2 - 8), outline=(255, 230, 166, 174), width=2)
    d.rounded_rectangle((24, 18, w - 24, h // 2), h // 4, fill=(144, 226, 255, 78))
    d.line((40, h // 2, w - 40, h // 2), fill=(255, 255, 255, 138), width=2)
    return img.filter(ImageFilter.UnsharpMask(radius=1, percent=105, threshold=2))


def make_slot(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((8, 8, w - 8, h - 8), 22, fill=(228, 244, 255, 190), outline=(255, 255, 255, 220), width=3)
    d.rounded_rectangle((16, 16, w - 16, h - 16), 16, fill=(29, 129, 213, 42), outline=(225, 175, 82, 150), width=2)
    d.ellipse((w * .18, h * .08, w * .82, h * .72), fill=(255, 255, 255, 38))
    d.line((28, h - 22, w - 28, h - 22), fill=(112, 206, 255, 120), width=2)
    return img


def make_location_pin(size: tuple[int, int] = (180, 220)) -> Image.Image:
    w, h = size
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2 - 12
    glow = Image.new('RGBA', size, (111, 226, 255, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((cx - 58, cy - 58, cx + 58, cy + 58), fill=(111, 226, 255, 100))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18)))
    d.ellipse((cx - 44, cy - 48, cx + 44, cy + 40), fill=(255, 255, 255, 226), outline=(229, 176, 77, 220), width=5)
    d.polygon([(cx - 24, cy + 25), (cx + 24, cy + 25), (cx, h - 22)], fill=(255, 255, 255, 226), outline=(229, 176, 77, 220))
    d.ellipse((cx - 23, cy - 26, cx + 23, cy + 20), fill=(33, 132, 226, 232), outline=(255, 255, 255, 220), width=3)
    d.polygon([(cx, cy - 42), (cx + 8, cy - 6), (cx + 40, cy), (cx + 8, cy + 8), (cx, cy + 42), (cx - 8, cy + 8), (cx - 40, cy), (cx - 8, cy - 6)], fill=(255, 232, 166, 210))
    return img


def create_ui_063_assets() -> None:
    ui_src = ROOT / 'src/assets/ui'
    ui_pub = ROOT / 'public/assets/soulpack/ui'
    generated = {
        'ui-panel-glass-063.webp': make_panel((720, 420)),
        'ui-button-sky-063.webp': make_button((512, 156)),
        'ui-slot-sky-063.webp': make_slot((220, 220)),
        'ui-location-pin-063.webp': make_location_pin(),
    }
    for name, img in generated.items():
        save_webp(img, ui_src / name, 92)
        save_webp(img, ui_pub / name, 92)
        print(f'[063] generated ui/{name}')

    for base_name in ('title-keyvisual-061.webp', 'title-landscape-061.webp', 'town-keyvisual-061.webp', 'town-composite-061.webp'):
        src = ui_src / base_name
        img = safe_open(src)
        if img is None:
            continue
        upgraded = grade_flat(img, (118, 218, 255), 1.2)
        # add reference-style sky/gold vignette
        overlay = Image.new('RGBA', upgraded.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        w, h = upgraded.size
        od.ellipse((-w * .15, -h * .22, w * .62, h * .46), fill=(255, 255, 255, 42))
        od.ellipse((w * .56, -h * .12, w * 1.12, h * .52), fill=(255, 224, 154, 34))
        upgraded = Image.alpha_composite(upgraded, overlay.filter(ImageFilter.GaussianBlur(30)))
        out_name = base_name.replace('-061', '-063')
        save_webp(upgraded, ui_src / out_name, 91)
        save_webp(upgraded, ui_pub / out_name, 91)
        print(f'[063] generated ui/{out_name}')


def create_taoist_male_portrait() -> None:
    sheet_path = ROOT / 'src/assets/2p5d/characters/hero-taoist-male-sheet.webp'
    sheet = safe_open(sheet_path)
    if sheet is None:
        return
    frame = sheet.crop((0, 0, 160, 240))
    canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    bg = Image.new('RGBA', (512, 512), (22, 95, 180, 255))
    bd = ImageDraw.Draw(bg)
    bd.ellipse((-80, -120, 420, 380), fill=(114, 226, 255, 98))
    bd.ellipse((210, 120, 620, 560), fill=(255, 232, 166, 78))
    canvas.alpha_composite(bg.filter(ImageFilter.GaussianBlur(10)))
    scaled = frame.resize((384, 576), Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled, (64, -12))
    mask = Image.new('L', (512, 512), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((20, 20, 492, 492), fill=255)
    canvas.putalpha(mask)
    for out in (ROOT / 'src/assets/ui/portrait-taoist-male.webp', ROOT / 'public/assets/soulpack/ui/portrait-taoist-male.webp'):
        save_webp(canvas, out, 92)
        print(f'[063] repaired {out.relative_to(ROOT)}')


def update_pack_metadata() -> None:
    pack_path = ROOT / 'public/assets/soulpack/asset-pack.json'
    if pack_path.exists():
        data = json.loads(pack_path.read_text(encoding='utf-8'))
        data['version'] = '0.63.0'
        data['style'] = 'reference-grade bright anime fantasy 2.5D asset upgrade'
        data['assetUpgrade063'] = {
            'characters': '6 hero sheets color-graded with rim light, gold outline and cleaner alpha edges',
            'monsters': '18 monster/boss sheets upgraded with species accent glow and readable silhouettes',
            'terrain': '8 core WebP tiles rebalanced for bright sky/ivory/gold visual direction',
            'ui': ['ui-panel-glass-063.webp', 'ui-button-sky-063.webp', 'ui-slot-sky-063.webp', 'ui-location-pin-063.webp'],
            'iconsAndCards': 'inventory, soul, card, effect and menu icons received the same premium material pass'
        }
        data['notes'] = '0.63 대규모 자산 업그레이드 패스. 저급 임시 이미지를 추가하지 않고 기존 WebP 자산을 고급 톤/림라이트/알파 아웃라인으로 재가공하고 063 UI 소재를 추가했습니다.'
        pack_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    ext_path = ROOT / 'public/assets/soulpack/external-asset-manifest.json'
    if ext_path.exists():
        data = json.loads(ext_path.read_text(encoding='utf-8'))
        data['version'] = '0.63.0'
        data['note'] = 'Third-party/user-supplied assets are integrated for this prototype. Alpha 0.63 adds internal post-processing and UI material assets. Verify original license terms before public redistribution.'
        ext_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def main() -> None:
    process_characters()
    process_monsters()
    process_tiles_props_buildings()
    process_small_runtime_folders()
    create_ui_063_assets()
    create_taoist_male_portrait()
    update_pack_metadata()
    print('[063] asset upgrade complete')


if __name__ == '__main__':
    main()
