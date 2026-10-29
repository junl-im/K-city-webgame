"""Upload owner-provided 8집.zip and 9집.zip to Cloudflare R2.
Requires: pip install boto3 mutagen
Environment: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL.
Do not commit credentials or audio files.
"""
import io, json, os, re, zipfile
from pathlib import Path
import boto3
from mutagen.mp3 import MP3

keys = ["R2_ACCOUNT_ID","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET","R2_PUBLIC_BASE_URL"]
missing = [key for key in keys if not os.getenv(key)]
if missing:
    raise SystemExit("Missing configuration: " + ", ".join(missing))
base = os.environ["R2_PUBLIC_BASE_URL"].rstrip("/")
client = boto3.client("s3", endpoint_url=f'https://{os.environ["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com',
 aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"], aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
 region_name="auto")
tracks = []
for album in (8, 9):
    archive = Path(f"{album}집.zip")
    if not archive.exists(): raise SystemExit(f"Missing source: {archive}")
    with zipfile.ZipFile(archive) as z:
        names = sorted(n for n in z.namelist() if n.lower().endswith(".mp3") and not n.startswith("__MACOSX/"))
        for i, name in enumerate(names, 1):
            blob = z.read(name)
            tags = MP3(io.BytesIO(blob))
            ident = f"a{album:02d}-{i:03d}"
            title = str(tags.get("TIT2", Path(name).stem))
            artist = str(tags.get("TPE1", "곰같은여우"))
            key = f"radio/{ident}.mp3"
            client.put_object(Bucket=os.environ["R2_BUCKET"], Key=key, Body=blob, ContentType="audio/mpeg")
            tracks.append({"id":ident,"title":title,"artist":artist,"album":f"{album}집",
                           "duration":round(tags.info.length, 3),"url":f"{base}/{key}"})
            print(f"Uploaded {ident}: {title}")
Path("tracks.json").write_text(json.dumps({"tracks":tracks}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Done: {len(tracks)} tracks. Deploy tracks.json next to index.html.")
