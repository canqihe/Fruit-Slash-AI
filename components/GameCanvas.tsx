import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameMode, GameState, Entity, Particle, Point, FruitType, Splatter, Language } from '../types';
import { GRAVITY, FRUIT_CONFIG, COLORS, BLADE_MAX_LENGTH, FRUIT_SPAWN_RATE_INITIAL, MAX_LIVES, TRANSLATIONS } from '../constants';
import { randomRange, randomEnum, lineIntersectsCircle, distance } from '../utils/math';
import { soundManager } from '../utils/sound';

interface GameCanvasProps {
  gameMode: GameMode;
  onGameOver: (score: number, bestCombo: number) => void;
  onReturnToMenu: () => void;
  isInputMethodCamera: boolean;
  language: Language;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameMode, onGameOver, onReturnToMenu, isInputMethodCamera, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const timeRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const lastSliceTimeRef = useRef(0);
  const isExplodingRef = useRef(false);
  const explosionTimeRef = useRef(0);
  
  const T = TRANSLATIONS[language];

  // Game Entities Refs
  const fruitsRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splattersRef = useRef<Splatter[]>([]);
  const bladeRef = useRef<Point[]>([]);
  
  // Input smoothing
  const rawMousePosRef = useRef<{x: number, y: number} | null>(null);
  const smoothedMousePosRef = useRef<{x: number, y: number} | null>(null);

  // Loading state
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(T.LOADING);

  // Update loading message when language changes
  useEffect(() => {
      setLoadingMessage(T.LOADING);
  }, [language, T]);

  // Init Sound & Music
  useEffect(() => {
    soundManager.resume();
    soundManager.startMusic();
    
    return () => {
        soundManager.stopMusic();
    };
  }, []);

