'use client';

import { useRef, useEffect } from 'react';
import { useRaycaster } from '@/hooks/use-raycaster';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Raycaster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const textureUrl = PlaceHolderImages.find(img => img.id === 'wall-texture')?.imageUrl;
  
  useRaycaster(canvasRef, mapCanvasRef, textureUrl);

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-lg shadow-2xl shadow-primary/30 border-2 border-accent/30 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        aria-label="First-person view of the 3D environment"
      />
      <canvas
        ref={mapCanvasRef}
        className="absolute top-4 left-4 bg-background/70 border border-accent/50 rounded-md backdrop-blur-sm"
        aria-label="2D map of the environment"
      />
    </div>
  );
}
