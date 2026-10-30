const KEY = "q3.sound";
const SINE = 0;
const TRI = 1;
const SAW = 2;
const NOISE = 4;
const SQUARE = 5;

function readSetting() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

let on = readSetting();
const listeners = new Set();
let engine = null;
const buffers = new Map();

// ZzFX opens an AudioContext when imported, so wait for the first gesture
function load() {
  if (!engine) {
    engine = import("zzfx").then(({ ZZFX }) => {
      ZZFX.volume = 0.45;
      return ZZFX;
    });
  }
  return engine;
}

let greeted = false;

// a few notes when the game is opened; browsers only allow it after a click
function greet() {
  if (greeted || !on) return;
  greeted = true;
  load().then((Z) => {
    const start = () => play("jingle");
    if (Z.audioContext.state === "suspended") Z.audioContext.resume().then(start);
    else start();
  });
}

if (typeof window !== "undefined") {
  const unlock = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    greet();
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

const note = (midi) => 440 * 2 ** ((midi - 69) / 12);

// ZzFX's positional parameters, by name
function voice(o) {
  return [
    o.vol ?? 0.2,
    0,
    o.freq ?? 440,
    o.a ?? 0.004,
    o.s ?? 0.05,
    o.r ?? 0.1,
    o.shape ?? SINE,
    o.curve ?? 1,
    o.slide ?? 0,
    0,
    0,
    0,
    o.repeat ?? 0,
    0,
    o.mod ?? 0,
    0,
    0,
    1,
    0,
    o.tremolo ?? 0,
    o.filter ?? 0,
  ];
}

const sq = (midi, dur, vol = 0.2, curve = 0.5) =>
  voice({ vol, freq: note(midi), s: dur * 0.55, r: dur * 0.45, shape: SQUARE, curve });
const tri = (freq, dur, vol = 0.25) => voice({ vol, freq, s: dur * 0.4, r: dur * 0.6, shape: TRI });
const saw = (midi, dur, extra = {}) =>
  voice({ vol: 0.2, freq: note(midi), a: 0.02, s: dur * 0.6, r: dur * 0.4, shape: SAW, filter: 900, ...extra });
const bell = (freq, len, vol = 0.16) => voice({ vol, freq, a: 0.003, s: 0.02, r: len });

const SOUNDS = {
  // a short major-key phrase, about two seconds
  jingle: [
    [0, sq(67, 0.12, 0.12)],
    [0.13, sq(71, 0.12, 0.12)],
    [0.26, sq(74, 0.12, 0.13)],
    [0.39, sq(79, 0.16, 0.14)],
    [0.58, sq(69, 0.12, 0.12)],
    [0.71, sq(72, 0.12, 0.12)],
    [0.84, sq(76, 0.12, 0.13)],
    [0.97, sq(81, 0.18, 0.14)],
    [1.2, sq(79, 0.42, 0.15)],
    [1.2, sq(74, 0.42, 0.08)],
    [1.2, tri(note(55), 0.5, 0.16)],
  ],
  click: [[0, voice({ vol: 0.16, freq: 880, a: 0, s: 0.01, r: 0.03, shape: SQUARE, curve: 0.5 })]],
  pick: [
    [0, sq(76, 0.05)],
    [0.05, sq(83, 0.09)],
  ],
  drumroll: [
    [0, voice({ vol: 0.16, freq: 600, a: 0.35, s: 1.1, r: 0.25, shape: NOISE, repeat: 0.045, tremolo: 0.9, filter: -700 })],
  ],
  swing: [[0, voice({ vol: 0.16, freq: 420, a: 0.05, s: 0.1, r: 0.35, shape: NOISE, slide: -0.6, filter: 1000 })]],
  baa: [
    [0, voice({ vol: 0.2, freq: 300, a: 0.03, s: 0.32, r: 0.18, shape: SAW, slide: -0.05, repeat: 0.033, tremolo: 0.55, filter: 1500 })],
  ],
  win: [
    [0, sq(72, 0.1)],
    [0.1, sq(76, 0.1)],
    [0.2, sq(79, 0.1)],
    [0.3, sq(84, 0.5, 0.2)],
    [0.3, sq(76, 0.5, 0.12, 1)],
    [0.3, tri(note(48), 0.5)],
  ],
  lose: [
    [0, saw(58, 0.26)],
    [0.28, saw(57, 0.26)],
    [0.56, saw(56, 0.26)],
    [0.84, saw(55, 0.8, { repeat: 0.11, tremolo: 0.35, slide: -0.02 })],
  ],
  pop: [[0, voice({ vol: 0.2, freq: 1400, a: 0, s: 0.01, r: 0.16, shape: NOISE, slide: -4, filter: 3000 })]],
  tick: [0, 0.45, 0.9, 1.35].map((at) => [at, voice({ vol: 0.16, freq: note(96), a: 0, s: 0.005, r: 0.03, shape: TRI })]),
  ominous: [
    [0, tri(note(50), 0.45, 0.3)],
    [0.38, tri(note(45), 0.85, 0.32)],
    [0.38, voice({ vol: 0.1, freq: note(33), a: 0.02, s: 0.35, r: 0.5, shape: SAW, filter: 400 })],
  ],
  gloat: [
    [0, sq(79, 0.07)],
    [0.07, sq(83, 0.07)],
    [0.14, sq(86, 0.07)],
    [0.21, sq(91, 0.14)],
    [0.38, sq(86, 0.06)],
    [0.44, sq(91, 0.24)],
  ],
  dawn: [
    [0, bell(note(76), 0.9)],
    [0.15, bell(note(79), 0.9)],
    [0.3, bell(note(84), 1.1)],
    [0.45, bell(note(88), 1.3)],
  ],
  clank: [
    [0, bell(523, 0.25, 0.12)],
    [0, bell(737, 0.2, 0.1)],
    [0, bell(1131, 0.18, 0.08)],
    [0, voice({ vol: 0.12, freq: 2000, a: 0, s: 0.005, r: 0.05, shape: NOISE })],
    [0.02, tri(98, 0.14, 0.2)],
  ],
  flip: [[0, voice({ vol: 0.12, freq: 3200, a: 0, s: 0.008, r: 0.06, shape: NOISE, slide: 8, filter: -1800 })]],
  right: [
    [0, sq(84, 0.07)],
    [0.08, sq(91, 0.24)],
  ],
  wrong: [
    [0, sq(64, 0.12, 0.18, 1)],
    [0.13, sq(60, 0.3, 0.18, 1)],
  ],
};

function render(Z, name) {
  const parts = SOUNDS[name].map(([at, params]) => [Math.round(at * Z.sampleRate), Z.buildSamples(...params)]);
  const length = Math.max(...parts.map(([offset, samples]) => offset + samples.length));
  const out = new Float32Array(length);
  for (const [offset, samples] of parts) {
    for (let i = 0; i < samples.length; i += 1) out[offset + i] += samples[i];
  }
  return out;
}

export function play(name, pan = 0) {
  if (!on || !SOUNDS[name]) return;
  load().then((Z) => {
    if (Z.audioContext.state === "suspended") Z.audioContext.resume();
    let samples = buffers.get(name);
    if (!samples) {
      samples = render(Z, name);
      buffers.set(name, samples);
    }
    Z.playSamples([samples], 1, 1, pan);
  });
}

export function soundOn() {
  return on;
}

export function setSound(next) {
  on = next;
  try {
    localStorage.setItem(KEY, next ? "on" : "off");
  } catch {
    // the choice just won't survive a reload
  }
  listeners.forEach((fn) => fn());
  if (next) {
    if (greeted) play("click");
    else greet();
  }
}

export function subscribeSound(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
