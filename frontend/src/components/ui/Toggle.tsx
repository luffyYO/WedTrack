import { cn } from '@/utils/cn';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
    id?: string;
}

const sizeConfig = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-10 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-5' },
};

export default function Toggle({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    size = 'md',
    id,
}: ToggleProps) {
    const { track, thumb, translate } = sizeConfig[size];
    const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex items-start gap-3">
            <button
                role="switch"
                id={toggleId}
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    track,
                    checked ? 'bg-primary-700' : 'bg-neutral-300'
                )}
            >
                <span
                    className={cn(
                        'inline-block bg-white rounded-full shadow-sm transition-transform duration-200',
                        'ml-0.5',
                        thumb,
                        checked ? translate : 'translate-x-0'
                    )}
                />
            </button>

            {(label || description) && (
                <div className="flex flex-col">
                    {label && (
                        <label
                            htmlFor={toggleId}
                            className="text-body-sm font-medium text-[var(--color-text-primary)] cursor-pointer select-none"
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <span className="text-caption text-[var(--color-text-muted)]">{description}</span>
                    )}
                </div>
            )}
        </div>
    );
}
