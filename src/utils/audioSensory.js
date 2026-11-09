/**
 * SmartCart Sensory Audio & Acoustics Engine
 * Uses Native Web Audio API to simulate real-world product acoustics:
 * 1. Active Noise Cancellation (ANC) simulation for headphones
 * 2. Sneaker step acoustic on athletic court / pavement
 * 3. Premium YKK zipper glide and denim fabric rustle
 */

let audioCtx = null;
let currentSource = null;
let currentGain = null;
let currentFilter = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopSensoryAudio() {
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch {}
    currentSource = null;
  }
  if (currentGain) {
    try { currentGain.disconnect(); } catch {}
    currentGain = null;
  }
}

/**
 * Simulates real-time Active Noise Cancellation (ANC)
 * @param {'airplane' | 'subway' | 'cafe'} environment
 * @param {boolean} isAncOn
 */
export function playHeadphonesANC(environment = 'airplane', isAncOn = false) {
  const ctx = getAudioContext();
  if (!ctx) return;
  stopSensoryAudio();

  // Create 4-second noise buffer
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate pink/brown low-frequency acoustic noise for environment
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99 * b0 + white * 0.05;
    b1 = 0.95 * b1 + white * 0.1;
    b2 = 0.85 * b2 + white * 0.2;
    data[i] = (b0 + b1 + b2) * 0.25;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  // Filter for environment
  const envFilter = ctx.createBiquadFilter();
  if (environment === 'airplane') {
    envFilter.type = 'lowpass';
    envFilter.frequency.value = isAncOn ? 180 : 850;
  } else if (environment === 'subway') {
    envFilter.type = 'bandpass';
    envFilter.frequency.value = isAncOn ? 220 : 600;
  } else {
    // Cafe
    envFilter.type = 'bandpass';
    envFilter.frequency.value = isAncOn ? 260 : 1200;
  }

  // Master Gain Node - ANC dramatically attenuates volume by 80%
  const gainNode = ctx.createGain();
  const targetGain = isAncOn ? 0.04 : 0.28;
  gainNode.gain.setValueAtTime(targetGain, ctx.currentTime);

  noiseSource.connect(envFilter);
  envFilter.connect(gainNode);
  gainNode.connect(ctx.destination);

  noiseSource.start();
  currentSource = noiseSource;
  currentGain = gainNode;
  currentFilter = envFilter;
}

/**
 * Updates ANC state seamlessly while sound is playing
 */
export function updateANC(isAncOn, environment = 'airplane') {
  const ctx = getAudioContext();
  if (!ctx || !currentGain || !currentFilter) return;

  const now = ctx.currentTime;
  const targetGain = isAncOn ? 0.04 : 0.28;
  currentGain.gain.cancelScheduledValues(now);
  currentGain.gain.linearRampToValueAtTime(targetGain, now + 0.35);

  const targetFreq = isAncOn ? 160 : (environment === 'airplane' ? 850 : 1100);
  currentFilter.frequency.cancelScheduledValues(now);
  currentFilter.frequency.exponentialRampToValueAtTime(Math.max(50, targetFreq), now + 0.35);
}

/**
 * Simulates athletic sneaker step / squeak on hardwood or track
 */
export function playSneakerStepSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  stopSensoryAudio();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(650, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.18);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

/**
 * Simulates heavy denim fabric rustle & metal zipper sound
 */
export function playFabricZipperSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  stopSensoryAudio();

  const bufferSize = ctx.sampleRate * 0.35;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const pulse = (i % 300) < 50 ? 1 : -0.2;
    data[i] = (Math.random() * 2 - 1) * 0.4 * pulse;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3200;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.22, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + 0.38);
}

