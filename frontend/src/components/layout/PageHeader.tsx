import React from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    breadcrumb?: React.ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    action,
    breadcrumb,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('mb-6', className)}>
            {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-heading-xl text-[var(--color-text-primary)]">{title}</h1>
                    {description && (
                        <p className="text-body-md text-[var(--color-text-secondary)] mt-1">{description}</p>
                    )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </div>
    );
}
