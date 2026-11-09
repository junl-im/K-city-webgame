#!/usr/bin/env python3
"""Create original, license-free CannonTale combat foley (not retro oscillator SFX).

All source energy is deterministically synthesized here: transients, filtered
air, rubble grains, physical low-frequency impulses, and short environmental
reflections. No recorded third-party content or remote service is used.
"""
from pathlib import Path
import json
import subprocess
import tempfile
import wave

import numpy as np
from scipy import signal


RATE = 24000
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sound"
OUT.mkdir(exist_ok=True)


def rand(seed):
    return np.random.default_rng(seed)


def timeline(seconds):
    return np.zeros(round(RATE * seconds), dtype=np.float64)


def colored_noise(length, seed, low, high):
    raw = rand(seed).standard_normal(length)
    low = max(28, min(low, RATE * .41))
    high = min(high, RATE * .47)
    if low < high * .76:
        sos = signal.butter(2, [low, high], fs=RATE, btype="bandpass", output="sos")
    else:
        sos = signal.butter(2, high, fs=RATE, btype="lowpass", output="sos")
    result = signal.sosfilt(sos, raw)
    rms = np.sqrt(np.mean(result**2) + 1e-10)
    return np.clip(result / max(.07, rms), -4, 4)


def puff(out, at, length, amp, low, high, seed, attack=.003, decay=.13):
    pos = round(at * RATE)
    count = min(round(length * RATE), len(out) - pos)
    if count <= 0:
        return
    times = np.arange(count) / RATE
    envelope = (1 - np.exp(-times / max(attack, .0003))) * np.exp(-times / max(decay, .008))
    out[pos:pos + count] += colored_noise(count, seed, low, high) * amp * envelope


def shock(out, at, duration, amp, start=160, end=43, seed=0):
    pos = round(at * RATE)
    count = min(round(duration * RATE), len(out) - pos)
    if count <= 0:
        return
    times = np.arange(count) / RATE
    freq = end + (start - end) * np.exp(-times * 14)
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    wobble = 1 + .13 * np.sin(2 * np.pi * (19 + seed % 13) * times)
    envelope = (1 - np.exp(-times * 370)) * np.exp(-times / max(.06, duration * .34))
    out[pos:pos + count] += amp * envelope * (np.sin(phase) + .34 * np.sin(phase * 2.04)) * wobble


def shrapnel(out, at, count, seed, scale=1):
    rng = rand(seed)
    for i in range(count):
        when = at + rng.uniform(.025, .36) + i * .005
        if when > len(out) / RATE - .05:
            continue
        puff(out, when, .10, rng.uniform(.026, .08) * scale,
             rng.uniform(360, 1000), rng.uniform(2400, 6500), seed + i + 20,
             attack=.0006, decay=rng.uniform(.007, .023))


def reflections(out, a=.14):
    dry = out.copy()
    for seconds, gain in ((.071, a), (.139, a * .72), (.247, a * .42), (.38, a * .21)):
        offset = round(seconds * RATE)
        out[offset:] += dry[:-offset] * gain


def brass(out, at, notes, length, amp, seed):
    pos = round(at * RATE)
    count = min(round(length * RATE), len(out) - pos)
    if count <= 0:
        return
    t = np.arange(count) / RATE
    env = (1 - np.exp(-t * 31)) * np.exp(-t / (length * .45))
    sound = np.zeros(count)
    for idx, fundamental in enumerate(notes):
        vibrato = .0018 * np.sin(2 * np.pi * (4.7 + idx * .25) * t)
        phase = 2 * np.pi * fundamental * (t + vibrato * t)
        for harmonic, strength in ((1, .65), (2, .24), (3, .10), (4, .065)):
            sound += np.sin(phase * harmonic + seed * .12 + idx) * strength / len(notes)
    out[pos:pos + count] += sound * env * amp
    puff(out, at, min(length, .28), amp * .075, 300, 3100, seed + 12,
         attack=.012, decay=.14)


