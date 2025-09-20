'use client';

import { useEffect, useRef } from 'react';

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;
const MAP_WIDTH = 24;
const MAP_HEIGHT = 24;
const TEX_WIDTH = 64;
const TEX_HEIGHT = 64;

const MAP = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,2,2,2,2,2,0,4],
  [4,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,2,0,4],
  [4,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,2,0,4],
  [4,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,2,0,4],
  [4,0,0,0,2,2,0,2,2,0,0,0,0,0,0,0,0,2,2,0,2,2,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,4],
  [4,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,4],
  [4,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,4],
  [4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,4],
  [4,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
];

type Sprite = {
  x: number;
  y: number;
  texture: number;
};

const sprites: Sprite[] = [
  { x: 20.5, y: 11.5, texture: 5 }, // enemy
];

const MINI_MAP_SCALE = 8;
const MOVE_SPEED_FACTOR = 3.0;
const ROT_SPEED_FACTOR = 2.0;

const CEILING_COLOR = 'hsl(210 10% 25%)';
const FLOOR_COLOR = 'hsl(210 10% 35%)';

const PLAYER_START = { x: 3.5, y: 3.5, dirX: -1, dirY: 0, planeX: 0, planeY: 0.66 };

export function useRaycaster(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  mapCanvasRef: React.RefObject<HTMLCanvasElement>
) {
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const player = useRef({ ...PLAYER_START });
  const textures = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
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
    let zBuffer: number[] = new Array(SCREEN_WIDTH);

    const textureUrls = [
      "https://picsum.photos/seed/stone1/64/64",
      "https://picsum.photos/seed/stone2/64/64",
      "https://picsum.photos/seed/wood/64/64",
      "https://picsum.photos/seed/brick/64/64",
      "https://picsum.photos/seed/enemy/64/64",
    ];

    function loadTextures() {
      return new Promise<void>((resolve) => {
        let loadedCount = 0;
        textureUrls.forEach((url, index) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            if (loadedCount === textureUrls.length) {
              resolve();
            }
          };
          img.src = url;
          textures.current[index] = img;
        });
      });
    }

    const gameLoop = (timestamp: number) => {
      if (!ctx) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      };

      const frameTime = timestamp - lastTime;
      lastTime = timestamp;
      const deltaTime = frameTime / 1000.0;
      
      updatePlayer(deltaTime);
      updateSprites(deltaTime);
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

    const updateSprites = (deltaTime: number) => {
        const p = player.current;
        const enemy = sprites[0];
        const moveSpeed = deltaTime * (MOVE_SPEED_FACTOR / 2); // Slower than player

        const dirX = p.x - enemy.x;
        const dirY = p.y - enemy.y;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);

        if (dist > 1) { // Stop if too close
            const moveX = (dirX / dist) * moveSpeed;
            const moveY = (dirY / dist) * moveSpeed;
            
            if (MAP[Math.floor(enemy.x + moveX)][Math.floor(enemy.y)] === 0) {
                enemy.x += moveX;
            }
            if (MAP[Math.floor(enemy.x)][Math.floor(enemy.y + moveY)] === 0) {
                enemy.y += moveY;
            }
        }
    }

    const render = (ctx: CanvasRenderingContext2D, mapCtx: CanvasRenderingContext2D | null) => {
      const p = player.current;
      
      ctx.fillStyle = CEILING_COLOR;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
      ctx.fillStyle = FLOOR_COLOR;
      ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Walls
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
        let side = 0;
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
        zBuffer[x] = perpWallDist;

        const lineHeight = Math.floor(SCREEN_HEIGHT / perpWallDist);
        const drawStart = Math.max(0, -lineHeight / 2 + SCREEN_HEIGHT / 2);
        const drawEnd = Math.min(SCREEN_HEIGHT - 1, lineHeight / 2 + SCREEN_HEIGHT / 2);
        
        const wallNum = MAP[mapX][mapY] - 1;
        
        let wallX;
        if (side === 0) wallX = p.y + perpWallDist * rayDirY;
        else wallX = p.x + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);
        
        let texX = Math.floor(wallX * TEX_WIDTH);
        if (side === 0 && rayDirX > 0) texX = TEX_WIDTH - texX - 1;
        if (side === 1 && rayDirY < 0) texX = TEX_WIDTH - texX - 1;
        
        ctx.drawImage(textures.current[wallNum], texX, 0, 1, TEX_HEIGHT, x, drawStart, 1, drawEnd - drawStart);
        if (side === 1) {
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
        }
      }

      // Sprites
      sprites.sort((a, b) => ((p.x - a.x) ** 2 + (p.y - a.y) ** 2) - ((p.x - b.x) ** 2 + (p.y - b.y) ** 2));

      for (let i = 0; i < sprites.length; i++) {
        const spriteX = sprites[i].x - p.x;
        const spriteY = sprites[i].y - p.y;
        
        const invDet = 1.0 / (p.planeX * p.dirY - p.dirX * p.planeY);
        
        const transformX = invDet * (p.dirY * spriteX - p.dirX * spriteY);
        const transformY = invDet * (-p.planeY * spriteX + p.planeX * spriteY);
        
        if (transformY > 0) {
            const spriteScreenX = Math.floor((SCREEN_WIDTH / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));
            const drawStartY = Math.floor(-spriteHeight / 2 + SCREEN_HEIGHT / 2);
            
            const spriteWidth = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));
            const drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            const drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);
            
            for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                const texX = Math.floor(256 * (stripe - (-spriteWidth / 2 + spriteScreenX)) * TEX_WIDTH / spriteWidth) / 256;
                if (stripe > 0 && stripe < SCREEN_WIDTH && transformY < zBuffer[stripe]) {
                    ctx.drawImage(textures.current[sprites[i].texture], texX, 0, 1, TEX_HEIGHT, stripe, drawStartY, 1, spriteHeight);
                }
            }
        }
      }

      if (mapCtx) {
        drawMiniMap(mapCtx);
      }
    }
    
    const drawMiniMap = (mapCtx: CanvasRenderingContext2D) => {
        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        // Draw map
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (MAP[x][y] > 0) {
                mapCtx.fillStyle = 'hsla(var(--accent-foreground), 0.7)';
                mapCtx.fillRect(x * MINI_MAP_SCALE, y * MINI_MAP_SCALE, MINI_MAP_SCALE, MINI_MAP_SCALE);
                }
            }
        }
        // Draw player
        mapCtx.fillStyle = 'hsla(var(--ring), 0.9)';
        mapCtx.fillRect(player.current.x * MINI_MAP_SCALE - 2, player.current.y * MINI_MAP_SCALE - 2, 4, 4);

        // Draw sprites
        mapCtx.fillStyle = 'hsla(0, 100%, 50%, 0.9)';
        for(const sprite of sprites) {
            mapCtx.fillRect(sprite.x * MINI_MAP_SCALE - 2, sprite.y * MINI_MAP_SCALE - 2, 4, 4);
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys.current) (keys.current as any)[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys.current) (keys.current as any)[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    loadTextures().then(() => {
        animationFrameId = requestAnimationFrame(gameLoop);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, mapCanvasRef]);
}
