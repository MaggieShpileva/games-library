import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/UI';
import styles from './MathGame.module.scss';

const TOTAL_PROBLEMS = 10;

const POSITIVE_FEEDBACK = [
  'Отлично!',
  'Супер!',
  'Молодец!',
  'Так держать!',
  'Гениально!',
];
const ENCOURAGEMENT = [
  'Попробуй ещё раз!',
  'Почти!',
  'Не сдавайся!',
  'У тебя получится!',
];

type LevelKey = '6' | '7' | '8';
type OpKey = 'add' | 'sub' | 'both';

type Problem = {
  num1: number;
  num2: number;
  op: '+' | '-';
  answer: number;
};

const makeProblem = (maxNumber: number, operation: OpKey): Problem => {
  let op: '+' | '-';
  if (operation === 'add') op = '+';
  else if (operation === 'sub') op = '-';
  else op = Math.random() < 0.5 ? '+' : '-';

  let num1 = Math.floor(Math.random() * maxNumber) + 1;
  let num2 = Math.floor(Math.random() * maxNumber) + 1;
  let answer: number;

  if (op === '-') {
    if (num1 < num2) [num1, num2] = [num2, num1];
    answer = num1 - num2;
  } else {
    answer = num1 + num2;
  }

  return { num1, num2, op, answer };
};

