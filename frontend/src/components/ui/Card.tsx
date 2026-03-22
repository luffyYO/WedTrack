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
                // The new Glassmorphism Base!
                'glass-panel rounded-[var(--radius-2xl)] overflow-hidden',
                hoverable && 'transition-all duration-400 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 cursor-pointer',
                !noPadding && 'p-6 sm:p-8 md:p-10',
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
    subtitle?: string; // Support for subtitle
    action?: React.ReactNode;
}

const CardHeader = ({ title, description, subtitle, action, className, ...props }: CardHeaderProps) => (
    <div className={cn('flex items-start justify-between mb-6', className)} {...props}>
        <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{title}</h3>
            {(description || subtitle) && (
                <p className="text-sm sm:text-base text-slate-500 mt-1.5 leading-relaxed">{description || subtitle}</p>
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
                'mt-6 pt-5 border-t border-slate-200/50 flex items-center justify-end gap-3',
                className
            )}
            {...props}
        />
    )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter };
