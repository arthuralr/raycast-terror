'use client';

import { useEffect, useRef } from 'react';

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;
const MAP_WIDTH = 24;
const MAP_HEIGHT = 24;

const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const MINI_MAP_SCALE = 8;

export function useRaycaster(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  mapCanvasRef: React.RefObject<HTMLCanvasElement>,
  textureUrl?: string
) {
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const player = useRef({ x: 3.5, y: 3.5, dirX: -1, dirY: 0, planeX: 0, planeY: 0.66 });
  const texture = useRef<HTMLImageElement | null>(null);
  const textureData = useRef<ImageData | null>(null);

  useEffect(() => {
    if (textureUrl) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = textureUrl;
      img.onload = () => {
        texture.current = img;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx?.drawImage(img, 0, 0);
        textureData.current = tempCtx?.getImageData(0, 0, img.width, img.height) || null;
      };
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys.current) (keys.current as any)[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys.current) (keys.current as any)[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    const mapCanvas = mapCanvasRef.current;
    if (!canvas || !mapCanvas) return;

    const ctx = canvas.getContext('2d');
    const mapCtx = mapCanvas.getContext('2d');
    if (!ctx || !mapCtx) return;

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    mapCanvas.width = MAP_WIDTH * MINI_MAP_SCALE;
    mapCanvas.height = MAP_HEIGHT * MINI_MAP_SCALE;
    
    let lastTime = 0;
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (!ctx || !mapCtx) return;

      const deltaTime = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      const moveSpeed = deltaTime * 5.0;
      const rotSpeed = deltaTime * 3.0;

      const p = player.current;
      const k = keys.current;

      if (k.w) {
        if (MAP[Math.floor(p.x + p.dirX * moveSpeed)][Math.floor(p.y)] === 0) p.x += p.dirX * moveSpeed;
        if (MAP[Math.floor(p.x)][Math.floor(p.y + p.dirY * moveSpeed)] === 0) p.y += p.dirY * moveSpeed;
      }
      if (k.s) {
        if (MAP[Math.floor(p.x - p.dirX * moveSpeed)][Math.floor(p.y)] === 0) p.x -= p.dirX * moveSpeed;
        if (MAP[Math.floor(p.x)][Math.floor(p.y - p.dirY * moveSpeed)] === 0) p.y -= p.dirY * moveSpeed;
      }
      if (k.a) {
        const oldDirX = p.dirX;
        p.dirX = p.dirX * Math.cos(rotSpeed) - p.dirY * Math.sin(rotSpeed);
        p.dirY = oldDirX * Math.sin(rotSpeed) + p.dirY * Math.cos(rotSpeed);
        const oldPlaneX = p.planeX;
        p.planeX = p.planeX * Math.cos(rotSpeed) - p.planeY * Math.sin(rotSpeed);
        p.planeY = oldPlaneX * Math.sin(rotSpeed) + p.planeY * Math.cos(rotSpeed);
      }
      if (k.d) {
        const oldDirX = p.dirX;
        p.dirX = p.dirX * Math.cos(-rotSpeed) - p.dirY * Math.sin(-rotSpeed);
        p.dirY = oldDirX * Math.sin(-rotSpeed) + p.dirY * Math.cos(-rotSpeed);
        const oldPlaneX = p.planeX;
        p.planeX = p.planeX * Math.cos(-rotSpeed) - p.planeY * Math.sin(-rotSpeed);
        p.planeY = oldPlaneX * Math.sin(-rotSpeed) + p.planeY * Math.cos(-rotSpeed);
      }
      
      // Draw 3D scene
      const ceilingColor = "#1E2640";
      const floorColor = "#293462";
      ctx.fillStyle = ceilingColor;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
      ctx.fillStyle = floorColor;
      ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

      for (let x = 0; x < SCREEN_WIDTH; x++) {
        const cameraX = 2 * x / SCREEN_WIDTH - 1;
        const rayDirX = p.dirX + p.planeX * cameraX;
        const rayDirY = p.dirY + p.planeY * cameraX;

        let mapX = Math.floor(p.x);
        let mapY = Math.floor(p.y);

        let sideDistX, sideDistY;
        const deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
        const deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);
        let perpWallDist;

        let stepX, stepY;
        let hit = 0;
        let side = 0;

        if (rayDirX < 0) {
          stepX = -1;
          sideDistX = (p.x - mapX) * deltaDistX;
        } else {
          stepX = 1;
          sideDistX = (mapX + 1.0 - p.x) * deltaDistX;
        }
        if (rayDirY < 0) {
          stepY = -1;
          sideDistY = (p.y - mapY) * deltaDistY;
        } else {
          stepY = 1;
          sideDistY = (mapY + 1.0 - p.y) * deltaDistY;
        }

        while (hit === 0) {
          if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
          } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
          }
          if (MAP[mapX][mapY] > 0) hit = 1;
        }
        
        perpWallDist = (side === 0) ? (sideDistX - deltaDistX) : (sideDistY - deltaDistY);
        const lineHeight = Math.floor(SCREEN_HEIGHT / perpWallDist);
        let drawStart = -lineHeight / 2 + SCREEN_HEIGHT / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + SCREEN_HEIGHT / 2;
        if (drawEnd >= SCREEN_HEIGHT) drawEnd = SCREEN_HEIGHT - 1;

        if (textureData.current) {
          const tex = texture.current!;
          const texD = textureData.current!;
          let wallX;
          if (side === 0) {
            wallX = p.y + perpWallDist * rayDirY;
          } else {
            wallX = p.x + perpWallDist * rayDirX;
          }
          wallX -= Math.floor(wallX);
          
          let texX = Math.floor(wallX * tex.width);
          if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
            texX = tex.width - texX - 1;
          }

          const step = tex.height / lineHeight;
          let texPos = (drawStart - SCREEN_HEIGHT / 2 + lineHeight / 2) * step;
          for (let y = drawStart; y < drawEnd; y++) {
            const texY = Math.floor(texPos) & (tex.height - 1);
            texPos += step;
            const colorIndex = (texY * texD.width + texX) * 4;

            let r = texD.data[colorIndex];
            let g = texD.data[colorIndex + 1];
            let b = texD.data[colorIndex + 2];

            if (side === 1) { // Darken Y-side walls for depth
              r = Math.floor(r * 0.7);
              g = Math.floor(g * 0.7);
              b = Math.floor(b * 0.7);
            }
            
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        } else {
          let color = 'rgb(100,100,100)';
          if (side === 1) color = 'rgb(50,50,50)';
          ctx.fillStyle = color;
          ctx.fillRect(x, drawStart, 1, drawEnd - drawStart + 1);
        }
      }

      // Draw mini-map
      mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          if (MAP[x][y] > 0) {
            mapCtx.fillStyle = 'rgba(255, 241, 193, 0.7)';
            mapCtx.fillRect(x * MINI_MAP_SCALE, y * MINI_MAP_SCALE, MINI_MAP_SCALE, MINI_MAP_SCALE);
          }
        }
      }

      mapCtx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      mapCtx.fillRect(p.x * MINI_MAP_SCALE - 2, p.y * MINI_MAP_SCALE - 2, 4, 4);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, mapCanvasRef, textureUrl]);
}
