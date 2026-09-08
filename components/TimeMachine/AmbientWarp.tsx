import React, { useEffect, useRef } from 'react';
import WarpCanvas, { WarpControls } from './WarpCanvas';

interface AmbientWarpProps {
  /** Intensidade baixa (0.03–0.15) para um fundo vivo, mas discreto */
  intensity?: number;
  className?: string;
}

// Fundo ambiente da máquina do tempo: o mesmo vórtice da viagem, mas em
// marcha lenta, com partículas derivando devagar para o centro.
const AmbientWarp: React.FC<AmbientWarpProps> = ({ intensity = 0.05, className }) => {
  const controls = useRef<WarpControls>({ intensity, direction: -1, flash: 0 });

  useEffect(() => {
    controls.current.intensity = intensity;
  }, [intensity]);

  return (
    <WarpCanvas
      controls={controls}
      className={className ?? 'fixed inset-0 w-full h-full pointer-events-none'}
    />
  );
};

export default AmbientWarp;
