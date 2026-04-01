import { PageHeader } from '@/components/UI';
import { PlatformBoard } from './PlatformBoard';
import styles from './Platform.module.scss';

export const Platform = () => {
  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Platform Game"
        link="https://codepen.io/nathantaylor/pen/KaLvXw"
      />
      <div className={styles.game}>
        <PlatformBoard />
      </div>
    </div>
  );
};
