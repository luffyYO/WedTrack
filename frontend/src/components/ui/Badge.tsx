import type { BadgeVariant } from '@/types';
import { cn } from '@/utils/cn';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
    dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-neutral-400',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
    info: 'bg-[var(--color-info)]',
};

export default function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5',
                'text-[11px] font-medium rounded-full capitalize',
                variantClasses[variant],
                className
            )}
        >
            {dot && (
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
            )}
            {children}
        </span>
    );
}
