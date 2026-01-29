import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-[var(--color-text)] text-white hover:bg-[var(--color-text)]/90 active:scale-[0.98]',
  secondary: 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)] active:scale-[0.98]',
  danger: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)] hover:opacity-90 active:scale-[0.98]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]',
};

const sizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-1.5 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-md
        transition-all duration-150 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
