import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NOTE_FREQ, midiToFreq, noteToFreq, sweepRatio } from '../src/lib/audio/noteFreq.ts';

describe('noteToFreq', () => {
  it('maps natural notes in octave 4', () => {
    assert.equal(noteToFreq('A4'), NOTE_FREQ.A4);
    assert.ok(Math.abs(noteToFreq('C4') - NOTE_FREQ.C4) < 0.02);
  });

  it('supports sharps and flats', () => {
    assert.ok(Math.abs(noteToFreq('C#4') - 277.18) < 0.02);
    assert.ok(Math.abs(noteToFreq('Bb4') - 466.16) < 0.02);
  });

  it('returns NaN for invalid input', () => {
    assert.ok(Number.isNaN(noteToFreq('H4')));
    assert.ok(Number.isNaN(noteToFreq('')));
  });
});

describe('midiToFreq', () => {
  it('uses A4 = 440 Hz at MIDI 69', () => {
    assert.equal(midiToFreq(69), 440);
  });

  it('steps by semitone ratio', () => {
    assert.ok(Math.abs(midiToFreq(70) - 466.16) < 0.02);
  });
});

describe('sweepRatio', () => {
  it('returns start at t=0 and end at t=1', () => {
    assert.equal(sweepRatio(100, 400, 0), 100);
    assert.equal(sweepRatio(100, 400, 1), 400);
  });

  it('clamps out-of-range t', () => {
    assert.equal(sweepRatio(100, 400, -1), 100);
    assert.equal(sweepRatio(100, 400, 2), 400);
  });
});

describe('NOTE_FREQ', () => {
  it('includes unlock chime triad', () => {
    assert.ok(NOTE_FREQ.A4 > 0);
    assert.ok(NOTE_FREQ.C5 > NOTE_FREQ.A4);
    assert.ok(NOTE_FREQ.E5 > NOTE_FREQ.C5);
  });
});
