'use client';

import { useEffect, useRef } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;
const MAP_WIDTH = 24;
const MAP_HEIGHT = 24;
const TEXTURE_WIDTH = 64;
const TEXTURE_HEIGHT = 64;

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

const sprites = [{ x: 20.5, y: 11.5, texture: 1 }]; // 1 is enemy sprite

const MINI_MAP_SCALE = 8;
const MOVE_SPEED_FACTOR = 3.0;
const ROT_SPEED_FACTOR = 2.0;
const ENEMY_SPEED_FACTOR = 1.5;

const WALL_COLOR_PRIMARY = 'hsl(0 0% 60%)';
const WALL_COLOR_SECONDARY = 'hsl(0 0% 50%)';
const CEILING_COLOR = 'hsl(210 10% 25%)';
const FLOOR_COLOR = 'hsl(210 10% 35%)';

const PLAYER_START = { x: 3.5, y: 3.5, dirX: -1, dirY: 0, planeX: 0, planeY: 0.66 };

function loadTexture(src: string): Promise<{img: HTMLImageElement, data: Uint8ClampedArray}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get 2d context from canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve({img, data: imageData.data});
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export function useRaycaster(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  mapCanvasRef: React.RefObject<HTMLCanvasElement>
) {
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const player = useRef({ ...PLAYER_START });
  const zBuffer = useRef<number[]>(new Array(SCREEN_WIDTH).fill(0));
  const textures = useRef<Uint8ClampedArray[]>([]);
  const texturesLoaded = useRef(false);

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
    
    const enemySpriteInfo = PlaceHolderImages.find(p => p.id === 'enemy-sprite');

    if (enemySpriteInfo) {
        Promise.all([
          // In a real app, you'd load multiple textures. Here we just load the enemy.
          // For wall textures, we would add them here.
          loadTexture(enemySpriteInfo.imageUrl),
        ]).then(loadedTextures => {
            // Index 0 can be a wall texture if we want.
            // Pushing a dummy texture at index 0
            textures.current.push(new Uint8ClampedArray(TEXTURE_WIDTH * TEXTURE_HEIGHT * 4));
            textures.current.push(loadedTextures[0].data);
            texturesLoaded.current = true;
        }).catch(err => console.error("Error loading textures:", err));
    }


    const gameLoop = (timestamp: number) => {
      if (!ctx || !texturesLoaded.current) {
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
        const enemy = sprites[0]; // Assuming only one enemy for now
        const p = player.current;
        const moveSpeed = deltaTime * ENEMY_SPEED_FACTOR;

        const dirX = p.x - enemy.x;
        const dirY = p.y - enemy.y;
        const dist = Math.sqrt(dirX*dirX + dirY*dirY);

        if (dist < 1) return; // Don't move if too close

        const moveX = (dirX / dist) * moveSpeed;
        const moveY = (dirY / dist) * moveSpeed;

        const nextX = enemy.x + moveX;
        const nextY = enemy.y + moveY;

        // Simple collision detection
        if (MAP[Math.floor(nextX)][Math.floor(enemy.y)] === 0) {
            enemy.x = nextX;
        }
        if (MAP[Math.floor(enemy.x)][Math.floor(nextY)] === 0) {
            enemy.y = nextY;
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
        zBuffer.current[x] = perpWallDist; // Set z-buffer for sprite casting

        const lineHeight = Math.floor(SCREEN_HEIGHT / perpWallDist);
        const drawStart = Math.max(0, -lineHeight / 2 + SCREEN_HEIGHT / 2);
        const drawEnd = Math.min(SCREEN_HEIGHT - 1, lineHeight / 2 + SCREEN_HEIGHT / 2);
        
        ctx.strokeStyle = side === 1 ? WALL_COLOR_SECONDARY : WALL_COLOR_PRIMARY;
        ctx.beginPath();
        ctx.moveTo(x, drawStart);
        ctx.lineTo(x, drawEnd);
        ctx.stroke();
      }

      // Sprites
      const spriteOrder: number[] = [];
      const spriteDistance: number[] = [];
      for (let i = 0; i < sprites.length; i++) {
        spriteOrder[i] = i;
        spriteDistance[i] = ((p.x - sprites[i].x) * (p.x - sprites[i].x) + (p.y - sprites[i].y) * (p.y - sprites[i].y));
      }
      // Sort sprites from far to close
      spriteOrder.sort((a, b) => spriteDistance[b] - spriteDistance[a]);

      const imageData = ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      const data = imageData.data;

      for (let i = 0; i < sprites.length; i++) {
        const s = sprites[spriteOrder[i]];
        const spriteX = s.x - p.x;
        const spriteY = s.y - p.y;

        const invDet = 1.0 / (p.planeX * p.dirY - p.dirX * p.planeY);

        const transformX = invDet * (p.dirY * spriteX - p.dirX * spriteY);
        const transformY = invDet * (-p.planeY * spriteX + p.planeX * spriteY);

        const spriteScreenX = Math.floor((SCREEN_WIDTH / 2) * (1 + transformX / transformY));
        const spriteHeight = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));
        const drawStartY = Math.floor(-spriteHeight / 2 + SCREEN_HEIGHT / 2);
        const drawEndY = Math.floor(spriteHeight / 2 + SCREEN_HEIGHT / 2);

        const spriteWidth = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));
        const drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
        const drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);

        for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
          const texX = Math.floor(256 * (stripe - (-spriteWidth / 2 + spriteScreenX)) * TEXTURE_WIDTH / spriteWidth) / 256;
          if (transformY > 0 && stripe > 0 && stripe < SCREEN_WIDTH && transformY < zBuffer.current[stripe]) {
            for (let y = Math.max(0, drawStartY); y < Math.min(SCREEN_HEIGHT, drawEndY); y++) {
                const d = y * 256 - SCREEN_HEIGHT * 128 + spriteHeight * 128;
                const texY = ((d * TEXTURE_HEIGHT) / spriteHeight) / 256;
                const tx = Math.floor(texX);
                const ty = Math.floor(texY);
                const textureData = textures.current[s.texture];
                if (textureData) {
                    const colorIndex = (TEXTURE_WIDTH * ty + tx) * 4;
                    const r = textureData[colorIndex];
                    const g = textureData[colorIndex + 1];
                    const b = textureData[colorIndex + 2];
                    const a = textureData[colorIndex + 3];

                    if (a > 128) { // Don't draw transparent pixels
                      const pixelIndex = (y * SCREEN_WIDTH + stripe) * 4;
                      data[pixelIndex] = r;
                      data[pixelIndex + 1] = g;
                      data[pixelIndex + 2] = b;
                      data[pixelIndex + 3] = 255;
                    }
                }
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);


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
        mapCtx.fillStyle = 'hsla(var(--destructive), 0.9)';
        for(let i = 0; i < sprites.length; i++) {
            mapCtx.fillRect(sprites[i].x * MINI_MAP_SCALE - 2, sprites[i].y * MINI_MAP_SCALE - 2, 4, 4);
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, mapCanvasRef]);
}
