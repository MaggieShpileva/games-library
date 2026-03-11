import type { FC } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';
import clsx from 'clsx';
import styles from './Input.module.scss';

type InputProps = {
  name: string;
  label?: string;
  error?: string;
  fullWidth?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export const Input: FC<InputProps> = ({
  name,
  label,
  error,
  fullWidth = false,
  className,
  id,
  ...props
}) => {
  const inputId = useId();

  const finalId = id || inputId;
  const wrapperClass = clsx(styles.inputWrapper, {
    [styles.fullWidth]: fullWidth,
  });
  const inputClass = clsx(
    styles.input,
    {
      [styles.error]: error,
    },
    className
  );

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={finalId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={finalId}
        className={inputClass}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${finalId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${finalId}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
