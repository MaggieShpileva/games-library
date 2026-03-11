import type { FC, ReactNode } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'dark';
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  disabled = false,
  fullWidth = false,
  className,
  ...props
}) => {
  const buttonClass = clsx(
    styles.button,
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
    {
      [styles.disabled]: disabled,
      [styles.fullWidth]: fullWidth,
    },
    className
  );

  return (
    <button className={buttonClass} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
