from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SRC_A = Path('/mnt/data/6a9410bc-3749-4a4b-a25e-644863937534.png')
SRC_B = Path('/mnt/data/ada3ee4a-4014-40d1-8ee9-4e7654a2e988.png')
OUT_PUBLIC = ROOT / 'public/assets/ui/soul136'
OUT_SRC = ROOT / 'src/assets/ui/soul136'
OUT_PUBLIC.mkdir(parents=True, exist_ok=True)
OUT_SRC.mkdir(parents=True, exist_ok=True)

A = Image.open(SRC_A).convert('RGBA')
B = Image.open(SRC_B).convert('RGBA')

def enhance(img: Image.Image, sharp=1.04, contrast=1.03, color=1.04, bright=1.0) -> Image.Image:
    img = ImageEnhance.Color(img).enhance(color)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Brightness(img).enhance(bright)
    img = ImageEnhance.Sharpness(img).enhance(sharp)
    return img

def save(name: str, img: Image.Image, max_w: int | None = None, max_h: int | None = None, q: int = 90):
    img = enhance(img)
    if max_w or max_h:
        w, h = img.size
        scale = min((max_w or w) / w, (max_h or h) / h, 1.0)
        if scale < 1:
            img = img.resize((max(1, int(w*scale)), max(1, int(h*scale))), Image.Resampling.LANCZOS)
    for base in (OUT_PUBLIC, OUT_SRC):
        out = base / name
        img.convert('RGB').save(out, 'WEBP', quality=q, method=6)

def crop(src: Image.Image, box, name: str, **kw):
    save(name, src.crop(box), **kw)

def soft_crop(src: Image.Image, box, name: str, overlay=(255,255,255,120), blur=1.1, **kw):
    img = src.crop(box)
    back = img.filter(ImageFilter.GaussianBlur(blur))
    overlay_img = Image.new('RGBA', img.size, overlay)
    img = Image.alpha_composite(back, overlay_img)
    save(name, img, **kw)

def clean_button(src: Image.Image, box, name: str, fill=(45, 145, 230, 235), outline=(255,255,255,120), **kw):
    img = enhance(src.crop(box), sharp=1.02, contrast=1.02, color=1.04)
    layer = Image.new('RGBA', img.size, (0,0,0,0))
    d = ImageDraw.Draw(layer)
    w,h = img.size
    d.rounded_rectangle((w*0.18,h*0.28,w*0.82,h*0.72), radius=max(8, int(h*.18)), fill=fill, outline=outline, width=max(1,int(h*.03)))
    # 아주 약한 광택을 추가해 원본 글자를 자연스럽게 덮는다.
    d.rounded_rectangle((w*0.22,h*0.31,w*0.78,h*0.48), radius=max(6, int(h*.12)), fill=(255,255,255,45))
    img = Image.alpha_composite(img, layer)
    save(name, img, **kw)

def clean_panel(src: Image.Image, box, name: str, paper=(255,255,255,174), **kw):
    img = src.crop(box)
    layer = Image.new('RGBA', img.size, (0,0,0,0))
    d = ImageDraw.Draw(layer)
    w,h = img.size
    d.rounded_rectangle((w*.07,h*.13,w*.93,h*.84), radius=max(14, int(min(w,h)*.06)), fill=paper)
    img = Image.alpha_composite(img, layer)
    save(name, img, **kw)

# 원본 보드 축소 보관: 앞으로 디자인 소스 추적용
save('reference-ui-board-a-136.webp', A, max_w=1024, max_h=768, q=88)
save('reference-town-board-b-136.webp', B, max_w=1024, max_h=768, q=88)

