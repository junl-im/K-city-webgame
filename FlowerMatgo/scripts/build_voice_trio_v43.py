#!/usr/bin/env python3
"""Generate REVIEW-ONLY three-cast Korean voice library for Flower Matgo.

All 49 runtime voice IDs get a sound candidate; 39 situations get 2 takes.
No part of this script switches VOICE_PACKS.trio.ready to true.
"""
from __future__ import annotations

import argparse
import array
import base64
import hashlib
import html
import json
import math
import shutil
import tempfile
import wave
from datetime import datetime, timezone
from pathlib import Path

from build_voice_previews_v42 import MODEL_REPO, MODEL_REVISION, normalize

DEFAULT_PLAN = Path(__file__).with_name("voice_trio_v43.json")


def source_plan(path: Path) -> dict:
    plan = json.loads(path.read_text(encoding="utf-8"))
    clips = plan["entries"]
    pairs = [(entry["id"], entry["variant"]) for entry in clips]
    if len(clips) != 88 or len(set(pairs)) != 88:
        raise ValueError("Expected exactly 88 unique voice event/variant pairs")
    if len({entry["id"] for entry in clips}) != 49:
        raise ValueError("Expected full coverage of 49 game voice IDs")
    if {entry["role"] for entry in clips} != {"main", "rival", "host"}:
        raise ValueError("Missing one or more cast voices")
    if plan["ready_for_public_game"] is not False:
        raise ValueError("Unapproved voice pack cannot be public")
    for entry in clips:
        role = entry["role"]
        if role not in plan["roles"] or not entry["text"].strip():
            raise ValueError(f"Invalid script: {entry}")
        if not entry["id"].replace("_", "").isalnum() or entry["variant"] not in (1, 2):
            raise ValueError(f"Unsafe event/variant name: {entry}")
    return plan


def inspect_wav(path: Path) -> dict:
    with wave.open(str(path), "rb") as audio:
        rate, frames, channels, sample_width = (
            audio.getframerate(), audio.getnframes(), audio.getnchannels(),
            audio.getsampwidth())
        data = audio.readframes(frames)
    if rate != 48000 or channels != 1 or sample_width != 2:
        raise ValueError(f"Output not 48kHz mono PCM16: {path.name}")
    pcm = array.array("h")
    pcm.frombytes(data)
    length = frames / rate
    abspeak = max(map(abs, pcm), default=0) / 32768
    rms = math.sqrt(sum(float(v) * v for v in pcm) / max(1, len(pcm))) / 32768
    if not (0.12 <= length < 14 and 0.010 <= rms < .60 and 0.020 <= abspeak < .985):
        raise ValueError(f"Suspect output {path.name}: {length:.3f}s peak={abspeak:.3f} rms={rms:.3f}")
    return {"sample_rate":rate, "channels":channels, "bit_depth":16,
            "duration_seconds":round(length, 4), "rms":round(rms, 4),
            "peak":round(abspeak, 4), "sha256":hashlib.sha256(data).hexdigest()}


def make_html(plan: dict, clips: list, out: Path, *, embedded: bool) -> None:
    # A static browser player, no third-party scripts, no SVG.
    if embedded:
        approved = [
            ("main", "win", 1), ("main", "cheongdan", 1),
            ("rival", "ppeok", 1), ("rival", "lose", 1),
            ("host", "start", 1), ("host", "hurry", 1)
        ]
        clips = [c for c in clips if (c["role"], c["id"], c["variant"]) in approved]
    cards = []
    for item in clips:
        url = item["mp3"]
        if embedded:
            uri = "data:audio/mpeg;base64," + base64.b64encode((out / url).read_bytes()).decode("ascii")
        else:
            uri = url
        phrase = html.escape(item["text"])
        event = html.escape(item["id"])
        role = item["role"]
        size = item["analysis"]["duration_seconds"]
        cards.append(
            f'<article class="clip" data-role="{role}"><div class="clip-head"><span class="role {role}">{role}</span>'
            f'<strong>{event}</strong><span class="take">take {item["variant"]} · {size:.2f}s</span></div>'
            f'<p>{phrase}</p><audio controls preload="none" src="{uri}"></audio>'
            f'<label><input type="checkbox" /> 발음·톤 적합</label></article>')
    title = "꽃맞고 v43 3인 음성 시청각 검수 — 6개 대표 샘플" if embedded else "꽃맞고 v43 3인 음성 시청각 검수 — 전체 88개"
    body = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/><title>{title}</title>