def make(name, seed):
    lengths = {
        "fire_normal": .92, "fire_bomb": 1.18, "fire_split": .91,
        "blast_normal": 1.08, "blast_bomb": 1.64, "blast_split": 1.05,
        "hit_wood": .53, "hit_stone": .75, "hit_iron": .79,
        "hit_foe": .52, "hit_hero": .61, "flyby": .69,
        "near_impact": .86, "boss_threat": 1.35, "boss_break": 1.65,
        "perfect": 1.12, "combo": 1.07, "win": 1.95, "lose": 1.42,
        "comeback": 2.25,
        "skill_fox": .84, "skill_bear": .98, "skill_rabbit": .88, "skill_cat": .94,
        "gauge_tick": .16, "gauge_lock": .30, "gauge_near": .35, "gauge_off": .36,
        "gauge_precision": .42, "charge": .44, "ui": .20, "split": .51,
    }
    out = timeline(lengths[name])
    heavy = name in ("fire_bomb", "blast_bomb", "boss_threat", "boss_break")
    if name.startswith("fire_"):
        puff(out, 0, .16, .52 if heavy else .46, 900, 9100, seed, decay=.028)
        puff(out, .013, .50 if heavy else .38, .65 if heavy else .49, 90, 2500, seed + 1,
             attack=.002, decay=.14 if heavy else .095)
        shock(out, .012, .55, .74 if heavy else .61, start=180 if heavy else 230, end=44, seed=seed)
        puff(out, .09, .7, .28, 100, 900, seed + 2, attack=.019, decay=.22)
        shrapnel(out, .08, 4 if name=="fire_split" else 2, seed + 3, .55)
        reflections(out, .16)
    elif name.startswith("blast_"):
        puff(out, 0, .18, .66, 550, 9700, seed, attack=.0007, decay=.027)
        puff(out, .018, .72 if heavy else .57, .74 if heavy else .60, 75, 2400, seed + 1,
             attack=.004, decay=.22 if heavy else .16)
        shock(out, .022, .75 if heavy else .51, .86 if heavy else .61,
              start=145 if heavy else 186, end=35, seed=seed)
        puff(out, .14, .87 if heavy else .59, .29, 95, 1100, seed + 2,
             attack=.05, decay=.36)
        shrapnel(out, .16, 11 if heavy else 7, seed + 3, .9 if heavy else .63)
        if name=="blast_split":
            shrapnel(out, .03, 6, seed + 24, .6)
        reflections(out, .22 if heavy else .12)
    elif name=="hit_wood":
        puff(out, 0, .20, .72, 280, 8500, seed, decay=.019)
        puff(out, .035, .20, .35, 170, 2800, seed + 1, decay=.045)
        shrapnel(out, .015, 6, seed + 6, .68)
    elif name=="hit_stone":
        puff(out, 0, .20, .64, 380, 6300, seed, decay=.029)
        shock(out, .015, .36, .36, 115, 42, seed)
        puff(out, .07, .43, .35, 150, 1400, seed + 1, attack=.023, decay=.14)
        shrapnel(out, .07, 8, seed + 8, .7)
    elif name=="hit_iron":
        puff(out, 0, .21, .71, 750, 9500, seed, decay=.014)
        for j, freq in enumerate([213, 391, 632, 1031, 1621]):
            brass(out, .012 + j * .001, [freq], .47, .22, seed + j)
        shrapnel(out, .13, 4, seed + 9, .42)
    elif name in ("hit_foe", "hit_hero"):
        puff(out, 0, .18, .65, 390, 5800, seed, decay=.022)
        shock(out, .01, .28, .40, 140, 46, seed)
        puff(out, .04, .28, .27, 150, 1700, seed + 1, decay=.10)
    elif name=="flyby":
        puff(out, .015, .62, .65, 270, 5200, seed, attack=.12, decay=.31)
        puff(out, .08, .43, .37, 520, 8700, seed + 1, attack=.085, decay=.19)
    elif name=="near_impact":
        shock(out, 0, .53, .80, 120, 33, seed)
        puff(out, .03, .59, .6, 56, 760, seed + 1, attack=.04, decay=.21)
        reflections(out, .09)
    elif name=="boss_threat":
        puff(out, 0, .21, .69, 330, 8900, seed, decay=.042)
        puff(out, .09, .80, .83, 70, 2200, seed + 1, attack=.032, decay=.33)
        shock(out, .04, .9, .91, 180, 32, seed)
        shrapnel(out, .14, 12, seed + 20, .65)
        reflections(out, .29)
    elif name=="boss_break":
        puff(out, 0, .18, .81, 370, 9200, seed, decay=.029)
        shock(out, .02, 1.2, .94, 208, 29, seed)
        puff(out, .11, 1.1, .72, 70, 1700, seed + 1, attack=.025, decay=.39)
        shrapnel(out, .14, 21, seed + 17, .84)
        reflections(out, .27)
    elif name=="perfect":
        puff(out, 0, .13, .53, 850, 9000, seed, decay=.014)
        brass(out, .034, [493, 740, 987], .8, .44, seed)
        puff(out, .23, .67, .2, 840, 6900, seed + 1, attack=.065, decay=.22)
        reflections(out, .10)
    elif name=="combo":
        for i, chord in enumerate(([233, 349], [294, 440], [349, 523])):
            puff(out, .08 + i * .13, .08, .19, 490, 5500, seed + i, decay=.016)
            brass(out, .08 + i * .13, chord, .6, .27, seed + i)
        reflections(out, .11)
    elif name in ("win", "comeback"):
        for i, chord in enumerate(([220, 330, 440], [277, 415, 554], [330, 494, 659])):
            puff(out, .10 + i * .27, .17, .30, 90, 3800, seed + i, decay=.065)
            shock(out, .10 + i * .27, .28, .30, 115, 39, seed + i)
            brass(out, .10 + i * .27, chord, 1.0 if name=="comeback" else .84, .39, seed+i)
        if name=="comeback":
            brass(out, 1.17, [392, 587, 783], .83, .46, seed + 10)
        reflections(out, .16)
    elif name=="lose":
        puff(out, .02, .36, .25, 150, 1900, seed, attack=.03, decay=.13)
        brass(out, .08, [233, 311, 392], 1.01, .30, seed)
        shock(out, .09, .6, .34, 105, 35, seed)
        reflections(out, .12)
    elif name=="skill_fox":
        puff(out, .008, .73, .58, 440, 8000, seed, attack=.065, decay=.26)
        puff(out, .17, .37, .51, 1100, 9400, seed + 1, attack=.007, decay=.073)
        reflections(out, .06)
    elif name=="skill_bear":
        shock(out, .01, .72, .78, 160, 32, seed)
        puff(out, 0, .41, .69, 160, 6300, seed + 1, decay=.075)
        puff(out, .09, .64, .50, 70, 900, seed + 2, attack=.026, decay=.24)
        reflections(out, .14)
    elif name=="skill_rabbit":
        for index in range(5):
            puff(out, .025 + index * .098, .22, .48, 670, 9000, seed + index,
                 attack=.003, decay=.031)
        puff(out, .08, .63, .31, 180, 2600, seed + 7, attack=.025, decay=.21)
    elif name=="skill_cat":
        for index in range(6):
            puff(out, .015 + index * .091, .20, .36, 1200, 10800, seed + index,
                 attack=.002, decay=.023)
        puff(out, .02, .65, .38, 220, 4500, seed + 9, attack=.047, decay=.19)
        reflections(out, .08)
    elif name in ("gauge_tick", "gauge_lock", "ui"):
        puff(out, 0, .12, .65, 600 if name=="ui" else 260, 7400, seed,
             attack=.001, decay=.011 if name=="gauge_tick" else .026)
        if name=="gauge_lock":
            puff(out, .045, .16, .46, 440, 4100, seed + 2, decay=.036)
            shock(out, .015, .2, .27, 145, 52, seed)
    elif name in ("gauge_near", "gauge_off", "gauge_precision", "charge"):
        puff(out, .012, lengths[name] * .8, .45, 220, 4300, seed,
             attack=.024, decay=.10)
        if name=="gauge_off":
            shock(out, .025, .26, .31, 160, 40, seed)
        else:
            puff(out, .04, .20, .34, 900, 7900, seed + 1, attack=.012, decay=.07)
    elif name=="split":
        for index in range(3):
            puff(out, .014 + index * .074, .17, .49, 670, 9800, seed + index,
                 attack=.001, decay=.024)
        puff(out, .015, .36, .31, 150, 3300, seed + 9, decay=.12)
    # A short natural fade prevents the mobile decoder from clicking at the tail.
    ramp = min(round(RATE * .013), len(out) // 2)
    out[:ramp] *= np.linspace(0, 1, ramp)
    out[-ramp:] *= np.linspace(1, 0, ramp)
    out = np.tanh(out * 1.08)
    peak = max(.001, np.max(np.abs(out)))
    return np.asarray(out / peak * .81, dtype=np.float32)


def export_atlas():
    names = (
        "fire_normal", "fire_bomb", "fire_split", "blast_normal", "blast_bomb", "blast_split",
        "hit_wood", "hit_stone", "hit_iron", "hit_foe", "hit_hero", "flyby", "near_impact",
        "boss_threat", "boss_break", "perfect", "combo", "win", "lose", "comeback",
        "skill_fox", "skill_bear", "skill_rabbit", "skill_cat", "gauge_tick", "gauge_lock",
        "gauge_near", "gauge_off", "gauge_precision", "charge", "ui", "split"
    )
    segments = []
    cues = {}
    offset = 0
    silence = np.zeros(round(RATE * .12), dtype=np.float32)
    for index, name in enumerate(names):
        sound = make(name, 7400 + index * 173)
        cues[name] = [round(offset / RATE, 5), round(len(sound) / RATE, 5)]
        segments.extend((sound, silence))
        offset += len(sound) + len(silence)
    pcm = np.int16(np.clip(np.concatenate(segments), -1, 1) * 32767)
    with tempfile.TemporaryDirectory() as directory:
        wav = Path(directory) / "original.wav"
        with wave.open(str(wav), "wb") as writer:
            writer.setnchannels(1)
            writer.setsampwidth(2)
            writer.setframerate(RATE)
            writer.writeframes(pcm.tobytes())
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
            "-c:a", "libvorbis", "-q:a", "5", str(OUT / "foley_atlas.ogg")
        ], check=True)
    (OUT / "foley_cues.json").write_text(json.dumps(cues, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return len(pcm) / RATE, (OUT / "foley_atlas.ogg").stat().st_size, len(cues)


if __name__ == "__main__":
    duration, size, cues = export_atlas()
    print(f"foley_atlas.ogg: {duration:.2f}s, {size / 1024:.1f} KiB, {cues} original cues")
