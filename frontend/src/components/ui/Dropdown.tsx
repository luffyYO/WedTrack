import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SelectOption } from '@/types';

interface DropdownProps<T extends string = string> {
    options: SelectOption<T>[];
    value?: T;
    onChange: (value: T) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    id?: string;
    icon?: React.ReactNode;
}

export default function Dropdown<T extends string = string>({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    error,
    disabled = false,
    fullWidth = false,
    id,
    icon,
}: DropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const selectedOption = options.find((o) => o.value === value);

    const handleClose = useCallback(() => setIsOpen(false), []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) handleClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [handleClose]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [handleClose]);

    return (
        <div className={cn('relative flex flex-col gap-1.5', fullWidth && 'w-full')} ref={containerRef}>
            {label && (
                <label
                    htmlFor={dropdownId}
                    className="text-body-sm font-medium text-[var(--color-text-primary)]"
                >
                    {label}
                </label>
            )}

            <button
                id={dropdownId}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className={cn(
                    'flex items-center justify-between h-9 px-3 text-[14px] rounded-[var(--radius-md)]',
                    'bg-[var(--color-surface)] border border-[var(--color-border)]',
                    'text-left transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error && 'border-red-500',
                    isOpen && 'ring-2 ring-black dark:ring-white border-black dark:border-white',
                    !selectedOption && 'text-[var(--color-text-muted)]',
                    selectedOption && 'text-[var(--color-text-primary)]',
                    icon && 'pl-9'
                )}
            >
                {icon && (
                    <span className="absolute left-3 top-[34px] text-[var(--color-text-muted)] pointer-events-none">
                        {icon}
                    </span>
                )}
                <span className="truncate">{selectedOption?.label ?? placeholder}</span>
                <ChevronDown
                    size={15}
                    className={cn(
                        'ml-2 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    className={cn(
                        'absolute z-50 top-full mt-1.5 w-full',
                        'bg-[var(--color-surface)] border border-[var(--color-border)]',
                        'rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]',
                        'py-1 overflow-auto max-h-56 animate-fade-in'
                    )}
                >
                    {options.map((option) => (
                        <li
                            key={option.value}
                            role="option"
                            aria-selected={option.value === value}
                            aria-disabled={option.disabled}
                            onClick={() => {
                                if (!option.disabled) {
                                    onChange(option.value);
                                    handleClose();
                                }
                            }}
                            className={cn(
                                'px-3 py-2 text-[14px] cursor-pointer transition-colors duration-100',
                                option.value === value
                                    ? 'text-black dark:text-white bg-neutral-100 dark:bg-neutral-800 font-medium'
                                    : 'text-[var(--color-text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800',
                                option.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                            )}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className="text-caption text-red-600">{error}</p>}
        </div>
    );
}
