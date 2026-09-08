import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, LayoutGrid, Orbit, Search, X } from 'lucide-react';
import { Character } from '../types';
import { useCharacters } from '../contexts/CharacterContext';
import { PRESENT_YEAR } from '../services/era';
import { HOME_LINES } from '../services/voiceLines';
import { fetchVoice, prefetchVoices, playBufferElement, Playback } from '../services/tts';
import LiveConversation from './LiveConversation';
import TimeMachineIntro from './TimeMachine/TimeMachineIntro';
import AmbientWarp from './TimeMachine/AmbientWarp';
import Logo from './Logo';
import GridHome from './GridHome';
import PortalHome from './PortalHome';
import { HomeView, sectorLabel, readStored, writeStored } from './homeShared';

const VIEW_KEY = 'tm-home-view';
const SECTOR_KEY = 'tm-sector';

const readSoundPref = () => readStored('tm-narration') !== 'off';
// A grade é o padrão; o portal só aparece quando o usuário escolheu antes
const readViewPref = (): HomeView => (readStored(VIEW_KEY) === 'portal' ? 'portal' : 'grade');

const Home: React.FC = () => {
  const { characters } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  // true depois que a máquina do tempo "entrega" o personagem no presente
  const [hasArrived, setHasArrived] = useState(false);

  // Duas formas de ver a home: a grade de cartões e o portal com carrossel
  const [view, setView] = useState<HomeView>(readViewPref);
  useEffect(() => { writeStored(VIEW_KEY, view); }, [view]);

  // Busca por nome, título, feito ou setor, em todos os setores de uma vez
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const showSearch = searchOpen || query.trim().length > 0;

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);
  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchOpen(false);
  }, []);

  // "/" abre a busca; Esc limpa e fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if (e.key === '/' && !typing) { e.preventDefault(); openSearch(); }
      else if (e.key === 'Escape' && (typing || showSearch)) { clearSearch(); (el as HTMLElement | null)?.blur?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch, clearSearch, showSearch]);

  const categories = useMemo(() => Array.from(new Set(characters.map(c => c.category))), [characters]);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const stored = readStored(SECTOR_KEY);
    return stored && categories.includes(stored) ? stored : categories[0];
  });
  useEffect(() => { if (selectedCategory) writeStored(SECTOR_KEY, selectedCategory); }, [selectedCategory]);

  // Narração da tela inicial (voz da máquina): boas-vindas no primeiro toque
  // e anúncio do setor ao trocar. Pode ser desligada e a escolha fica salva.
  const [narrationOn, setNarrationOn] = useState(readSoundPref);
  const narrationRef = useRef(narrationOn);
  const welcomedRef = useRef(false);
  const playbackRef = useRef<Playback | null>(null);

  useEffect(() => {
    narrationRef.current = narrationOn;
    writeStored('tm-narration', narrationOn ? 'on' : 'off');
    if (!narrationOn) playbackRef.current?.stop();
  }, [narrationOn]);

  useEffect(() => {
    prefetchVoices('machine', [HOME_LINES.welcome, ...categories.map(c => HOME_LINES.sector(sectorLabel(c)))]);
  }, [categories]);

  const narrate = useCallback(async (text: string) => {
    if (!narrationRef.current) return;
    try {
      const buffer = await fetchVoice('machine', text);
      if (!narrationRef.current) return;
      playbackRef.current?.stop();
      playbackRef.current = playBufferElement(buffer, 1);
    } catch (err) {
      console.warn('Narração indisponível:', (err as Error).message);
    }
  }, []);

  // Navegadores só tocam áudio depois de um gesto: a primeira interação que
  // não for escolher um viajante dispara as boas-vindas.
  const handleFirstInteraction = (e: React.PointerEvent) => {
    if (welcomedRef.current) return;
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    welcomedRef.current = true;
    narrate(HOME_LINES.welcome);
  };

  const handleSelectCategory = useCallback((cat: string) => {
    if (cat === selectedCategory) return;
    setSelectedCategory(cat);
    welcomedRef.current = true;
    narrate(HOME_LINES.sector(sectorLabel(cat)));
  }, [selectedCategory, narrate]);

  useEffect(() => () => playbackRef.current?.stop(), []);

  useEffect(() => {
    if (!categories.includes(selectedCategory) && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const handleSelectCharacter = useCallback((char: Character) => {
    playbackRef.current?.stop();
    setHasArrived(false);
    setSelectedCharacter(char);
  }, []);

  const handleClose = () => {
    setSelectedCharacter(null);
    setHasArrived(false);
  };

  const isPortal = view === 'portal';

  return (
    <>
      <AnimatePresence>
        {!selectedCharacter && (
          <motion.div
            key="home"
            className={`tm-stage text-white relative flex flex-col ${isPortal ? 'tm-screen overflow-hidden' : 'min-h-screen'}`}
            onPointerDownCapture={handleFirstInteraction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)', transition: { duration: 0.55 } }}
          >
            <AmbientWarp intensity={isPortal ? 0.07 : 0.045} />

            {/* Barra superior */}
            <header className="relative z-30 shrink-0 flex items-center justify-between gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pt-6">
              <Logo />
              <div className="flex items-center gap-1.5 md:gap-3 font-sci text-[9px] md:text-[11px] tracking-[0.25em] text-purple-200/80">
                <span className="hidden sm:flex items-center gap-2 border border-purple-500/30 bg-black/40 rounded-full px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 tm-dot-online" />
                  SISTEMA ONLINE
                </span>
                <span className="hidden lg:inline border border-purple-500/30 bg-black/40 rounded-full px-3 py-1.5">
                  ANO {PRESENT_YEAR}
                </span>

                {/* Busca */}
                <button
                  type="button"
                  onClick={() => (showSearch ? clearSearch() : openSearch())}
                  aria-expanded={showSearch}
                  aria-controls="tm-search"
                  title={showSearch ? 'Fechar busca' : 'Buscar viajante'}
                  className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1.5 transition-colors ${showSearch ? 'border-cyan-400/40 text-cyan-200 bg-cyan-400/10' : 'border-purple-500/30 text-purple-200/80 bg-black/40 hover:text-white'}`}
                >
                  <Search size={13} />
                  <span className="hidden md:inline">BUSCAR</span>
                </button>

                {/* Seletor de visualização */}
                <div role="radiogroup" aria-label="Modo de visualização" className="flex items-center border border-purple-500/30 bg-black/40 rounded-full p-0.5">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!isPortal}
                    onClick={() => setView('grade')}
                    title="Ver como grade"
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors ${!isPortal ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <LayoutGrid size={13} />
                    <span className="hidden md:inline">GRADE</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isPortal}
                    onClick={() => setView('portal')}
                    title="Ver como portal"
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors ${isPortal ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Orbit size={13} />
                    <span className="hidden md:inline">PORTAL</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setNarrationOn(v => !v)}
                  aria-pressed={narrationOn}
                  title={narrationOn ? 'Desligar narração da máquina' : 'Ligar narração da máquina'}
                  className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1.5 transition-colors ${narrationOn ? 'border-cyan-400/40 text-cyan-200 bg-black/40 hover:bg-cyan-400/10' : 'border-white/15 text-slate-500 bg-black/40 hover:text-slate-300'}`}
                >
                  {narrationOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  <span className="hidden md:inline">NARRAÇÃO</span>
                </button>
              </div>
            </header>

            {/* Campo de busca */}
            <AnimatePresence initial={false}>
              {showSearch && (
                <motion.div
                  id="tm-search"
                  key="search"
                  role="search"
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-30 shrink-0 overflow-hidden px-4 md:px-8"
                >
                  <div className="mx-auto mt-3 md:mt-4 w-full max-w-md flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/50 backdrop-blur px-3 py-2 focus-within:border-cyan-300 focus-within:shadow-[0_0_24px_rgba(34,211,238,0.25)] transition-shadow">
                    <Search size={16} className="shrink-0 text-cyan-300/80" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Buscar viajante por nome, área ou feito…"
                      aria-label="Buscar viajante"
                      autoComplete="off"
                      enterKeyHint="search"
                      className="flex-1 min-w-0 bg-transparent text-sm md:text-base text-white placeholder:text-slate-500 outline-none [&::-webkit-search-cancel-button]:hidden"
                    />
                    {query && (
                      <button type="button" onClick={() => { setQuery(''); searchInputRef.current?.focus(); }} aria-label="Limpar busca" className="shrink-0 text-slate-400 hover:text-white">
                        <X size={16} />
                      </button>
                    )}
                    <kbd className="hidden md:inline shrink-0 font-sci text-[9px] tracking-widest text-slate-500 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isPortal ? (
              <PortalHome
                characters={characters}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                onSelectCharacter={handleSelectCharacter}
                query={query}
                onClearQuery={clearSearch}
              />
            ) : (
              <GridHome
                characters={characters}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                onSelectCharacter={handleSelectCharacter}
                query={query}
                onClearQuery={clearSearch}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCharacter && (
        <>
          {/* A conversa conecta por baixo enquanto a máquina roda; a primeira
              fala do personagem só sai quando a animação termina. */}
          <LiveConversation
            character={selectedCharacter}
            onClose={handleClose}
            arrivalMode
            greetingReady={hasArrived}
          />
          <AnimatePresence>
            {!hasArrived && (
              <TimeMachineIntro
                key={selectedCharacter.id}
                character={selectedCharacter}
                onComplete={() => setHasArrived(true)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
};

export default Home;
