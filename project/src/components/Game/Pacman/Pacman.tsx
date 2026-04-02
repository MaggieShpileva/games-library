import { useEffect, useRef, type FC } from 'react';
import { PageHeader } from '@/components/UI/PageHeader';
import { initPacman } from './pacmanGame';
import styles from './Pacman.module.scss';

export const Pacman: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return initPacman(canvas);
  }, []);

  return (
    <div className={styles.wrapper}>
      <PageHeader title="Pac-Man" link="https://passer-by.com/pacman/" />
      <div className={styles.body}>
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={960}
            height={640}
            aria-label="Pac-Man"
          />
        </div>
        <p className={styles.hint}>
          Стрелки — движение. Пробел или Enter — пауза на уровне; на титульном
          экране и после окончания игры — старт / рестарт. Соберите все точки,
          избегайте призраков; большие «энергетические» точки временно делают
          призраков уязвимыми.
        </p>
      </div>
    </div>
  );
};
