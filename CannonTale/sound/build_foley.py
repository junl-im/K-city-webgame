#!/usr/bin/env python3
"""Build CannonTale's original cinematic cartoon-artillery sound atlas.

No third-party recordings or generated speech are incorporated. Every cue is
made from filtered broadband transients, inharmonic resonances and short spatial
reflections. Requires numpy, scipy and ffmpeg (for final game-ready encoding).
"""

import json
import math
import subprocess
from pathlib import Path

import numpy as np
from scipy import signal


ROOT = Path(__file__).resolve().parent
SR = 44100
RNG = np.random.default_rng(20261109)
CUES = json.loads((ROOT / "foley_cues.json").read_text(encoding="utf-8"))
ATLAS_DURATION = max(start + length for start, length in CUES.values()) + 0.12


def envelope(n, attack=0.003, decay=0.2, hold=0):
    t = np.arange(n) / SR
    rise = 1 - np.exp(-t / max(0.0002, attack))
    fall = np.exp(-np.maximum(0, t - hold) / max(0.005, decay))
    return rise * fall


def filtered_noise(duration, low=30, high=14000, amplitude=1):
    n = max(16, round(duration * SR))
    x = RNG.standard_normal(n)
    if low > 20:
        x = signal.sosfilt(signal.butter(2, low, "highpass", fs=SR, output="sos"), x)
    if high < SR * 0.48:
        x = signal.sosfilt(signal.butter(2, high, "lowpass", fs=SR, output="sos"), x)
    rms = np.sqrt(np.mean(x * x))
    return x * (amplitude / max(0.02, rms))


def drum(duration=0.55, f0=95, f1=38, decay=0.21, level=0.45):
    n = round(duration * SR)
    t = np.arange(n) / SR
    instantaneous = f1 + (f0 - f1) * np.exp(-t / 0.035)
    phase = 2 * np.pi * np.cumsum(instantaneous) / SR
    fundamental = np.sin(phase) + 0.11 * np.sin(phase * 1.87)
    return fundamental * envelope(n, 0.002, decay) * level


