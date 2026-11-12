#!/usr/bin/env python3
"""Flower Matgo v42: three distinct Korean voices, listen-before-release drafts.

Uses only the fixed presets from the pinned Supertonic 3 open-weight model.
Produces genuine WAV/MP3 clips, but NEVER changes the shipping game's ready flag.
"""
from __future__ import annotations

import argparse
import array
import json
import math
import subprocess
import tempfile
import wave
import imageio_ffmpeg
from datetime import datetime, timezone
from pathlib import Path

MODEL_REPO = "supertone-oss-archive/supertonic-3"
MODEL_REVISION = "aafc6e32416a594460b32413efc49d7fe4ce6d46"
# These are three distinct preset embeddings, not a cloned real person's voice.
# Tone suitability and Korean pronunciation still require a human listening test.
ROLES = {
    "main": {
        "preset": "F3", "speed": 1.04, "brief": "귀엽고 발랄한 여성 / 족보·승리",
        "samples": [("win_01", "아싸, 내가 이겼어!"), ("cheongdan_01", "청단 완성!")],
    },
    "rival": {
        "preset": "F5", "speed": 0.98, "brief": "능청스러운 여성 / 도발·실수 반응",
        "samples": [("ppeok_01", "어머, 거기서 뻑이 나네?"), ("tease_01", "이번엔 내가 한 수 앞섰지!")],
    },
    "host": {
        "preset": "M2", "speed": 1.0, "brief": "또렷한 남성 진행자 / 게임 안내",
        "samples": [("start_01", "자, 게임을 시작합니다!"), ("hurry_01", "남은 시간 오 초입니다!")],
    },
}


def command(*args: str) -> None:
    # GitHub's hosted runner image does not guarantee a system FFmpeg.
    # imageio-ffmpeg provides one independently of apt/sudo.
    executable = imageio_ffmpeg.get_ffmpeg_exe() if args[0] == "ffmpeg" else args[0]
    result = subprocess.run((executable, *args[1:]), capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"Audio command failed ({result.returncode}): {result.stderr[-2500:]}")


def measure_wav(path: Path) -> dict[str, float | int]:
    with wave.open(str(path), "rb") as audio:
        channels, frequency, frames = (
            audio.getnchannels(), audio.getframerate(), audio.getnframes()
        )
        if audio.getsampwidth() != 2 or channels != 1:
            raise ValueError(f"Expected mono PCM16 WAV: {path}")
        pcm = array.array("h")
        pcm.frombytes(audio.readframes(frames))
    seconds = frames / frequency
    peak = max(abs(x) for x in pcm) / 32768 if pcm else 0
    rms = math.sqrt(sum(int(x) * int(x) for x in pcm) / max(1, len(pcm))) / 32768
    if frequency != 48000 or not (0.30 <= seconds <= 12.0):
        raise ValueError(f"Unexpected sample rate/clip duration: {path} {frequency} {seconds:.2f}")
    if not (0.018 < rms < 0.55) or peak >= 0.985:
        raise ValueError(f"Silence or clipped/mismatched dynamic range: {path} peak={peak:.3f}, rms={rms:.3f}")
    return {"sample_rate_hz": frequency, "duration_s": round(seconds, 4),
            "peak": round(peak, 4), "rms": round(rms, 4),
            "channels": channels, "bit_depth": 16}


def normalize(raw: Path, wav_path: Path, mp3_path: Path) -> None:
    # Short start/end pauses are removed; no pitch acceleration is added here.
    # 48 kHz is a deliverable container rate (upsampled where the model is
    # natively lower rate), not a claim that model output was 48 kHz native.
    filter_chain = (
        "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-46dB:"
        "stop_periods=1:stop_duration=0.11:stop_threshold=-46dB,"
        "apad=pad_dur=0.045,"
        "loudnorm=I=-18:TP=-2.0:LRA=9"
    )
    command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(raw), "-af", filter_chain, "-ar", "48000", "-ac", "1",
            "-c:a", "pcm_s16le", str(wav_path))
    command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(wav_path), "-c:a", "libmp3lame", "-b:a", "128k",
            str(mp3_path))
    if mp3_path.stat().st_size < 3000:
        raise ValueError(f"MP3 was unexpectedly tiny: {mp3_path}")


