import type { FC } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import styles from './Error.module.scss';

const getErrorMessage = (error: unknown): string => {
  if (isRouteErrorResponse(error)) {
    return error.statusText || 'An error occurred';
  }
  if (error instanceof Error) {
    return (error as Error).message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
};

export const Error: FC = () => {
  const error = useRouteError();

  const errorStatus = isRouteErrorResponse(error) ? error.status : undefined;
  const errorMessage = getErrorMessage(error);

  const handleReload = () => {
    window.location.reload();
  };

  const titleText = errorStatus ? `${errorStatus}` : 'Error';

  return (
    <div className={styles.error}>
      <h1 className={styles.title}>{titleText}</h1>
      <h2 className={styles.subtitle}>Oops! Something went wrong</h2>
      <p className={styles.message}>{errorMessage}</p>
      <div className={styles.actions}>
        <Link to="/" className={styles.link}>
          Go to Home
        </Link>
        <button onClick={handleReload} className={styles.button}>
          Reload Page
        </button>
      </div>
    </div>
  );
};
