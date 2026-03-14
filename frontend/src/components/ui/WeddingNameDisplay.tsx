import React from 'react';
import { cn } from '@/utils/cn';

interface WeddingNameDisplayProps {
    brideName: string;
    groomName: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const WeddingNameDisplay: React.FC<WeddingNameDisplayProps> = ({ 
    brideName, 
    groomName, 
    className,
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base sm:text-lg',
        lg: 'text-xl sm:text-2xl',
        xl: 'text-2xl sm:text-3xl lg:text-4xl'
    };

    return (
        <div className={cn(
            "inline-flex items-center whitespace-nowrap overflow-hidden max-w-full",
            sizeClasses[size],
            className
        )}>
            <span className="font-bold text-gray-900 tracking-tight truncate">
                {brideName}
            </span>
            <span className="mx-2 sm:mx-3 text-primary-600 font-medium select-none flex-shrink-0">
                &
            </span>
            <span className="font-bold text-gray-900 tracking-tight truncate">
                {groomName}
            </span>
        </div>
    );
};

export default WeddingNameDisplay;
