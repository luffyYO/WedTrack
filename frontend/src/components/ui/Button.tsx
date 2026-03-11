import React from 'react';
import type { ButtonVariant, ButtonSize } from '@/types';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 shadow-sm',
    secondary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300',
    ghost: 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
};

// Touch-friendly: min h-10 (40px) on mobile, sizes scale with screen
const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 sm:h-9   px-3 text-[13px] gap-1.5 rounded-[var(--radius-md)]',
    md: 'h-10 sm:h-10 px-4 text-[14px] gap-2   rounded-[var(--radius-md)]',
    lg: 'h-11 sm:h-12 px-5 text-[15px] gap-2   rounded-[var(--radius-lg)]',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            icon,
            iconPosition = 'left',
            fullWidth = false,
            className,
            disabled,
            children,
            ...props
        },
        ref
    ) => (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
                'inline-flex items-center justify-center font-medium',
                'transition-all duration-150 select-none cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
            ) : (
                iconPosition === 'left' && icon
            )}
            {children && <span>{children}</span>}
            {!isLoading && iconPosition === 'right' && icon}
        </button>
    )
);

Button.displayName = 'Button';
export default Button;
