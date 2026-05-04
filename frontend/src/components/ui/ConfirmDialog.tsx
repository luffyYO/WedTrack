import { useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 'danger' = red confirm button; 'primary' = pink */
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Fully-styled confirm dialog that replaces window.confirm().
 * Theme-aware: uses CSS variables so it works in light, dark, and high-contrast modes.
 */
export default function ConfirmDialog({
    isOpen,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    // Close on Escape
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter') onConfirm();
        },
        [isOpen, onCancel, onConfirm]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className={cn(
                    'relative w-full max-w-sm rounded-2xl',
                    'bg-white dark:bg-slate-900',
                    'border border-slate-200 dark:border-slate-700',
                    'shadow-[0_24px_48px_rgba(0,0,0,0.18)]',
                    'animate-fade-up'
                )}
            >
                {/* Icon + Header */}
                <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                    <div className={cn(
                        'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                        variant === 'danger'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                            : 'bg-pink-100 dark:bg-pink-900/30 text-pink-500'
                    )}>
                        <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                        <h2
                            id="confirm-dialog-title"
                            className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-snug"
                        >
                            {title}
                        </h2>
                        <p
                            id="confirm-dialog-message"
                            className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed"
                        >
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[13px] font-semibold transition-all',
                            'text-slate-600 dark:text-slate-300',
                            'bg-slate-100 dark:bg-slate-800',
                            'hover:bg-slate-200 dark:hover:bg-slate-700',
                            'active:scale-95'
                        )}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[13px] font-bold transition-all active:scale-95',
                            variant === 'danger'
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/30'
                                : 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm shadow-pink-500/30'
                        )}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
