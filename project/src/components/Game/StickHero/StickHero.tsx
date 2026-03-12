import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/UI/PageHeader';
import styles from './StickHero.module.scss';

// --- Helpers (instead of extending prototypes) ---
const last = <T,>(arr: T[]): T => arr[arr.length - 1];
const sinus = (degree: number) => Math.sin((degree / 180) * Math.PI);

// --- Constants ---
const CANVAS_WIDTH = 375;
const CANVAS_HEIGHT = 375;
const PLATFORM_HEIGHT = 100;
const HERO_DISTANCE_FROM_EDGE = 10;
const PADDING_X = 100;
const PERFECT_AREA_SIZE = 10;
const BACKGROUND_SPEED_MULTIPLIER = 0.2;
const HILL1_BASE_HEIGHT = 100;
const HILL1_AMPLITUDE = 10;
const HILL1_STRETCH = 1;
const HILL2_BASE_HEIGHT = 70;
const HILL2_AMPLITUDE = 20;
const HILL2_STRETCH = 0.5;
const STRETCHING_SPEED = 4;
const TURNING_SPEED = 4;
const WALKING_SPEED = 4;
const TRANSITIONING_SPEED = 2;
const FALLING_SPEED = 2;
const HERO_WIDTH = 17;
const HERO_HEIGHT = 30;

type Phase =
  | 'waiting'
  | 'stretching'
  | 'turning'
  | 'walking'
  | 'transitioning'
  | 'falling';

interface Platform {
  x: number;
  w: number;
}

interface Stick {
  x: number;
  length: number;
  rotation: number;
}

interface Tree {
  x: number;
  color: string;
}

interface GameState {
  phase: Phase;
  lastTimestamp: number | undefined;
  heroX: number;
  heroY: number;
  sceneOffset: number;
  platforms: Platform[];
  sticks: Stick[];
  trees: Tree[];
  score: number;
  ctx: CanvasRenderingContext2D | null;
  /** Для чёткой картинки на Retina/high-DPI */
  dpr: number;
  logicalWidth: number;
  logicalHeight: number;
}

const TREE_COLORS = ['#6D8821', '#8FAC34', '#98B333'];

function generateTree(trees: Tree[]): Tree {
  const minimumGap = 30;
  const maximumGap = 150;
  const lastTree = trees[trees.length - 1];
  const furthestX = lastTree ? lastTree.x : 0;
  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const color = TREE_COLORS[Math.floor(Math.random() * 3)];
  return { x, color };
}

function generatePlatform(platforms: Platform[]): Platform {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;
  const lastPlatform = platforms[platforms.length - 1];
  const furthestX = lastPlatform.x + lastPlatform.w;
  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
  return { x, w };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
}