# A: 모바일 시작/로그인/서버/팝업/UI 킷
crop(A, (8, 10, 502, 550), 'title-card-polished-136.webp')
soft_crop(A, (512, 18, 777, 475), 'login-panel-soft-136.webp')
soft_crop(A, (790, 20, 1054, 475), 'server-panel-soft-136.webp')
clean_panel(A, (1072, 270, 1522, 505), 'quest-panel-clean-136.webp')
crop(A, (1070, 22, 1527, 244), 'mobile-hud-map-136.webp')
clean_panel(A, (12, 564, 490, 808), 'inventory-panel-clean-136.webp')
crop(A, (29, 626, 463, 735), 'inventory-slot-grid-136.webp')
clean_panel(A, (520, 512, 742, 796), 'reward-panel-clean-136.webp')
clean_panel(A, (766, 512, 995, 805), 'levelup-panel-clean-136.webp')
clean_panel(A, (1012, 520, 1345, 795), 'chat-panel-clean-136.webp')
crop(A, (1347, 520, 1535, 846), 'action-wheel-kit-136.webp')
crop(A, (870, 838, 1348, 952), 'bottom-menu-icon-kit-136.webp')
crop(A, (16, 836, 367, 970), 'button-kit-clean-136.webp')
crop(A, (379, 836, 742, 970), 'toggle-gauge-kit-136.webp')
crop(A, (748, 833, 914, 970), 'badge-alert-kit-136.webp')
crop(A, (1085, 174, 1510, 248), 'town-top-icon-row-136.webp')
crop(A, (1342, 806, 1535, 1018), 'mascot-ornament-136.webp')
clean_button(A, (123, 484, 384, 527), 'start-button-clean-136.webp', fill=(28,127,218,232))
clean_button(A, (558, 241, 736, 280), 'gold-button-clean-136.webp', fill=(232,178,91,235))
clean_button(A, (1176, 438, 1394, 475), 'blue-button-clean-136.webp', fill=(31,137,229,235))
clean_button(A, (1278, 743, 1335, 782), 'send-button-clean-136.webp', fill=(36,141,230,235))

# B: 와이드 마을/HUD/퀘스트/액션
crop(B, (34, 35, 260, 275), 'town-left-logo-136.webp')
clean_panel(B, (302, 103, 847, 246), 'town-hero-profile-clean-136.webp')
clean_panel(B, (906, 103, 1374, 323), 'town-menu-grid-clean-136.webp')
clean_panel(B, (300, 278, 854, 604), 'town-quest-list-clean-136.webp')
clean_panel(B, (898, 354, 1370, 550), 'town-banner-clean-136.webp')
clean_panel(B, (558, 704, 952, 872), 'town-chat-clean-136.webp')
crop(B, (30, 338, 268, 704), 'town-left-menu-136.webp')
crop(B, (62, 828, 282, 933), 'town-status-bars-136.webp')
crop(B, (302, 888, 825, 974), 'town-sticker-strip-136.webp')
crop(B, (992, 720, 1286, 794), 'town-skill-row-136.webp')
crop(B, (1288, 678, 1532, 875), 'town-action-ring-136.webp')
clean_panel(B, (1170, 798, 1516, 970), 'town-reward-toast-clean-136.webp')
crop(B, (624, 20, 1218, 72), 'currency-bar-136.webp')
crop(B, (1406, 337, 1517, 585), 'right-rail-icon-kit-136.webp')
clean_button(B, (30, 338, 266, 390), 'side-menu-button-clean-136.webp', fill=(251,250,238,230))
clean_button(B, (720, 431, 839, 472), 'move-button-clean-136.webp', fill=(34,116,197,235))
clean_button(B, (876, 591, 986, 642), 'confirm-button-clean-136.webp', fill=(33,120,203,235))
clean_button(B, (995, 591, 1108, 642), 'cancel-button-clean-136.webp', fill=(250,247,238,236))
clean_button(B, (1118, 591, 1228, 642), 'green-button-clean-136.webp', fill=(84,175,84,236))
clean_button(B, (1238, 591, 1295, 642), 'gold-small-button-clean-136.webp', fill=(226,156,64,236))

# 작은 아이콘을 개별화. 텍스트가 있는 원본은 아이콘 중심으로만 자른다.
icons = {
  'icon-event-136.webp': (946, 130, 1005, 194),
  'icon-attendance-136.webp': (1058, 126, 1122, 194),
  'icon-firstcharge-136.webp': (1170, 126, 1238, 193),
  'icon-pass-136.webp': (1284, 126, 1348, 193),
  'icon-ranking-136.webp': (944, 222, 1006, 292),
  'icon-codex-136.webp': (1057, 219, 1125, 292),
  'icon-craft-136.webp': (1171, 219, 1237, 292),
  'icon-market-136.webp': (1284, 219, 1348, 292),
  'icon-mail-136.webp': (1377, 23, 1421, 69),
  'icon-chat-136.webp': (1430, 23, 1475, 69),
  'icon-bell-136.webp': (1478, 23, 1522, 69),
}
for name, box in icons.items():
    crop(B, box, name, max_w=96, max_h=96, q=92)

print(f'created {len(list(OUT_PUBLIC.glob("*.webp")))} public soul136 webp assets')