def plan() -> dict:
    return {
        "project": "FlowerMatgo", "version": "v42 audition candidates",
        "model_repository": MODEL_REPO, "model_revision": MODEL_REVISION,
        "source_license": "BigScience Open RAIL-M",
        "use": "review-only, not in published game",
        "roles": ROLES,
        "quality_gate": ["48kHz PCM16 WAV masters", "128kbps MP3",
                         "automatic duration/peak/RMS checks",
                         "human Korean diction, emotions, role distinction", 
                         "rights/distribution final review"],
    }


def generate(model_dir: Path, output_dir: Path) -> None:
    from supertonic import TTS
    if not (model_dir / "config.json").is_file():
        raise FileNotFoundError(f"Supertonic model_dir lacks config.json: {model_dir}")
    model = TTS(model_dir=str(model_dir), auto_download=False)
    output_dir.mkdir(parents=True, exist_ok=True)
    clips = []
    with tempfile.TemporaryDirectory(prefix="flower-voice-v42-") as work:
        tmp = Path(work)
        for role, settings in ROLES.items():
            voice = model.get_voice_style(voice_name=settings["preset"])
            for event, spoken_text in settings["samples"]:
                name = f"{role}__{event}"
                original = tmp / f"{name}__raw.wav"
                wav, _duration = model.synthesize(
                    spoken_text, voice_style=voice, lang="ko",
                    total_steps=10, speed=settings["speed"]
                )
                model.save_audio(wav, str(original))
                master = output_dir / f"{name}.wav"
                compressed = output_dir / f"{name}.mp3"
                normalize(original, master, compressed)
                details = measure_wav(master)
                clips.append({
                    "event": event, "role": role, "preset": settings["preset"],
                    "script_ko": spoken_text, "wav": master.name,
                    "mp3": compressed.name, "analysis": details,
                    "listening_approved": False,
                })
                print(f"[CREATED] {name}: {details['duration_s']}s / {details['peak']} peak", flush=True)
    manifest = {
        "version": "FlowerMatgo-v42-audition",
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "source_model": MODEL_REPO, "revision": MODEL_REVISION,
        "license": "BigScience Open RAIL-M",
        "audio_is_synthetic": True,
        "commercial_use": "conditional on compliance with license; not independently certified",
        "human_listening_approved": False, "ready_for_public_game": False,
        "clips": clips,
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (output_dir / "README_KO.txt").write_text(
        "꽃맞고 v42 한국어 3인 프리셋 음성 비교용 후보\n"
        "메인 F3 / 상대 F5 / 진행자 M2. 각 2개 대사, 합계 6개.\n"
        "Supertonic 3 공개 사전학습 프리셋으로 만든 AI 합성음입니다.\n"
        "이 ZIP은 음성 후보 청취용입니다. 게임 출시용 확정 음원은 아닙니다.\n"
        "한글 발음과 말투·음색·청각 품질 및 권리 검수 뒤 승인 필요.\n"
        "WAV 48kHz PCM16은 표준화 출력이며 엔진 네이티브 샘플레이트와 다를 수 있습니다.\n"
        "모델 라이선스: BigScience Open RAIL-M (함께 제공되는 MODEL_LICENSE 참조).\n",
        encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", action="store_true")
    parser.add_argument("--model-dir", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("voice-v42-previews"))
    args = parser.parse_args()
    if args.plan:
        print(json.dumps(plan(), ensure_ascii=False, indent=2))
    else:
        if args.model_dir is None:
            parser.error("--model-dir is required unless --plan")
        generate(args.model_dir, args.output_dir)
