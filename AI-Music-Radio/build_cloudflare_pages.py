#!/usr/bin/env python3
"""Build a card-free Cloudflare Pages Direct Upload ZIP from album archives.

Dependencies: pip install mutagen pillow
Put 8집.zip and 9집.zip next to this script. GitHub source tracks HTML/CSS/JS,
while the resulting ZIP (including audio) is uploaded only to Cloudflare Pages.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED, ZIP_DEFLATED
from io import BytesIO
from PIL import Image
from mutagen.mp3 import MP3
import random, json, re

HERE = Path(__file__).resolve().parent
OUT = HERE / "cloudflare-pages-dist"
for folder in ("audio", "covers"):
    (OUT / folder).mkdir(parents=True, exist_ok=True)
tracks = []
for album, expected in ((8, 35), (9, 20)):
    archive = HERE / f"{album}집.zip"
    if not archive.exists():
        raise SystemExit(f"Missing {archive.name}")
    with ZipFile(archive) as z:
        names = sorted(
            (n for n in z.namelist() if n.lower().endswith(".mp3") and not n.startswith("__MACOSX/")),
            key=str.casefold,
        )
        if len(names) != expected:
            raise SystemExit(f"{archive.name}: expected {expected}, found {len(names)}")
        for i, filename in enumerate(names, 1):
            ident = f"{album:02d}-{i:03d}"
            content = z.read(filename)
            meta = MP3(BytesIO(content))
            title = str(meta.get("TIT2") or Path(filename).stem).strip()
            rel = f"audio/{ident}.mp3"
            (OUT / rel).write_bytes(content)
            track = {"id": ident, "title": title, "artist": "곰같은여우",
                     "album": f"{album}집", "duration": round(meta.info.length, 3),
                     "url": rel}
            pics = [v for key, v in (meta.tags or {}).items() if key.startswith("APIC")]
            if pics:
                try:
                    im = Image.open(BytesIO(pics[0].data)).convert("RGB")
                    im.thumbnail((650, 650), Image.Resampling.LANCZOS)
                    cover = f"covers/{ident}.jpg"
                    im.save(OUT / cover, "JPEG", quality=86, optimize=True)
                    track["cover"] = cover
                except Exception as exc:
                    print("Cover skipped", ident, exc)
            tracks.append(track)
random.Random(20261029).shuffle(tracks)
manifest = {"title": "곰같은여우 AI MUSIC RADIO",
            "stationStart": "2026-10-28T15:00:00Z", "tracks": tracks}
(OUT / "tracks.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
(OUT / "index.html").write_bytes((HERE / "index.html").read_bytes())
(OUT / "_headers").write_text(
    "/audio/*\n  Cache-Control: public, max-age=604800, immutable\n"
    "/covers/*\n  Cache-Control: public, max-age=604800, immutable\n"
    "/tracks.json\n  Cache-Control: public, max-age=60\n",
    encoding="utf-8",
)
(OUT / "404.html").write_text(
    '<!doctype html><html lang="ko"><meta charset="utf-8">'
    '<title>페이지를 찾을 수 없습니다</title><p><a href="/">홈으로</a></p></html>',
    encoding="utf-8",
)
files = sorted((p for p in OUT.rglob("*") if p.is_file()), key=lambda p: p.as_posix())\nfor item in files:\n    rel = item.relative_to(OUT).as_posix()\n    if not re.fullmatch(r"[A-Za-z0-9_./-]+", rel):\n        raise SystemExit(f"Non-ASCII / URL-unsafe path found: {rel}")
if len(tracks) != 55 or any(p.stat().st_size > 25 * 1024 * 1024 for p in files):
    raise SystemExit("Pages validation failed: count or >25 MiB single file")
dest = HERE / "gomfox-radio-pages-55tracks.zip"
with ZipFile(dest, "w") as archive:
    for item in files:
        mode = ZIP_STORED if item.suffix.lower() in (".mp3", ".jpg") else ZIP_DEFLATED
        archive.write(item, item.relative_to(OUT).as_posix(), compress_type=mode)
with ZipFile(dest) as check:\n    if check.testzip() is not None:\n        raise SystemExit("ZIP CRC validation failed")\nprint(f"Ready: {dest.name}, {len(tracks)} audio files and {len(files)} files total")
