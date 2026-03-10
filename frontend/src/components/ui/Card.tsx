import React from 'react';
import { cn } from '@/utils/cn';

// ─── Card Root ────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    noPadding?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, hoverable = false, noPadding = false, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]',
                'shadow-[var(--shadow-sm)]',
                hoverable && 'transition-shadow duration-200 hover:shadow-[var(--shadow-md)] cursor-pointer',
                !noPadding && 'p-6',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
);
Card.displayName = 'Card';

// ─── Card Header ──────────────────────────────────────────────────────────────

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

const CardHeader = ({ title, description, action, className, ...props }: CardHeaderProps) => (
    <div className={cn('flex items-start justify-between mb-5', className)} {...props}>
        <div>
            <h3 className="text-heading-sm text-[var(--color-text-primary)]">{title}</h3>
            {description && (
                <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">{description}</p>
            )}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
);
CardHeader.displayName = 'CardHeader';

// ─── Card Footer ──────────────────────────────────────────────────────────────

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2',
                className
            )}
            {...props}
        />
    )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter };
