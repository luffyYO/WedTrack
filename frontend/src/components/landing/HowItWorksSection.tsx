import { useState, TouchEvent } from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STEPS = [
    {
        title: "Home Page",
        desc: "Landing securely on your personalized digital invitation space.",
        img: "/step-1.png",
    },
    {
        title: "Fill Couples Details",
        desc: "Input precise wedding and couple information for smart handling.",
        img: "/step-2.png",
    },
    {
        title: "Guest Scans QR",
        desc: "Invitees arrive and scan your generated QR code effortlessly.",
        img: "/step-3.png",
    },
    {
        title: "Guest Fills Details",
        desc: "Guests log their attendance and record their gifts instantly.",
        img: "/step-5.png",
    },
    {
        title: "Dashboard Tracking",
        desc: "Track every attendance and gift securely on a live tracking board.",
        img: "/step-6.png",
    }
];

export default function HowItWorksSection() {
    const [activeStep, setActiveStep] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const handleNext = () => {
        setActiveStep((prev) => (prev + 1) % STEPS.length);
    };

    const handlePrev = () => {
        setActiveStep((prev) => (prev - 1 + STEPS.length) % STEPS.length);
    };

    // Swipe handlers for mobile
    const onTouchStart = (e: TouchEvent) => setTouchStartX(e.touches[0].clientX);
    const onTouchEnd = (e: TouchEvent) => {
        if (!touchStartX) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (diff > 50) handleNext(); // Swiped left
        if (diff < -50) handlePrev(); // Swiped right
        setTouchStartX(null);
    };

    return (
        <section className="relative w-full overflow-hidden py-16 sm:py-24" id="how-it-works">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-10 right-10 w-96 h-96 bg-pink-100/40 blur-3xl rounded-full" />
                <div className="absolute bottom-10 left-10 w-80 h-80 bg-rose-100/40 blur-3xl rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                        Plan Your Wedding Gifts in <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">5 Simple Steps</span>
                    </h2>
                </div>

                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-pink-900/5 rounded-[3rem] p-6 lg:p-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                    
                    {/* Right on Desktop / Bottom on Mobile: Interactive Info Context */}
                    <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start text-center lg:text-left order-2">
                        
                        <div className="mb-8 min-h-[140px] flex flex-col justify-center w-full">
                            <span className="text-pink-400 font-bold tracking-widest uppercase text-sm mb-2 drop-shadow-sm">Step 0{activeStep + 1}</span>
                            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4 transition-all duration-300">
                                {STEPS[activeStep].title}
                            </h3>
                            <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-sm mx-auto lg:mx-0 transition-all duration-300">
                                {STEPS[activeStep].desc}
                            </p>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex items-center gap-6 mt-4">
                            <button 
                                onClick={handlePrev}
                                className="w-12 h-12 rounded-full border border-pink-200 bg-white shadow-sm flex items-center justify-center text-pink-500 hover:bg-pink-50 transition-all hover:scale-105 active:scale-95"
                                aria-label="Previous step"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            
                            <div className="flex gap-2">
                                {STEPS.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveStep(idx)}
                                        className={cn(
                                            "h-2.5 rounded-full transition-all duration-500",
                                            activeStep === idx ? "w-8 bg-pink-500" : "w-2.5 bg-pink-200 hover:bg-pink-300"
                                        )}
                                        aria-label={`Go to step ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            <button 
                                onClick={handleNext}
                                className="w-12 h-12 rounded-full border border-pink-200 bg-white shadow-sm flex items-center justify-center text-pink-500 hover:bg-pink-50 transition-all hover:scale-105 active:scale-95"
                                aria-label="Next step"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Left on Desktop / Top on Mobile: Moderate iPhone Mockup */}
                    <div 
                        className="w-full lg:w-1/2 flex justify-center order-1 perspective-1000"
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* iPhone Frame */}
                        <div className="relative w-[210px] h-[430px] sm:w-[280px] sm:h-[580px] rounded-[2.5rem] sm:rounded-[3rem] bg-slate-900 border-[6px] sm:border-[10px] border-slate-800 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] sm:shadow-[20px_20px_60px_rgba(0,0,0,0.15),_inset_0_0_15px_rgba(255,255,255,0.1)] overflow-hidden shrink-0 group">
                            
                            <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] bg-black overflow-hidden m-[2px]">
                                {/* Dynamic Island */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-5 sm:h-7 bg-black rounded-full z-30 shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                                
                                {/* Screen Crossfade */}
                                {STEPS.map((step, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "absolute inset-0 w-full h-full bg-slate-50 transition-all duration-[600ms] ease-out z-10",
                                            activeStep === idx 
                                                ? "opacity-100 translate-x-0" 
                                                : activeStep < idx 
                                                    ? "opacity-0 translate-x-12" 
                                                    : "opacity-0 -translate-x-12"
                                        )}
                                    >
                                        {/* Dynamic blurred backdrop to fill empty space */}
                                        <img 
                                            src={step.img}
                                            alt={step.title}
                                            className="absolute inset-0 w-full h-full object-cover opacity-60 blur-2xl scale-110"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        {/* Actual fully visible image */}
                                        <img 
                                            src={step.img}
                                            alt={step.title}
                                            className="absolute inset-0 w-full h-full object-contain object-top drop-shadow-2xl"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                ))}

                                {/* Overlay gradient for premium feel */}
                                <div className="absolute inset-0 border-[3px] border-white/10 rounded-[2.5rem] pointer-events-none z-20"></div>
                            </div>
                            
                            {/* Decorative Volume Buttons */}
                            <div className="absolute top-[80px] -left-[12px] w-[4px] h-[26px] bg-slate-700 rounded-l-md"></div>
                            <div className="absolute top-[120px] -left-[12px] w-[4px] h-[40px] bg-slate-700 rounded-l-md"></div>
                            <div className="absolute top-[170px] -left-[12px] w-[4px] h-[40px] bg-slate-700 rounded-l-md"></div>
                            <div className="absolute top-[130px] -right-[12px] w-[4px] h-[60px] bg-slate-700 rounded-r-md"></div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
