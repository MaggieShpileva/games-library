import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { PageHeader } from '@/components/UI';
import styles from './Coloron.module.scss';

const COLORS = ['#FF4571', '#FFD145', '#8260F6'] as const;
const COLOR_NAMES = ['red', 'yellow', 'purple'] as const;
const EFFECTS = ['bubble', 'triangle', 'block'] as const;
const STICK_WIDTH_PX = 180;
const BASE_TIME = 1.6;
const DESIGN_WIDTH = 1200;
const DESIGN_HEIGHT = 800;
const BALL_DROP_PX = 250;

type ColorName = (typeof COLOR_NAMES)[number];
type EffectType = (typeof EFFECTS)[number];

const getColorName = (colorIndex: number): ColorName =>
  COLOR_NAMES[colorIndex] ?? 'red';

const getRandomColorIndex = (prev: number): number => {
  let next = Math.floor(Math.random() * 3);
  while (next === prev) next = Math.floor(Math.random() * 3);
  return next;
};

const getRandomEffect = (prev: EffectType | null): EffectType => {
  let next = EFFECTS[Math.floor(Math.random() * 3)];
  while (next === prev) next = EFFECTS[Math.floor(Math.random() * 3)];
  return next;
};

type StickState = {
  id: number;
  colorIndex: number;
  effect: EffectType | null;
};

const createStick = (id: number): StickState => ({
  id,
  colorIndex: -1,
  effect: null,
});

const speedUpScale = (score: number): number => {
  if (score > 30) return 1.8;
  if (score > 20) return 1.7;
  if (score > 15) return 1.5;
  if (score > 12) return 1.4;
  if (score > 10) return 1.3;
  if (score > 8) return 1.2;
  if (score > 5) return 1.1;
  return 1;
};

const getGrade = (score: number): string => {
  if (score > 30) return 'Chuck Norris?';
  if (score > 25) return "You're da man";
  if (score > 20) return 'Awesome';
  if (score > 15) return 'Great!';
  if (score > 13) return 'Nice!';
  if (score > 10) return 'Good Job!';
  if (score > 5) return 'Really?';
  return 'Poor...';
};

let stickIdCounter = 0;