  // Setup MediaPipe
  useEffect(() => {
    if (!isInputMethodCamera) {
      setIsCameraReady(true);
      return;
    }

    let camera: any;
    let hands: any;
    let isActive = true;

    const onResults = (results: any) => {
        if (!canvasRef.current || !isActive) return;
        
        // Find index finger tip (landmark 8)
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const indexTip = landmarks[8]; // Normalized 0-1
            
            // Map to canvas
            const x = (1 - indexTip.x) * canvasRef.current.width; // Mirror horizontal
            const y = indexTip.y * canvasRef.current.height;
            
            rawMousePosRef.current = { x, y };
            // Initialize smoothed if null
            if (!smoothedMousePosRef.current) {
                smoothedMousePosRef.current = { x, y };
            }
        } else {
            // Hand lost
            rawMousePosRef.current = null;
        }
    };

    const loadMediaPipe = async () => {
      try {
        setLoadingMessage(T.VISION_LOADING);
        
        let attempts = 0;
        while ((!window.Hands || !window.Camera) && attempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        if (!window.Hands || !window.Camera) {
             throw new Error("MediaPipe libraries failed to load from CDN.");
        }

        if (!isActive) return;

        hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (hands && isActive) {
                  await hands.send({image: videoRef.current});
              }
            },
            width: 320,
            height: 240
          });
          
          await camera.start();
          if (isActive) setIsCameraReady(true);
        } else {
             throw new Error("Video element not found");
        }
      } catch (err) {
        console.error("Camera init failed", err);
        if (isActive) {
            setLoadingMessage(`${T.ERROR_CAM}: ${(err as Error).message || 'Unknown error'}`);
        }
      }
    };

    loadMediaPipe();

    return () => {
        isActive = false;
        if (camera) {
             try { camera.stop(); } catch(e) { console.warn(e); }
        }
        if (hands) {
             try { hands.close(); } catch(e) { console.warn(e); }
        }
    };
  }, [isInputMethodCamera, T]);

  // Mouse Fallback
  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isInputMethodCamera) {
          rawMousePosRef.current = { x: e.clientX, y: e.clientY };
          smoothedMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  // Game Loop
  useEffect(() => {
    if (!isCameraReady && isInputMethodCamera) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Reset Game State
    fruitsRef.current = [];
    particlesRef.current = [];
    splattersRef.current = [];
    bladeRef.current = [];
    scoreRef.current = 0;
    livesRef.current = gameMode === GameMode.ZEN ? 999 : 3;
    timeRef.current = gameMode === GameMode.ZEN ? 90 : 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    isExplodingRef.current = false;

    let frameCount = 0;
    let animationFrameId: number;

    const spawnFruit = () => {
        const type = gameMode === GameMode.ZEN 
            ? randomEnum(FruitType) 
            : Math.random() > 0.85 ? FruitType.BOMB : randomEnum(FruitType);
        
        const actualType = (gameMode === GameMode.ZEN && type === FruitType.BOMB) ? FruitType.WATERMELON : type;
        
        if (actualType === FruitType.BOMB) {
            soundManager.playBombSpawn();
        }

        const x = randomRange(50, canvas.width - 50);
        const y = canvas.height + 50;
        const vx = (canvas.width / 2 - x) * randomRange(0.01, 0.02); 
        const vy = randomRange(-12, -15); 

        fruitsRef.current.push({
            id: Math.random().toString(36),
            x, y, vx, vy,
            radius: FRUIT_CONFIG[actualType as FruitType].radius,
            color: FRUIT_CONFIG[actualType as FruitType].color,
            type: actualType as FruitType,
            rotation: 0,
            rotationSpeed: randomRange(-0.1, 0.1),
            sliced: false,
            scoreValue: FRUIT_CONFIG[actualType as FruitType].score
        });
    };

    const createParticles = (x: number, y: number, color: string, count: number = 10, speedMultiplier = 1) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random().toString(),
                x, y,
                vx: randomRange(-5, 5) * speedMultiplier,
                vy: randomRange(-5, 5) * speedMultiplier,
                life: 1.0,
                color,
                size: randomRange(2, 6)
            });
        }
    };

    const createSplatter = (x: number, y: number, color: string) => {
        splattersRef.current.push({
            id: Math.random().toString(),
            x, y, 
            color,
            rotation: Math.random() * Math.PI * 2,
            scale: randomRange(0.8, 1.5),
            opacity: 0.8
        });
        if (splattersRef.current.length > 10) splattersRef.current.shift();
    };

    const handleBombExplosion = (bombX: number, bombY: number) => {
        isExplodingRef.current = true;
        explosionTimeRef.current = Date.now();
        soundManager.playBomb();
        
        // Massive particle explosion
        createParticles(bombX, bombY, '#ef4444', 30, 3);
        createParticles(bombX, bombY, '#fbbf24', 20, 2);
        createParticles(bombX, bombY, '#ffffff', 10, 4);

        // Schedule Game Over after brief visual effect
        setTimeout(() => {
            handleGameOver();
        }, 1000); 
    };

    const update = () => {
        frameCount++;

        // 1. Blade Logic
        if (rawMousePosRef.current && smoothedMousePosRef.current) {
            const lerp = 0.4;
            smoothedMousePosRef.current.x += (rawMousePosRef.current.x - smoothedMousePosRef.current.x) * lerp;
            smoothedMousePosRef.current.y += (rawMousePosRef.current.y - smoothedMousePosRef.current.y) * lerp;

            bladeRef.current.push({ x: smoothedMousePosRef.current.x, y: smoothedMousePosRef.current.y, life: 1.0 });
            if (bladeRef.current.length > BLADE_MAX_LENGTH) {
                bladeRef.current.shift();
            }
        } else {
            bladeRef.current.shift(); 
            smoothedMousePosRef.current = null;
        }

        // Particle physics (Always update for explosion effect)
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += GRAVITY;
            p.life -= 0.02;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // If Exploding, stop game logic and only do effects
        if (isExplodingRef.current) {
             return;
        }

        // 2. Spawn Logic
        let spawnRate = FRUIT_SPAWN_RATE_INITIAL;
        if (gameMode === GameMode.CLASSIC) {
            spawnRate = Math.max(20, 60 - Math.floor(frameCount / 300));
        }
        
        if (frameCount % spawnRate === 0) {
            spawnFruit();
            if (Math.random() > 0.7) spawnFruit();
        }

        // 3. Physics & Collision
        fruitsRef.current.forEach(fruit => {
            fruit.x += fruit.vx;
            fruit.y += fruit.vy;
            fruit.vy += GRAVITY;
            fruit.rotation += fruit.rotationSpeed;

            // Check Collision with Blade
            if (!fruit.sliced && bladeRef.current.length >= 2) {
                const p1 = bladeRef.current[bladeRef.current.length - 1];
                const p2 = bladeRef.current[bladeRef.current.length - 2];
                
                const bladeSpeed = distance(p1.x, p1.y, p2.x, p2.y);
                
                if (bladeSpeed > 3 && lineIntersectsCircle(p1, p2, fruit.x, fruit.y, fruit.radius)) {
                    // SLICE!
                    if (fruit.type === FruitType.BOMB) {
                        handleBombExplosion(fruit.x, fruit.y);
                        return;
                    }

                    fruit.sliced = true;
                    
                    // FX
                    createParticles(fruit.x, fruit.y, FRUIT_CONFIG[fruit.type].innerColor, 15);
                    createParticles(fruit.x, fruit.y, FRUIT_CONFIG[fruit.type].color, 5);
                    createSplatter(fruit.x, fruit.y, FRUIT_CONFIG[fruit.type].innerColor);

                    fruit.vx = fruit.vx * 0.5;
                    handleScore(fruit.scoreValue);
                }
            }
        });

        // 4. Cleanup & Bounds
        fruitsRef.current = fruitsRef.current.filter(f => {
            if (f.y > canvas.height + 100) {
                if (!f.sliced && f.type !== FruitType.BOMB && gameMode === GameMode.CLASSIC) {
                    loseLife();
                }
                return false;
            }
            return true;
        });

        // Splatter cleanup
        splattersRef.current.forEach(s => s.opacity -= 0.005);
        splattersRef.current = splattersRef.current.filter(s => s.opacity > 0);

        // Zen Timer
        if (gameMode === GameMode.ZEN) {
            if (frameCount % 60 === 0) {
                timeRef.current -= 1;
                if (timeRef.current <= 0) handleGameOver();
            }
        }
    };

    const drawFruitBody = (ctx: CanvasRenderingContext2D, f: Entity, offset: number) => {
        const gradient = ctx.createRadialGradient(
            offset, -offset/2, f.radius * 0.2, 
            0, 0, f.radius
        );
        ctx.fillStyle = f.color;
        
        if (f.type !== FruitType.BOMB) {
             const g = ctx.createRadialGradient(-f.radius/3, -f.radius/3, f.radius/10, 0, 0, f.radius);
             g.addColorStop(0, '#ffffff66');
             g.addColorStop(1, f.color);
             ctx.fillStyle = g;
        }

        if (f.type === FruitType.BANANA) {
             ctx.beginPath();
             ctx.arc(0, -10, f.radius, 0.2 + offset/20, Math.PI - 0.2 + offset/20);
             ctx.fill();
        } else {
             ctx.beginPath();
             ctx.arc(offset, offset, f.radius, 0, Math.PI * 2); 
             ctx.fill();
        }

        if (f.type === FruitType.WATERMELON) {
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(offset, offset, f.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(offset - f.radius, offset);
            ctx.quadraticCurveTo(offset, offset - f.radius/2, offset + f.radius, offset);
            ctx.stroke();
        } else if (f.type === FruitType.STRAWBERRY) {
            ctx.fillStyle = '#450a0a';
            for(let i=0; i<5; i++) {
                ctx.beginPath();
                ctx.arc(offset + randomRange(-10, 10), offset + randomRange(-10, 10), 1.5, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    const drawInside = (ctx: CanvasRenderingContext2D, f: Entity) => {
        ctx.fillStyle = FRUIT_CONFIG[f.type].innerColor;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius - 4, 0, Math.PI*2);
        ctx.fill();

        if (f.type === FruitType.WATERMELON || f.type === FruitType.APPLE) {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(-5, -5, 2, 0, Math.PI*2);
            ctx.arc(5, 5, 2, 0, Math.PI*2);
            ctx.fill();
        }
    }

    const draw = () => {
        // Clear background
        ctx.fillStyle = gameMode === GameMode.ZEN ? COLORS.BACKGROUND_ZEN : COLORS.BACKGROUND_CLASSIC;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw Camera Feed
        if (isInputMethodCamera && videoRef.current) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            const scale = Math.max(canvas.width / videoRef.current.videoWidth, canvas.height / videoRef.current.videoHeight);
            const x = (canvas.width / 2) - (videoRef.current.videoWidth / 2) * scale;
            const y = (canvas.height / 2) - (videoRef.current.videoHeight / 2) * scale;
            
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, -x + (canvas.width - videoRef.current.videoWidth*scale), y, videoRef.current.videoWidth * scale, videoRef.current.videoHeight * scale);
            ctx.restore();
        }

        // Screen Shake & Red Flash for explosion
        if (isExplodingRef.current) {
            const elapsed = Date.now() - explosionTimeRef.current;
            const shake = Math.max(0, 20 - elapsed / 20);
            const flash = Math.max(0, 1 - elapsed / 300);
            
            ctx.save();
            ctx.translate(Math.random() * shake - shake/2, Math.random() * shake - shake/2);
            
            if (flash > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Draw Splatters (Behind fruits)
        splattersRef.current.forEach(s => {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation);
            ctx.globalAlpha = s.opacity;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            for(let i=0; i<8; i++) {
                ctx.arc(Math.cos(i) * 20 * s.scale, Math.sin(i) * 20 * s.scale, 10 * s.scale, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.restore();
        });

        // Draw Fruits (If not exploded)
        if (!isExplodingRef.current) {
            fruitsRef.current.forEach(f => {
                ctx.save();
                ctx.translate(f.x, f.y);
                ctx.rotate(f.rotation);
                
                if (f.sliced) {
                    ctx.save();
                    ctx.translate(-10, -10);
                    drawFruitBody(ctx, f, 0);
                    drawInside(ctx, f);
                    ctx.restore();

                    ctx.save();
                    ctx.translate(10, 10);
                    drawFruitBody(ctx, f, 0);
                    drawInside(ctx, f);
                    ctx.restore();
                 } else {
                    if (f.type === FruitType.BOMB) {
                        const grad = ctx.createRadialGradient(-5, -5, 5, 0, 0, f.radius);
                        grad.addColorStop(0, '#4b5563');
                        grad.addColorStop(1, '#1f2937');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#ef4444';
                        ctx.font = '30px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('☠️', 0, 0);

                        ctx.beginPath();
                        ctx.strokeStyle = '#d97706';
                        ctx.lineWidth = 3;
                        ctx.moveTo(0, -f.radius);
                        ctx.quadraticCurveTo(15, -f.radius - 15, 20, -f.radius - 5);
                        ctx.stroke();

                        if (Math.random() > 0.5) {
                            ctx.fillStyle = '#fbbf24';
                            ctx.beginPath();
                            ctx.arc(20, -f.radius - 5, 3, 0, Math.PI*2);
                            ctx.fill();
                        }
                    } else {
                        drawFruitBody(ctx, f, 0);
                    }
                }
                ctx.restore();
            });
        }

        // Draw Particles
        particlesRef.current.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Restore shake context
        if (isExplodingRef.current) {
            ctx.restore();
        }

        // Draw Blade
        if (bladeRef.current.length > 1) {
            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Outer glow
            ctx.strokeStyle = COLORS.BLADE_GLOW;
            ctx.lineWidth = 15;
            ctx.moveTo(bladeRef.current[0].x, bladeRef.current[0].y);
            for(let i=1; i<bladeRef.current.length; i++) {
                ctx.lineTo(bladeRef.current[i].x, bladeRef.current[i].y);
            }
            ctx.stroke();
            
            // Inner Core
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
             ctx.moveTo(bladeRef.current[0].x, bladeRef.current[0].y);
            for(let i=1; i<bladeRef.current.length; i++) {
                ctx.lineTo(bladeRef.current[i].x, bladeRef.current[i].y);
            }
            ctx.stroke();
        }

        // Draw HUD
        drawHUD(ctx);
    };

    const drawHUD = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = 'white';
        ctx.font = '40px Bangers';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        
        // Score
        ctx.textAlign = 'left';
        ctx.fillText(`${T.SCORE}: ${scoreRef.current}`, 20, 50);

        // Lives or Time
        if (gameMode === GameMode.CLASSIC) {
            ctx.textAlign = 'right';
            let hearts = '';
            for(let i=0; i<MAX_LIVES; i++) {
                hearts += i < livesRef.current ? '❤️' : '🖤';
            }
            ctx.fillText(hearts, canvas.width - 20, 50);
        } else if (gameMode === GameMode.ZEN) {
            ctx.textAlign = 'right';
            ctx.fillStyle = timeRef.current < 10 ? 'red' : 'white';
            ctx.fillText(`${T.TIME}: ${Math.ceil(timeRef.current)}`, canvas.width - 20, 50);
        }
        
        // Combo text
        if (comboRef.current > 1) {
             ctx.fillStyle = '#fbbf24';
             ctx.textAlign = 'center';
             ctx.font = '60px Bangers';
             ctx.fillText(`${comboRef.current} COMBO!`, canvas.width/2, 100);
        }
    };

    const handleScore = (points: number) => {
        const now = Date.now();
        soundManager.playSlice();

        if (now - lastSliceTimeRef.current < 400) {
            comboRef.current++;
            soundManager.playCombo();
        } else {
            comboRef.current = 1;
        }
        lastSliceTimeRef.current = now;
        
        if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;

        scoreRef.current += points * comboRef.current;
    };

    const loseLife = () => {
        livesRef.current--;
        if (livesRef.current <= 0) {
            handleGameOver();
        }
    };

    const handleGameOver = async () => {
        soundManager.stopMusic();
        soundManager.playGameOver();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        const finalScore = scoreRef.current;
        const bestCombo = maxComboRef.current;
        
        // Pass data immediately to App -> GameOverScreen
        // AI feedback is now handled in GameOverScreen to prevent game loop lag
        onGameOver(finalScore, bestCombo);
    };

    const loop = () => {
        update();
        draw();
        animationFrameId = requestAnimationFrame(loop);
    };

    const handleResize = () => {
        if(canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    animationFrameId = requestAnimationFrame(loop);

    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
    };
  }, [isCameraReady, gameMode, isInputMethodCamera, language, T]);

  return (
    <div className="relative w-full h-full overflow-hidden cursor-none">
      <video 
        ref={videoRef} 
        className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none"
        playsInline 
        muted
        autoPlay
      />
      
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onTouchMove={(e) => {
            if (!isInputMethodCamera && e.touches.length > 0) {
                 const t = e.touches[0];
                 rawMousePosRef.current = { x: t.clientX, y: t.clientY };
                 smoothedMousePosRef.current = { x: t.clientX, y: t.clientY };
            }
        }}
        className="block w-full h-full touch-none"
      />

      {(!isCameraReady && isInputMethodCamera) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-50">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold font-display">{loadingMessage}</h2>
                  <p className="mt-2 text-gray-400">{T.PERMISSIONS}</p>
                  <p className="mt-1 text-xs text-gray-600 max-w-md mx-auto">
                    Video element status: {videoRef.current ? "Ready" : "Missing"}
                  </p>
                  <button onClick={onReturnToMenu} className="mt-8 px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition pointer-events-auto">Cancel</button>
              </div>
          </div>
      )}
      
      {isCameraReady && (
        <button 
            onClick={() => { soundManager.playClick(); onReturnToMenu(); }}
            className="absolute top-4 left-4 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm cursor-pointer pointer-events-auto"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        </button>
      )}
    </div>
  );
};

export default GameCanvas;