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
    // Beautiful subtle gradient with floating drop shadow
    primary: 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)] border border-pink-400/20 hover:shadow-[0_12px_24px_-6px_rgba(236,72,153,0.6)] hover:-translate-y-0.5',
    
    // Glassmorphism button
    secondary: 'bg-white/70 backdrop-blur-md border border-white/60 text-slate-700 shadow-sm hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5',
    
    // Minimal airy ghost
    ghost: 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 active:bg-slate-200/50',
    
    // Elegant outline
    outline: 'border border-slate-200 bg-white/30 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-slate-300 hover:-translate-y-0.5 shadow-sm',
    
    // Danger stays critical but softer
    danger: 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 hover:shadow-lg',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 px-4 text-[13px] gap-1.5 rounded-[var(--radius-lg)]',
    md: 'h-11 px-6 text-[14px] gap-2 rounded-[var(--radius-xl)]',
    lg: 'h-12 sm:h-14 px-8 text-[15px] sm:text-[16px] gap-2.5 rounded-[var(--radius-2xl)]',
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
                'transition-all duration-300 select-none cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:shadow-none',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
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
