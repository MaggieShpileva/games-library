import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { PageHeader } from '@/components/UI';
import styles from './Quiz.module.scss';
import {
  CATEGORY_LABELS,
  type QuizCategory,
  type QuizQuestion,
} from './quizBank';
import { buildMultiRound, buildStandard, clamp } from './quizUtils';

const LS_THEME = 'uq-theme';
const LS_SFX = 'uq-sfx';
const LS_MUSIC = 'uq-music';
const LS_BOARD = 'uq-board';

const BGM_SRC =
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_d65267f53f.mp3?filename=chill-ambient-110997.mp3';

type Theme = 'dark' | 'light';
type Phase = 'setup' | 'quiz' | 'result';
type GameMode = 'standard' | 'multiround';

type AnswerRecord = {
  q: string;
  opts: string[];
  chosen: number;
  correctIdx: number;
  exp: string;
  diff: string;
  skipped?: boolean;
};

type BoardRow = {
  name: string;
  score: number;
  correct: number;
  total: number;
  acc: number;
  date: string;
  streak: number;
};

function useConfetti(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const launch = useCallback(
    (duration = 1200, count = 120) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      type Piece = {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        rot: number;
        vr: number;
      };

      const pieces: Piece[] = [...Array(count)].map(() => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
      }));

      runningRef.current = true;
      let last = performance.now();

      const tick = (t: number) => {
        const dt = (t - last) / 16;
        last = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.y > canvas.height + 20) p.y = -10;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `hsl(${((p.x + p.y) % 360).toFixed(0)} 90% 60%)`;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });
        if (runningRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
      window.setTimeout(() => {
        runningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }, duration);
    },
    [canvasRef]
  );

  return launch;
}

