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

    const isLarge = size === 'lg' || size === 'xl';

    return (
        <div className={cn(
            "flex items-center justify-center max-w-full leading-tight text-center",
            isLarge ? "flex-col gap-1 sm:gap-1.5 w-full" : "inline-flex flex-wrap flex-row gap-1.5 sm:gap-2",
            sizeClasses[size],
            className
        )}>
            <span className={cn("font-bold tracking-tight", !isLarge && "truncate max-w-[40%]")}>
                {brideName}
            </span>
            
            <div className="flex items-center gap-1.5 sm:gap-2 select-none flex-shrink-0 mx-1">
                <span className="text-red-500 text-[0.9em]">❤️</span>
                <span className="font-serif italic text-neutral-600 font-medium text-[0.9em] lowercase">
                    weds
                </span>
                <span className="text-red-500 text-[0.9em]">❤️</span>
            </div>

            <span className={cn("font-bold tracking-tight", !isLarge && "truncate max-w-[40%]")}>
                {groomName}
            </span>
        </div>
    );
};

export default WeddingNameDisplay;
