import React from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        { label, error, hint, icon, iconPosition = 'left', fullWidth = false, className, id, ...props },
        ref
    ) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
        const hasError = !!error;

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label htmlFor={inputId} className="text-body-sm font-medium text-[var(--color-text-primary)]">
                        {label}
                    </label>
                )}

                <div className="relative flex items-center">
                    {icon && iconPosition === 'left' && (
                        <span className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none">
                            {icon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            // Touch-friendly: h-10 min (40px) on all devices
                            'h-10 w-full px-3 text-[14px] rounded-[var(--radius-md)]',
                            'bg-[var(--color-surface)] text-[var(--color-text-primary)]',
                            'border border-[var(--color-border)] transition-all duration-150',
                            'placeholder:text-[var(--color-text-muted)]',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            'disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60',
                            icon && iconPosition === 'left' && 'pl-9',
                            icon && iconPosition === 'right' && 'pr-9',
                            hasError && 'border-red-500 focus:ring-red-500 focus:border-red-500',
                            className
                        )}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        {...props}
                    />

                    {icon && iconPosition === 'right' && (
                        <span className="absolute right-3 text-[var(--color-text-muted)] pointer-events-none">
                            {icon}
                        </span>
                    )}

                    {hasError && iconPosition !== 'right' && (
                        <span className="absolute right-3 text-red-500">
                            <AlertCircle size={15} />
                        </span>
                    )}
                </div>

                {hasError && (
                    <p id={`${inputId}-error`} className="text-caption text-red-600">
                        {error}
                    </p>
                )}
                {!hasError && hint && (
                    <p id={`${inputId}-hint`} className="text-caption text-[var(--color-text-muted)]">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
