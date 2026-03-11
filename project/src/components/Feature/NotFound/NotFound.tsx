import type { FC } from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.scss';

export const NotFound: FC = () => {
  return (
    <div className={styles.notFound}>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>Page Not Found</h2>
      <p className={styles.text}>
        The page you are looking for does not exist.
      </p>
      <Link to="/" className={styles.link}>
        Go to Home
      </Link>
    </div>
  );
};
