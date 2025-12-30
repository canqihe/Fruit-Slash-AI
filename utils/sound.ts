// Simple Procedural Audio Generator
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Music State
  private musicGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicInterval: any = null;

  constructor() {
    try {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Main volume
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startMusic() {
    if (this.isMusicPlaying || !this.ctx || !this.masterGain) return;
    this.isMusicPlaying = true;
    this.resume();
    
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.12; 
    this.musicGain.connect(this.masterGain);

    // C Pentatonic scale: C4, D4, E4, G4, A4 (Oriental feeling)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    let step = 0;

    const playNote = () => {
        if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
        const t = this.ctx.currentTime;

        // Melody: Shamisen/Koto style pluck
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.type = 'square'; // Sharper sound
        // Random walk through pentatonic scale
        const note = scale[Math.floor(Math.random() * scale.length)];
        osc.frequency.value = note;

        // Pluck envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.start(t);
        osc.stop(t + 0.5);
        
        // Rhythm: Bass every 2 steps
        if (step % 2 === 0) {
            const bass = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bass.connect(bGain);
            bGain.connect(this.musicGain!);
            bass.type = 'triangle';
            bass.frequency.value = 130.81; // C3
            bGain.gain.setValueAtTime(0.2, t);
            bGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            bass.start(t);
            bass.stop(t + 0.5);
        }
        step++;
    };

    this.musicInterval = setInterval(playNote, 300); // 200bpm
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
        clearInterval(this.musicInterval);
        this.musicInterval = null;
    }
    if (this.musicGain) {
        try {
            const t = this.ctx?.currentTime || 0;
            this.musicGain.gain.cancelScheduledValues(t);
            this.musicGain.gain.linearRampToValueAtTime(0, t + 0.5);
            setTimeout(() => {
                if (this.musicGain) this.musicGain.disconnect();
            }, 600);
        } catch(e) {
            this.musicGain.disconnect();
        }
    }
  }

  // UI Click Sound
  playClick() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Wood block / High tick
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playSlice() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // 1. The Swoosh (Air) - High Pass Filtered Noise
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const swooshFilter = this.ctx.createBiquadFilter();
    swooshFilter.type = 'highpass';
    swooshFilter.frequency.value = 2000;

    const swooshGain = this.ctx.createGain();
    swooshGain.gain.setValueAtTime(0.5, t);
    swooshGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    noise.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(this.masterGain);
    noise.start(t);

    // 2. The Cut (Blade impact) - Sine Drop
    const osc = this.ctx.createOscillator();
    const cutGain = this.ctx.createGain();
    
    osc.connect(cutGain);
    cutGain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

    cutGain.gain.setValueAtTime(0.3, t);
    cutGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playCombo() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.15); // Rising fifth
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playBombSpawn() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.4);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  playBomb() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Sub-bass impact
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);

    // Explosion Noise
    const bufferSize = this.ctx.sampleRate * 1.5; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(t);
  }

  playGameOver() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Descending Gong-like sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    // FM Synthesis for metallic gong
    const modOsc = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    modOsc.connect(modGain);
    modGain.connect(osc.frequency);

    modOsc.frequency.value = 50; // Modulation speed
    modGain.gain.setValueAtTime(100, t);
    modGain.gain.exponentialRampToValueAtTime(0.1, t + 2);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t); // Low pitch
    osc.frequency.linearRampToValueAtTime(100, t + 2);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);

    modOsc.start(t);
    osc.start(t);
    
    modOsc.stop(t + 2.5);
    osc.stop(t + 2.5);
  }

  playSplatter() {
      // Reusing playSlice logic but maybe deeper? 
      // Current playSlice covers this well enough for web audio procedural
  }
}

export const soundManager = new SoundManager();