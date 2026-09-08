import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { Character } from '../types';
import Portal from './TimeMachine/Portal';
import { HomeViewProps, sectorLabel, sectorEmoji, splitDescription, fallbackAvatar, readStored, writeStored, searchCharacters } from './homeShared';

const LAST_CHARACTER_KEY = 'tm-last-character';

/**
 * Home em modo portal: o mesmo portal da viagem no centro, com o rosto do
 * viajante em foco. Os setores ficam num carrossel de chips e os viajantes do
 * setor num carrossel de rostos; deslizar troca quem aparece no portal.
 */
const PortalHome: React.FC<HomeViewProps> = ({ characters, categories, selectedCategory, onSelectCategory, onSelectCharacter, query = '', onClearQuery }) => {
  const searching = query.trim().length > 0;
  // Durante a busca, o carrossel mostra os resultados de todos os setores
  const travelers = useMemo(
    () => (searching ? searchCharacters(characters, query) : characters.filter(c => c.category === selectedCategory)),
    [characters, selectedCategory, query, searching]
  );

  const [focusedIndex, setFocusedIndex] = useState(() => {
    const lastId = readStored(LAST_CHARACTER_KEY);
    const idx = travelers.findIndex(c => c.id === lastId);
    return idx >= 0 ? idx : 0;
  });
  const focused = travelers[Math.min(focusedIndex, travelers.length - 1)] ?? null;

  const facesRef = useRef<HTMLDivElement>(null);
  const sectorsRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef(0);
  const programmaticRef = useRef(false);
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);

  const scrollFaceIntoCenter = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = facesRef.current;
    const child = container?.children[index] as HTMLElement | undefined;
    if (!container || !child) return;
    const left = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
    programmaticRef.current = true;
    container.scrollTo({ left, behavior });
    window.setTimeout(() => { programmaticRef.current = false; }, behavior === 'smooth' ? 450 : 50);
  }, []);

  // Ao trocar de setor, volta para o último viajante visto (ou o primeiro);
  // ao buscar, sempre para o primeiro resultado
  useEffect(() => {
    const lastId = readStored(LAST_CHARACTER_KEY);
    const idx = searching ? 0 : Math.max(0, travelers.findIndex(c => c.id === lastId));
    setFocusedIndex(idx);
    const id = requestAnimationFrame(() => scrollFaceIntoCenter(idx, 'auto'));
    return () => cancelAnimationFrame(id);
  }, [selectedCategory, travelers, searching, scrollFaceIntoCenter]);

  useEffect(() => {
    if (focused && !searching) writeStored(LAST_CHARACTER_KEY, focused.id);
  }, [focused, searching]);

  // Escolher um setor durante a busca volta para a navegação por setor
  const pickCategory = (cat: string) => {
    if (searching) onClearQuery?.();
    onSelectCategory(cat);
  };

  // Mantém o chip do setor ativo visível no carrossel de setores
  useEffect(() => {
    const container = sectorsRef.current;
    const active = container?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!container || !active) return;
    const left = active.offsetLeft - (container.clientWidth - active.offsetWidth) / 2;
    container.scrollTo({ left, behavior: 'smooth' });
  }, [selectedCategory]);

  // Quem está no centro do carrossel de rostos é quem aparece no portal
  const handleFacesScroll = () => {
    cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      const container = facesRef.current;
      if (!container) return;
      const center = container.scrollLeft + container.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(container.children).forEach((el, i) => {
        const child = el as HTMLElement;
        const dist = Math.abs(child.offsetLeft + child.offsetWidth / 2 - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setFocusedIndex(prev => (prev === best ? prev : best));
    });
  };

  const focusIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(travelers.length - 1, index));
    setFocusedIndex(clamped);
    scrollFaceIntoCenter(clamped);
  }, [travelers.length, scrollFaceIntoCenter]);

  const step = useCallback((delta: number) => focusIndex(focusedIndex + delta), [focusIndex, focusedIndex]);

  const stepSector = useCallback((delta: number) => {
    const i = categories.indexOf(selectedCategory);
    const next = categories[(i + delta + categories.length) % categories.length];
    if (next) onSelectCategory(next);
  }, [categories, selectedCategory, onSelectCategory]);

  // Setas do teclado: ← → trocam o viajante, ↑ ↓ trocam o setor, Enter invoca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); stepSector(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); stepSector(-1); }
      else if (e.key === 'Enter' && focused && el?.tagName !== 'BUTTON') { onSelectCharacter(focused); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, stepSector, focused, onSelectCharacter]);

  // Deslizar sobre o portal também troca o viajante (celular)
  const onPortalPointerDown = (e: React.PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPortalPointerUp = (e: React.PointerEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      step(dx < 0 ? 1 : -1);
    } else if (Math.hypot(dx, dy) < 10 && focused) {
      onSelectCharacter(focused);
    }
  };

  const info = focused ? splitDescription(focused.description) : null;

  return (
    <div className="relative z-10 flex-1 min-h-0 flex flex-col">
      {/* Carrossel de setores */}
      <div className="shrink-0 pt-3 md:pt-5">
        <div className={`flex items-center justify-center gap-3 mb-2 px-4 ${searching ? '' : '[@media(max-height:700px)]:hidden'}`}>
          <span className="h-px w-10 md:w-24 bg-gradient-to-l from-purple-500/40 to-transparent" />
          <span className={`font-sci text-[9px] md:text-[11px] tracking-[0.4em] ${searching ? 'text-cyan-300/90' : 'text-purple-300/70'}`}>
            {searching
              ? `${travelers.length} ${travelers.length === 1 ? 'RESULTADO' : 'RESULTADOS'} EM TODOS OS SETORES`
              : 'ESCOLHA O SETOR'}
          </span>
          <span className="h-px w-10 md:w-24 bg-gradient-to-r from-purple-500/40 to-transparent" />
        </div>
        <div
          ref={sectorsRef}
          role="tablist"
          aria-label="Setores de conhecimento"
          className="tm-carousel px-4 pb-1"
        >
          <div className="flex gap-2 mx-auto">
            {categories.map(cat => {
              const active = !searching && selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={active}
                  onClick={() => pickCategory(cat)}
                  className={`relative px-3.5 py-2 rounded-full text-[11px] md:text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                    active ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="portal-sector-pill"
                      className="absolute inset-0 rounded-full bg-purple-600 shadow-lg shadow-purple-500/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && <span className="absolute inset-0 rounded-full bg-white/5 border border-white/10" />}
                  <span className="relative">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Portal com o viajante em foco */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center" style={{ minHeight: 'calc(var(--portal-size) * var(--home-portal-scale, 1) + 3rem)' }}>
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={focusedIndex <= 0}
          aria-label="Viajante anterior"
          className="hidden md:flex absolute left-[max(1.5rem,calc(50%-var(--portal-size)*1.15))] top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-300 hover:text-white hover:border-cyan-300/60 disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={focusedIndex >= travelers.length - 1}
          aria-label="Próximo viajante"
          className="hidden md:flex absolute right-[max(1.5rem,calc(50%-var(--portal-size)*1.15))] top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-300 hover:text-white hover:border-cyan-300/60 disabled:opacity-20 transition-colors"
        >
          <ChevronRight size={22} />
        </button>

        <div
          className="relative z-10 cursor-pointer touch-pan-y"
          style={{ width: 'calc(var(--portal-size) * var(--home-portal-scale, 1))' }}
          onPointerDown={onPortalPointerDown}
          onPointerUp={onPortalPointerUp}
          onPointerCancel={() => { swipeRef.current = null; }}
          role="button"
          tabIndex={-1}
          aria-label={focused ? `Trazer ${focused.name} para o presente` : 'Portal'}
        >
          <Portal className="absolute inset-0" ringOpacity={0.85}>
            {/* Núcleo brilhante atrás do rosto */}
            <div className="absolute rounded-full bg-purple-500/40 blur-3xl" style={{ inset: '12%' }} />

            <div className="tm-portal-face border-2 border-purple-300/70 shadow-[0_0_60px_rgba(168,85,247,0.55)] bg-[#0a0a0a]">
              {!focused && searching && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 text-slate-400">
                  <SearchX size={32} className="text-purple-300/70" />
                  <span className="text-[11px] md:text-sm leading-snug">Nenhum viajante encontrado</span>
                </div>
              )}
              <AnimatePresence mode="popLayout" initial={false}>
                {focused && (
                  <motion.img
                    key={focused.id}
                    src={focused.image}
                    alt={focused.name}
                    referrerPolicy="no-referrer"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('ui-avatars.com')) target.src = fallbackAvatar(focused.name, 512);
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 0.7, filter: 'blur(14px) brightness(2)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)' }}
                    exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)', transition: { duration: 0.25 } }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </AnimatePresence>
              {/* Brilho de vidro do portal */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.18),transparent_55%)] pointer-events-none" />
            </div>

            {/* Época, na borda inferior do portal */}
            <AnimatePresence mode="wait">
              {info?.years && (
                <motion.span
                  key={focused!.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-20 whitespace-nowrap font-sci text-[9px] md:text-[11px] tracking-widest px-2.5 py-1 rounded-full bg-[#0a0a0a] border border-cyan-300/50 text-cyan-100"
                >
                  {info.years}
                </motion.span>
              )}
            </AnimatePresence>
          </Portal>
        </div>
      </div>

      {/* Nome e feito do viajante em foco */}
      <div className="shrink-0 text-center px-4 pt-2 min-h-[4.75rem] md:min-h-[5.5rem] relative z-20">
        {!focused && searching && (
          <div className="flex flex-col items-center gap-2 pt-1">
            <p className="text-slate-400 text-sm md:text-base">Nada para “{query.trim()}”. Tente outro nome ou área.</p>
            <button
              type="button"
              onClick={onClearQuery}
              className="font-sci text-[10px] md:text-xs tracking-[0.25em] px-4 py-1.5 rounded-full border border-cyan-400/40 text-cyan-100 hover:bg-cyan-400/10 transition-colors"
            >
              LIMPAR BUSCA
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          {focused && (
            <motion.div
              key={focused.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl md:text-3xl font-bold tracking-tight leading-tight">{focused.name}</h2>
              <p className="text-purple-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider mt-0.5">
                {focused.title.split(',')[0]}
              </p>
              {info && <p className="text-slate-400 text-[11px] md:text-sm italic mt-0.5 line-clamp-1">{info.feat}</p>}
              {searching && (
                <p className="font-sci text-[9px] md:text-[10px] tracking-[0.25em] text-cyan-300/80 mt-1">
                  {sectorEmoji(focused.category)} {sectorLabel(focused.category)}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Carrossel de rostos do setor */}
      <div className="shrink-0 relative z-20 mt-2 md:mt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-[#04000c] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-[#04000c] to-transparent z-10" />
        <div
          ref={facesRef}
          onScroll={handleFacesScroll}
          className="tm-carousel tm-carousel-faces py-2 select-none"
          style={{ ['--face-w' as any]: 'clamp(4.5rem, 20vw, 6rem)' }}
          aria-label={searching ? `Resultados da busca por ${query.trim()}` : `Viajantes do setor ${sectorLabel(selectedCategory)}`}
        >
          {travelers.map((char, i) => {
            const active = i === focusedIndex;
            return (
              <button
                key={char.id}
                type="button"
                data-card
                data-active={active}
                onClick={() => (active ? onSelectCharacter(char) : focusIndex(i))}
                aria-label={active ? `Trazer ${char.name} para o presente` : `Ver ${char.name}`}
                aria-current={active}
                className="tm-face flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded-2xl py-1"
              >
                <span className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 bg-[#0a0a0a] transition-colors ${active ? 'border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.5)]' : 'border-purple-500/40'}`}>
                  <img
                    src={char.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('ui-avatars.com')) target.src = fallbackAvatar(char.name);
                    }}
                  />
                </span>
                <span className={`text-[10px] md:text-[11px] leading-tight text-center max-w-full px-0.5 line-clamp-2 ${active ? 'text-white font-semibold' : 'text-slate-300'}`}>
                  {char.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-center gap-1 mt-1">
          {travelers.map((c, i) => (
            <span key={c.id} className={`h-1 rounded-full transition-all duration-300 ${i === focusedIndex ? 'w-4 bg-cyan-300' : 'w-1 bg-white/20'}`} />
          ))}
        </div>
      </div>

      {/* Chamada para ação */}
      <div className="shrink-0 relative z-20 flex flex-col items-center px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6">
        <motion.button
          type="button"
          data-card
          whileTap={{ scale: 0.97 }}
          disabled={!focused}
          onClick={() => focused && onSelectCharacter(focused)}
          className="group relative font-sci text-[11px] md:text-sm tracking-[0.28em] px-7 md:px-10 py-3.5 md:py-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.45)] hover:shadow-[0_0_46px_rgba(168,85,247,0.7)] border border-purple-300/40 transition-shadow disabled:opacity-40"
        >
          <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative">▸ TRAZER PARA O PRESENTE</span>
        </motion.button>
        <p className="mt-2 text-[10px] md:text-[11px] text-slate-500 font-sci tracking-[0.2em]">
          {searching
            ? `BUSCA · ${travelers.length === 0 ? 0 : focusedIndex + 1}/${travelers.length}`
            : `${sectorEmoji(selectedCategory)} ${sectorLabel(selectedCategory)} · ${focusedIndex + 1}/${travelers.length}`}
        </p>
      </div>
    </div>
  );
};

export default PortalHome;