export const Quiz = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const selectedRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const remainingRef = useRef(0);
  const launchConfetti = useConfetti(canvasRef);
  const [leaderboardRev, setLeaderboardRev] = useState(0);

  const [theme, setTheme] = useState<Theme>(() => {
    const s = localStorage.getItem(LS_THEME);
    return s === 'light' ? 'light' : 'dark';
  });
  const [sfxOn, setSfxOn] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_SFX) ?? 'true');
    } catch {
      return true;
    }
  });
  const [musicOn, setMusicOn] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_MUSIC) ?? 'false');
    } catch {
      return false;
    }
  });

  const [phase, setPhase] = useState<Phase>('setup');
  const [category, setCategory] = useState<QuizCategory>('web');
  const [mode, setMode] = useState<GameMode>('multiround');
  const [difficulty, setDifficulty] = useState<
    'easy' | 'medium' | 'hard' | 'mixed'
  >('mixed');
  const [questionCount, setQuestionCount] = useState(12);
  const [playerName, setPlayerName] = useState('');
  const [timerPerQ, setTimerPerQ] = useState(25);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [used, setUsed] = useState({
    fifty: false,
    hint: false,
    skip: false,
  });
  const [timeUsed, setTimeUsed] = useState(0);
  const [answered, setAnswered] = useState<AnswerRecord[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('multiround');
  const [submitted, setSubmitted] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [hintVisible, setHintVisible] = useState(false);
  const [timerLabel, setTimerLabel] = useState('25s');
  const [reviewOpen, setReviewOpen] = useState(false);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const correctRef = useRef(0);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  useEffect(() => {
    correctRef.current = correct;
  }, [correct]);

  const q = questions[current];
  const totalRounds = gameMode === 'multiround' ? 3 : 1;
  const roundSize =
    questions.length > 0
      ? Math.floor(questions.length / totalRounds) || questions.length
      : 1;
  const currentRound =
    gameMode === 'multiround'
      ? Math.min(1 + Math.floor(current / roundSize), totalRounds)
      : 1;

  const progressPct =
    questions.length > 0 ? (current / questions.length) * 100 : 0;

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  const beep = useCallback(
    (freq = 800, time = 0.08, type: OscillatorType = 'sine', gain = 0.05) => {
      if (!sfxOn) return;
      try {
        const ctx = getAudioCtx();
        void ctx.resume();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = gain;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        window.setTimeout(() => o.stop(), time * 1000);
      } catch {
        /* ignore */
      }
    },
    [sfxOn]
  );

  useEffect(() => {
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LS_SFX, JSON.stringify(sfxOn));
  }, [sfxOn]);

  useEffect(() => {
    localStorage.setItem(LS_MUSIC, JSON.stringify(musicOn));
    const el = bgmRef.current;
    if (!el) return;
    if (musicOn) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [musicOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const clearTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const applyAnswer = useCallback(
    (chosen: number) => {
      if (!q || submittedRef.current) return;
      submittedRef.current = true;
      clearTimer();
      if (chosen === q.c) {
        const bonus = timerPerQ > 0 && remainingRef.current >= 10 ? 2 : 0;
        setScore((s) => s + 10 + bonus);
        setCorrect((c) => c + 1);
        setStreak((st) => {
          const next = st + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        beep(880, 0.06, 'triangle', 0.07);
      } else {
        setStreak(0);
        beep(200, 0.09, 'square', 0.06);
      }

      setAnswered((prev) => [
        ...prev,
        {
          q: q.q,
          opts: q.a,
          chosen,
          correctIdx: q.c,
          exp: q.e,
          diff: q.d,
        },
      ]);
      setSubmitted(true);
    },
    [q, timerPerQ, beep]
  );

  const applyAnswerRef = useRef(applyAnswer);

  useEffect(() => {
    applyAnswerRef.current = applyAnswer;
  }, [applyAnswer]);

  useEffect(() => {
    if (phase !== 'quiz' || submitted || !q) return;

    const perQ = timerPerQ;
    if (perQ <= 0) {
      queueMicrotask(() => {
        setTimerLabel('∞');
      });
      remainingRef.current = 0;
      return;
    }

    let rem = perQ;
    remainingRef.current = rem;
    queueMicrotask(() => {
      setTimerLabel(`${rem}s`);
    });

    clearTimer();
    timerIntervalRef.current = setInterval(() => {
      rem -= 1;
      remainingRef.current = rem;
      setTimeUsed((t) => t + 1);
      if (rem <= 0) {
        clearTimer();
        setTimerLabel('0s');
        remainingRef.current = 0;
        const sel = selectedRef.current;
        const chosen = sel === null ? -1 : sel;
        if (!submittedRef.current) {
          applyAnswerRef.current(chosen);
        }
      } else {
        setTimerLabel(`${rem}s`);
      }
    }, 1000);

    return () => clearTimer();
  }, [phase, current, submitted, timerPerQ, q]);

  const startQuiz = () => {
    const count = clamp(questionCount, 6, 24);
    const items =
      mode === 'multiround'
        ? buildMultiRound(category, count)
        : buildStandard(category, difficulty, shuffleQuestions, count);
    setQuestions(items);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setUsed({ fifty: false, hint: false, skip: false });
    setTimeUsed(0);
    setAnswered([]);
    setGameMode(mode);
    setSubmitted(false);
    setHiddenOptions([]);
    setHintVisible(false);
    setReviewOpen(false);
    submittedRef.current = false;
    setPhase('quiz');
  };

  const finishQuiz = useCallback(() => {
    clearTimer();
    setPhase('result');
    const n = questions.length;
    const acc = n > 0 ? Math.round((correctRef.current / n) * 100) : 0;
    if (acc >= 80) {
      launchConfetti(1800, 160);
    }
  }, [launchConfetti, questions.length]);

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      submittedRef.current = false;
      setSubmitted(false);
      setHiddenOptions([]);
      setHintVisible(false);
    } else {
      finishQuiz();
    }
  };

  const handleSubmit = () => {
    if (submitted || !q) return;
    if (selected === null) {
      window.alert('Выберите вариант или используйте «Пропуск».');
      return;
    }
    applyAnswer(selected);
  };

  const handleNextClick = () => {
    if (!submitted) return;
    goNext();
  };

  const handleFifty = () => {
    if (submitted || used.fifty || !q) return;
    setUsed((u) => ({ ...u, fifty: true }));
    const wrong = [0, 1, 2, 3].filter((i) => i !== q.c);
    const shuffled = [...wrong].sort(() => Math.random() - 0.5);
    setHiddenOptions(shuffled.slice(0, 2));
    beep(600, 0.05, 'sine', 0.05);
  };

  const handleHint = () => {
    if (submitted || used.hint || !q) return;
    setUsed((u) => ({ ...u, hint: true }));
    setHintVisible(true);
    beep(700, 0.05, 'sine', 0.05);
  };

  const handleSkip = () => {
    if (submitted || used.skip || !q) return;
    setUsed((u) => ({ ...u, skip: true }));
    clearTimer();
    setAnswered((prev) => [
      ...prev,
      {
        q: q.q,
        opts: q.a,
        chosen: -1,
        correctIdx: q.c,
        exp: q.e,
        diff: q.d,
        skipped: true,
      },
    ]);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      submittedRef.current = false;
      setSubmitted(false);
      setHiddenOptions([]);
      setHintVisible(false);
    } else {
      finishQuiz();
    }
  };

  const keyHandlersRef = useRef({
    handleSubmit: () => {},
    handleNextClick: () => {},
    handleFifty: () => {},
    handleHint: () => {},
    handleSkip: () => {},
  });

  useEffect(() => {
    keyHandlersRef.current = {
      handleSubmit,
      handleNextClick,
      handleFifty,
      handleHint,
      handleSkip,
    };
  });

  useEffect(() => {
    if (phase !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      const h = keyHandlersRef.current;
      if (submittedRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          h.handleNextClick();
        }
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        setSelected(idx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        h.handleSubmit();
      } else if (e.key.toLowerCase() === 'f') {
        h.handleFifty();
      } else if (e.key.toLowerCase() === 'h') {
        h.handleHint();
      } else if (e.key.toLowerCase() === 'k') {
        h.handleSkip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const leaderboard = useMemo((): BoardRow[] => {
    void leaderboardRev;
    try {
      return JSON.parse(localStorage.getItem(LS_BOARD) ?? '[]') as BoardRow[];
    } catch {
      return [];
    }
  }, [leaderboardRev]);

  const saveLeaderboard = () => {
    const list: BoardRow[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(LS_BOARD) ?? '[]') as BoardRow[];
      } catch {
        return [];
      }
    })();
    const n = questions.length;
    const acc = n > 0 ? Math.round((correct / n) * 100) : 0;
    list.push({
      name: (playerName || 'Игрок').trim(),
      score,
      correct,
      total: n,
      acc,
      date: new Date().toISOString(),
      streak: bestStreak,
    });
    list.sort((a, b) => b.score - a.score || b.acc - a.acc);
    localStorage.setItem(LS_BOARD, JSON.stringify(list.slice(0, 20)));
    setLeaderboardRev((v) => v + 1);
    beep(900, 0.06, 'triangle', 0.06);
  };

  const resetStorage = () => {
    localStorage.removeItem(LS_BOARD);
    window.location.reload();
  };

  const accuracyPct =
    questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

  const finalTitle =
    accuracyPct >= 80
      ? '🔥 Превосходно!'
      : accuracyPct >= 60
        ? '👏 Отличная работа!'
        : accuracyPct >= 40
          ? '👍 Продолжай тренироваться!'
          : '💪 Не сдавайся!';

  const badges = useMemo(() => {
    const list: string[] = [];
    if (bestStreak >= 3) list.push('🔥 Серия (3+)');
    if (accuracyPct >= 90) list.push('🎯 Снайпер (90%+)');
    if (
      questions.length > 0 &&
      timeUsed <= questions.length * Math.max(5, Math.floor(timerPerQ * 0.5))
    ) {
      list.push('⚡ Скорость');
    }
    if (!used.fifty && !used.hint && !used.skip) {
      list.push('🧠 Без подсказок');
    }
    return list;
  }, [bestStreak, accuracyPct, questions.length, timeUsed, timerPerQ, used]);

  return (
    <div
      className={styles.wrapper}
      data-theme={theme === 'light' ? 'light' : 'dark'}
    >
      <canvas ref={canvasRef} className={styles.confetti} aria-hidden />
      <audio ref={bgmRef} loop preload="auto" className={styles.hiddenAudio}>
        <source src={BGM_SRC} type="audio/mpeg" />
      </audio>

      <PageHeader
        title="Система квиза"
        link="https://codepen.io/Adi-Satya/pen/yyYvPPg"
      />

      <div className={styles.page}>
        <div className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.logo} aria-hidden />
            <span>Ultimate Quiz — Pro</span>
          </div>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.btn}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Тема"
            >
              🌗 Тема
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={() => {
                setSfxOn((v: boolean) => !v);
                beep(700, 0.05, 'triangle', 0.07);
              }}
              aria-label="Звуки"
            >
              {sfxOn ? '🔊 Звук' : '🔇 Звук'}
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={() => setMusicOn((v: boolean) => !v)}
              aria-label="Музыка"
            >
              {musicOn ? '🎵 Музыка вкл' : '🎵 Музыка выкл'}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={resetStorage}
            >
              Сброс
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.leftCol}>
            {phase === 'setup' && (
              <section
                className={`${styles.card} ${styles.setup}`}
                aria-label="Настройки"
              >
                <h2 className={styles.cardTitle}>Настройки</h2>
                <div className={styles.row}>
                  <div>
                    <label className={styles.label}>Категория</label>
                    <select
                      className={styles.select}
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as QuizCategory)
                      }
                    >
                      {(Object.keys(CATEGORY_LABELS) as QuizCategory[]).map(
                        (k) => (
                          <option key={k} value={k}>
                            {CATEGORY_LABELS[k]}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className={styles.label}>Режим</label>
                    <select
                      className={styles.select}
                      value={mode}
                      onChange={(e) => setMode(e.target.value as GameMode)}
                    >
                      <option value="standard">Стандарт</option>
                      <option value="multiround">
                        Мульти-раунд (лёгкий → сложный)
                      </option>
                    </select>
                  </div>
                </div>
                <div className={styles.row}>
                  <div>
                    <label className={styles.label}>
                      Сложность (стандартный режим)
                    </label>
                    <select
                      className={styles.select}
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(e.target.value as typeof difficulty)
                      }
                      disabled={mode === 'multiround'}
                    >
                      <option value="easy">Лёгкая</option>
                      <option value="medium">Средняя</option>
                      <option value="hard">Сложная</option>
                      <option value="mixed">Смешанная</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.label}>Вопросов (всего)</label>
                    <input
                      className={styles.input}
                      type="number"
                      min={6}
                      max={24}
                      value={questionCount}
                      onChange={(e) =>
                        setQuestionCount(parseInt(e.target.value, 10) || 12)
                      }
                    />
                    <div className={styles.hint}>
                      6–24 (в мульти-раунде делится по раундам)
                    </div>
                  </div>
                </div>
                <div className={styles.row}>
                  <div>
                    <label className={styles.label}>
                      Имя (таблица лидеров)
                    </label>
                    <input
                      className={styles.input}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Игрок"
                    />
                  </div>
                  <div>
                    <label className={styles.label}>Таймер на вопрос</label>
                    <select
                      className={styles.select}
                      value={timerPerQ}
                      onChange={(e) =>
                        setTimerPerQ(parseInt(e.target.value, 10))
                      }
                    >
                      <option value={0}>Без таймера</option>
                      <option value={15}>15 с</option>
                      <option value={25}>25 с</option>
                      <option value={40}>40 с</option>
                    </select>
                  </div>
                </div>
                <div className={styles.row}>
                  <div>
                    <label className={styles.label}>Перемешать вопросы</label>
                    <select
                      className={styles.select}
                      value={shuffleQuestions ? 'yes' : 'no'}
                      onChange={(e) =>
                        setShuffleQuestions(e.target.value === 'yes')
                      }
                    >
                      <option value="yes">Да</option>
                      <option value="no">Нет</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.label}>Достижения</label>
                    <div className={styles.hint}>
                      Бейджи за серии, скорость и точность
                    </div>
                  </div>
                </div>
                <div className={styles.hint}>
                  Клавиши: 1–4 — выбор, Enter — ответ / далее, F — 50:50, H —
                  подсказка, K — пропуск
                </div>
                <div className={styles.startRow}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={startQuiz}
                  >
                    Старт ▶
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => setPhase('result')}
                  >
                    Таблица лидеров 🏆
                  </button>
                </div>
              </section>
            )}

            {(phase === 'setup' || phase === 'quiz' || phase === 'result') && (
              <aside className={styles.card}>
                <h2 className={styles.cardTitle}>Статистика</h2>
                <div className={styles.statGrid}>
                  <div className={styles.stat}>
                    <div>Очки</div>
                    <div>{score}</div>
                  </div>
                  <div className={styles.stat}>
                    <div>Верно</div>
                    <div>{correct}</div>
                  </div>
                  <div className={styles.stat}>
                    <div>Серия</div>
                    <div>{streak}</div>
                  </div>
                </div>
                <h2 className={styles.cardTitle}>Как играть</h2>
                <ul className={styles.howList}>
                  <li>Выберите вариант и нажмите «Ответить».</li>
                  <li>Подсказки одноразовые.</li>
                  <li>Клавиши 1–4, Enter, стрелки навигации.</li>
                </ul>
              </aside>
            )}
          </div>

          <div className={styles.mainCol}>
            {phase === 'quiz' && q && (
              <section
                className={`${styles.card} ${styles.quiz} ${styles.fadeIn}`}
                aria-live="polite"
              >
                <div className={styles.progressWrap}>
                  <div className={styles.progress} aria-label="Прогресс">
                    <span style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className={styles.pill}>
                    {gameMode === 'multiround'
                      ? `Раунд ${currentRound}/${totalRounds}`
                      : 'Стандарт'}
                  </div>
                  <div className={styles.pill}>
                    В {current + 1}/{questions.length}
                  </div>
                  <div className={`${styles.pill} ${styles.timer}`}>
                    {timerLabel}
                  </div>
                </div>
                <div className={styles.pill}>
                  {CATEGORY_LABELS[category]} • Сложность: {q.d.toUpperCase()}
                </div>
                <div className={styles.question}>{q.q}</div>
                <div className={styles.options}>
                  {q.a.map((opt, i) => {
                    const isSel = selected === i;
                    const isCor = submitted && i === q.c;
                    const isWrong = submitted && selected === i && i !== q.c;
                    const hidden = hiddenOptions.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`${styles.option} ${isCor ? styles.optionCorrect : ''} ${isWrong ? styles.optionWrong : ''}`}
                        data-selected={isSel ? 'true' : undefined}
                        disabled={submitted}
                        style={
                          hidden
                            ? { visibility: 'hidden', pointerEvents: 'none' }
                            : undefined
                        }
                        onClick={() => !submitted && setSelected(i)}
                      >
                        <span className={styles.optionIndex}>{i + 1}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {hintVisible && q && (
                  <div className={styles.hintPill}>
                    Подсказка: {q.e || 'Подумайте ещё раз.'}
                  </div>
                )}

                <div className={styles.quizFooter}>
                  <div className={styles.lifelines}>
                    <button
                      type="button"
                      className={styles.lifeline}
                      disabled={submitted || used.fifty}
                      onClick={handleFifty}
                    >
                      50:50 (F)
                    </button>
                    <button
                      type="button"
                      className={styles.lifeline}
                      disabled={submitted || used.hint}
                      onClick={handleHint}
                    >
                      Подсказка (H)
                    </button>
                    <button
                      type="button"
                      className={styles.lifeline}
                      disabled={submitted || used.skip}
                      onClick={handleSkip}
                    >
                      Пропуск (K)
                    </button>
                  </div>
                  <div className={styles.quizActions}>
                    <button
                      type="button"
                      className={styles.btn}
                      disabled={submitted}
                      onClick={handleSubmit}
                    >
                      Ответить
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      disabled={!submitted}
                      onClick={handleNextClick}
                    >
                      Далее ▶
                    </button>
                  </div>
                </div>
              </section>
            )}

            {phase === 'result' && (
              <section
                className={`${styles.card} ${styles.result} ${styles.fadeIn}`}
              >
                <h2 className={styles.resultHeading}>Результаты</h2>
                <div className={styles.scoreBadge}>
                  <span>{finalTitle}</span>
                  <strong>
                    {correct}/{questions.length || 0} (очки {score})
                  </strong>
                </div>
                <div className={styles.badges}>
                  {badges.length > 0 ? (
                    badges.map((b) => (
                      <span key={b} className={styles.badge}>
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className={styles.hint}>
                      Пока без бейджей — попробуйте серию, точность и скорость
                    </span>
                  )}
                </div>
                <div className={styles.statGrid}>
                  <div className={styles.stat}>
                    <div>Точность</div>
                    <div>{accuracyPct}%</div>
                  </div>
                  <div className={styles.stat}>
                    <div>Лучшая серия</div>
                    <div>{bestStreak}</div>
                  </div>
                  <div className={styles.stat}>
                    <div>Время</div>
                    <div>{timeUsed} с</div>
                  </div>
                </div>
                <div className={styles.startRow}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => {
                      setPhase('setup');
                      setReviewOpen(false);
                    }}
                  >
                    Играть снова
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={saveLeaderboard}
                  >
                    Сохранить в таблицу
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => setReviewOpen((v) => !v)}
                  >
                    Разбор ответов
                  </button>
                </div>

                {reviewOpen && (
                  <div className={styles.review}>
                    {answered.map((r, idx) => {
                      const chosenLabel =
                        r.chosen >= 0 ? r.opts[r.chosen] : '(нет ответа)';
                      return (
                        <div
                          key={`${idx}-${r.q}`}
                          className={styles.reviewItem}
                        >
                          <h4>
                            Вопрос {idx + 1}. {r.q}
                          </h4>
                          <div className={styles.reviewTags}>
                            {r.opts.map((t, i) => (
                              <span
                                key={i}
                                className={styles.reviewTag}
                                data-correct={
                                  i === r.correctIdx ? 'true' : undefined
                                }
                              >
                                {String.fromCharCode(65 + i)}. {t}
                              </span>
                            ))}
                          </div>
                          <div>
                            <strong>Ваш ответ:</strong> {chosenLabel}
                            {r.skipped ? ' (пропуск)' : ''}
                          </div>
                          <div>
                            <strong>Верно:</strong> {r.opts[r.correctIdx]}
                          </div>
                          <div className={styles.reviewExp}>{r.exp}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <h2 className={styles.leaderHeading}>Таблица лидеров 🏆</h2>
                <table className={styles.table}>
                  {leaderboard.length > 0 && (
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Имя</th>
                        <th>Очки</th>
                        <th>Точность</th>
                        <th>Серия</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          Пока нет записей — сыграйте и сохраните результат
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((r, i) => (
                        <tr key={`${r.date}-${i}`}>
                          <td>{i + 1}</td>
                          <td>{r.name}</td>
                          <td>{r.score}</td>
                          <td>{r.acc}%</td>
                          <td>{r.streak}</td>
                          <td>{new Date(r.date).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
