import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
};

export function Button({ variant = 'default', className = '', type = 'button', ...props }: Props) {
  return <button {...props} type={type} data-variant={variant} className={`house-button ${className}`} />;
}