export const MathGame = () => {
  const [phase, setPhase] = useState<'setup' | 'game' | 'end'>('setup');
  const [level, setLevel] = useState<LevelKey | null>(null);
  const [operation, setOperation] = useState<OpKey | null>(null);
  const [maxNumber, setMaxNumber] = useState(9);
  const [gridWidth, setGridWidth] = useState(3);
  const [score, setScore] = useState(0);
  const [problemCount, setProblemCount] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'ok' | 'bad'>('ok');
  const [feedbackAnim, setFeedbackAnim] = useState(0);
  const [answeredCorrect, setAnsweredCorrect] = useState(false);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const populateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    voicesRef.current = window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    populateVoices();
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.onvoiceschanged = populateVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [populateVoices]);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    const voices = voicesRef.current.length
      ? voicesRef.current
      : synth.getVoices();
    const ru =
      voices.find((v) => v.lang.startsWith('ru')) ??
      voices.find((v) => v.name.includes('Google')) ??
      voices[0];
    if (ru) utterance.voice = ru;
    utterance.pitch = 1.1;
    utterance.rate = 0.95;
    synth.speak(utterance);
  }, []);

  const speakProblem = useCallback(
    (p: Problem) => {
      const opWord = p.op === '+' ? 'плюс' : 'минус';
      speak(`Сколько будет ${p.num1} ${opWord} ${p.num2}?`);
    },
    [speak]
  );

  useEffect(() => {
    if (phase !== 'game' || !currentProblem) return;
    const id = window.setTimeout(() => speakProblem(currentProblem), 500);
    return () => clearTimeout(id);
  }, [currentProblem, phase, speakProblem]);

  useEffect(() => {
    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startGame = useCallback(() => {
    if (!level || !operation) return;
    const maxN = level === '6' ? 9 : level === '7' ? 16 : 25;
    const gw = level === '6' ? 3 : level === '7' ? 4 : 5;
    setMaxNumber(maxN);
    setGridWidth(gw);
    setScore(0);
    setAnswerText('');
    setFeedback('');
    setAnsweredCorrect(false);
    setPhase('game');

    setProblemCount(1);
    setCurrentProblem(makeProblem(maxN, operation));
  }, [level, operation]);

  useEffect(() => {
    if (phase !== 'setup' || !level || !operation) return;
    startTimeoutRef.current = window.setTimeout(() => {
      startGame();
    }, 300);
    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    };
  }, [phase, level, operation, startGame]);

  const endGame = useCallback(() => {
    setPhase('end');
  }, []);

  const checkAnswer = useCallback(() => {
    if (!currentProblem || answeredCorrect) return;
    const userAnswer = parseInt(answerText, 10);
    if (Number.isNaN(userAnswer)) return;

    if (userAnswer === currentProblem.answer) {
      setScore((s) => s + 1);
      const msg =
        POSITIVE_FEEDBACK[Math.floor(Math.random() * POSITIVE_FEEDBACK.length)];
      setFeedback(msg);
      setFeedbackTone('ok');
      setFeedbackAnim((k) => k + 1);
      speak(msg);
      setAnsweredCorrect(true);
    } else {
      const msg =
        ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
      setFeedback(msg);
      setFeedbackTone('bad');
      setFeedbackAnim((k) => k + 1);
      speak(msg);
      window.setTimeout(() => setAnswerText(''), 800);
    }
  }, [answerText, answeredCorrect, currentProblem, speak]);

  const handleNext = useCallback(() => {
    setProblemCount((prev) => {
      if (prev >= TOTAL_PROBLEMS) {
        endGame();
        return prev;
      }
      const next = prev + 1;
      if (next > TOTAL_PROBLEMS) {
        endGame();
        return prev;
      }
      if (operation) {
        setCurrentProblem(makeProblem(maxNumber, operation));
      }
      setAnswerText('');
      setFeedback('');
      setAnsweredCorrect(false);
      return next;
    });
  }, [endGame, maxNumber, operation]);

  const resetGame = useCallback(() => {
    setLevel(null);
    setOperation(null);
    setPhase('setup');
    setCurrentProblem(null);
    setAnswerText('');
    setFeedback('');
    setProblemCount(0);
    setScore(0);
  }, []);

  const numpadKeys = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'C',
    '0',
    '✓',
  ] as const;

  const handleNumpad = (key: string) => {
    if (key === 'C') {
      setAnswerText('');
      return;
    }
    if (key === '✓') {
      checkAnswer();
      return;
    }
    setAnswerText((prev) => (prev.length < 3 ? prev + key : prev));
  };

  const levelRing = (k: LevelKey) =>
    level === k ? styles.ringActive : undefined;
  const opRing = (k: OpKey) =>
    operation === k ? styles.ringActive : undefined;

  const progressPct =
    phase === 'game' && problemCount > 0
      ? (problemCount / TOTAL_PROBLEMS) * 100
      : 0;

  const endTitle = score === TOTAL_PROBLEMS ? 'Потрясающе!' : 'Игра окончена!';
  let endMessage = '';
  if (score === TOTAL_PROBLEMS) {
    endMessage = 'Идеально! Ты звезда математики!';
  } else if (score >= TOTAL_PROBLEMS / 2) {
    endMessage = 'Отличная работа! Продолжай тренироваться!';
  } else {
    endMessage = 'Хорошая попытка! Практика ведёт к успеху!';
  }

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Математика (для умных)"
        link="https://codepen.io/Pavel-Rana/pen/dPoqWoW"
      />
      <div className={styles.page}>
        <div className={styles.card}>
          {phase === 'setup' && (
            <div className={styles.setupScreen}>
              <h1 className={styles.titleMain}>Математика!</h1>
              <p className={styles.lead}>Потренируемся в счёте!</p>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Выбери уровень</h2>
                <div className={styles.btnRow}>
                  <button
                    type="button"
                    className={`${styles.btnLevel} ${styles.levelEasy} ${levelRing('6') ?? ''}`}
                    onClick={() => setLevel('6')}
                  >
                    Лёгкий
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnLevel} ${styles.levelMid} ${levelRing('7') ?? ''}`}
                    onClick={() => setLevel('7')}
                  >
                    Средний
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnLevel} ${styles.levelHard} ${levelRing('8') ?? ''}`}
                    onClick={() => setLevel('8')}
                  >
                    Сложный
                  </button>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Выбери задание</h2>
                <div className={styles.btnRow}>
                  <button
                    type="button"
                    className={`${styles.btnOp} ${styles.opAdd} ${opRing('add') ?? ''}`}
                    onClick={() => setOperation('add')}
                  >
                    Сложение
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnOp} ${styles.opSub} ${opRing('sub') ?? ''}`}
                    onClick={() => setOperation('sub')}
                  >
                    Вычитание
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnOp} ${styles.opBoth} ${opRing('both') ?? ''}`}
                    onClick={() => setOperation('both')}
                  >
                    Всё вместе
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'game' && currentProblem && (
            <div className={styles.gameScreen}>
              <header className={styles.gameHeader}>
                <p className={styles.problemCounter}>
                  Задача {problemCount} из {TOTAL_PROBLEMS}
                </p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </header>

              <div className={styles.problemRow}>
                <span className={styles.numBlue}>{currentProblem.num1}</span>
                <span
                  className={
                    currentProblem.op === '+' ? styles.opPlus : styles.opMinus
                  }
                >
                  {currentProblem.op}
                </span>
                <span className={styles.numGreen}>{currentProblem.num2}</span>
              </div>

              <VisualClue problem={currentProblem} gridWidth={gridWidth} />

              <div className={styles.answerDisplay}>{answerText}</div>

              <div className={styles.numpad}>
                {numpadKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={
                      k === 'C'
                        ? styles.numpadClear
                        : k === '✓'
                          ? styles.numpadOk
                          : styles.numpadDigit
                    }
                    onClick={() => handleNumpad(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className={styles.actionRow}>
                {!answeredCorrect ? (
                  <button
                    type="button"
                    className={styles.hearBtn}
                    onClick={() => speakProblem(currentProblem)}
                    aria-label="Прослушать задачу"
                  >
                    🔊
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.nextBtn}
                    onClick={handleNext}
                  >
                    Дальше
                  </button>
                )}
              </div>

              {feedback && (
                <div
                  key={feedbackAnim}
                  className={`${styles.feedback} ${feedbackTone === 'ok' ? styles.feedbackOk : styles.feedbackBad}`}
                >
                  {feedback}
                </div>
              )}
            </div>
          )}

          {phase === 'end' && (
            <div className={styles.endScreen}>
              <h1 className={styles.endTitle}>{endTitle}</h1>
              <p className={styles.endScore}>
                Правильных ответов: {score} из {TOTAL_PROBLEMS}
              </p>
              <div className={styles.starChart} aria-hidden>
                {Array.from({ length: TOTAL_PROBLEMS }, (_, i) => (
                  <span
                    key={i}
                    className={styles.star}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {i < score ? '🌟' : '☆'}
                  </span>
                ))}
              </div>
              <p className={styles.endMessage}>{endMessage}</p>
              <button
                type="button"
                className={styles.playAgain}
                onClick={resetGame}
              >
                Играть снова
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VisualClue = ({
  problem,
  gridWidth,
}: {
  problem: Problem;
  gridWidth: number;
}) => {
  const { num1, num2, op } = problem;

  if (op === '+') {
    return (
      <div className={styles.visualClue}>
        <DotGroup count={num1} color="blue" gridWidth={gridWidth} />
        <span className={styles.visualPlus}>+</span>
        <DotGroup count={num2} color="green" gridWidth={gridWidth} />
      </div>
    );
  }

  return (
    <div className={styles.visualClue}>
      <DotGroup
        count={num1}
        color="blue"
        gridWidth={gridWidth}
        crossedOut={num2}
      />
    </div>
  );
};

const DotGroup = ({
  count,
  color,
  gridWidth,
  crossedOut = 0,
}: {
  count: number;
  color: 'blue' | 'green';
  gridWidth: number;
  crossedOut?: number;
}) => {
  const cols = Math.min(count, gridWidth);
  const dotClass = color === 'blue' ? styles.dotBlue : styles.dotGreen;

  return (
    <div
      className={styles.dotGrid}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const crossed = i >= count - crossedOut;
        return (
          <div
            key={i}
            className={`${styles.dot} ${dotClass} ${crossed ? styles.dotCrossed : ''}`}
          >
            {crossed && <span className={styles.crossMark}>×</span>}
          </div>
        );
      })}
    </div>
  );
};
