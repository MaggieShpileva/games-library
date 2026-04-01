import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { Button, PageHeader } from '@/components/UI';
import styles from './AimTrainer.module.scss';

const GAME_MS = 10_000;
const TARGET_SIZE = 40;

type Phase = 'idle' | 'running' | 'finished';

type TargetState = {
  x: number;
  y: number;
  spawnAt: number;
};

function ReactionChartSvg({ data }: { data: number[] }) {
  const w = 400;
  const h = 220;
  const pad = 28;
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const points = data.map((v, i) => {
    const x =
      pad + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad + (1 - (v - min) / range) * innerH;
    return { x, y, v };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      className={styles.chartSvg}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="График времени реакции по попыткам"
    >
      <rect
        x={pad}
        y={pad}
        width={innerW}
        height={innerH}
        fill="none"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth={1}
        rx={4}
      />
      <polyline
        fill="none"
        stroke="#007bff"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={polylinePoints}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#007bff" />
      ))}
    </svg>
  );
}

export const AimTrainer = () => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const reactionTimesRef = useRef<number[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(10);
  const [targetPos, setTargetPos] = useState<TargetState | null>(null);
  const [sessionResults, setSessionResults] = useState<number[] | null>(null);

  const clearTimers = useCallback(() => {
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (endTimeoutRef.current !== null) {
      clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const spawnTarget = useCallback(() => {
    const el = gameAreaRef.current;
    if (!el) return;
    const maxX = Math.max(0, el.clientWidth - TARGET_SIZE);
    const maxY = Math.max(0, el.clientHeight - TARGET_SIZE);
    setTargetPos({
      x: Math.random() * maxX,
      y: Math.random() * maxY,
      spawnAt: Date.now(),
    });
  }, []);

  const endGame = useCallback(() => {
    clearTimers();
    setPhase('finished');
    setTimeLeft(0);
    setTargetPos(null);
    setSessionResults([...reactionTimesRef.current]);
  }, [clearTimers]);

  const startGame = useCallback(() => {
    clearTimers();
    reactionTimesRef.current = [];
    setSessionResults(null);
    setTimeLeft(10);
    setPhase('running');
    queueMicrotask(() => {
      spawnTarget();
    });
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    endTimeoutRef.current = setTimeout(endGame, GAME_MS);
  }, [clearTimers, endGame, spawnTarget]);

  const onTargetClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (!targetPos || phase !== 'running') return;
      const reaction = Date.now() - targetPos.spawnAt;
      reactionTimesRef.current = [...reactionTimesRef.current, reaction];
      spawnTarget();
    },
    [targetPos, phase, spawnTarget]
  );

  const running = phase === 'running';
  const showResults = phase === 'finished' && sessionResults !== null;

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Аим-тренер (статистика скорости реакции)"
        link="https://codepen.io/Harshal-Gunwant/pen/yyOKMGX"
      />
      <div className={styles.body}>
        <p className={styles.intro}>
          Кликайте по мишени, как только она появляется. Раунд длится 10 секунд.
        </p>

        <Button
          type="button"
          variant="primary"
          disabled={running}
          onClick={startGame}
          className={styles.startBtn}
        >
          {running
            ? 'Идёт игра…'
            : phase === 'finished'
              ? 'Сыграть снова'
              : 'Начать игру'}
        </Button>

        <p className={styles.timer} aria-live="polite">
          Осталось: {timeLeft} с
        </p>

        <div
          ref={gameAreaRef}
          className={styles.gameArea}
          aria-label="Игровое поле"
        >
          {running && targetPos && (
            <button
              type="button"
              className={styles.target}
              style={{
                left: targetPos.x,
                top: targetPos.y,
                width: TARGET_SIZE,
                height: TARGET_SIZE,
              }}
              onClick={onTargetClick}
              aria-label="Мишень"
            />
          )}
        </div>

        {showResults && (
          <div className={styles.results}>
            <h2 className={styles.resultsTitle}>Результаты</h2>
            {sessionResults.length === 0 ? (
              <p className={styles.emptyHint}>
                За раунд не было попаданий — попробуйте ещё раз.
              </p>
            ) : (
              <>
                <p className={styles.summary}>
                  Попаданий: {sessionResults.length}. Среднее время реакции:{' '}
                  {Math.round(
                    sessionResults.reduce((a, b) => a + b, 0) /
                      sessionResults.length
                  )}{' '}
                  мс
                </p>
                <div className={styles.chartWrap}>
                  <ReactionChartSvg data={sessionResults} />
                </div>
                <p className={styles.axisHint}>
                  Ось X — номер попытки, ось Y — время реакции (мс)
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
