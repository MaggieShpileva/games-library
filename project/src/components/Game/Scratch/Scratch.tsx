import { useCallback, useRef, useState } from 'react';
import { PageHeader } from '@/components/UI';
import styles from './Scratch.module.scss';

const COIN_SIZE = 60;
const COIN_HALF = COIN_SIZE / 2;
const BOX_WIDTH = 1220;
const BOX_HEIGHT = 630;
const SCRATCH_THRESHOLD = 100;
const STROKE_STEP = 8;
const COIN_LERP = 0.32;

const COIN_BG =
  "url('https://irxcm.com/RevTrax/creative/image?orgId=15117353&imageId=11003925')";
const REVEAL_BG = "url('/image.png')";

type ScratchCircle = { key: string; x: number; y: number };

function getLocalPos(
  box: DOMRect,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  return {
    x: clientX - box.left - COIN_HALF,
    y: clientY - box.top - COIN_HALF,
  };
}

function collectStampAlongLine(
  keys: Set<string>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  step: number
): ScratchCircle[] {
  const out: ScratchCircle[] = [];
  const tryStamp = (x: number, y: number) => {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const key = `${rx}x${ry}`;
    if (keys.has(key)) return;
    keys.add(key);
    out.push({ key, x: rx, y: ry });
  };
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.01) {
    tryStamp(x1, y1);
    return out;
  }
  const n = Math.max(1, Math.ceil(dist / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    tryStamp(x0 + dx * t, y0 + dy * t);
  }
  return out;
}

export const Scratch = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const rafDrawRef = useRef<number | undefined>(undefined);
  const rafMoveRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseDownRef = useRef(0);
  const doneRef = useRef(false);
  const hasShownCoinRef = useRef(false);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const lastScratchRef = useRef<{ x: number; y: number } | null>(null);
  const coinSmoothRef = useRef({ x: 0, y: 0 });
  const coinSmoothReadyRef = useRef(false);

  const [showCoin, setShowCoin] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [circles, setCircles] = useState<ScratchCircle[]>([]);
  const [done, setDone] = useState(false);

  const cancelRaf = useCallback(() => {
    if (rafDrawRef.current !== undefined) {
      cancelAnimationFrame(rafDrawRef.current);
      rafDrawRef.current = undefined;
    }
    if (rafMoveRef.current !== undefined) {
      cancelAnimationFrame(rafMoveRef.current);
      rafMoveRef.current = undefined;
    }
  }, []);

  const drawCircle = useCallback(() => {
    const tick = () => {
      if (!boxRef.current || !mouseDownRef.current) return;

      const curr = mouseRef.current;
      const last = lastScratchRef.current;
      let batch: ScratchCircle[];

      if (last === null) {
        batch = collectStampAlongLine(
          keysRef.current,
          curr.x,
          curr.y,
          curr.x,
          curr.y,
          STROKE_STEP
        );
        lastScratchRef.current = { x: curr.x, y: curr.y };
      } else {
        batch = collectStampAlongLine(
          keysRef.current,
          last.x,
          last.y,
          curr.x,
          curr.y,
          STROKE_STEP
        );
        lastScratchRef.current = { x: curr.x, y: curr.y };
      }

      if (batch.length > 0) {
        setCircles((prev) => [...prev, ...batch]);
        if (!doneRef.current && keysRef.current.size > SCRATCH_THRESHOLD) {
          doneRef.current = true;
          setDone(true);
        }
      }
      rafDrawRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const moveCoin = useCallback(() => {
    const tick = () => {
      const node = cursorRef.current;
      if (node) {
        const t = mouseRef.current;
        let s = coinSmoothRef.current;
        if (!coinSmoothReadyRef.current) {
          s = { x: t.x, y: t.y };
          coinSmoothRef.current = s;
          coinSmoothReadyRef.current = true;
        } else {
          s.x += (t.x - s.x) * COIN_LERP;
          s.y += (t.y - s.y) * COIN_LERP;
        }
        node.style.left = `${s.x}px`;
        node.style.top = `${s.y}px`;
      }
      rafMoveRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = boxRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pos = getLocalPos(rect, e.clientX, e.clientY);
      mouseRef.current = pos;

      if (!hasShownCoinRef.current) {
        hasShownCoinRef.current = true;
        setShowCoin(true);
      }

      if (mouseDownRef.current) {
        if (rafDrawRef.current === undefined) {
          rafDrawRef.current = requestAnimationFrame(drawCircle);
        }
        setDragging(true);
      }

      if (rafMoveRef.current === undefined) {
        rafMoveRef.current = requestAnimationFrame(moveCoin);
      }
    },
    [drawCircle, moveCoin]
  );

  const onPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (hasShownCoinRef.current) {
        hasShownCoinRef.current = false;
        setShowCoin(false);
        cancelRaf();
      }
      coinSmoothReadyRef.current = false;
      mouseDownRef.current = 0;
      setDragging(false);
      lastScratchRef.current = null;
    },
    [cancelRaf]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const el = boxRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        mouseRef.current = getLocalPos(rect, e.clientX, e.clientY);
      }
      lastScratchRef.current = null;
      if (mouseDownRef.current === 0) {
        mouseDownRef.current = 1;
      }
      if (rafDrawRef.current === undefined) {
        rafDrawRef.current = requestAnimationFrame(drawCircle);
      }
    },
    [drawCircle]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (mouseDownRef.current === 1) {
        cancelRaf();
        setDragging(false);
        mouseDownRef.current = 0;
        lastScratchRef.current = null;
      }
    },
    [cancelRaf]
  );

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Скретч"
        link="https://codepen.io/revtrax/pen/jOVoZNO"
      />

      <div
        ref={boxRef}
        className={`${styles.box} ${done ? styles.doneScratching : ''}`}
        style={
          {
            '--coin-bg': COIN_BG,
            '--reveal-bg': REVEAL_BG,
            '--box-width': `${BOX_WIDTH}px`,
            '--box-height': `${BOX_HEIGHT}px`,
            '--coin-size': `${COIN_SIZE}px`,
          } as React.CSSProperties
        }
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {circles.map(({ key, x, y }) => (
          <span
            key={key}
            className={styles.cursorStatic}
            style={{
              left: x,
              top: y,
              backgroundImage: REVEAL_BG,
              backgroundPosition: `${-x}px ${-y}px`,
            }}
          />
        ))}

        <span
          ref={cursorRef}
          className={`${styles.cursor} ${showCoin ? styles.cursorActive : ''} ${dragging ? styles.cursorDragging : ''}`}
          style={{
            backgroundImage: COIN_BG,
          }}
        />
      </div>
    </div>
  );
};