export const Coloron = () => {
  const [phase, setPhase] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [sticks, setSticks] = useState<StickState[]>([]);
  const [, setBallColorIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [, setSteps] = useState(0);
  const [containerSize, setContainerSize] = useState({
    w: DESIGN_WIDTH,
    h: DESIGN_HEIGHT,
  });
  const prevBallColorRef = useRef<number>(0);
  const prevEffectRef = useRef<EffectType | null>(null);

  const gameViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const sticksRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const topWaveRef = useRef<HTMLDivElement>(null);
  const wave1Ref = useRef<HTMLDivElement>(null);
  const wave2Ref = useRef<HTMLDivElement>(null);
  const wave3Ref = useRef<HTMLDivElement>(null);
  const wave4Ref = useRef<HTMLDivElement>(null);
  const mount1Ref = useRef<HTMLDivElement>(null);
  const mount2Ref = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);
  const sceneTweensRef = useRef<gsap.core.Tween[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const ballTweenRef = useRef<gsap.core.Timeline | null>(null);
  const scoreRef = useRef(0);
  const isRunningRef = useRef(false);
  const sticksStateRef = useRef<StickState[]>([]);
  const ballColorIndexRef = useRef(0);
  const pendingStickAnimationRef = useRef<{
    id: number;
    effect: EffectType | null;
  } | null>(null);
  const stickEffectTweensRef = useRef<gsap.core.Tween[]>([]);

  const screenWidth = useRef(1200);
  const screenHeight = useRef(800);

  const calculateScale = useCallback(() => {
    const el = gameViewportRef.current;
    const w = el ? el.clientWidth : window.innerWidth;
    const h = el ? el.clientHeight : window.innerHeight;
    screenWidth.current = w;
    screenHeight.current = h;
    const s = w > h ? h / DESIGN_HEIGHT : w / DESIGN_WIDTH;
    const st = w / (STICK_WIDTH_PX * s);
    setScale(s);
    setSteps(st);
    setContainerSize({ w: w / s, h: h / s });
    return { scale: s, steps: st };
  }, []);

  const intro = useCallback(() => {
    gsap.killTweensOf('*');
    stickEffectTweensRef.current.forEach((t) => t.kill());
    stickEffectTweensRef.current = [];
    pendingStickAnimationRef.current = null;
    setPhase('start');
    setSticks([]);
    setScore(0);
    scoreRef.current = 0;
    isRunningRef.current = false;
  }, []);

  const rearrange = useCallback(() => {
    const sc = scoreRef.current;
    const scaleUp = speedUpScale(sc);
    timelineRef.current?.timeScale(scaleUp);
    ballTweenRef.current?.timeScale(scaleUp);
    setSticks((prev) => {
      const next = [...prev.slice(1), createStick(++stickIdCounter)];
      sticksStateRef.current = next;
      return next;
    });
  }, []);

  const checkColor = useCallback(() => {
    const ball = ballRef.current;
    const sticksEl = sticksRef.current;
    if (!ball || !sticksEl) return;
    const ballRect = ball.getBoundingClientRect();
    const ballCenterX = ballRect.left + ballRect.width / 2;
    const stickEls = sticksEl.querySelectorAll(`.${styles.stick}`);
    const currentSticks = sticksStateRef.current;
    const ballColor = ballColorIndexRef.current;
    for (let i = 0; i < stickEls.length; i++) {
      const stick = stickEls[i] as HTMLElement;
      const rect = stick.getBoundingClientRect();
      // Используем фактические границы стика (с учётом scale), а не константу 90px
      if (rect.left < ballCenterX && rect.right > ballCenterX) {
        const stickColorIndex = currentSticks[i]?.colorIndex ?? -1;
        if (stickColorIndex === ballColor) {
          const newScore = scoreRef.current + 1;
          scoreRef.current = newScore;
          setScore(newScore);
          const scoreEl = sceneRef.current?.querySelector(`.${styles.score}`);
          if (scoreEl) {
            gsap.fromTo(
              scoreEl,
              { scale: 1.5 },
              { scale: 1, duration: 0.5, ease: 'elastic.out(1.5, 0.5)' }
            );
          }
        } else {
          isRunningRef.current = false;
          setFinalScore(scoreRef.current);
          setPhase('gameOver');
          timelineRef.current?.kill();
          ballTweenRef.current?.kill();
          gsap.killTweensOf(ballRef.current);
        }
        return;
      }
    }
  }, []);

  const bounce = useCallback(() => {
    const ball = ballRef.current;
    if (!ball || !isRunningRef.current) return;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    const time = BASE_TIME / 2;

    tl.to(ball, {
      y: `+=${BALL_DROP_PX}`,
      transformOrigin: 'bottom',
      duration: time,
      ease: 'power2.in',
      onComplete: checkColor,
    }).to(ball, {
      y: `-=${BALL_DROP_PX}`,
      transformOrigin: 'bottom',
      duration: time,
      ease: 'power2.out',
      onStart: () => {
        const prev = prevBallColorRef.current;
        const next = getRandomColorIndex(prev);
        prevBallColorRef.current = next;
        ballColorIndexRef.current = next;
        setBallColorIndex(next);
        gsap.to(ball, { backgroundColor: COLORS[next], duration: 0.5 });
        ball.className = `${styles.ball} ${styles[getColorName(next)]}`;
      },
    });
    ballTweenRef.current = tl;
    return tl;
  }, [checkColor]);

  const startGame = useCallback(() => {
    gsap.killTweensOf('*');
    const { scale: s, steps: st } = calculateScale();
    const count = Math.ceil(st) + 2;
    const initialSticks: StickState[] = [];
    for (let i = 0; i < count; i++) {
      initialSticks.push(createStick(++stickIdCounter));
    }
    setSticks(initialSticks);
    sticksStateRef.current = initialSticks;
    setScore(0);
    setFinalScore(0);
    setPhase('playing');
    scoreRef.current = 0;
    isRunningRef.current = true;
    prevBallColorRef.current = 0;
    ballColorIndexRef.current = 0;
    setBallColorIndex(0);

    requestAnimationFrame(() => {
      const sticksEl = sticksRef.current;
      const ballHolder = sceneRef.current?.querySelector(
        `.${styles.ballHolder}`
      ) as HTMLElement;
      const scene = sceneRef.current;
      if (!sticksEl || !ballHolder || !scene) return;

      const scoreEl = scene.querySelector(`.${styles.score}`) as HTMLElement;
      if (scoreEl) scoreEl.textContent = '0';

      const ball = document.createElement('div');
      ball.className = `${styles.ball} ${styles.red}`;
      ball.style.backgroundColor = COLORS[0];
      ballRef.current = ball;
      ballHolder.innerHTML = '';
      ballHolder.appendChild(ball);

      const learnEl = scene.querySelector(
        `.${styles.learnToPlay}`
      ) as HTMLElement;

      if (learnEl) {
        gsap.fromTo(
          learnEl,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: 'elastic.out(1.25, 0.5)',
          }
        );
        gsap.to(learnEl, {
          scale: 0,
          opacity: 0,
          duration: 1,
          ease: 'elastic.out(1.25, 0.5)',
          delay: 3,
        });
      }

      const screenPx = screenWidth.current / s;
      gsap.set(ball, { scale: 1, opacity: 0, x: screenPx / 2 });
      gsap.to(ball, {
        scale: 1,
        opacity: 1,
        duration: 1.2,
        delay: BASE_TIME * (st - 7.5),
        ease: 'none',
        onComplete: () => {
          setTimeout(() => {
            ballTweenRef.current?.play();
          }, 400);
        },
      });

      const moveTl = gsap.timeline();
      moveTl.fromTo(
        sticksEl,
        { x: screenPx },
        { x: 0, duration: BASE_TIME * st, ease: 'none' }
      );
      moveTl.to(sticksEl, {
        x: '-=180',
        duration: BASE_TIME,
        ease: 'none',
        repeat: -1,
        onRepeat: rearrange,
      });
      timelineRef.current = moveTl;
      bounce();
    });
  }, [calculateScale, rearrange, bounce]);

  const handleStickClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (phase !== 'playing') return;
      const id = Number(e.currentTarget.getAttribute('data-stick-id'));
      if (Number.isNaN(id)) return;
      const stick = sticksStateRef.current.find((s) => s.id === id);
      if (!stick) return;
      const nextIndex =
        stick.colorIndex === -1 ? 0 : (stick.colorIndex + 1) % 3;
      const effect =
        stick.colorIndex === -1
          ? getRandomEffect(prevEffectRef.current)
          : stick.effect;
      if (stick.colorIndex === -1) {
        prevEffectRef.current = effect ?? null;
        pendingStickAnimationRef.current = { id, effect };
      }
      setSticks((prev) => {
        const next = prev.map((s) =>
          s.id === id
            ? { ...s, colorIndex: nextIndex, effect: effect ?? null }
            : s
        );
        sticksStateRef.current = next;
        return next;
      });
    },
    [phase]
  );

  const playStickEffect = useCallback((el: HTMLElement, effect: EffectType) => {
    const bubbleClass = styles.bubble;
    const triangleClass = styles.triangle;
    const blockClass = styles.block;
    const innerClass = styles.inner;
    const inner2Class = styles.inner2;

    if (effect === 'bubble') {
      const bubbles = el.querySelectorAll<HTMLElement>(`.${bubbleClass}`);
      stickEffectTweensRef.current.push(
        gsap.fromTo(
          bubbles,
          { scale: 0.1 },
          { scale: 1, duration: 0.3, stagger: 0.03 }
        ) as gsap.core.Tween
      );
      stickEffectTweensRef.current.push(
        gsap.to(bubbles, {
          y: '-=60',
          duration: 0.5,
          yoyo: true,
          repeat: -1,
          stagger: 0.03,
        }) as gsap.core.Tween
      );
    } else if (effect === 'triangle') {
      const triangles = el.querySelectorAll<HTMLElement>(`.${triangleClass}`);
      stickEffectTweensRef.current.push(
        gsap.fromTo(
          triangles,
          { scale: 0.1 },
          { scale: 1, duration: 0.3, stagger: 0.03 }
        ) as gsap.core.Tween
      );
      stickEffectTweensRef.current.push(
        gsap.to(triangles, {
          duration: 1.5,
          stagger: 0.1,
          repeat: -1,
          repeatDelay: 0.1,
          rotationY: (i) => (i % 2 === 0 ? 360 : 0),
          rotationX: (i) => (i % 2 === 0 ? 0 : 360),
        }) as gsap.core.Tween
      );
    } else if (effect === 'block') {
      const blocks = el.querySelectorAll<HTMLElement>(`.${blockClass}`);
      stickEffectTweensRef.current.push(
        gsap.fromTo(
          blocks,
          { scale: 0.1 },
          { scale: 1, duration: 0.3, stagger: 0.03 }
        ) as gsap.core.Tween
      );
      const inners = el.querySelectorAll<HTMLElement>(
        `.${innerClass}:not(.${inner2Class})`
      );
      const inner2s = el.querySelectorAll<HTMLElement>(`.${inner2Class}`);
      stickEffectTweensRef.current.push(
        gsap.to(inners, {
          x: (i) => (i % 2 === 0 ? '200%' : '-200%'),
          duration: 1,
          stagger: 0.1,
          repeat: -1,
          repeatDelay: 0.6,
        }) as gsap.core.Tween
      );
      stickEffectTweensRef.current.push(
        gsap.to(inner2s, {
          x: (i) => (i % 2 === 0 ? '-200%' : '200%'),
          duration: 1,
          stagger: 0.1,
          repeat: -1,
          repeatDelay: 0.6,
          delay: 0.69,
        }) as gsap.core.Tween
      );
    }
  }, []);

  useEffect(() => {
    calculateScale();
  }, [calculateScale]);

  useEffect(() => {
    const pending = pendingStickAnimationRef.current;
    if (!pending || !sticksRef.current) return;
    const effectType = pending.effect;
    if (!effectType) return;
    const stickEl = sticksRef.current.querySelector<HTMLElement>(
      `[data-stick-id="${pending.id}"]`
    );
    if (stickEl) {
      playStickEffect(stickEl, effectType);
    }
    pendingStickAnimationRef.current = null;
  }, [sticks, playStickEffect]);

  useEffect(() => {
    const el = gameViewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(calculateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [calculateScale]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const tl = ballTweenRef.current;
    if (tl) tl.play();
    return () => {
      tl?.pause();
    };
  }, [phase, sticks]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const speed = 15;
    const kill = () => {
      sceneTweensRef.current.forEach((t) => t.kill());
      sceneTweensRef.current = [];
    };
    const el = (ref: React.RefObject<HTMLDivElement | null>) => ref.current;
    if (el(topWaveRef)) {
      sceneTweensRef.current.push(
        gsap.to(topWaveRef.current, {
          backgroundPositionX: '-=54px',
          duration: (speed * 1.7) / 42,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    if (el(wave1Ref)) {
      sceneTweensRef.current.push(
        gsap.to(wave1Ref.current, {
          backgroundPositionX: '-=54px',
          duration: (speed * 1.9) / 42,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    if (el(wave2Ref)) {
      sceneTweensRef.current.push(
        gsap.to(wave2Ref.current, {
          backgroundPositionX: '-=54px',
          duration: (speed * 2) / 42,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    if (el(wave3Ref)) {
      sceneTweensRef.current.push(
        gsap.to(wave3Ref.current, {
          backgroundPositionX: '-=54px',
          duration: (speed * 2.2) / 42,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    if (el(wave4Ref)) {
      sceneTweensRef.current.push(
        gsap.to(wave4Ref.current, {
          backgroundPositionX: '-=54px',
          duration: (speed * 2.4) / 42,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    if (el(mount1Ref)) {
      sceneTweensRef.current.push(
        gsap.to(mount1Ref.current, {
          backgroundPositionX: '-=1760px',
          duration: speed * 8,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    if (el(mount2Ref)) {
      sceneTweensRef.current.push(
        gsap.to(mount2Ref.current, {
          backgroundPositionX: '-=1782px',
          duration: speed * 10,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    if (el(cloudsRef)) {
      sceneTweensRef.current.push(
        gsap.to(cloudsRef.current, {
          backgroundPositionX: '-=1001px',
          duration: speed * 3,
          repeat: -1,
          ease: 'none',
        })
      );
    }
    return kill;
  }, [phase]);

  return (
    <div className={styles.wrapper}>
      <PageHeader title="Coloron" link="https://codepen.io/gregh/pen/yVLOyO" />
      <div ref={gameViewportRef} className={styles.gameViewport}>
        <div
          ref={containerRef}
          className={styles.container}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'left top',
            width: containerSize.w,
            height: containerSize.h,
          }}
        >
          {/* Start */}
          <div
            className={styles.startGame}
            style={{ display: phase === 'start' ? 'flex' : 'none' }}
          >
            <div className={styles.logoHolder}>
              <p className={styles.logo}>
                {'Coloron'.split('').map((char, i) => (
                  <span key={i}>{char}</span>
                ))}
              </p>
              <button
                type="button"
                className={styles.playButton}
                onClick={startGame}
              >
                Play
              </button>
              <h4 className={styles.hint}>
                hint: <span className={styles.hintRed}>red</span> color always
                comes first
              </h4>
            </div>
            <div className={styles.howToPlay}>
              <div className={styles.section}>
                <h4>Bouncing ball changes color</h4>
                <div className={styles.demoContent}>
                  <div className={`${styles.ballDemo} ${styles.ballDemo1}`} />
                </div>
              </div>
              <div className={styles.section}>
                <h4>
                  Tap on the bar to switch the colors (Red, Yellow, Purple)
                </h4>
                <div className={styles.demoContent}>
                  <div className={`${styles.bar} ${styles.bar1}`} />
                  <div className={`${styles.bar} ${styles.bar2}`} />
                  <div className={`${styles.bar} ${styles.bar3}`} />
                </div>
              </div>
              <div className={styles.section}>
                <h4>Always match the ball and bar colors</h4>
                <div className={styles.demoContent}>
                  <div
                    className={`${styles.ballDemo} ${styles.ballDemoPurple}`}
                  />
                  <div className={`${styles.bar} ${styles.barPurple}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Game Over */}
          <div
            className={styles.stopGame}
            style={{ display: phase === 'gameOver' ? 'flex' : 'none' }}
          >
            <div className={styles.scoreContainer}>
              <h1>Coloron</h1>
              <div className={styles.finalScore}>{finalScore}!</div>
              <div className={styles.result}>{getGrade(finalScore)}</div>
              <div className={styles.gameOverActions}>
                <button
                  type="button"
                  className={styles.playAgain}
                  onClick={startGame}
                >
                  Play Again
                </button>
                <button
                  type="button"
                  className={styles.mainMenu}
                  onClick={intro}
                >
                  Menu
                </button>
              </div>
            </div>
          </div>

          {/* Background */}
          <div className={styles.glow}>
            <div className={styles.sun} />
          </div>
          <div className={styles.waves}>
            <div ref={topWaveRef} className={styles.topWave} />
            <div ref={wave1Ref} className={styles.wave1} />
            <div ref={wave2Ref} className={styles.wave2} />
            <div ref={wave3Ref} className={styles.wave3} />
            <div ref={wave4Ref} className={styles.wave4} />
          </div>
          <div className={styles.mounts}>
            <div ref={mount1Ref} className={styles.mount1} />
            <div ref={mount2Ref} className={styles.mount2} />
          </div>
          <div ref={cloudsRef} className={styles.clouds} />

          {/* Game scene */}
          <div
            ref={sceneRef}
            className={styles.scene}
            style={{ display: phase === 'playing' ? 'flex' : 'none' }}
          >
            <div className={styles.learnToPlay}>
              Click on the bars to change the color!
            </div>
            <div className={styles.score}>{score}</div>
            <div className={styles.ballHolder} />
            <div
              ref={sticksRef}
              className={styles.sticks}
              style={{
                width: (containerSize.w + 3 * STICK_WIDTH_PX) | 0,
              }}
            >
              {sticks.map((stick) => (
                <div
                  key={stick.id}
                  data-stick-id={stick.id}
                  role="button"
                  tabIndex={0}
                  className={`${styles.stick} ${
                    stick.colorIndex === -1
                      ? styles.inactive
                      : styles[getColorName(stick.colorIndex)]
                  } ${stick.effect ? styles[`${stick.effect}Stick`] : ''}`}
                  onClick={handleStickClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStickClick({
                        currentTarget: e.currentTarget,
                      } as React.MouseEvent<HTMLDivElement>);
                    }
                  }}
                >
                  {stick.effect &&
                    Array.from({ length: 14 }, (_, i) => {
                      const num = i + 1;
                      const effectNumClass = (styles as Record<string, string>)[
                        `${stick.effect}-${num}`
                      ];
                      return (
                        <div
                          key={i}
                          className={`${styles[stick.effect!]} ${effectNumClass ?? ''}`}
                        >
                          {stick.effect === 'block' && (
                            <>
                              <div className={styles.inner} />
                              <div
                                className={`${styles.inner} ${styles.inner2}`}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
