import React from 'react';

interface PortalProps {
  /**
   * Refs para os quatro anéis, quando a rotação é controlada por fora
   * (a viagem gira os anéis na velocidade do vórtice). Sem isso, os anéis
   * giram sozinhos, devagar, por CSS.
   */
  ringsRef?: React.MutableRefObject<Array<HTMLDivElement | null>>;
  /** Opacidade geral dos anéis (0..1) */
  ringOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Conteúdo dentro do círculo (retrato, núcleo, efeitos) */
  children?: React.ReactNode;
}

// Insets de cada anel em relação ao círculo central. Os mesmos valores em
// todas as telas para que o portal da home, da viagem e da conversa seja
// visivelmente o mesmo objeto.
export const PORTAL_RINGS = [
  { className: 'tm-ring tm-ring-conic', inset: '-9%' },
  { className: 'tm-ring tm-ring-dashed', inset: '-20%' },
  { className: 'tm-ring tm-ring-ticks', inset: '-33%' },
  { className: 'tm-ring tm-ring-conic', inset: '-46%', opacity: 0.5 },
];

/**
 * O portal da máquina do tempo: um círculo com quatro anéis giratórios.
 * Usado na home (modo portal), na viagem e na conversa.
 */
const Portal: React.FC<PortalProps> = ({ ringsRef, ringOpacity = 1, className = '', style, children }) => {
  const idle = !ringsRef;
  return (
    <div className={`tm-portal relative ${idle ? 'tm-portal-idle' : ''} ${className}`} style={{ aspectRatio: '1', ...style }}>
      {PORTAL_RINGS.map((ring, i) => (
        <div
          key={i}
          ref={el => { if (ringsRef) ringsRef.current[i] = el; }}
          className={ring.className}
          style={{ inset: ring.inset, opacity: (ring.opacity ?? 1) * ringOpacity }}
        />
      ))}
      {children}
    </div>
  );
};

export default Portal;
