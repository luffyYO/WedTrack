import React from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    breadcrumbs?: React.ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    action,
    breadcrumbs,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-4 mb-6 sm:mb-8 mt-2', className)}>
            {breadcrumbs && <div className="text-sm text-[var(--color-text-muted)]">{breadcrumbs}</div>}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col min-w-0 flex-1">
                    <h1 className="text-display-sm text-[var(--color-text-primary)] truncate">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>

                {action && (
                    <div className="flex shrink-0 w-full sm:w-auto">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}
