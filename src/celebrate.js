// Decorative only: cash rain and money sounds when a setting changes.
// Nothing here touches any sampling calculation or result.

const rainListeners = new Set();
const muteListeners = new Set();
const MUTE_KEY = "judge-the-sample-muted";
let lastRain = 0;
let lastSound = 0;
let audioCtx = null;

export const prefersReducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  muteListeners.forEach((fn) => fn(muted));
}

export function onMuteChange(fn) {
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

export function onRain(fn) {
  rainListeners.add(fn);
  return () => rainListeners.delete(fn);
}

/**
 * Call when the user changes a setting. kind: "change" (money or change sound) or "coin"
 * (slider steps). Throttled: one rain burst per 1.2 s, one full sound per 0.9 s, one slider
 * coin per 0.25 s, so dragging never turns into noise.
 */
export function celebrate(kind = "change") {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const gap = kind === "coin" ? 250 : 900;
  if (now - lastSound > gap) {
    lastSound = now;
    playSound(kind);
  }
  if (now - lastRain > 1200) {
    lastRain = now;
    rainListeners.forEach((fn) => fn());
  }
}

// --- Built-in sounds (Web Audio API), used only if a recorded sound cannot be loaded ------

let master = null;
let nextSound = 0; // 0 = cha-ching, 1 = tinkling change (alternates)

function getAudio() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) {
    audioCtx = new AC();
    // Master output with a short, soft echo so the bells sound full rather than thin.
    master = audioCtx.createGain();
    master.gain.value = 0.7;
    const echo = audioCtx.createDelay();
    echo.delayTime.value = 0.045;
    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.28;
    const soften = audioCtx.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = 5000;
    master.connect(audioCtx.destination);
    master.connect(echo);
    echo.connect(soften).connect(feedback).connect(echo);
    soften.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/** A bell: several sine partials with their own volumes and natural (exponential) fades. */
function bell(ac, start, freq, peak, partials) {
  for (const [ratio, amp, decay] of partials) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * ratio, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak * amp, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + decay + 0.05);
  }
}

/** The soft mechanical "cha": a low, muffled clunk of the cash drawer. */
function clunk(ac, start) {
  const length = Math.floor(ac.sampleRate * 0.07);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const gain = ac.createGain();
  gain.gain.value = 0.35;
  src.connect(filter).connect(gain).connect(master);
  src.start(start);
  bell(ac, start, 160, 0.25, [[1, 1, 0.09]]);
}

const REGISTER_BELL = [
  [1, 1, 1.4],
  [2.0, 0.5, 1.0],
  [3.01, 0.3, 0.7],
  [4.17, 0.18, 0.5],
  [5.43, 0.1, 0.35],
];
const COIN = [
  [1, 1, 0.35],
  [2.76, 0.35, 0.2],
  [5.4, 0.15, 0.12],
];

function chaChing(ac, t) {
  clunk(ac, t); // "cha"
  bell(ac, t + 0.11, 2093, 0.12, REGISTER_BELL); // "ching" (C7) ...
  bell(ac, t + 0.112, 2637, 0.07, REGISTER_BELL); // ... with a bright E7 on top
}

function tinklingChange(ac, t) {
  const coins = 6 + Math.floor(Math.random() * 4);
  let at = t;
  for (let i = 0; i < coins; i++) {
    const pitch = 3200 + Math.random() * 2400;
    bell(ac, at, pitch, 0.035 + Math.random() * 0.035, COIN);
    at += 0.03 + Math.random() * 0.09;
  }
}

// --- Recorded sounds (public/sounds/, chosen by the student) -------------------------------
// Each clip is decoded once, its leading silence is skipped, and it plays for at most ~2 s
// with a short fade, so long recordings stay snappy. A new clip fades out the previous one.
const FILES = {
  money: ["Cash register.mp3", "Cash dispensing.mp3"],
  change: ["Coins clinking.mp3", "Coins on counter.mp3", "Coin drop.mp3"],
  register: ["Cash register.mp3"],
  step: ["Coin drop.mp3"],
  paper: ["paper rustling.mp3"],
  printer: ["printing sound.mp3"],
};
const clips = new Map(); // file name -> { buffer, offset }
let preloadStarted = false;
let current = null; // { src, gain } of the clip playing now

