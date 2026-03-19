import styles from './SimulatorGame.module.scss';
import { PageHeader } from '@/components/UI';

export const SimulatorGame = () => {
  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Simulator Game"
        link="https://codepen.io/jcoulterdesign/pen/YvgpZW"
      />
    </div>
  );
};
