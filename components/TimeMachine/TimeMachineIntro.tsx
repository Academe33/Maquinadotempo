import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, AnimationPlaybackControls } from 'motion/react';
import { Character } from '../../types';
import { parseEra, formatYear, PRESENT_YEAR } from '../../services/era';
import { TimeMachineAudio } from '../../services/timeMachineSfx';
import { speakAsMachine, cancelMachineSpeech, warmUpVoices } from '../../services/timeMachineVoice';
import { machineLines } from '../../services/voiceLines';
import { prefetchVoices } from '../../services/tts';
import WarpCanvas, { WarpControls } from './WarpCanvas';
import Portal from './Portal';
import './timeMachine.css';

type Phase = 'boot' | 'scan' | 'calibrate' | 'charge' | 'travel' | 'arrival';

interface TimeMachineIntroProps {
  character: Character;
  /** Chamado quando a sequência termina (ou o usuário pula) */
  onComplete: () => void;
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const PHASE_LABEL: Record<Phase, string> = {
  boot: 'INICIALIZANDO SISTEMAS',
  scan: 'RASTREANDO FLUXO TEMPORAL',
  calibrate: 'CALIBRANDO COORDENADAS',
  charge: 'CARREGANDO PORTAL',
  travel: 'TRANSFERÊNCIA EM CURSO',
  arrival: 'CHEGADA CONFIRMADA',
};

// Texto que aparece letra por letra, como um terminal
const Typewriter: React.FC<{ text: string; speed?: number; className?: string }> = ({ text, speed = 22, className }) => {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span className={className}>{shown}</span>;
};

const fallbackImage = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e1b4b&color=e9d5ff&size=512`;

const TimeMachineIntro: React.FC<TimeMachineIntroProps> = ({ character, onComplete }) => {
  const [phase, setPhase] = useState<Phase>('boot');
  const [machineLine, setMachineLine] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [displayYear, setDisplayYear] = useState<number | null>(null);
  const [energy, setEnergy] = useState(0);

  const warp = useRef<WarpControls>({ intensity: 0, direction: -1, flash: 0 });
  const audioRef = useRef<TimeMachineAudio | null>(null);
  const ringsRef = useRef<Array<HTMLDivElement | null>>([]);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const era = parseEra(character.description);
  const yearsCrossed = Math.abs(PRESENT_YEAR - era.targetYear);
  const lines = machineLines(character);

  // Anéis giram com velocidade proporcional à intensidade do vórtice
  useEffect(() => {
    let raf = 0;
    let angle = 0;
    let last = performance.now();
    const multipliers = [1, -0.55, 0.3, -1.6];
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      angle += dt * (18 + warp.current.intensity * 420);
      ringsRef.current.forEach((el, i) => {
        if (el) el.style.transform = `rotate(${angle * multipliers[i % multipliers.length]}deg)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Sequência principal
  useEffect(() => {
    let cancelled = false;
    const audio = new TimeMachineAudio();
    audioRef.current = audio;
    const controls = warp.current;
    const anims: AnimationPlaybackControls[] = [];
    const timers: number[] = [];
    warmUpVoices();
    // Baixa (ou gera) as falas desta viagem enquanto a máquina liga
    prefetchVoices('machine', Object.values(lines));

    const guard = () => {
      if (cancelled) throw new Error('cancelled');
    };
    const pushLog = (line: string) => setLog(prev => [...prev.slice(-5), line]);
    const later = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(() => { if (!cancelled) fn(); }, ms));
    };
    const say = async (text: string, minMs: number) => {
      setMachineLine(text);
      await Promise.all([speakAsMachine(text, { audio }), wait(minMs)]);
      guard();
    };
    const runOdometer = (from: number, to: number, duration: number) => {
      let lastTick = 0;
      anims.push(
        animate(from, to, {
          duration,
          ease: 'easeInOut',
          onUpdate: v => {
            setDisplayYear(Math.round(v));
            const now = performance.now();
            if (now - lastTick > 70) {
              audio.tick(0.04);
              lastTick = now;
            }
          },
        })
      );
    };