export const StickHero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [introductionOpacity, setIntroductionOpacity] = useState(1);
  const [perfectOpacity, setPerfectOpacity] = useState(0);
  const [showRestart, setShowRestart] = useState(false);

  const gameRef = useRef<GameState>({
    phase: 'waiting',
    lastTimestamp: undefined,
    heroX: 0,
    heroY: 0,
    sceneOffset: 0,
    platforms: [],
    sticks: [],
    trees: [],
    score: 0,
    ctx: null,
    dpr: 1,
    logicalWidth: CANVAS_WIDTH,
    logicalHeight: CANVAS_HEIGHT,
  });

  const settersRef = useRef({
    setScore,
    setIntroductionOpacity,
    setPerfectOpacity,
    setShowRestart,
  });
  useEffect(() => {
    settersRef.current = {
      setScore,
      setIntroductionOpacity,
      setPerfectOpacity,
      setShowRestart,
    };
  }, [setScore, setIntroductionOpacity, setPerfectOpacity, setShowRestart]);

  const rafIdRef = useRef<number>(0);
  const animateRef = useRef<(timestamp: number) => void>(() => {});
  const drawRef = useRef<() => void>(() => {});

  const thePlatformTheStickHits = useCallback(
    (g: GameState): [Platform | undefined, boolean] => {
      const stick = last(g.sticks);
      if (stick.rotation !== 90) return [undefined, false];
      const stickFarX = stick.x + stick.length;
      const platform = g.platforms.find(
        (p) => p.x < stickFarX && stickFarX < p.x + p.w
      );
      if (!platform) return [undefined, false];
      const perfectHit =
        platform.x + platform.w / 2 - PERFECT_AREA_SIZE / 2 < stickFarX &&
        stickFarX < platform.x + platform.w / 2 + PERFECT_AREA_SIZE / 2;
      return [platform, perfectHit];
    },
    []
  );

  const resetGame = useCallback(() => {
    const g = gameRef.current;
    g.phase = 'waiting';
    g.lastTimestamp = undefined;
    g.sceneOffset = 0;
    g.score = 0;
    g.platforms = [{ x: 50, w: 50 }];
    g.platforms.push(generatePlatform(g.platforms));
    g.platforms.push(generatePlatform(g.platforms));
    g.platforms.push(generatePlatform(g.platforms));
    g.platforms.push(generatePlatform(g.platforms));
    g.sticks = [
      { x: g.platforms[0].x + g.platforms[0].w, length: 0, rotation: 0 },
    ];
    g.trees = [];
    for (let i = 0; i < 10; i++) g.trees.push(generateTree(g.trees));
    g.heroX = g.platforms[0].x + g.platforms[0].w - HERO_DISTANCE_FROM_EDGE;
    g.heroY = 0;

    settersRef.current.setScore(0);
    drawRef.current();
    settersRef.current.setIntroductionOpacity(1);
    settersRef.current.setPerfectOpacity(0);
    settersRef.current.setShowRestart(false);
  }, []);

  const draw = useCallback(() => {
    const g = gameRef.current;
    const ctx = g.ctx;
    if (!ctx || !canvasRef.current) return;
    const w = g.logicalWidth;
    const h = g.logicalHeight;

    ctx.save();
    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#BBD691');
    gradient.addColorStop(1, '#FEF1E1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const getHillY = (
      windowX: number,
      baseHeight: number,
      amplitude: number,
      stretch: number
    ) => {
      const sineBaseY = h - baseHeight;
      return (
        sinus(
          (g.sceneOffset * BACKGROUND_SPEED_MULTIPLIER + windowX) * stretch
        ) *
          amplitude +
        sineBaseY
      );
    };

    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(
      0,
      getHillY(0, HILL1_BASE_HEIGHT, HILL1_AMPLITUDE, HILL1_STRETCH)
    );
    for (let i = 0; i <= w; i++) {
      ctx.lineTo(
        i,
        getHillY(i, HILL1_BASE_HEIGHT, HILL1_AMPLITUDE, HILL1_STRETCH)
      );
    }
    ctx.lineTo(w, h);
    ctx.fillStyle = '#95C629';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(
      0,
      getHillY(0, HILL2_BASE_HEIGHT, HILL2_AMPLITUDE, HILL2_STRETCH)
    );
    for (let i = 0; i <= w; i++) {
      ctx.lineTo(
        i,
        getHillY(i, HILL2_BASE_HEIGHT, HILL2_AMPLITUDE, HILL2_STRETCH)
      );
    }
    ctx.lineTo(w, h);
    ctx.fillStyle = '#659F1C';
    ctx.fill();

    const getTreeY = (x: number, baseHeight: number, amplitude: number) =>
      h - baseHeight + sinus(x) * amplitude;

    g.trees.forEach((tree) => {
      ctx.save();
      ctx.translate(
        (-g.sceneOffset * BACKGROUND_SPEED_MULTIPLIER + tree.x) * HILL1_STRETCH,
        getTreeY(tree.x, HILL1_BASE_HEIGHT, HILL1_AMPLITUDE)
      );
      const treeTrunkHeight = 5;
      const treeTrunkWidth = 2;
      const treeCrownHeight = 25;
      const treeCrownWidth = 10;
      ctx.fillStyle = '#7D833C';
      ctx.fillRect(
        -treeTrunkWidth / 2,
        -treeTrunkHeight,
        treeTrunkWidth,
        treeTrunkHeight
      );
      ctx.beginPath();
      ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
      ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
      ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
      ctx.fillStyle = tree.color;
      ctx.fill();
      ctx.restore();
    });

    ctx.translate(
      (w - CANVAS_WIDTH) / 2 - g.sceneOffset,
      (h - CANVAS_HEIGHT) / 2
    );

    // Platforms
    g.platforms.forEach(({ x, w }) => {
      ctx.fillStyle = 'black';
      ctx.fillRect(
        x,
        CANVAS_HEIGHT - PLATFORM_HEIGHT,
        w,
        PLATFORM_HEIGHT + (h - CANVAS_HEIGHT) / 2
      );
      if (last(g.sticks).x < x) {
        ctx.fillStyle = 'red';
        ctx.fillRect(
          x + w / 2 - PERFECT_AREA_SIZE / 2,
          CANVAS_HEIGHT - PLATFORM_HEIGHT,
          PERFECT_AREA_SIZE,
          PERFECT_AREA_SIZE
        );
      }
    });

    // Hero
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.translate(
      g.heroX - HERO_WIDTH / 2,
      g.heroY + CANVAS_HEIGHT - PLATFORM_HEIGHT - HERO_HEIGHT / 2
    );
    drawRoundedRect(
      ctx,
      -HERO_WIDTH / 2,
      -HERO_HEIGHT / 2,
      HERO_WIDTH,
      HERO_HEIGHT - 4,
      5
    );
    const legDistance = 5;
    ctx.beginPath();
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = 'red';
    ctx.fillRect(-HERO_WIDTH / 2 - 1, -12, HERO_WIDTH + 2, 4.5);
    ctx.beginPath();
    ctx.moveTo(-9, -14.5);
    ctx.lineTo(-17, -18.5);
    ctx.lineTo(-14, -8.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -10.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-5, -7);
    ctx.fill();
    ctx.restore();

    // Sticks
    g.sticks.forEach((stick) => {
      ctx.save();
      ctx.translate(stick.x, CANVAS_HEIGHT - PLATFORM_HEIGHT);
      ctx.rotate((Math.PI / 180) * stick.rotation);
      ctx.beginPath();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -stick.length);
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      const g = gameRef.current;
      if (!g.ctx) return;

      if (g.lastTimestamp === undefined) {
        g.lastTimestamp = timestamp;
        rafIdRef.current = requestAnimationFrame((ts) =>
          animateRef.current(ts)
        );
        return;
      }

      const dt = timestamp - g.lastTimestamp;

      switch (g.phase) {
        case 'waiting':
          g.lastTimestamp = timestamp;
          rafIdRef.current = requestAnimationFrame((ts) =>
            animateRef.current(ts)
          );
          return;
        case 'stretching': {
          last(g.sticks).length += dt / STRETCHING_SPEED;
          break;
        }
        case 'turning': {
          last(g.sticks).rotation += dt / TURNING_SPEED;
          if (last(g.sticks).rotation > 90) {
            last(g.sticks).rotation = 90;
            const [nextPlatform, perfectHit] = thePlatformTheStickHits(g);
            if (nextPlatform) {
              g.score += perfectHit ? 2 : 1;
              settersRef.current.setScore(g.score);
              if (perfectHit) {
                settersRef.current.setPerfectOpacity(1);
                setTimeout(() => settersRef.current.setPerfectOpacity(0), 1000);
              }
              g.platforms.push(generatePlatform(g.platforms));
              g.trees.push(generateTree(g.trees));
              g.trees.push(generateTree(g.trees));
            }
            g.phase = 'walking';
          }
          break;
        }
        case 'walking': {
          g.heroX += dt / WALKING_SPEED;
          const [nextPlatform] = thePlatformTheStickHits(g);
          if (nextPlatform) {
            const maxHeroX =
              nextPlatform.x + nextPlatform.w - HERO_DISTANCE_FROM_EDGE;
            if (g.heroX > maxHeroX) {
              g.heroX = maxHeroX;
              g.phase = 'transitioning';
            }
          } else {
            const maxHeroX =
              last(g.sticks).x + last(g.sticks).length + HERO_WIDTH;
            if (g.heroX > maxHeroX) {
              g.heroX = maxHeroX;
              g.phase = 'falling';
            }
          }
          break;
        }
        case 'transitioning': {
          g.sceneOffset += dt / TRANSITIONING_SPEED;
          const [nextPlatform] = thePlatformTheStickHits(g);
          if (
            nextPlatform &&
            g.sceneOffset > nextPlatform.x + nextPlatform.w - PADDING_X
          ) {
            g.sticks.push({
              x: nextPlatform.x + nextPlatform.w,
              length: 0,
              rotation: 0,
            });
            g.phase = 'waiting';
          }
          break;
        }
        case 'falling': {
          if (last(g.sticks).rotation < 180)
            last(g.sticks).rotation += dt / TURNING_SPEED;
          g.heroY += dt / FALLING_SPEED;
          const maxHeroY =
            PLATFORM_HEIGHT + 100 + (g.logicalHeight - CANVAS_HEIGHT) / 2;
          if (g.heroY > maxHeroY) {
            settersRef.current.setShowRestart(true);
            g.lastTimestamp = timestamp;
            draw();
            return;
          }
          break;
        }
      }

      draw();
      g.lastTimestamp = timestamp;
      rafIdRef.current = requestAnimationFrame((ts) => animateRef.current(ts));
    },
    [draw, thePlatformTheStickHits]
  );

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) {
      (
        ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }
      ).imageSmoothingQuality = 'high';
    }
    gameRef.current.ctx = ctx;
    const resize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      gameRef.current.dpr = dpr;
      gameRef.current.logicalWidth = rect.width;
      gameRef.current.logicalHeight = rect.height;
      const canvas = canvasRef.current;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      draw();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        resetGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [draw, resetGame]);

  useEffect(() => {
    resetGame();
    rafIdRef.current = requestAnimationFrame((ts) => animateRef.current(ts));
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [resetGame, animate]);

  const handleMouseDown = useCallback(() => {
    const g = gameRef.current;
    if (g.phase === 'waiting') {
      g.lastTimestamp = undefined;
      settersRef.current.setIntroductionOpacity(0);
      g.phase = 'stretching';
      rafIdRef.current = requestAnimationFrame((ts) => animateRef.current(ts));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    const g = gameRef.current;
    if (g.phase === 'stretching') g.phase = 'turning';
  }, []);

  const handleRestart = useCallback(() => {
    resetGame();
    setShowRestart(false);
  }, [resetGame]);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Stick Hero"
        link="https://codepen.io/HunorMarton/pen/xxOMQKg"
      />
      <div ref={containerRef} className={styles.container}>
        <div className={styles.score} aria-live="polite">
          {score}
        </div>
        <canvas
          ref={canvasRef}
          className={styles.game}
          width={375}
          height={305}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={(e) => {
            e.preventDefault();
            handleMouseDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleMouseUp();
          }}
        />
        <p
          className={styles.introduction}
          style={{ opacity: introductionOpacity }}
        >
          Удерживайте мышь (или палец), чтобы вытянуть палочку
        </p>
        <div
          className={styles.perfect}
          style={{ opacity: perfectOpacity }}
          aria-live="polite"
        >
          DOUBLE SCORE
        </div>
        <button
          type="button"
          className={styles.restart}
          style={{ display: showRestart ? 'block' : 'none' }}
          onClick={handleRestart}
        >
          RESTART
        </button>
      </div>
    </div>
  );
};
