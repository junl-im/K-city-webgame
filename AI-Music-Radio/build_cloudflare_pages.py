#!/usr/bin/env python3
"""Make a card-free Cloudflare Workers/Pages static ZIP from the author's 8집.zip and 9집.zip.

Requires: Python, ffmpeg, pip install mutagen pillow.
Never uploads tracks to GitHub or includes account credentials.
"""
from io import BytesIO
from pathlib import Path
from shutil import rmtree, which
from subprocess import run
from tempfile import TemporaryDirectory
from zipfile import ZipFile, ZIP_STORED, ZIP_DEFLATED
from mutagen.mp3 import MP3
from PIL import Image
import json
import random
import re

HERE = Path(__file__).resolve().parent
OUT = HERE / "cloudflare-pages-dist"
if not which("ffmpeg"):
    raise SystemExit("ffmpeg must be installed and on PATH")
if OUT.exists():
    rmtree(OUT)  # Build directory only; never touch source ZIPs.
for folder in ("audio", "covers"):
    (OUT / folder).mkdir(parents=True, exist_ok=True)
tracks = []
with TemporaryDirectory(prefix="radio-reencode-") as tempdir:
    tmp = Path(tempdir) / "source.mp3"
    for album, expected in ((8, 35), (9, 20)):
        archive = HERE / f"{album}집.zip"
        if not archive.exists():
            raise SystemExit(f"Missing {archive.name}")
        with ZipFile(archive) as z:
            names = sorted((n for n in z.namelist()
                            if n.lower().endswith(".mp3") and not n.startswith("__MACOSX/")),
                           key=str.casefold)
            if len(names) != expected:
                raise SystemExit(f"{archive.name}: expected {expected}, found {len(names)}")
            for i, filename in enumerate(names, 1):
                ident = f"{album:02d}-{i:03d}"
                original = z.read(filename)
                meta = MP3(BytesIO(original))
                title = str(meta.get("TIT2") or Path(filename).stem).strip()
                tmp.write_bytes(original)
                rel = f"audio/{ident}-v4.mp3"  # Changed URL prevents stale cached v3 audio.
                dest = OUT / rel
                command = ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
                           "-y", "-i", str(tmp), "-map", "0:a:0", "-vn",
                           "-map_metadata", "-1", "-c:a", "libmp3lame",
                           "-b:a", "128k", "-ar", "48000", str(dest)]
                run(command, check=True)
                new_audio = MP3(dest)
                if abs(new_audio.info.length - meta.info.length) > 1:
                    raise SystemExit(f"Bad encode duration: {ident}")
                track = {"id": ident, "title": title, "artist": "곰같은여우",
                         "album": f"{album}집", "duration": round(new_audio.info.length, 3),
                         "url": rel}
                pics = [frame for key, frame in (meta.tags or {}).items()
                        if key.startswith("APIC")]
                if pics:
                    try:
                        im = Image.open(BytesIO(pics[0].data)).convert("RGB")
                        im.thumbnail((650, 650), Image.Resampling.LANCZOS)
                        cover = f"covers/{ident}.jpg"
                        im.save(OUT / cover, "JPEG", quality=86, optimize=True)
                        track["cover"] = cover
                    except Exception as exc:
                        print("Cover skipped:", ident, exc)
                tracks.append(track)
random.Random(20261029).shuffle(tracks)
manifest = {"title": "곰같은여우 AI MUSIC RADIO",
            "stationStart": "2026-10-28T15:00:00Z", "tracks": tracks}
(OUT / "tracks.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
(OUT / "index.html").write_bytes((HERE / "index.html").read_bytes())
(OUT / "_headers").write_text(
    "/audio/*\n  Cache-Control: public, max-age=604800, immutable\n"
    "/covers/*\n  Cache-Control: public, max-age=604800, immutable\n"
    "/tracks.json\n  Cache-Control: public, max-age=60\n", encoding="utf-8"
)
(OUT / "404.html").write_text(
    '<!doctype html><html lang="ko"><meta charset="utf-8">'
    '<title>페이지를 찾을 수 없습니다</title><p><a href="/">홈으로</a></p></html>',
    encoding="utf-8"
)
files = sorted((p for p in OUT.rglob("*") if p.is_file()), key=lambda p: p.as_posix())
for item in files:
    rel = item.relative_to(OUT).as_posix()
    if not re.fullmatch(r"[A-Za-z0-9_./-]+", rel):
        raise SystemExit(f"Unsafe URL path: {rel}")
if len(tracks) != 55 or any(p.stat().st_size > 25 * 1024 * 1024 for p in files):
    raise SystemExit("Cloudflare static assets validation failed")
dest = HERE / "gomfox-radio-55tracks-stable-v4.zip"
with ZipFile(dest, "w") as archive:
    for item in files:
        archive.write(item, item.relative_to(OUT).as_posix(),
                      compress_type=ZIP_STORED if item.suffix.lower() in (".mp3", ".jpg")
                      else ZIP_DEFLATED)
with ZipFile(dest) as check:
    if check.testzip() is not None:
        raise SystemExit("ZIP CRC validation failed")
print(f"Packaged {len(tracks)} tracks; {len(files)} files: {dest}")