    const run = async () => {
      await audio.resume();
      guard();

      // ---------- 1. LIGANDO ----------
      setPhase('boot');
      controls.intensity = 0.06;
      controls.direction = -1;
      audio.startHum();
      audio.bootSequence();
      pushLog('INICIALIZANDO NÚCLEO TEMPORAL...');
      await wait(550); guard();
      pushLog('REATOR DE CRONÔNIOS: ONLINE');
      await wait(450); guard();
      pushLog('SINCRONIA QUÂNTICA: ESTÁVEL');
      setDisplayYear(PRESENT_YEAR);
      await wait(750); guard();

      // ---------- 2. LOCALIZANDO ----------
      setPhase('scan');
      controls.intensity = 0.14;
      audio.setHumIntensity(0.2);
      audio.sonar(0);
      audio.sonar(1.1);
      audio.sonar(2.2);
      pushLog(`RASTREANDO: ${character.name.toUpperCase()}`);
      await say(lines.scan, 2600);

      // ---------- 3. CALIBRANDO ----------
      setPhase('calibrate');
      controls.intensity = 0.24;
      audio.setHumIntensity(0.35);
      audio.beep(1320, 0.18, 'sine', 0.12);
      audio.beep(1760, 0.25, 'sine', 0.1, 0.18);
      pushLog(`ALVO LOCALIZADO · ANO ${era.label}`);
      runOdometer(PRESENT_YEAR, era.targetYear, 2.4);
      await say(lines.calibrate, 2800);

      // ---------- 4. CARREGANDO ----------
      setPhase('charge');
      audio.charge(3.7);
      audio.setHumIntensity(0.95, 3.5);
      pushLog('ABRINDO PORTAL TEMPORAL');
      anims.push(
        animate(0.25, 0.8, {
          duration: 3.7,
          ease: 'easeIn',
          onUpdate: v => {
            controls.intensity = v;
            setEnergy(Math.min(1, (v - 0.25) / 0.55));
          },
        })
      );
      await say(lines.charge, 3800);

      // ---------- 5. VIAGEM ----------
      setPhase('travel');
      controls.direction = 1;
      controls.intensity = 1;
      setEnergy(1);
      audio.warp(3.3);
      audio.glitch(6);
      later(1100, () => audio.glitch(5));
      later(2200, () => audio.glitch(6));
      pushLog(`ATRAVESSANDO ${yearsCrossed.toLocaleString('pt-BR')} ANOS`);
      runOdometer(era.targetYear, PRESENT_YEAR, 3.0);
      await wait(3200); guard();

      // ---------- 6. CHEGADA ----------
      setPhase('arrival');
      audio.boom();
      audio.arrivalChime();
      audio.setHumIntensity(0.08, 2);
      setDisplayYear(PRESENT_YEAR);
      anims.push(animate(1, 0, { duration: 1.4, ease: 'easeOut', onUpdate: v => { controls.flash = v; } }));
      anims.push(animate(1, 0.12, { duration: 2.6, ease: 'easeOut', onUpdate: v => { controls.intensity = v; } }));
      pushLog('TRANSFERÊNCIA CONCLUÍDA');
      await say(lines.arrival, 2400);

      finishedRef.current = true;
      audio.fadeOut(1.2);
      onCompleteRef.current();
    };

    run().catch(err => {
      if (err?.message !== 'cancelled') console.error('Sequência da máquina do tempo falhou:', err);
    });

    return () => {
      cancelled = true;
      cancelMachineSpeech();
      anims.forEach(a => a.stop());
      timers.forEach(t => clearTimeout(t));
      if (!finishedRef.current) audio.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  const handleSkip = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelMachineSpeech();
    audioRef.current?.fadeOut(0.5);
    onCompleteRef.current();
  };

  const shakeClass = phase === 'charge' ? 'tm-shake-soft' : phase === 'travel' ? 'tm-shake-hard' : '';
  const yearText = displayYear === null ? '— — — —' : formatYear(displayYear);
  const showEnergy = phase === 'charge' || phase === 'travel';

