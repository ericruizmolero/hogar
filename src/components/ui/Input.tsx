import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            px-3 py-2 bg-[var(--color-bg)]
            border border-[var(--color-border)] rounded-md
            text-sm text-[var(--color-text)]
            placeholder:text-[var(--color-text-tertiary)]
            focus:outline-none focus:border-[var(--color-border-strong)]
            transition-colors
            ${error ? 'border-[var(--color-discarded-text)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--color-discarded-text)]">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
