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
            "inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-full leading-tight",
            sizeClasses[size],
            className
        )}>
            <span className="font-bold text-gray-900 tracking-tight truncate max-w-[40%]">
                {brideName}
            </span>
            
            <div className="flex items-center gap-1.5 sm:gap-2 select-none flex-shrink-0 mx-1">
                <span className="text-red-500 text-[0.9em]">❤️</span>
                <span className="font-serif italic text-primary-600 font-medium text-[0.9em] lowercase">
                    weds
                </span>
                <span className="text-red-500 text-[0.9em]">❤️</span>
            </div>

            <span className="font-bold text-gray-900 tracking-tight truncate max-w-[40%]">
                {groomName}
            </span>
        </div>
    );
};

export default WeddingNameDisplay;
