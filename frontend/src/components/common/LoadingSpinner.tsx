import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    label?: string;
    fullScreen?: boolean;
}

const sizeMap = { sm: 16, md: 24, lg: 36 };

export default function LoadingSpinner({
    size = 'md',
    className,
    label = 'Loading…',
    fullScreen = false,
}: LoadingSpinnerProps) {
    return (
        <div
            role="status"
            aria-label={label}
            className={cn(
                'flex flex-col items-center justify-center gap-3',
                fullScreen && 'fixed inset-0 bg-[var(--color-bg)]',
                className
            )}
        >
            <Loader2
                size={sizeMap[size]}
                className="animate-spin text-primary-600"
                aria-hidden="true"
            />
            {label && <span className="text-body-sm text-[var(--color-text-muted)]">{label}</span>}
        </div>
    );
}
