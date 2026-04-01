import { useCallback, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/UI';
import styles from './OldSchoolRacing.module.scss';

const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 450;

const COLORS = {
  sky: '#D4F5FE',
  mountains: '#83CACE',
  ground: '#8FC04C',
  groundDark: '#73B043',
  road: '#fff',
  roadLine: '#474747',
  hud: '#FFF',
} as const;

const SETTINGS = {
  fps: 60,
  skySize: 120,
  ground: { size: 350, min: 4, max: 120 },
  road: { min: 76, max: 700 },
} as const;

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function norm(value: number, min: number, max: number) {
  return (value - min) / (max - min);
}

function lerp(n: number, min: number, max: number) {
  return (max - min) * n + min;
}

function map(
  value: number,
  sourceMin: number,
  sourceMax: number,
  destMin: number,
  destMax: number
) {
  return lerp(norm(value, sourceMin, sourceMax), destMin, destMax);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCirclePoint(x: number, y: number, radius: number, angle: number) {
  const radian = (angle / 180) * Math.PI;
  return {
    x: x + radius * Math.cos(radian),
    y: y + radius * Math.sin(radian),
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  turn?: boolean,
  turneffect?: number,
  stateTurn?: number
) {
  const skew =
    turn === true && turneffect !== undefined && stateTurn !== undefined
      ? stateTurn * turneffect
      : 0;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y - skew);
  ctx.lineTo(x + width - radius, y + skew);
  ctx.arcTo(x + width, y + skew, x + width, y + radius + skew, radius);
  ctx.lineTo(x + width, y + radius + skew);
  ctx.lineTo(x + width, y + height + skew - radius);
  ctx.arcTo(
    x + width,
    y + height + skew,
    x + width - radius,
    y + height + skew,
    radius
  );
  ctx.lineTo(x + width - radius, y + height + skew);
  ctx.lineTo(x + radius, y + height - skew);
  ctx.arcTo(x, y + height - skew, x, y + height - skew - radius, radius);
  ctx.lineTo(x, y + height - skew - radius);
  ctx.lineTo(x, y + radius - skew);
  ctx.arcTo(x, y - skew, x + radius, y - skew, radius);
  ctx.lineTo(x + radius, y - skew);
  ctx.fill();
}

export const OldSchoolRacing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const bgImageDataRef = useRef<ImageData | null>(null);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(0);
  const gameLoopRef = useRef<() => void>(() => {});

  const stateRef = useRef({
    bgpos: 0,
    offset: 0,
    startDark: true,
    curve: 0,
    currentCurve: 0,
    turn: 1,
    speed: 27,
    xpos: 0,
    section: 50,
    keypress: { up: false, left: false, right: false, down: false },
  });

  const car = useRef({
    maxSpeed: 50,
    friction: 0.4,
    acc: 0.85,
    deAcc: 0.5,
  });

  const drawMountain = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      pos: number,
      height: number,
      width: number
    ) => {
      ctx.fillStyle = COLORS.mountains;
      ctx.strokeStyle = COLORS.mountains;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(pos, SETTINGS.skySize);
      ctx.lineTo(pos + width / 2, SETTINGS.skySize - height);
      ctx.lineTo(pos + width, SETTINGS.skySize);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    },
    []
  );

  const drawBg = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, CANVAS_WIDTH, SETTINGS.skySize);
      drawMountain(ctx, 0, 60, 200);
      drawMountain(ctx, 280, 40, 200);
      drawMountain(ctx, 400, 80, 200);
      drawMountain(ctx, 550, 60, 200);
      bgImageDataRef.current = ctx.getImageData(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
    },
    [drawMountain]
  );

  const drawGround = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      offset: number,
      lightColor: string,
      darkColor: string
    ) => {
      let pos = SETTINGS.skySize - SETTINGS.ground.min + offset;
      let stepSize = 1;
      let drawDark = stateRef.current.startDark;
      let firstRow = true;
      ctx.fillStyle = lightColor;
      ctx.fillRect(0, SETTINGS.skySize, CANVAS_WIDTH, SETTINGS.ground.size);
      ctx.fillStyle = darkColor;
      while (pos <= CANVAS_HEIGHT) {
        stepSize =
          norm(pos, SETTINGS.skySize, CANVAS_HEIGHT) * SETTINGS.ground.max;
        if (stepSize < SETTINGS.ground.min) stepSize = SETTINGS.ground.min;
        if (drawDark) {
          if (firstRow) {
            ctx.fillRect(
              0,
              SETTINGS.skySize,
              CANVAS_WIDTH,
              stepSize -
                (offset > SETTINGS.ground.min
                  ? SETTINGS.ground.min
                  : SETTINGS.ground.min - offset)
            );
          } else {
            ctx.fillRect(
              0,
              pos < SETTINGS.skySize ? SETTINGS.skySize : pos,
              CANVAS_WIDTH,
              stepSize
            );
          }
        }
        firstRow = false;
        pos += stepSize;
        drawDark = !drawDark;
      }
    },
    []
  );

  const drawRoad = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      min: number,
      max: number,
      squishFactor: number,
      color: string | CanvasPattern
    ) => {
      const s = stateRef.current;
      const basePos = CANVAS_WIDTH + s.xpos;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo((basePos + min) / 2 - s.currentCurve * 3, SETTINGS.skySize);
      ctx.quadraticCurveTo(
        basePos / 2 + min + s.currentCurve / 3 + squishFactor,
        SETTINGS.skySize + 52,
        (basePos + max) / 2,
        CANVAS_HEIGHT
      );
      ctx.lineTo((basePos - max) / 2, CANVAS_HEIGHT);
      ctx.quadraticCurveTo(
        basePos / 2 - min + s.currentCurve / 3 - squishFactor,
        SETTINGS.skySize + 52,
        (basePos - min) / 2 - s.currentCurve * 3,
        SETTINGS.skySize
      );
      ctx.closePath();
      ctx.fill();
    },
    []
  );

  const calcMovement = useCallback(() => {
    const s = stateRef.current;
    const c = car.current;
    const move = s.speed * 0.01;
    let newCurve = 0;

    if (s.keypress.up) {
      s.speed += c.acc - s.speed * 0.015;
    } else if (s.speed > 0) {
      s.speed -= c.friction;
    }
    if (s.keypress.down && s.speed > 0) s.speed -= 1;

    s.xpos -= s.currentCurve * s.speed * 0.005;

    if (s.speed) {
      if (s.keypress.left) {
        s.xpos +=
          (Math.abs(s.turn) +
            7 +
            (s.speed > c.maxSpeed / 4 ? c.maxSpeed - s.speed / 2 : s.speed)) *
          0.2;
        s.turn -= 1;
      }
      if (s.keypress.right) {
        s.xpos -=
          (Math.abs(s.turn) +
            7 +
            (s.speed > c.maxSpeed / 4 ? c.maxSpeed - s.speed / 2 : s.speed)) *
          0.2;
        s.turn += 1;
      }
      if (s.turn !== 0 && !s.keypress.left && !s.keypress.right) {
        s.turn += s.turn > 0 ? -0.25 : 0.25;
      }
    }

    s.turn = clamp(s.turn, -5, 5);
    s.speed = clamp(s.speed, 0, c.maxSpeed);
    s.section -= s.speed;

    if (s.section < 0) {
      s.section = randomRange(1000, 9000);
      newCurve = randomRange(-50, 50);
      if (Math.abs(s.curve - newCurve) < 20) newCurve = randomRange(-50, 50);
      s.curve = newCurve;
    }

    if (s.currentCurve < s.curve && move < Math.abs(s.currentCurve - s.curve)) {
      s.currentCurve += move;
    } else if (
      s.currentCurve > s.curve &&
      move < Math.abs(s.currentCurve - s.curve)
    ) {
      s.currentCurve -= move;
    }

    if (Math.abs(s.xpos) > 550) s.speed *= 0.96;
    s.xpos = clamp(s.xpos, -650, 650);
  }, []);

  const drawTig = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      angle: number,
      size: number
    ) => {
      const startPoint = getCirclePoint(x, y, radius - 4, angle);
      const endPoint = getCirclePoint(x, y, radius - size, angle);
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    },
    []
  );

  const drawPointer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      color: string,
      radius: number,
      centerX: number,
      centerY: number,
      angle: number
    ) => {
      const point = getCirclePoint(centerX, centerY, radius - 20, angle);
      const point2 = getCirclePoint(centerX, centerY, 2, angle + 90);
      const point3 = getCirclePoint(centerX, centerY, 2, angle - 90);
      ctx.beginPath();
      ctx.strokeStyle = '#FF9166';
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.moveTo(point2.x, point2.y);
      ctx.lineTo(point.x, point.y);
      ctx.lineTo(point3.x, point3.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 9, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  const drawHUD = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      color: string
    ) => {
      const radius = 50;
      const tigs = [0, 90, 135, 180, 225, 270, 315];
      const s = stateRef.current;
      const angle = map(s.speed, 0, car.current.maxSpeed, 90, 360);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      ctx.lineWidth = 7;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();

      tigs.forEach((t) => drawTig(ctx, centerX, centerY, radius, t, 7));
      drawPointer(ctx, color, 50, centerX, centerY, angle);
    },
    [drawTig, drawPointer]
  );

  const drawCar = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    const carWidth = 160;
    const carHeight = 50;
    const carX = CANVAS_WIDTH / 2 - carWidth / 2;
    const carY = 320;

    roundedRect(
      ctx,
      'rgba(0, 0, 0, 0.35)',
      carX - 1 + s.turn,
      carY + carHeight - 35,
      carWidth + 10,
      carHeight,
      9
    );
    roundedRect(ctx, '#111', carX, carY + carHeight - 30, 30, 40, 6);
    roundedRect(
      ctx,
      '#111',
      carX - 22 + carWidth,
      carY + carHeight - 30,
      30,
      40,
      6
    );

    const startX = 299;
    const startY = 311;
    const lights = [10, 26, 134, 152];
    let lightsY = 0;

    roundedRect(
      ctx,
      '#C2C2C2',
      startX + 6 + s.turn * 1.1,
      startY - 18,
      146,
      40,
      18
    );

    ctx.beginPath();
    ctx.lineWidth = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.moveTo(startX + 30, startY);
    ctx.lineTo(startX + 46 + s.turn, startY - 25);
    ctx.lineTo(startX + 114 + s.turn, startY - 25);
    ctx.lineTo(startX + 130, startY);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.fillStyle = '#DEE0E2';
    ctx.strokeStyle = '#DEE0E2';
    ctx.moveTo(startX + 2, startY + 12 + s.turn * 0.2);
    ctx.lineTo(startX + 159, startY + 12 + s.turn * 0.2);
    ctx.quadraticCurveTo(
      startX + 166,
      startY + 35,
      startX + 159,
      startY + 55 + s.turn * 0.2
    );
    ctx.lineTo(startX + 2, startY + 55 - s.turn * 0.2);
    ctx.quadraticCurveTo(
      startX - 5,
      startY + 32,
      startX + 2,
      startY + 12 - s.turn * 0.2
    );
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 12;
    ctx.fillStyle = '#DEE0E2';
    ctx.strokeStyle = '#DEE0E2';
    ctx.moveTo(startX + 30, startY);
    ctx.lineTo(startX + 40 + s.turn * 0.7, startY - 15);
    ctx.lineTo(startX + 120 + s.turn * 0.7, startY - 15);
    ctx.lineTo(startX + 130, startY);
    ctx.fill();
    ctx.stroke();

    roundedRect(
      ctx,
      '#474747',
      startX - 4,
      startY,
      169,
      10,
      3,
      true,
      0.2,
      s.turn
    );
    roundedRect(
      ctx,
      '#474747',
      startX + 40,
      startY + 5,
      80,
      10,
      5,
      true,
      0.1,
      s.turn
    );

    ctx.fillStyle = '#FF9166';
    lights.forEach((xPos) => {
      ctx.beginPath();
      ctx.arc(startX + xPos, startY + 20 + lightsY, 6, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      lightsY += s.turn * 0.05;
    });

    ctx.lineWidth = 9;
    ctx.fillStyle = '#222222';
    ctx.strokeStyle = '#444';
    roundedRect(
      ctx,
      '#FFF',
      startX + 60,
      startY + 25,
      40,
      18,
      3,
      true,
      0.05,
      s.turn
    );
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const canvas2 = canvas2Ref.current;
    const ctx2 = canvas2?.getContext('2d');
    const bg = bgImageDataRef.current;

    if (!ctx || !canvas2 || !ctx2 || !bg) return;

    const s = stateRef.current;

    calcMovement();

    s.bgpos += s.currentCurve * 0.02 * (s.speed * 0.2);
    s.bgpos = s.bgpos % CANVAS_WIDTH;

    ctx.putImageData(bg, s.bgpos, 5);
    ctx.putImageData(
      bg,
      s.bgpos > 0 ? s.bgpos - CANVAS_WIDTH : s.bgpos + CANVAS_WIDTH,
      5
    );

    s.offset += s.speed * 0.05;
    if (s.offset > SETTINGS.ground.min) {
      s.offset = SETTINGS.ground.min - s.offset;
      s.startDark = !s.startDark;
    }
    drawGround(ctx, s.offset, COLORS.ground, COLORS.groundDark);
    drawRoad(
      ctx,
      SETTINGS.road.min + 6,
      SETTINGS.road.max + 36,
      10,
      COLORS.roadLine
    );
    drawGround(ctx2, s.offset, COLORS.roadLine, COLORS.road);
    drawRoad(ctx2, SETTINGS.road.min, SETTINGS.road.max, 10, COLORS.road);
    drawRoad(
      ctx,
      3,
      24,
      0,
      ctx.createPattern(canvas2, 'repeat') ?? COLORS.road
    );
    drawCar(ctx);
    drawHUD(ctx, 630, 340, COLORS.hud);

    timeoutRef.current = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => gameLoopRef.current());
    }, 1000 / SETTINGS.fps);
  }, [calcMovement, drawGround, drawRoad, drawCar, drawHUD]);

  useEffect(() => {
    gameLoopRef.current = gameLoop;
  }, [gameLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvas2 = document.createElement('canvas');
    canvas2.width = CANVAS_WIDTH;
    canvas2.height = CANVAS_HEIGHT;
    canvas2Ref.current = canvas2;

    drawBg(ctx);
    rafRef.current = requestAnimationFrame(() => gameLoopRef.current());

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
      canvas2Ref.current = null;
    };
  }, [drawBg, gameLoop]);

  const handleKey = useCallback((e: KeyboardEvent, isKeyDown: boolean) => {
    if (e.keyCode >= 37 && e.keyCode <= 40) e.preventDefault();
    const k = stateRef.current.keypress;
    if (e.keyCode === 37) k.left = isKeyDown;
    if (e.keyCode === 38) k.up = isKeyDown;
    if (e.keyCode === 39) k.right = isKeyDown;
    if (e.keyCode === 40) k.down = isKeyDown;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleKey]);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Олдскул гоночки"
        link="https://codepen.io/johan-tirholm/pen/PGYExJ"
      />
      <div className={styles.gameContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
      </div>
      <p className={styles.controls}>
        Управление: стрелки ↑ ускорение, ↓ тормоз, ← → поворот
      </p>
    </div>
  );
};