<style>
:root{{font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif;color:#342a25;background:#f6f1e7}}
*{{box-sizing:border-box}}body{{max-width:1040px;margin:0 auto;padding:18px 15px 70px}}
h1{{font-size:1.55rem;margin:10px 0}}p.intro{{line-height:1.65;color:#66564a}}
.controls{{display:flex;gap:7px;flex-wrap:wrap;padding:12px 0;position:sticky;top:0;background:#f6f1e7;z-index:1}}
button{{font:inherit;padding:9px 14px;border-radius:10px;border:1px solid #b9a18a;background:white;color:#332820;cursor:pointer}}
button[aria-pressed="true"]{{background:#70513c;color:white}}
#count{{color:#7a6758;margin:5px 0 18px}}main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:12px}}
.clip{{background:white;border:1px solid #eadcc9;border-radius:14px;padding:12px;box-shadow:0 3px 10px #c7b69b20}}
.clip[hidden]{{display:none}}.clip-head{{display:flex;align-items:center;gap:7px;flex-wrap:wrap}}
.role{{padding:4px 9px;border-radius:8px;font-size:.75rem;color:white}}.role.main{{background:#aa6678}}
.role.rival{{background:#7a8a65}}.role.host{{background:#647e9c}}.take{{font-size:.74rem;color:#777}}
.clip p{{font-size:1rem;min-height:42px;margin:12px 0}}audio{{width:100%;height:42px}}
label{{display:block;margin-top:8px;font-size:.8rem;color:#756250}}
small{{display:block;color:#806f60;margin-top:18px}}
</style></head><body><h1>{title}</h1>
<p class="intro">각 음성은 서로 다른 한국어 합성 프리셋을 사용합니다.
A 메인 F3 · B 상대 F5 · C 진행자 M2.<br/>음원의 기계적 품질 검사는 통과했지만,
발음/억양/자연스러움은 **청취 검수 전**이며 출시용 확정팩이 아닙니다.
이 페이지의 체크는 이 브라우저 안에서만 유지되는 검토 메모로, 실제 승인으로 전송되지 않습니다.</p>
<div class="controls">
<button type="button" data-filter="all" aria-pressed="true">모두</button>
<button type="button" data-filter="main">A · 메인</button>
<button type="button" data-filter="rival">B · 상대</button>
<button type="button" data-filter="host">C · 진행자</button></div>
<p id="count" aria-live="polite"></p><main>{''.join(cards)}</main>
<small>Supertonic 3 · Open RAIL-M · AI 합성 음성 · 원본 44.1kHz 출력 → 48kHz PCM16 변환.
권리 및 실제 청취 최종 확인 전 게임 배포 금지.</small>
<script>
const cards=[...document.querySelectorAll('.clip')];
const count=document.querySelector('#count');
function filter(role){{
document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===role)));
for(const c of cards)c.hidden=role!=='all'&&c.dataset.role!==role;
count.textContent=cards.filter(c=>!c.hidden).length+'개 대사 후보';
document.querySelectorAll('audio').forEach(a=>{{if(a.closest('.clip').hidden)a.pause()}})
}}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>filter(b.dataset.filter));
filter('all');
document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>{{for(const b of document.querySelectorAll('audio'))if(b!==a)b.pause()}}));
</script></body></html>"""
    name = "PREVIEW_6_IN_ONE.html" if embedded else "INDEX_88_CLIPS.html"
    (out / name).write_text(body, encoding="utf-8")


def produce(plan: dict, model_dir: Path, out: Path) -> None:
    from supertonic import TTS

    if not (model_dir / "config.json").is_file():
        raise FileNotFoundError(f"Missing model config in {model_dir}")
    model = TTS(model_dir=str(model_dir), auto_download=False)
    out.mkdir(parents=True, exist_ok=True)
    voice_styles = {role: model.get_voice_style(voice_name=info["preset"])
                    for role, info in plan["roles"].items()}
    result = []
    with tempfile.TemporaryDirectory(prefix="flower-matgo-v43-") as scratch:
        for index, entry in enumerate(plan["entries"], 1):
            role, cue, take = entry["role"], entry["id"], entry["variant"]
            base = f"{role}__{cue}__v{take:02d}"
            raw = Path(scratch) / f"{base}.wav"
            wav, _ = model.synthesize(entry["text"],
                                      voice_style=voice_styles[role],
                                      lang="ko", total_steps=10,
                                      speed=plan["roles"][role]["speed"])
            model.save_audio(wav, str(raw))
            target = out / f"{base}.wav"
            mp3 = out / f"{base}.mp3"
            normalize(raw, target, mp3)
            details = inspect_wav(target)
            if mp3.stat().st_size <= 3000:
                raise ValueError(f"Unexpected tiny MP3: {mp3}")
            result.append({**entry, "wav": target.name, "mp3": mp3.name,
                           "analysis": details, "listening_approved": False})
            print(f"[{index:02d}/{len(plan['entries'])}] {base}: {details['duration_seconds']:.2f}s", flush=True)
    published = {**plan, "generated_utc": datetime.now(timezone.utc).isoformat(),
                 "quality": "automated waveform checks only",
                 "human_listening_approved": False,
                 "ready_for_public_game": False, "clips": result}
    del published["entries"]
    (out / "manifest.json").write_text(json.dumps(published, ensure_ascii=False, indent=2),
                                      encoding="utf-8")
    (out / "README_KO.txt").write_text(
        "꽃맞고 v43 · A/B/C 3인 한국어 음성 88개 후보 (49개 게임 이벤트)\n"
        "A 여성 메인 F3, B 능청스러운 여성 상대 F5, C 남성 진행자 M2.\n"
        "모두 Supertonic 3 오픈 모델의 AI 합성음이며 사람 성우 녹음이 아닙니다.\n"
        "48kHz WAV는 출력 포맷을 통일한 것으로 엔진 원본 48kHz를 뜻하지 않습니다.\n"
        "MP3는 128kbps로 최적화했으며 INDEX_88_CLIPS.html을 열어 청취하세요.\n"
        "PREVIEW_6_IN_ONE.html은 압축 해제 없이 대표 샘플 6개를 들을 수 있습니다.\n"
        "기계 검사: WAV 디코딩·피크·RMS·길이·파일 크기.\n"
        "미검수: 자연스러운 한국어 발음·말투, 스마트폰/PC 소리, 최종 권리 검수.\n"
        "기존 게임에 새 음성을 활성화하지 않았으며 모든 후보는 보류 상태입니다.\n",
        encoding="utf-8")
    make_html(plan, result, out, embedded=False)
    make_html(plan, result, out, embedded=True)
    print(f"Completed: {len(result)} synthetic clips, all pending listening approval", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", type=Path, default=DEFAULT_PLAN)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--model-dir", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("voice-v43-audition"))
    args = parser.parse_args()
    plan = source_plan(args.plan)
    if args.check:
        print(json.dumps({"events": len({e["id"] for e in plan["entries"]}),
                          "clips": len(plan["entries"]),
                          "by_role": {role: len([e for e in plan["entries"] if e["role"]==role])
                                      for role in plan["roles"]},
                          "public": False}, ensure_ascii=False, indent=2))
        return
    if args.model_dir is None:
        parser.error("--model-dir is required for generation")
    produce(plan, args.model_dir, args.output_dir)


if __name__ == "__main__":
    main()