  return (
    <motion.div
      className={`tm-root tm-stage tm-intro fixed inset-0 z-[100] bg-[#04000c] text-white overflow-hidden tm-scanlines tm-vignette ${shakeClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      transition={{ duration: 0.4 }}
    >
      <WarpCanvas controls={warp} className="absolute inset-0 w-full h-full" />

      {/* HUD: cantos */}
      <div className="tm-corner tl" />
      <div className="tm-corner tr" />
      <div className="tm-corner bl" />
      <div className="tm-corner br" />

      {/* HUD: topo */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between gap-3"
        style={{
          paddingTop: 'calc(var(--tm-safe-t) + 0.75rem)',
          paddingLeft: 'calc(var(--tm-safe-x) + 1.25rem)',
          paddingRight: 'calc(var(--tm-safe-x) + 0.25rem)',
        }}
      >
        <div className="tm-mono text-[8px] sm:text-[9px] md:text-xs tracking-[0.15em] sm:tracking-[0.25em] md:tracking-[0.35em] text-purple-300/80 min-w-0 flex-1">
          <div className="tm-intro-brand truncate">ACADEME · MÁQUINA DO TEMPO</div>
          <motion.div
            key={phase}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-cyan-300/80 mt-1 truncate"
          >
            ▸ {PHASE_LABEL[phase]}
          </motion.div>
        </div>
        <button
          onClick={handleSkip}
          className="tm-mono shrink-0 whitespace-nowrap text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] text-white/50 hover:text-white border border-white/15 hover:border-white/50 rounded-full px-3 py-2 md:px-4 transition-colors"
        >
          PULAR ›
        </button>
      </div>

      {/* Título */}
      <motion.h1
        className={`tm-mono tm-intro-title absolute left-0 right-0 px-6 text-center font-black uppercase truncate gradient-text drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] z-10 ${phase === 'boot' ? 'tm-flicker' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'travel' ? 0.35 : 1 }}
        transition={{ duration: 1.2 }}
      >
        Máquina do Tempo
      </motion.h1>

      {/* Portal central: sempre no mesmo ponto da tela que o retrato da
          conversa e o portal da home, para a transição ser contínua. */}
      <div className="tm-stage-portal z-10 pointer-events-none">
        <Portal ringsRef={ringsRef} className="absolute inset-0">
          {/* Núcleo pulsante (sempre presente, mais forte na carga) */}
          <motion.div
            className="absolute rounded-full bg-purple-400 blur-3xl"
            style={{ inset: '22%' }}
            animate={{
              opacity: phase === 'boot' ? 0.15 : phase === 'charge' ? [0.5, 0.9, 0.6, 1] : phase === 'travel' ? 0.9 : 0.35,
              scale: phase === 'charge' ? [0.6, 1, 0.8, 1.3] : phase === 'travel' ? 1.6 : 0.8,
            }}
            transition={{ duration: phase === 'charge' ? 3.6 : 1.2, ease: 'easeInOut' }}
          />

