import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { PageHeader } from '@/components/UI/PageHeader';
import {
  initConnectFourVsAi,
  type ConnectFourController,
} from './connectFourGame';
import styles from './ConnectFour.module.scss';

export const ConnectFour: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ConnectFourController | null>(null);
  const [status, setStatus] = useState('Загрузка…');
  const [gameOver, setGameOver] = useState<{
    draw: boolean;
    message: string;
  } | null>(null);

  const handlePlayAgain = useCallback(() => {
    setGameOver(null);
    void controllerRef.current?.playAgain();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctrl = initConnectFourVsAi(canvas, {
      onStatus: setStatus,
      onGameOver: setGameOver,
    });
    controllerRef.current = ctrl;

    return () => {
      ctrl.end();
      controllerRef.current = null;
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <PageHeader title="4 в ряд" link={'https://kenrick95.github.io/c4/'} />
      <div className={styles.body}>
        <p className={styles.status} role="status">
          {status}
        </p>
        <div className={styles.canvasWrap}>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="Поле" />
          {gameOver && (
            <div className={styles.overlay} role="dialog" aria-modal="true">
              <p className={styles.overlayTitle}>{gameOver.message}</p>
              <button
                type="button"
                className={styles.restartBtn}
                onClick={handlePlayAgain}
              >
                Сыграть снова
              </button>
            </div>
          )}
        </div>
        <p className={styles.hint}>
          Соберите четыре фишки в ряд (горизонтально, вертикально или по
          диагонали) раньше противника. Ход — клик по нужному столбцу.
        </p>
      </div>
    </div>
  );
};
