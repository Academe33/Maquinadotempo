// Efeitos sonoros da Máquina do Tempo, sintetizados em tempo real com a
// Web Audio API. Nenhum arquivo de áudio externo é necessário: zumbido do
// reator, carga de energia, vórtice, impacto de chegada, bipes e glitches.

type Stoppable = { stop: (when?: number) => void };

const AudioCtor =
  typeof window !== 'undefined'
    ? window.AudioContext || (window as any).webkitAudioContext
    : null;

export class TimeMachineAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private hum: { oscs: OscillatorNode[]; filter: BiquadFilterNode; gain: GainNode; lfo: OscillatorNode } | null = null;
  private live: Set<Stoppable> = new Set();

  constructor() {
    if (!AudioCtor) return;
    try {
      this.ctx = new AudioCtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      // Compressor para o "boom" não estourar em fones/celular
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 6;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  get available() {
    return !!this.ctx && !!this.master;
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch { /* sem gesto do usuário */ }
    }
  }

  private now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  private noise(): AudioBuffer {
    const ctx = this.ctx!;
    if (this.noiseBuffer) return this.noiseBuffer;
    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  private track(node: Stoppable) {
    this.live.add(node);
    return node;
  }

  // ---------- Zumbido do reator (contínuo) ----------

  startHum() {
    if (!this.ctx || !this.master || this.hum) return;
    const ctx = this.ctx;
    const t = this.now();

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, t);
    filter.Q.value = 4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 1.8);

    const oscs: OscillatorNode[] = [];
    const specs: Array<[OscillatorType, number]> = [
      ['sawtooth', 41],
      ['sine', 82],
      ['triangle', 123.5],
    ];
    for (const [type, freq] of specs) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start(t);
      oscs.push(osc);
    }

    // LFO que faz o zumbido "respirar"
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t);

    filter.connect(gain);
    gain.connect(this.master);
    this.hum = { oscs, filter, gain, lfo };
  }

  /** 0 = quase inaudível, 1 = reator no limite */
  setHumIntensity(intensity: number, rampSeconds = 1) {
    if (!this.hum || !this.ctx) return;
    const t = this.now();
    const clamped = Math.max(0, Math.min(1, intensity));
    this.hum.filter.frequency.cancelScheduledValues(t);
    this.hum.filter.frequency.setTargetAtTime(120 + clamped * 1400, t, rampSeconds / 3);
    this.hum.gain.gain.cancelScheduledValues(t);
    this.hum.gain.gain.setTargetAtTime(0.12 + clamped * 0.3, t, rampSeconds / 3);
    this.hum.oscs.forEach((osc, i) => {
      const base = [41, 82, 123.5][i];
      osc.frequency.setTargetAtTime(base * (1 + clamped * 0.6), t, rampSeconds / 2);
    });
  }

  // ---------- Eventos pontuais ----------

  beep(freq = 880, duration = 0.09, type: OscillatorType = 'square', volume = 0.08, delay = 0) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = this.now() + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /** Sequência de bipes de "sistema ligando" */
  bootSequence() {
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((f, i) => this.beep(f, 0.12, 'square', 0.06, i * 0.13));
    this.beep(1760, 0.5, 'sine', 0.05, notes.length * 0.13);
  }

  /** Clique curto para o contador de anos */
  tick(volume = 0.05) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = this.now();
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t, Math.random() * 2);
    src.stop(t + 0.05);
  }

  /** Bipe de sonar/varredura ao localizar o personagem */
  sonar(delay = 0) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = this.now() + delay;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const delayNode = ctx.createDelay();
    delayNode.delayTime.value = 0.22;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    osc.connect(gain);
    gain.connect(this.master);
    gain.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(this.master);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  /** Carga de energia: apito subindo + ruído filtrado subindo */
  charge(duration = 3.2) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = this.now();

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + duration);
    const oscFilter = ctx.createBiquadFilter();
    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(400, t);
    oscFilter.frequency.exponentialRampToValueAtTime(6000, t + duration);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, t);
    oscGain.gain.exponentialRampToValueAtTime(0.18, t + duration * 0.7);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.3);
    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.4);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noise();
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 6;
    bp.frequency.setValueAtTime(200, t);
    bp.frequency.exponentialRampToValueAtTime(5000, t + duration);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, t);
    nGain.gain.exponentialRampToValueAtTime(0.25, t + duration);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.3);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(this.master);
    noise.start(t);
    noise.stop(t + duration + 0.4);
    this.track(noise);
  }

  /** Vórtice: ruído em varredura, com batimento de "dobra" */
  warp(duration = 3) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = this.now();

    const noise = ctx.createBufferSource();
    noise.buffer = this.noise();
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(4500, t + duration * 0.5);
    bp.frequency.exponentialRampToValueAtTime(500, t + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.25);
    gain.gain.setValueAtTime(0.5, t + duration - 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    noise.connect(bp);
    bp.connect(gain);
    gain.connect(this.master);
    noise.start(t);
    noise.stop(t + duration + 0.1);
    this.track(noise);

    // Pulsação grave de dobra espacial
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + duration);
    const trem = ctx.createOscillator();
    trem.type = 'sine';
    trem.frequency.setValueAtTime(4, t);
    trem.frequency.exponentialRampToValueAtTime(22, t + duration);
    const tremGain = ctx.createGain();
    tremGain.gain.value = 0.5;
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, t);
    oscGain.gain.exponentialRampToValueAtTime(0.25, t + 0.3);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    trem.connect(tremGain);
    tremGain.connect(oscGain.gain);
    osc.connect(oscGain);
    oscGain.connect(this.master);
    osc.start(t);
    trem.start(t);
    osc.stop(t + duration + 0.1);
    trem.stop(t + duration + 0.1);
  }

  /** Impacto da chegada */
  boom() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = this.now();

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 1.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.9, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 1.7);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(100, t + 0.8);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.6, t);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.master);
    noise.start(t);
    noise.stop(t + 1);
  }

  /** Acorde ascendente de "chegada confirmada" */
  arrivalChime() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = this.now() + 0.35;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const delayNode = ctx.createDelay();
    delayNode.delayTime.value = 0.28;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(this.master);

    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const gain = ctx.createGain();
      const start = t + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
      osc.connect(gain);
      gain.connect(this.master);
      gain.connect(delayNode);
      osc.start(start);
      osc.stop(start + 1.7);
    });
  }

  /** Rajada de glitch digital */
  glitch(count = 4) {
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.4;
      const freq = 200 + Math.random() * 3000;
      this.beep(freq, 0.03 + Math.random() * 0.05, 'square', 0.05, delay);
    }
  }

  /** Reduz tudo a zero e fecha o contexto */
  fadeOut(seconds = 1.2) {
    if (!this.ctx || !this.master) return;
    const t = this.now();
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.0001, t + seconds);
    const ctx = this.ctx;
    setTimeout(() => this.dispose(), seconds * 1000 + 100);
    void ctx;
  }

  dispose() {
    if (!this.ctx) return;
    try {
      this.hum?.oscs.forEach(o => o.stop());
      this.hum?.lfo.stop();
    } catch { /* já parados */ }
    this.hum = null;
    this.live.forEach(n => { try { n.stop(); } catch { /* já parado */ } });
    this.live.clear();
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    ctx.close().catch(() => undefined);
  }
}
