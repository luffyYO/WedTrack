import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right';
    delay?: number;
    threshold?: number;
}

export default function ScrollReveal({
    children,
    className,
    animation = 'fade-up',
    delay = 0,
    threshold = 0.15,
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (ref.current) observer.unobserve(ref.current);
                }
            },
            {
                threshold,
                rootMargin: '0px 0px -50px 0px', // Trigger slightly before it comes fully into view
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    const getAnimationClasses = () => {
        const base = "transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] w-full";
        if (!isVisible) {
            switch (animation) {
                case 'fade-up': return `${base} opacity-0 translate-y-16 lg:translate-y-24`;
                case 'slide-left': return `${base} opacity-0 translate-x-12 lg:translate-x-20`;
                case 'slide-right': return `${base} opacity-0 -translate-x-12 lg:-translate-x-20`;
                case 'fade-in': return `${base} opacity-0`;
                default: return `${base} opacity-0 translate-y-16`;
            }
        }
        return `${base} opacity-100 translate-y-0 translate-x-0`;
    };

    return (
        <div 
            ref={ref} 
            className={cn(getAnimationClasses(), className)}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
