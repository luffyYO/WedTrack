import { useEffect, useState } from 'react';

interface Heart {
    id: number;
    left: number;
    size: number;
    duration: number;
    color: string;
}

const COLORS = ['text-pink-400', 'text-rose-400', 'text-pink-300', 'text-red-400', 'text-white/80'];

export default function FloatingHearts({ active }: { active: boolean }) {
    const [hearts, setHearts] = useState<Heart[]>([]);

    useEffect(() => {
        if (!active) {
            // Let existing hearts float away, but don't add new ones immediately
            // Optionally, we could clear them after a few seconds
            const timer = setTimeout(() => setHearts([]), 3000);
            return () => clearTimeout(timer);
        }
        
        let idCounter = Date.now();
        const interval = setInterval(() => {
            setHearts(prev => {
                const newHeart = {
                    id: idCounter++,
                    left: Math.random() * 80 + 10, // 10% to 90% across screen width
                    size: Math.random() * 16 + 14, // 14px to 30px
                    duration: Math.random() * 1.5 + 2.5, // 2.5s to 4s
                    color: COLORS[Math.floor(Math.random() * COLORS.length)]
                };
                return [...prev, newHeart].slice(-20); // max 20 hearts
            });
        }, 300); // New heart every 300ms while active

        return () => clearInterval(interval);
    }, [active]);

    if (!active && hearts.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
            {hearts.map(heart => (
                <div
                    key={heart.id}
                    className={`absolute bottom-[10%] text-shadow-sm animate-float-heart opacity-0 ${heart.color}`}
                    style={{
                        left: `${heart.left}%`,
                        fontSize: `${heart.size}px`,
                        animationDuration: `${heart.duration}s`
                    }}
                >
                    ❤️
                </div>
            ))}
        </div>
    );
}
