import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { PageHeader, Button } from '@/components/UI';
import styles from './WheelOfFortune.module.scss';

type WheelEntry = {
  label: string;
  value: number;
  question: string;
  color: string;
};

const WHEEL_DATA: WheelEntry[] = [
  {
    label: '−100',
    value: 1,
    question: 'Минус 100 очков. Повезёт в следующий раз!',
    color: '#e63946',
  },
  {
    label: '+200',
    value: 2,
    question: 'Поздравляем! +200 очков на счёт.',
    color: '#2a9d8f',
  },
  {
    label: 'Пусто',
    value: 3,
    question: 'Сектор «Пусто». Крутите ещё раз.',
    color: '#457b9d',
  },
  {
    label: '+500',
    value: 4,
    question: 'Джекпот: +500 очков!',
    color: '#e9c46a',
  },
  {
    label: 'Бонус',
    value: 5,
    question: 'Бонусный раунд — удвоение следующего выигрыша.',
    color: '#9b5de5',
  },
];

const N = WHEEL_DATA.length;
const SLICE = 360 / N;
const FULL_TURNS = 5;

function conicGradient(): string {
  const stops = WHEEL_DATA.map((seg, i) => {
    const start = i * SLICE;
    const end = (i + 1) * SLICE;
    return `${seg.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}

function nextRotation(currentDeg: number, winIndex: number): number {
  const phi = ((winIndex + 0.5) * SLICE) % 360;
  const targetRem = (360 - phi) % 360;
  const currentRem = ((currentDeg % 360) + 360) % 360;
  const align = (targetRem - currentRem + 360) % 360;
  return currentDeg + FULL_TURNS * 360 + align;
}

/** Угол подписи как в D3 pie + CodePen: rotate((mid − 90°)) */
function labelRotateDeg(i: number, n: number): number {
  const mid = ((i + 0.5) * 2 * Math.PI) / n;
  return (mid * 180) / Math.PI - 90;
}

export const WheelOfFortune: FC = () => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const [question, setQuestion] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const el = wheelRef.current;
    return () => {
      if (el) gsap.killTweensOf(el);
    };
  }, []);

  const spin = useCallback(() => {
    if (isSpinning) return;

    const el = wheelRef.current;
    if (!el) return;

    const winIndex = Math.floor(Math.random() * N);
    const from = rotationRef.current;
    const to = nextRotation(from, winIndex);

    setIsSpinning(true);
    setQuestion('');

    gsap.fromTo(
      el,
      { rotation: from },
      {
        rotation: to,
        duration: 4.2,
        ease: 'power3.out',
        onComplete: () => {
          rotationRef.current = to;
          setQuestion(WHEEL_DATA[winIndex].question);
          setIsSpinning(false);
        },
      }
    );
  }, [isSpinning]);

  const spinDisabled = isSpinning;

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Колесо фортуны"
        link="https://codepen.io/sumeshkp18/pen/VGBPYg"
      />

      <div className={styles.row}>
        <div className={styles.chart}>
          <div className={styles.stage}>
            <div className={styles.pointer} aria-hidden />
            <div
              ref={wheelRef}
              className={styles.wheel}
              style={{ background: conicGradient() }}
            >
              {WHEEL_DATA.map((seg, i) => (
                <div
                  key={seg.label + String(i)}
                  className={styles.segmentLabel}
                >
                  <div
                    className={styles.segmentArm}
                    style={{
                      transform: `rotate(${labelRotateDeg(i, N)}deg)`,
                    }}
                  >
                    <span className={styles.segmentText}>{seg.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.hub} aria-hidden />
          </div>

          <Button
            type="button"
            variant="primary"
            size="large"
            disabled={spinDisabled}
            onClick={spin}
            className={styles.spinBtn}
          >
            {isSpinning ? 'Крутится…' : 'Крутить'}
          </Button>
        </div>

        <div className={styles.question}>
          <h1 className={styles.questionTitle}>{question}</h1>
        </div>
      </div>
    </div>
  );
};
