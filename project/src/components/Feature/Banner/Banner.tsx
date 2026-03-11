import type { FC } from 'react';
import { Title } from '@components/UI';
import styles from './Banner.module.scss';

export const Banner: FC = () => {
  return (
    <section className={styles.banner}>
      <Title tag="h1" variant="bold" className={styles.bannerTitle}>
        Template project on React
      </Title>
    </section>
  );
};
