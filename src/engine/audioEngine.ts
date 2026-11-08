export interface AudioStoreState {
  isInitialized: boolean;
  isMuted: boolean;
  isMuffled: boolean;
  initAudio: () => void;
  toggleMute: () => boolean;
  setMuffled: (muffled: boolean) => void;
}

class ValleyAudioController {
  public isInitialized = false;
  public isMuted = true;
  public isMuffled = false;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private oscNodes: OscillatorNode[] = [];
  private chimeInterval: number | null = null;

  public initAudio = (): void => {
    this.isInitialized = true;
  };

  private ensureContextGraph(): void {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.isMuffled ? 320 : 2600, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);
    this.lowpassFilter = filter;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.masterGain = master;

    filter.connect(master);
    master.connect(ctx.destination);

    // Warm regenerative night-valley harmonic drone (D minor 9th / warm fifths)
    const freqs = [146.83, 220.0, 293.66, 329.63, 440.0];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.detune.setValueAtTime((idx - 2) * 4.5, ctx.currentTime);

      oscGain.gain.setValueAtTime(idx === 0 ? 0.08 : 0.032 / (idx * 0.65 + 1), ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      this.oscNodes.push(osc);
    });

    // Subtle procedural night breeze (filtered pink-like noise buffer)
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      output[i] = (b0 + b1 + b2) * 0.18;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(420, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.06, ctx.currentTime);

    noiseSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(filter);
    noiseSource.start();

    // Gentle botanical bell harmonic notes every few seconds
    const pentatonic = [587.33, 659.25, 783.99, 880.0, 1046.5];
    this.chimeInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const noteOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const noteFreq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      noteOsc.type = 'sine';
      noteOsc.frequency.setValueAtTime(noteFreq, now);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.exponentialRampToValueAtTime(this.isMuffled ? 0.008 : 0.022, now + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      noteOsc.connect(noteGain);
      if (this.lowpassFilter) {
        noteGain.connect(this.lowpassFilter);
      }
      noteOsc.start(now);
      noteOsc.stop(now + 3.3);
    }, 3600);
  }

  public toggleMute = (): boolean => {
    if (!this.isInitialized) {
      this.initAudio();
    }
    this.ensureContextGraph();
    this.isMuted = !this.isMuted;

    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended' && !this.isMuted) {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      if (this.isMuted) {
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      } else {
        this.masterGain.gain.exponentialRampToValueAtTime(0.42, now + 0.8);
      }
    }

    return this.isMuted;
  };

  public setMuffled = (muffled: boolean): void => {
    this.isMuffled = muffled;
    if (this.ctx && this.lowpassFilter) {
      const now = this.ctx.currentTime;
      this.lowpassFilter.frequency.cancelScheduledValues(now);
      this.lowpassFilter.frequency.setValueAtTime(this.lowpassFilter.frequency.value, now);
      this.lowpassFilter.frequency.exponentialRampToValueAtTime(muffled ? 320 : 2600, now + 0.55);
    }
  };
}

const singletonAudio = new ValleyAudioController();

export function audioStore(): AudioStoreState {
  return singletonAudio;
}