const baseUrl = () => {
  try {
    return import.meta.env.BASE_URL || "/";
  } catch {
    return "/";
  }
};

/** Start loading the recorded sounds (call once when the app starts). Failures are ignored. */
export function preloadSounds() {
  if (preloadStarted) return;
  preloadStarted = true;
  const ac = getAudio();
  if (!ac || typeof fetch === "undefined") return;
  const names = [...new Set(Object.values(FILES).flat())];
  for (const name of names) {
    fetch(`${baseUrl()}sounds/${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
      .then((data) => ac.decodeAudioData(data))
      .then((buffer) => {
        const ch = buffer.getChannelData(0);
        let i = 0;
        while (i < ch.length && Math.abs(ch[i]) < 0.02) i++;
        clips.set(name, { buffer, offset: Math.max(0, i / buffer.sampleRate - 0.01) });
      })
      .catch(() => {
        /* missing or unreadable file: the built-in sound is used instead */
      });
  }
}

function playClip(ac, group, { maxDur = 2, volume = 0.8, exclusive = true } = {}) {
  const ready = FILES[group].filter((n) => clips.has(n));
  if (ready.length === 0) return false;
  const { buffer, offset } = clips.get(ready[Math.floor(Math.random() * ready.length)]);
  const t = ac.currentTime + 0.01;
  if (exclusive && current) {
    current.gain.gain.cancelScheduledValues(t);
    current.gain.gain.setValueAtTime(current.gain.gain.value, t);
    current.gain.gain.linearRampToValueAtTime(0.0001, t + 0.08);
    current.src.stop(t + 0.1);
  }
  const dur = Math.min(maxDur, buffer.duration - offset);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.setValueAtTime(volume, t + Math.max(0, dur - 0.35));
  gain.gain.linearRampToValueAtTime(0.0001, t + dur);
  src.connect(gain).connect(ac.destination);
  src.start(t, offset, dur);
  if (exclusive) current = { src, gain };
  src.onended = () => {
    if (current && current.src === src) current = null;
  };
  return true;
}

// --- Paper sounds for the envelope (built in: shaped noise with little crackles) -------------
// A buffer of noise whose loudness is made of many tiny, quickly fading "crackles" over a soft
// bed of hiss, filtered to the bright, papery range.
function paper(ac, start, { dur, crackles, bed, peak, low = 900, high = 6000 }) {
  const rate = ac.sampleRate;
  const length = Math.floor(rate * dur);
  const buffer = ac.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  const env = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const x = i / length;
    env[i] = bed * Math.sin(Math.PI * x); // soft swell and fade
  }
  for (let c = 0; c < crackles; c++) {
    const at = Math.floor(Math.random() * length);
    const amp = 0.3 + Math.random() * 0.7;
    const tau = rate * (0.002 + Math.random() * 0.01);
    for (let i = at; i < Math.min(length, at + tau * 6); i++) env[i] += amp * Math.exp(-(i - at) / tau);
  }
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * env[i];
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = low;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = high;
  const gain = ac.createGain();
  gain.gain.value = peak;
  src.connect(hp).connect(lp).connect(gain).connect(ac.destination);
  src.start(start);
}

// Built-in receipt-printer clatter (used only if the recording is missing): quick dot-matrix
// ticks, then a short paper tear.
function printerClatter(ac, t) {
  for (let i = 0; i < 22; i++) paper(ac, t + i * 0.045, { dur: 0.03, crackles: 3, bed: 0.1, peak: 0.35, low: 1500, high: 6000 });
  paper(ac, t + 1.05, { dur: 0.18, crackles: 12, bed: 0.6, peak: 0.4, low: 900, high: 5000 });
}

const PAPER = {
  flap: { dur: 0.35, crackles: 14, bed: 0.25, peak: 0.35 }, // envelope flap lifting
  slide: { dur: 0.9, crackles: 22, bed: 0.55, peak: 0.28, low: 700, high: 4500 }, // letter sliding out
  unfold: { dur: 0.22, crackles: 10, bed: 0.15, peak: 0.5, low: 1200, high: 7000 }, // a third snapping open
};

/**
 * Timing plan for the envelope, read from the recorded paper sound (if it has loaded).
 * Measures loudness in 20 ms steps over the first 4 s, finds where each rustle starts
 * (loudness rising past 35% of the loudest point, at least 0.25 s apart) and where the
 * rustling ends. Returns { onsets: [seconds...], end } or null if the recording is not ready.
 */
export function paperTimeline() {
  const clip = clips.get(FILES.paper[0]);
  if (!clip) return null;
  const { buffer, offset } = clip;
  const ch = buffer.getChannelData(0);
  const rate = buffer.sampleRate;
  const win = Math.floor(rate * 0.02);
  const first = Math.floor(offset * rate);
  const last = Math.min(ch.length, first + Math.floor(rate * 4));
  const rms = [];
  for (let i = first; i + win <= last; i += win) {
    let sum = 0;
    for (let j = i; j < i + win; j++) sum += ch[j] * ch[j];
    rms.push(Math.sqrt(sum / win));
  }
  if (rms.length === 0) return null;
  const smooth = rms.map((_, k) => (rms[k - 1] ?? rms[k]) * 0.25 + rms[k] * 0.5 + (rms[k + 1] ?? rms[k]) * 0.25);
  const peak = Math.max(...smooth);
  const onsets = [];
  let below = true;
  smooth.forEach((v, k) => {
    const time = k * 0.02;
    if (below && v >= peak * 0.35 && (onsets.length === 0 || time - onsets[onsets.length - 1] >= 0.25)) {
      onsets.push(time);
      below = false;
    } else if (v < peak * 0.2) {
      below = true;
    }
  });
  let endIndex = smooth.length - 1;
  while (endIndex > 0 && smooth[endIndex] < peak * 0.1) endIndex--;
  return { onsets, end: (endIndex + 1) * 0.02 };
}

/** Play the recorded paper rustle from its first sound (up to 4 s). Returns false if not loaded. */
export function playPaperClip() {
  if (isMuted()) return true; // muted: nothing to play, but the timing plan still applies
  try {
    const ac = getAudio();
    if (!ac) return false;
    return playClip(ac, "paper", { maxDur: 4, volume: 0.9 });
  } catch {
    return false;
  }
}

export function playSound(kind = "change") {
  if (isMuted()) return;
  try {
    const ac = getAudio();
    if (!ac) return;
    preloadSounds();
    const t = ac.currentTime + 0.02;
    if (kind === "coin") {
      // one light coin per slider step
      if (!playClip(ac, "step", { maxDur: 0.7, volume: 0.35 })) bell(ac, t, 3520 + Math.random() * 600, 0.05, COIN);
      return;
    }
    if (kind.startsWith("paper-")) {
      const settings = PAPER[kind.slice(6)];
      if (settings) paper(ac, t, settings);
      return;
    }
    if (kind === "printer") {
      // receipt printing (plays alongside other sounds rather than cutting them off)
      if (!playClip(ac, "printer", { maxDur: 2.2, volume: 0.75, exclusive: false })) printerClatter(ac, t);
      return;
    }
    if (kind === "cha-ching") {
      // always the cash register (used when the envelope is opened)
      if (!playClip(ac, "register", { maxDur: 2.4 })) chaChing(ac, t);
      return;
    }
    // Alternate: money sound, then change sound, then money sound, ...
    if (nextSound === 0) {
      if (!playClip(ac, "money")) chaChing(ac, t);
    } else if (!playClip(ac, "change")) {
      tinklingChange(ac, t);
    }
    nextSound = 1 - nextSound;
  } catch {
    /* sound is optional */
  }
}
