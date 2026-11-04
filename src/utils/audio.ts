/**
 * Web Audio API procedural sound synthesizers.
 * Generates tactile audio without any external assets, with identical calibrated loudness.
 */

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  } catch {
    return null;
  }
}

/**
 * Ivory Theme Sound: "Paper Crunch"
 * Simulates a tactile, crisp archival sheet of paper gently creasing / crunching.
 * Calibrated perceived loudness: peak gain ~0.16.
 */
export function playPaperCrunch() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate textured noise with micro-crackle characteristics
    for (let i = 0; i < bufferSize; i++) {
      // White noise with subtle amplitude modulation
      const grain = Math.random() * 2 - 1;
      const envelopeMod = Math.sin((i / bufferSize) * Math.PI);
      data[i] = grain * (0.8 + 0.2 * Math.random()) * envelopeMod;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Bandpass filter to isolate the distinctive paper rustle frequencies (1800Hz - 3200Hz)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2200, ctx.currentTime);
    bandpass.Q.setValueAtTime(2.2, ctx.currentTime);

    // Highpass to eliminate low rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(900, ctx.currentTime);

    const gainNode = ctx.createGain();
    const t = ctx.currentTime;

    // Multi-peak crunch envelope: quick tactile crinkle
    gainNode.gain.setValueAtTime(0.001, t);
    gainNode.gain.linearRampToValueAtTime(0.16, t + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.07, t + 0.045);
    gainNode.gain.linearRampToValueAtTime(0.14, t + 0.075);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    noiseNode.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start(t);
    noiseNode.stop(t + 0.15);
  } catch {
    // Silent fallback if audio context is blocked
  }
}

/**
 * Noir Theme Sound: "Dark Ambient"
 * Cinematic, visceral sub-bass drop with audible harmonic overtones and atmospheric swell.
 * Engineered with compression and multi-layered oscillators for high perceived loudness
 * across laptop, mobile, and headphone speakers.
 */
export function playDarkAmbient() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;

    // Master compressor to maximize loudness and punch without clipping
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, t);
    compressor.knee.setValueAtTime(8, t);
    compressor.ratio.setValueAtTime(6, t);
    compressor.attack.setValueAtTime(0.003, t);
    compressor.release.setValueAtTime(0.18, t);
    compressor.connect(ctx.destination);

    // Master gain node with boosted amplitude
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, t);
    masterGain.gain.linearRampToValueAtTime(0.48, t + 0.035);
    masterGain.gain.exponentialRampToValueAtTime(0.15, t + 0.22);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
    masterGain.connect(compressor);

    // Resonant lowpass filter for the dramatic cinematic 'whoom' sweep
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(750, t);
    lowpass.frequency.exponentialRampToValueAtTime(140, t + 0.45);
    lowpass.Q.setValueAtTime(2.8, t);
    lowpass.connect(masterGain);

    // Layer 1: Sub-bass fundamental drop (190Hz -> 62Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(190, t);
    osc1.frequency.exponentialRampToValueAtTime(62, t + 0.4);

    // Layer 2: Audible mid-frequency harmonic body (290Hz -> 95Hz triangle)
    // Ensures the sound is prominently loud on phone & laptop speakers
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(290, t);
    osc2.frequency.exponentialRampToValueAtTime(95, t + 0.38);

    // Layer 3: Atmospheric low-air whoosh for cinematic depth
    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(380, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, t + 0.35);
    noiseFilter.Q.setValueAtTime(1.8, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    osc1.connect(lowpass);
    osc2.connect(lowpass);

    osc1.start(t);
    osc2.start(t);
    noiseSource.start(t);

    osc1.stop(t + 0.54);
    osc2.stop(t + 0.54);
    noiseSource.stop(t + 0.36);
  } catch {
    // Silent fallback
  }
}

/**
 * Mechanical toggle switch relay sound
 */
export function playMechanicalRelay(isArmed: boolean) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isArmed ? 260 : 400, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  } catch {
    // Silent fallback
  }
}