def resonant(duration, frequencies, decay=0.2, level=0.15):
    n = round(duration * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, freq in enumerate(frequencies):
        # Deliberately inharmonic partials: struck materials, not retro melody.
        out += np.sin(2 * np.pi * (freq * t + 0.5 * math.sin(k + 1) * t * t)) * np.exp(-t / (decay / (1 + k * 0.38))) / (1 + k * 0.7)
    return level * out * (1 - np.exp(-t / 0.001))


class Cue:
    def __init__(self, duration):
        self.duration = duration
        self.data = np.zeros((round(duration * SR), 2), dtype=np.float64)

    def layer(self, mono, when=0, gain=1, pan=0, width=0):
        at = round(when * SR)
        if at >= len(self.data):
            return
        n = min(len(mono), len(self.data) - at)
        if n <= 0:
            return
        angle = (max(-1, min(1, pan)) + 1) * np.pi / 4
        left, right = math.cos(angle), math.sin(angle)
        self.data[at:at + n, 0] += mono[:n] * gain * left
        self.data[at:at + n, 1] += mono[:n] * gain * right
        if width:
            # Room reflection, decorrelated from direct sound, slightly wider.
            offset = max(1, round((0.008 + width * 0.013) * SR))
            tail = min(n, len(self.data) - at - offset)
            if tail > 0:
                self.data[at + offset:at + offset + tail, 0] += mono[:tail] * gain * width * 0.14 * right
                self.data[at + offset:at + offset + tail, 1] += mono[:tail] * gain * width * 0.14 * left

    def crack(self, when=0, weight=1, material="metal", pan=0):
        configs = {"metal": (850, 13700, 0.044), "wood": (165, 7900, 0.061), "stone": (95, 9800, 0.074)}
        low, high, duration = configs[material]
        x = filtered_noise(duration, low, high, 0.4) * envelope(round(duration * SR), 0.00045, duration * 0.28)
        self.layer(x, when, weight, pan, 0.3)

    def rush(self, when=0, duration=0.38, low=90, high=4700, weight=0.26, pan=0):
        n = round(duration * SR)
        x = filtered_noise(duration, low, high, 0.34)
        t = np.arange(n) / SR
        wave = np.sin(np.pi * np.minimum(1, t / duration)) ** 1.5
        self.layer(x * wave, when, weight, pan, 0.78)

    def boom(self, when=0, scale=1, f0=105, decay=0.28):
        self.layer(drum(min(0.77, max(0.12, self.duration - when)), f0, 33, decay, 0.48), when, scale, 0, 0.3)
        self.layer(filtered_noise(min(0.34, self.duration - when), 43, 800, 0.19)
                   * envelope(round(min(0.34, self.duration - when) * SR), 0.002, decay * 0.5), when, scale, 0, 0.56)

    def fragments(self, when=0.12, count=8, end=0.65, material="stone", scale=1):
        span = max(0.05, min(self.duration - 0.07, end) - when)
        for i in range(count):
            tm = when + (i + RNG.uniform(-0.35, 0.35)) * span / count
            if tm >= self.duration - 0.055:
                break
            weight = (0.48 + RNG.random() * 0.57) * scale * (1 - i / (count * 1.4))
            self.crack(max(0, tm), weight * 0.42, material, RNG.uniform(-0.78, 0.78))

    def chime(self, when, freqs, decay=0.3, weight=0.35, pan=0):
        d = min(self.duration - when, max(0.06, decay * 2.9))
        if d > 0:
            self.layer(resonant(d, freqs, decay, 0.25), when, weight, pan, 0.48)

    def finish(self):
        # Short unpitched early reflections sound spacious without long reverb.
        original = self.data.copy()
        for delay, level, swap in [(0.034, 0.13, False), (0.061, 0.09, True), (0.098, 0.058, False)]:
            offset = round(delay * SR)
            reflected = original[:-offset, ::-1] if swap else original[:-offset]
            self.data[offset:] += reflected * level
        n = len(self.data)
        edge = min(280, n // 3)
        self.data[:edge] *= np.linspace(0, 1, edge)[:, None]
        self.data[-edge:] *= np.linspace(1, 0, edge)[:, None]
        # Soft saturation tames impacts; final peak management is per cue.
        self.data = np.tanh(self.data * 1.17)
        peak = float(np.max(np.abs(self.data)))
        if peak > 0:
            self.data *= min(1.2, 0.84 / peak)
        return self.data


def build(name, duration):
    c = Cue(duration)
    if name.startswith("fire_"):
        bomb = name.endswith("bomb")
        split = name.endswith("split")
        c.crack(0.023, 0.85 if bomb else 0.72)
        c.boom(0.028, 1.26 if bomb else (0.71 if split else 0.88), 130 if bomb else 104, 0.34)
        c.rush(0.07, min(0.54, duration - 0.12), 90, 4300 if split else 2700, 0.86 if split else 0.74)
        if bomb:
            c.boom(0.20, 0.47, 75, 0.25)
            c.fragments(0.24, 6, 0.92, "metal", 0.67)
        if split:
            c.fragments(0.19, 5, 0.70, "metal", 0.43)
    elif name.startswith("blast_"):
        bomb = name.endswith("bomb")
        split = name.endswith("split")
        c.crack(0.007, 1.1 if bomb else 0.82)
        c.boom(0.013, 1.65 if bomb else 1.05, 119 if bomb else 142, 0.41 if bomb else 0.24)
        c.rush(0.055, min(duration - 0.08, 0.75 if bomb else 0.38), 70, 5700, 1.0 if bomb else 0.54)
        c.fragments(0.12, 18 if bomb else (11 if split else 7), duration - 0.1, "stone", 0.85 if bomb else 0.6)
        if bomb:
            c.boom(0.32, 0.62, 75, 0.47)
            c.fragments(0.70, 11, duration - 0.1, "wood", 0.44)
        if split:
            for i in range(4):
                c.crack(0.13 + i * 0.125, 0.50, "metal", (-1) ** i * 0.55)
    elif name in ("hit_wood", "hit_stone", "hit_iron"):
        mat = name[4:]
        c.crack(0.018, 1.15 if mat == "wood" else 0.92, "metal" if mat == "iron" else mat)
        if mat == "wood":
            c.layer(resonant(0.28, [183, 321, 611], 0.085), 0.027, 0.7)
            c.fragments(0.08, 8, 0.43, "wood", 0.48)
        elif mat == "stone":
            c.boom(0.025, 0.67, 103, 0.18)
            c.fragments(0.07, 11, 0.59, "stone", 0.59)
        else:
            c.chime(0.025, [523, 1124, 1779, 2784], 0.29, 1.15)
            c.crack(0.14, 0.38, "metal", -0.25)
    elif name in ("hit_foe", "hit_hero"):
        c.crack(0.018, 0.67, "wood")
        c.boom(0.025, 0.64 if name == "hit_hero" else 0.37, 117, 0.13)
        c.rush(0.03, duration - 0.08, 130, 1700, 0.29)
    elif name.startswith("foe_"):
        species = name[4:]
        if species == "acorn":
            c.crack(0.015, 0.93, "wood")
            c.boom(0.025, 0.30, 157, 0.12)
            c.fragments(0.07, 8, 0.45, "wood", 0.37)
        elif species == "golem":
            c.crack(0.017, 0.95, "stone")
            c.boom(0.025, 0.77, 99, 0.23)
            c.fragments(0.08, 12, 0.62, "stone", 0.67)
        elif species == "spirit":
            c.rush(0.02, 0.56, 310, 9800, 1.05, -0.30)
            c.rush(0.16, 0.38, 120, 3900, 0.44, 0.45)
            c.chime(0.11, [790, 1381, 2527], 0.15, 0.24)
        else:
            c.crack(0.022, 1.22, "metal")
            c.boom(0.025, 1.11, 118, 0.31)
            c.chime(0.04, [417, 901, 1611, 2819], 0.30, 0.92)
            c.fragments(0.19, 9, 0.81, "metal", 0.52)
    elif name == "flyby":
        c.rush(0.02, 0.61, 270, 9200, 1.25, -0.50)
        c.rush(0.19, 0.37, 120, 3500, 0.5, 0.66)
    elif name == "near_impact":
        c.rush(0.0, 0.44, 60, 3800, 0.83)
        c.boom(0.13, 0.84, 91, 0.31)
        c.fragments(0.22, 5, 0.64, "stone", 0.43)
    elif name == "boss_threat":
        c.rush(0.04, 1.02, 45, 2500, 0.91)
        c.boom(0.22, 1.20, 79, 0.44)
        c.chime(0.29, [121, 184, 290, 449], 0.58, 0.55)
        c.fragments(0.49, 9, 1.10, "metal", 0.35)
    elif name == "boss_break":
        c.crack(0.025, 1.28, "metal")
        c.boom(0.02, 1.5, 129, 0.45)
        c.fragments(0.17, 24, 1.39, "metal", 0.65)
        c.boom(0.38, 0.85, 80, 0.42)
        c.rush(0.37, 1.06, 65, 5500, 0.63)
    elif name in ("perfect", "combo", "win", "lose", "comeback"):
        accents = {"perfect": [0.04, 0.18], "combo": [0.02, 0.16, 0.30],
                   "win": [0.12, 0.34, 0.58, 0.90], "lose": [0.16, 0.51],
                   "comeback": [0.03, 0.17, 0.36, 0.60, 0.89, 1.15]}
        for i, when in enumerate(accents[name]):
            c.crack(when, 0.45 + i * 0.035, "metal", -0.36 if i % 2 else 0.36)
            c.chime(when + 0.015, [523 + 37 * i, 1121 + 57 * i, 1811 + 83 * i], 0.22, 0.7)
        if name == "lose":
            c.boom(0.18, 0.45, 90, 0.36)
            c.rush(0.25, 0.80, 95, 2000, 0.26)
        else:
            c.rush(0.03, min(duration - 0.10, 0.84 if name != "comeback" else 1.75), 190, 8900, 0.45)
            if name in ("win", "comeback"):
                c.boom(0.09, 0.55, 103, 0.32)
                c.fragments(0.68, 14, duration - 0.13, "metal", 0.25)
    elif name.startswith("skill_"):
        hero = name[6:]
        if hero == "fox":
            c.rush(0.04, 0.60, 280, 9500, 0.87, -0.36)
            c.crack(0.22, 0.58, "wood", 0.38)
        elif hero == "bear":
            c.boom(0.07, 1.22, 92, 0.37)
            c.crack(0.18, 0.87, "stone")
            c.fragments(0.3, 6, 0.79, "stone", 0.41)
        elif hero == "rabbit":
            for i in range(5):
                c.rush(0.055 + i * 0.10, 0.13, 350, 8500, 0.42, -0.75 + i * 0.36)
                c.crack(0.09 + i * 0.10, 0.26, "wood", -0.75 + i * 0.36)
        else:
            c.chime(0.07, [420, 973, 1721, 2931], 0.32, 0.95)
            c.rush(0.16, 0.55, 320, 9700, 0.77)
    elif name.startswith("gauge_") or name in ("charge", "ui", "split"):
        if name == "gauge_tick":
            c.crack(0.021, 0.19, "wood")
        elif name == "gauge_lock":
            c.crack(0.02, 0.35, "metal")
            c.chime(0.038, [1013, 1679, 2461], 0.12, 0.31)
        elif name == "gauge_near":
            c.rush(0.018, 0.25, 420, 5400, 0.36)
            c.crack(0.13, 0.22, "metal")
        elif name == "gauge_off":
            c.crack(0.018, 0.28, "wood")
            c.boom(0.04, 0.22, 93, 0.09)
        elif name == "gauge_precision":
            c.crack(0.015, 0.42, "metal")
            c.chime(0.047, [819, 1444, 2353, 3637], 0.15, 0.44)
        elif name == "charge":
            c.rush(0.022, 0.30, 140, 2700, 0.5)
            c.crack(0.21, 0.28, "wood")
        elif name == "split":
            c.rush(0.02, 0.43, 340, 7500, 0.79)
            for i in range(3):
                c.crack(0.11 + i * 0.10, 0.25, "metal", (i - 1) * 0.45)
        else:
            c.crack(0.018, 0.19, "wood")
            c.chime(0.029, [750, 1399, 2607], 0.07, 0.20)
    return c.finish()


def main():
    atlas = np.zeros((round(ATLAS_DURATION * SR), 2), dtype=np.float32)
    for name, (start, duration) in CUES.items():
        rendered = build(name, duration)
        begin = round(start * SR)
        atlas[begin:begin + len(rendered)] += rendered.astype(np.float32)
        peak = max(np.max(np.abs(rendered)), 1e-9)
        rms = math.sqrt(float(np.mean(rendered * rendered)))
        print(f"{name:18s} peak={peak:.2f} rms={rms:.3f}")
    # Both Vorbis and MP3 can overshoot on decode. Reserve a generous margin
    # before the in-browser per-event gain and speaker-safe compressor stages.
    atlas = np.clip(atlas, -0.96, 0.96) * 0.75
    for codec, path, args in [
        ("vorbis", ROOT / "foley_atlas.ogg", ["-c:a", "libvorbis", "-q:a", "4"]),
        ("mp3", ROOT / "foley_atlas.mp3", ["-c:a", "libmp3lame", "-b:a", "112k"]),
    ]:
        command = ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "pipe:0", *args, str(path)]
        result = subprocess.run(command, input=atlas.tobytes(), capture_output=True, check=False)
        if result.returncode:
            raise RuntimeError(f"{codec} encoder failed: {result.stderr.decode()}")
        print(f"{path.name}: {path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
