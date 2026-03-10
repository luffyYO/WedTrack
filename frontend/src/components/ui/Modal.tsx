import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnOverlayClick?: boolean;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    closeOnOverlayClick = true,
}: ModalProps) {
    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className={cn(
                    'relative w-full bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
                    'shadow-[var(--shadow-lg)] border border-[var(--color-border)]',
                    'animate-scale-in',
                    sizeClasses[size]
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                        <div>
                            <h2 id="modal-title" className="text-heading-md text-[var(--color-text-primary)]">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">{description}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-4 p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-neutral-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className={cn('px-6', title ? 'py-5' : 'pt-6 pb-5')}>{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 pb-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Convenience export for modal footer buttons ───────────────────────────────
export { Button as ModalButton };
