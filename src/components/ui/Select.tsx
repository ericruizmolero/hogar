import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: { value: string; label: string }[];
  size?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, size = 'md', className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'pl-2 pr-6 py-1 text-xs',
      md: 'pl-3 pr-8 py-2 text-sm',
    };

    return (
      <div className={size === 'sm' ? 'inline-flex flex-col' : 'flex flex-col gap-1.5'}>
        {label && (
          <label className="text-sm text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              appearance-none w-full
              bg-[var(--color-bg)]
              border border-[var(--color-border)] rounded-md
              text-[var(--color-text)]
              focus:outline-none focus:border-[var(--color-border-strong)]
              transition-colors cursor-pointer
              ${sizeClasses[size]}
              ${className}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={size === 'sm' ? 12 : 14}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
