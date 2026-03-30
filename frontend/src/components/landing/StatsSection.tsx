import { useEffect, useState, useRef } from 'react';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  label: string;
}

const AnimatedCounter = ({ target, suffix = '+', label }: AnimatedCounterProps) => {
  const [count, setCount] = useState(1);
  const isInView = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const startAnimation = () => {
    let startTimestamp: number | null = null;
    const duration = 2000; // 2 seconds
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutExpo function for smooth deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * (target - 1) + 1));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    
    window.requestAnimationFrame(step);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
            if (!isInView.current) {
                isInView.current = true;
                startAnimation();
            }
        }
      },
      { threshold: 0.5 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [target]);


  return (
    <div 
        ref={containerRef}
        className="flex flex-col items-center justify-center p-8 group transition-transform duration-500 hover:scale-105"
    >
        <span className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-[0.2em] mb-4 group-hover:text-pink-500 transition-colors duration-300">
            {label}
        </span>
        <div className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-light tracking-tighter text-slate-800 flex items-baseline leading-none">
            {count}
            <span className="text-pink-500 font-extralight">{suffix}</span>
        </div>
    </div>
  );
};

export default function StatsSection() {
    return (
        <section className="py-16 md:py-24 relative bg-transparent overflow-hidden border-b border-slate-100/50">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[30rem] h-[30rem] bg-pink-300/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[30rem] h-[30rem] bg-rose-300/10 rounded-full blur-[100px] pointer-events-none" />
            
            <ScrollReveal className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row justify-center items-center gap-16 md:gap-32">
                    <AnimatedCounter target={300} label="QR Generated" />
                    <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                    <AnimatedCounter target={200} label="Peoples Reviewed" />
                </div>
            </ScrollReveal>
        </section>
    );
}