          <AnimatePresence>
            {/* Silhueta sendo rastreada */}
            {(phase === 'scan' || phase === 'calibrate') && (
              <motion.div
                key="silhouette"
                className="absolute inset-0 rounded-full overflow-hidden border border-cyan-400/40 bg-black/60"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.1, filter: 'blur(24px)', transition: { duration: 0.7, ease: 'easeIn' } }}
                transition={{ duration: 0.8 }}
              >
                <motion.img
                  src={character.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={e => { (e.target as HTMLImageElement).src = fallbackImage(character.name); }}
                  className="w-full h-full object-cover"
                  animate={{
                    filter: phase === 'scan'
                      ? 'grayscale(1) brightness(0.22) contrast(1.8)'
                      : 'grayscale(1) brightness(0.6) contrast(1.4) sepia(0.6) hue-rotate(190deg)',
                    opacity: phase === 'scan' ? 0.7 : 1,
                  }}
                  transition={{ duration: 1 }}
                />
                <div className="tm-noise" />
                <div className="tm-scan-beam" />
                {phase === 'calibrate' && (
                  <motion.div
                    className="absolute inset-0 border-2 border-cyan-300/80 rounded-full"
                    initial={{ scale: 1.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: 'backOut' }}
                  />
                )}
              </motion.div>
            )}

            {/* Rosto emergindo do vórtice */}
            {phase === 'travel' && (
              <motion.div
                key="emerge"
                className="absolute inset-0 rounded-full overflow-hidden"
                initial={{ scale: 0.04, opacity: 0, filter: 'blur(28px) brightness(3)', rotate: -40 }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px) brightness(1.25)', rotate: 0 }}
                transition={{ duration: 3, ease: [0.25, 0.75, 0.25, 1] }}
              >
                <img
                  src={character.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={e => { (e.target as HTMLImageElement).src = fallbackImage(character.name); }}
                  className="w-full h-full object-cover"
                />
                <img src={character.image} alt="" referrerPolicy="no-referrer" className="tm-ghost tm-ghost-r" />
                <img src={character.image} alt="" referrerPolicy="no-referrer" className="tm-ghost tm-ghost-c" />
                <img src={character.image} alt="" referrerPolicy="no-referrer" className="tm-glitch-slice" />
                <img src={character.image} alt="" referrerPolicy="no-referrer" className="tm-glitch-slice delay" />
              </motion.div>
            )}

            {/* Chegada: retrato nítido */}
            {phase === 'arrival' && (
              <motion.div
                key="arrived"
                className="absolute inset-0 rounded-full overflow-hidden border-4 border-purple-300 shadow-[0_0_90px_rgba(168,85,247,0.85)]"
                initial={{ scale: 1.2, opacity: 0.4, filter: 'brightness(2.5)' }}
                animate={{ scale: 1, opacity: 1, filter: 'brightness(1)' }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              >
                <img
                  src={character.image}
                  alt={character.name}
                  referrerPolicy="no-referrer"
                  onError={e => { (e.target as HTMLImageElement).src = fallbackImage(character.name); }}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Portal>
      </div>

      {/* Contador de anos e barra de energia, ancorados logo abaixo do portal.
          A energia vive aqui (e não entre o título e o portal) porque naquela
          faixa não sobra altura no celular — nem em pé, nem deitado. */}
      <div className="tm-stage-below tm-intro-below z-10 pointer-events-none px-4">
        <div className="tm-intro-gap text-center">
          <div className="tm-mono tm-intro-label tracking-[0.35em] sm:tracking-[0.5em] text-purple-300/70 mb-1">
            {phase === 'travel' ? 'ANO ATUAL' : phase === 'arrival' ? 'PRESENTE' : 'DESTINO'}
          </div>
          <div
            className={`tm-mono tm-intro-year font-bold tabular-nums tracking-widest transition-colors ${
              phase === 'travel' ? 'text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.9)]' : 'text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]'
            }`}
          >
            {yearText}
          </div>

          {/* Barra de energia */}
          <AnimatePresence>
            {showEnergy && (
              <motion.div
                key="energy"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="tm-intro-gap-sm flex flex-col items-center"
              >
                <div className="tm-energy-track h-1.5 md:h-2 w-40 md:w-72 max-w-[70vw] rounded-full overflow-hidden">
                  <div className="tm-energy-fill h-full rounded-full" style={{ width: `${Math.round(energy * 100)}%`, transition: 'width 120ms linear' }} />
                </div>
                <div className="tm-mono tm-intro-label tracking-[0.3em] sm:tracking-[0.4em] text-cyan-300/70 mt-1.5">
                  ENERGIA<span className="hidden sm:inline"> TEMPORAL</span> {Math.round(energy * 100)}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nome na chegada */}
          <AnimatePresence>
            {phase === 'arrival' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="tm-intro-gap-sm"
              >
                <div className="tm-intro-name font-bold tracking-tight text-balance">
                  <Typewriter text={character.name} speed={45} />
                </div>
                <div className="tm-intro-label text-purple-300 uppercase tracking-[0.2em] mt-1 line-clamp-2">
                  {character.title} · {era.label}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Terminal inferior */}
      <div className="tm-intro-terminal absolute left-0 right-0 z-10 text-center pointer-events-none">
        <div className="tm-mono tm-intro-line text-cyan-200 tracking-wider min-h-[1.4em] tm-cursor drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          {machineLine && <Typewriter text={machineLine} />}
        </div>
        <div className={`tm-intro-log mt-3 tm-mono text-[10px] tracking-[0.3em] text-purple-300/45 space-y-0.5 transition-opacity duration-500 ${phase === 'arrival' ? 'opacity-0' : ''}`}>
          {log.slice(-3).map((line, i) => (
            <div key={`${i}-${line}`} style={{ opacity: 0.45 + i * 0.27 }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TimeMachineIntro;
