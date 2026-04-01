import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { PageHeader } from '@/components/UI';
import styles from './Jumper.module.scss';

const SQUARE = 40;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const CHARACTER_GROUND_TOP = GAME_HEIGHT - SQUARE;
const BLOCK_TOP = CHARACTER_GROUND_TOP;
const COLLISION_TOP = CHARACTER_GROUND_TOP;
const COLLISION_LEFT_MAX = SQUARE;
const JUMP_PEAK_TOP = CHARACTER_GROUND_TOP - 180;
const BLOCK_START_LEFT = GAME_WIDTH - SQUARE;
const JUMP_DURATION_MS = 320;

export const Jumper = () => {
  const characterRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [blockKey, setBlockKey] = useState(0);

  const jump = useCallback(() => {
    if (gameOver || jumping) return;
    setJumping(true);
    window.setTimeout(() => setJumping(false), JUMP_DURATION_MS);
  }, [gameOver, jumping]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  useEffect(() => {
    if (gameOver) return;
    const id = window.setInterval(() => {
      setScore((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameOver, blockKey]);

  useEffect(() => {
    if (gameOver) return;
    const id = window.setInterval(() => {
      const character = characterRef.current;
      const block = blockRef.current;
      if (!character || !block) return;
      const characterTop = parseInt(
        window.getComputedStyle(character).getPropertyValue('top'),
        10
      );
      const blockLeft = parseInt(
        window.getComputedStyle(block).getPropertyValue('left'),
        10
      );
      if (
        blockLeft > 0 &&
        blockLeft < COLLISION_LEFT_MAX &&
        characterTop >= COLLISION_TOP
      ) {
        setScore(0);
        setGameOver(true);
      }
    }, 10);
    return () => window.clearInterval(id);
  }, [gameOver, blockKey]);

  const handleRestart = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setJumping(false);
    setBlockKey((k) => k + 1);
  }, []);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Перепрыгивать препятствия"
        link="https://codepen.io/danialwafiy/pen/abJemma"
      />
      <div className={styles.content}>
        <div className={styles.inner}>
          <p className={styles.hint}>
            Клик по полю (более долгий отклик) или пробел — прыжок
          </p>
          <div
            className={styles.game}
            onClick={jump}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                jump();
              }
            }}
            style={
              {
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                '--jumper-char-ground': `${CHARACTER_GROUND_TOP}px`,
                '--jumper-jump-peak': `${JUMP_PEAK_TOP}px`,
                '--jumper-block-top': `${BLOCK_TOP}px`,
                '--jumper-block-start': `${BLOCK_START_LEFT}px`,
                '--jumper-jump-duration': `${JUMP_DURATION_MS}ms`,
              } as CSSProperties
            }
            role="application"
            tabIndex={0}
            aria-label="Игровое поле: клик или пробел для прыжка"
          >
            {gameOver && (
              <div className={styles.overlay}>
                <p className={styles.overlayTitle}>Игра окончена</p>
                <button
                  type="button"
                  className={styles.restartBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestart();
                  }}
                >
                  Играть снова
                </button>
              </div>
            )}
            <div
              ref={characterRef}
              className={`${styles.character} ${jumping ? styles.characterJump : ''}`}
            />
            <div
              key={blockKey}
              ref={blockRef}
              className={`${styles.block} ${gameOver ? styles.blockStopped : ''}`}
            />
          </div>
          <p className={styles.score}>
            Счёт: <span>{score}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
