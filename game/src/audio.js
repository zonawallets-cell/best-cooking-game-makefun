// All sound is synthesized with the Web Audio API — short oscillator
// blips and a little filtered noise for the sizzle. No audio files, no
// network, and nothing plays until the player first interacts, which is
// also when the AudioContext is allowed to start. M toggles mute.
export function createSoundBoard() {
  const board = {
    context: null,
    muted: false,
  };

  function ensureContext() {
    if (board.context) return board.context;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    board.context = new AudioContextClass();
    return board.context;
  }

  /** Unlock audio on the first user gesture; call from any interaction. */
  function unlock() {
    const context = ensureContext();
    if (context && context.state === 'suspended') void context.resume();
  }

  function tone(frequency, duration, type, volume, slideTo) {
    if (board.muted) return;
    const context = ensureContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  function noiseBurst(duration, volume) {
    if (board.muted) return;
    const context = ensureContext();
    if (!context) return;
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }

  const sounds = {
    pickup() { tone(520, 0.08, 'sine', 0.12, 760); },
    place() { tone(300, 0.09, 'triangle', 0.14, 220); },
    chop() { noiseBurst(0.07, 0.25); tone(180, 0.06, 'square', 0.08); },
    chopped() { tone(660, 0.1, 'sine', 0.12); tone(880, 0.12, 'sine', 0.1); },
    sizzle() { noiseBurst(0.35, 0.12); },
    ding() { tone(1046, 0.35, 'sine', 0.14); tone(1568, 0.3, 'sine', 0.08); },
    serve() { tone(523, 0.12, 'triangle', 0.16); tone(659, 0.12, 'triangle', 0.16); tone(784, 0.22, 'triangle', 0.16); },
    error() { tone(160, 0.16, 'square', 0.1, 110); },
    trash() { noiseBurst(0.12, 0.15); },
    lost() { tone(392, 0.2, 'sawtooth', 0.08, 196); },
    burnt() { tone(220, 0.25, 'sawtooth', 0.09, 110); },
    over() { tone(523, 0.18, 'triangle', 0.14); tone(392, 0.18, 'triangle', 0.14); tone(330, 0.3, 'triangle', 0.14); },
  };

  return {
    get muted() { return board.muted; },
    unlock,
    toggleMute() { board.muted = !board.muted; return board.muted; },
    /** Play one named sound; unknown names are ignored. */
    play(name) {
      const sound = sounds[name];
      if (sound) sound();
    },
  };
}
