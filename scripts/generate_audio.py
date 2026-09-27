"""Generate an original, quiet 16-second wedding ambience as mono PCM WAV."""

import math
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 22050
SECONDS = 16
CHORDS = [
    (220.00, 261.63, 329.63, 440.00),
    (196.00, 246.94, 329.63, 392.00),
    (174.61, 220.00, 261.63, 349.23),
    (196.00, 246.94, 293.66, 392.00),
]


def tone(frequency, time):
    fundamental = math.sin(2 * math.pi * frequency * time)
    bell = 0.25 * math.sin(2 * math.pi * frequency * 2.01 * time)
    shimmer = 0.08 * math.sin(2 * math.pi * frequency * 3.98 * time)
    return fundamental + bell + shimmer


path = Path(__file__).resolve().parent.parent / 'assets/audio/nocturne-original.wav'
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), 'wb') as sound:
    sound.setnchannels(1)
    sound.setsampwidth(2)
    sound.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for index in range(SAMPLE_RATE * SECONDS):
        time = index / SAMPLE_RATE
        chord = CHORDS[int(time // 4)]
        local = time % 4
        pad = sum(tone(note, time) for note in chord) / len(chord)
        pad *= 0.055 * (0.78 + 0.22 * math.sin(math.pi * local / 4))
        notes = [chord[2], chord[3], chord[1], chord[3], chord[2], chord[1], chord[0], chord[1]]
        beat = int(time * 2)
        beat_age = (time * 2 - beat) / 2
        pluck = tone(notes[beat % len(notes)], time) * math.exp(-beat_age * 7) * 0.095
        fade = min(1.0, time / 1.2, (SECONDS - time) / 1.2)
        sample = max(-1, min(1, (pad + pluck) * fade))
        frames.extend(struct.pack('<h', int(sample * 32767)))
    sound.writeframes(frames)
