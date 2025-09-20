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
const MOVE_SPEED_FACTOR = 5.0;
const ROT_SPEED_FACTOR = 3.0;

const WALL_COLOR_PRIMARY = 'hsl(0 0% 80%)';
const WALL_COLOR_SECONDARY = 'hsl(0 0% 60%)';
const CEILING_COLOR = 'hsl(225 38% 19% / 0.4)';
const FLOOR_COLOR = 'hsl(var(--primary))';

const PLAYER_START = { x: 3.5, y: 3.5, dirX: -1, dirY: 0, planeX: 0, planeY: 0.66 };

export function useRaycaster(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  mapCanvasRef: React.RefObject<HTMLCanvasElement>
) {
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const player = useRef({ ...PLAYER_START });
  
  useEffect(() => {
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

    const ctx = canvas.getContext('2d', { alpha: false });
    const mapCtx = mapCanvas.getContext('2d');
    if (!ctx || !mapCtx) return;

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    mapCanvas.width = MAP_WIDTH * MINI_MAP_SCALE;
    mapCanvas.height = MAP_HEIGHT * MINI_MAP_SCALE;
    
    let lastTime = 0;
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (!ctx) return;
      const frameTime = timestamp - lastTime;
      lastTime = timestamp;
      const deltaTime = frameTime / 1000.0;
      
      updatePlayer(deltaTime);
      render(ctx, mapCtx);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const updatePlayer = (deltaTime: number) => {
      const moveSpeed = deltaTime * MOVE_SPEED_FACTOR;
      const rotSpeed = deltaTime * ROT_SPEED_FACTOR;

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
      if (k.d) { // Turn right
        const oldDirX = p.dirX;
        p.dirX = p.dirX * Math.cos(-rotSpeed) - p.dirY * Math.sin(-rotSpeed);
        p.dirY = oldDirX * Math.sin(-rotSpeed) + p.dirY * Math.cos(-rotSpeed);
        const oldPlaneX = p.planeX;
        p.planeX = p.planeX * Math.cos(-rotSpeed) - p.planeY * Math.sin(-rotSpeed);
        p.planeY = oldPlaneX * Math.sin(-rotSpeed) + p.planeY * Math.cos(-rotSpeed);
      }
      if (k.a) { // Turn left
        const oldDirX = p.dirX;
        p.dirX = p.dirX * Math.cos(rotSpeed) - p.dirY * Math.sin(rotSpeed);
        p.dirY = oldDirX * Math.sin(rotSpeed) + p.dirY * Math.cos(rotSpeed);
        const oldPlaneX = p.planeX;
        p.planeX = p.planeX * Math.cos(rotSpeed) - p.planeY * Math.sin(rotSpeed);
        p.planeY = oldPlaneX * Math.sin(rotSpeed) + p.planeY * Math.cos(rotSpeed);
      }
    };

    const render = (ctx: CanvasRenderingContext2D, mapCtx: CanvasRenderingContext2D | null) => {
      const p = player.current;
      
      ctx.fillStyle = CEILING_COLOR;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
      ctx.fillStyle = FLOOR_COLOR;
      ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT);

      for (let x = 0; x < SCREEN_WIDTH; x++) {
        const cameraX = 2 * x / SCREEN_WIDTH - 1;
        const rayDirX = p.dirX + p.planeX * cameraX;
        const rayDirY = p.dirY + p.planeY * cameraX;

        let mapX = Math.floor(p.x);
        let mapY = Math.floor(p.y);

        const deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
        const deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);
        
        let stepX, stepY;
        let sideDistX, sideDistY;

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

        let hit = 0;
        let side = 0; // Was a NS or a EW wall hit?
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
        
        const perpWallDist = (side === 0) ? (sideDistX - deltaDistX) : (sideDistY - deltaDistY);
        const lineHeight = Math.floor(SCREEN_HEIGHT / perpWallDist);
        const drawStart = Math.max(0, -lineHeight / 2 + SCREEN_HEIGHT / 2);
        const drawEnd = Math.min(SCREEN_HEIGHT -1, lineHeight / 2 + SCREEN_HEIGHT / 2);

        ctx.strokeStyle = side === 1 ? WALL_COLOR_SECONDARY : WALL_COLOR_PRIMARY;
        ctx.beginPath();
        ctx.moveTo(x, drawStart);
        ctx.lineTo(x, drawEnd);
        ctx.stroke();
      }

      if (mapCtx) {
        drawMiniMap(mapCtx);
      }
    }
    
    const drawMiniMap = (mapCtx: CanvasRenderingContext2D) => {
        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (MAP[x][y] > 0) {
                mapCtx.fillStyle = 'hsla(var(--accent-foreground), 0.7)';
                mapCtx.fillRect(x * MINI_MAP_SCALE, y * MINI_MAP_SCALE, MINI_MAP_SCALE, MINI_MAP_SCALE);
                }
            }
        }
        mapCtx.fillStyle = 'hsla(var(--destructive), 0.9)';
        mapCtx.fillRect(player.current.x * MINI_MAP_SCALE - 2, player.current.y * MINI_MAP_SCALE - 2, 4, 4);
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, mapCanvasRef]);
}
