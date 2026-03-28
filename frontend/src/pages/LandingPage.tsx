import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { 
    Instagram, 
    Linkedin,
    Facebook, 
    Star, 
    Mail, 
    MapPin, 
    Phone, 
    Info, 
    Sparkles, 
    HelpCircle, 
    QrCode, 
    LayoutDashboard, 
    Bell, 
    Send,
    Navigation,
    HeartHandshake,
    ListX,
    MessageCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import MobileMenuPanel from '@/components/navigation/MobileMenuPanel';
import FAQSection from '@/components/landing/FAQSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { TypeAnimation } from 'react-type-animation';

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // 3D Animated Splash Screen
    const [showSplash, setShowSplash] = useState(true);

    // State for Doubt Form
    const [doubtName, setDoubtName] = useState('');
    const [doubtMessage, setDoubtMessage] = useState('');

    useEffect(() => {
        // Delay to show splash screen (logo spin)
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/home');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleWhatsAppSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const adminNumber = '9149891771';
        const text = `*New Inquiry from WedTrack Landing*%0A%0A*Name:* ${doubtName}%0A*Message:* ${doubtMessage}`;
        window.open(`https://wa.me/${adminNumber}?text=${text}`, '_blank');
        setDoubtName('');
        setDoubtMessage('');
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };

    if (showSplash) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-colors duration-1000">
                {/* The Cube Bouncing sequence */}
                <div className="relative animate-drop-bounce-complex z-30 mb-2">
                    {/* Perspective Container adjusted for edge spinning */}
                    <div style={{ perspective: '1200px' }} className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]">
                        {/* 3D Cube Isometric Spin */}
                        <div className="relative w-full h-full animate-spin-cube-edge">
                            {['front', 'back', 'right', 'left', 'top', 'bottom'].map((face) => (
                                <div key={face} className={`cube-face face-${face} overflow-hidden rounded-[20%] shadow-[0_5px_15px_rgba(244,114,182,0.2)] border-2 border-white bg-white`}>
                                    <img src="/logo.jpeg" alt="WedTrack Logo" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* The "Floor" that the cube bounces on (Fog Shadow & Bold Text) */}
                <div className="relative z-10 animate-fade-up flex flex-col items-center mt-6" style={{ animationDelay: '0.2s' }}>
                    {/* Dynamic shadow to anchor the bouncing cube */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-12 bg-pink-100/90 blur-[20px] rounded-full z-[-1]" />
                    
                    {/* Styled Premium Text */}
                    <div className="flex flex-col items-center">
                        <p className="text-xs sm:text-sm font-bold tracking-[0.4em] text-slate-400 uppercase mb-2">Welcome to</p>
                        <span className="font-black tracking-tight text-5xl sm:text-7xl bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent drop-shadow-sm pb-1">
                            WedTracks
                        </span>
                        <div className="h-2 w-16 rounded-full bg-gradient-to-r from-pink-400 to-rose-300 mt-4 shadow-sm opacity-90" />
                    </div>
                </div>
            </div>
        );
    }

    const Logo = ({ size = "md" }) => (
        <div className="flex items-center gap-2 sm:gap-3">
            <img 
                src="/logo.jpeg" 
                alt="WedTrack logo" 
                className={`${size === "lg" ? "w-16 h-16" : "w-8 h-8 sm:w-10 sm:h-10"} rounded-xl sm:rounded-2xl object-cover shadow-sm border border-white/50`}
            />
            <span className={`font-bold tracking-tight text-slate-800 ${size === "lg" ? "text-3xl" : "text-base sm:text-xl"}`}>
                WedTrack
            </span>
        </div>
    );

    const navItems = [
        { label: 'About', sectionId: 'about', icon: Info },
        { label: 'Features', sectionId: 'features', icon: Sparkles },
        { label: 'FAQ', sectionId: 'faq', icon: MessageCircle },
        { label: 'Support', sectionId: 'doubt', icon: HelpCircle }
    ];

    const mobileNavItems = navItems.map(item => ({
        label: item.label,
        icon: item.icon,
        onClick: () => scrollToSection(item.sectionId)
    }));

    return (
        <div className="min-h-screen font-sans overflow-x-hidden relative text-slate-700">
            {/* Global soft decorative blobs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-300/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-300/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_20px_rgba(244,114,182,0.05)]">
                <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-20 flex items-center justify-between">
                    <Logo />
                    
                    <div className="flex items-center gap-2 sm:gap-6">
                        <button 
                            onClick={() => navigate('/login')}
                            className="hidden sm:inline-flex px-6 py-2.5 rounded-2xl font-bold transition-all text-sm tracking-wide bg-white border border-slate-200 text-slate-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600 shadow-sm hover:shadow"
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-2xl font-bold transition-all text-[11px] sm:text-sm tracking-wide whitespace-nowrap bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5"
                        >
                            Get Started
                        </button>

                        <button 
                            className={cn(
                                "p-2 transition-all sm:hidden flex items-center justify-center relative w-10 h-10 group",
                                isMobileMenuOpen ? "z-[1100] text-slate-800" : "z-50 text-slate-600"
                            )}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            <div className="w-6 h-5 relative flex flex-col justify-between items-center transition-all duration-300">
                                <span className={cn(
                                    "w-full h-0.5 bg-current transition-all duration-300 rounded-full",
                                    isMobileMenuOpen ? "rotate-45 translate-y-[9px]" : ""
                                )} />
                                <span className={cn(
                                    "w-full h-0.5 bg-current transition-all duration-300 rounded-full",
                                    isMobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100"
                                )} />
                                <span className={cn(
                                    "w-full h-0.5 bg-current transition-all duration-300 rounded-full",
                                    isMobileMenuOpen ? "-rotate-45 -translate-y-[9px]" : ""
                                )} />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenuPanel 
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                items={mobileNavItems}
            />
            
            <main className="pt-24 sm:pt-32 relative z-10">
                {/* Hero Section */}
                <section className="relative py-12 sm:py-20 overflow-hidden px-4">
                    <div className="container mx-auto relative">
                        <div className="absolute top-10 left-10 text-pink-300 animate-float-heart opacity-60">💖</div>
                        <div className="absolute top-20 right-20 text-pink-300 animate-float-heart opacity-60" style={{animationDelay: '1s'}}>💖</div>
                        
                        <div className="max-w-4xl mx-auto text-center relative z-10">
                            <div className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs tracking-[0.2em] uppercase border border-pink-200/50 bg-white/80 shadow-sm mb-8 animate-fade-up text-pink-500 backdrop-blur-md">
                                <Sparkles size={16} />
                                <span>The Premium Wedding Management Platform</span>
                            </div>
                            
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8 animate-fade-up text-slate-800" style={{animationDelay: '100ms'}}>
                                Celebrate with <br />
                                <TypeAnimation
                                    sequence={[
                                        'Elegance and Order.',
                                        2500,
                                        'Perfect Harmony.',
                                        2500,
                                        'Zero Stress.',
                                        2500,
                                    ]}
                                    wrapper="span"
                                    speed={50}
                                    className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent inline-block"
                                    repeat={Infinity}
                                />
                            </h1>
                            
                            <p className="text-xl max-w-2xl mx-auto leading-relaxed mb-12 animate-fade-up text-slate-500 font-medium" style={{animationDelay: '200ms'}}>
                                Simplify guest management and elegantly track gift entries with secure QR tracking. Focus on your special day.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{animationDelay: '300ms'}}>
                                <button 
                                    onClick={() => navigate('/login')} 
                                    className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] text-lg font-bold shadow-xl hover:shadow-pink-500/30 hover:-translate-y-1 transition-all bg-gradient-to-r from-pink-500 to-rose-400 text-white border border-pink-400"
                                >
                                    Start Organizing
                                </button>
                                <button 
                                    onClick={() => scrollToSection('about')} 
                                    className="w-full sm:w-auto px-10 py-4 border border-slate-200/80 bg-white/70 backdrop-blur-md hover:bg-white transition-all rounded-[1.5rem] text-lg font-bold text-slate-700 shadow-sm hover:shadow"
                                >
                                    Discover Features
                                </button>
                            </div>
                        </div>

                        <div className="mt-20 mx-auto max-w-5xl animate-fade-up" style={{animationDelay: '400ms'}}>
                            <div className="rounded-[2.5rem] p-3 sm:p-5 shadow-[0_20px_60px_rgba(244,114,182,0.15)] glass-panel border border-white/60 relative group cursor-pointer overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-pink-50/20 to-transparent pointer-events-none z-10 rounded-[2.5rem]" />
                                <img 
                                    src="/Landingpage.png" 
                                    alt="WedTrack Dashboard Preview" 
                                    className="w-full rounded-[2rem] object-cover border border-slate-100/50 relative z-0 transition-all duration-700 group-hover:grayscale group-hover:scale-[1.02]"
                                />
                            </div>
                        </div>
                    </div>
                </section>
                {/* About Section */}
                <section id="about" className="py-24 relative z-10">
                    <ScrollReveal className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mb-16 mx-auto text-center">
                            <h2 className="text-4xl sm:text-5xl font-black mb-6 text-slate-800">The Modern Reception</h2>
                            <div className="h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-rose-300" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            <div className="p-10 rounded-[2.5rem] border border-white/60 glass-panel shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(244,114,182,0.1)] transition-all relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-pink-300 transition-colors" />
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-slate-400">
                                    <ListX size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-slate-800">The Chaos of Paper</h3>
                                <p className="leading-relaxed text-slate-500 font-medium">Physical guest lists and unrecorded gift envelopes lead to financial leaks, confusion at the gates, and unnecessary wedding day stress. The traditional system is fractured.</p>
                            </div>

                            <div className="p-10 rounded-[2.5rem] border border-white/60 glass-panel shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(244,114,182,0.1)] transition-all relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-emerald-400 transition-colors" />
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-emerald-500">
                                    <HeartHandshake size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-slate-800">The Digital Harmony</h3>
                                <p className="leading-relaxed text-slate-500 font-medium">Smart QR passes guarantee secure entry while providing a unified, real-time view of attendance and financial gifts, protecting the integrity of your celebration.</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                <ScrollReveal animation="fade-up">
                    <HowItWorksSection />
                </ScrollReveal>

                {/* Features Section */}
                <section id="features" className="py-24 relative z-10">
                    <ScrollReveal className="container mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-4xl sm:text-5xl font-black mb-6 text-slate-800">Designed for Joy</h2>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {[
                                { title: 'Seamless QR Entry', desc: 'Secure, unique QR codes instantly authorizing your esteemed guests.', icon: QrCode },
                                { title: 'Live Gift Ledger', desc: 'Immaculate real-time tracking of wishes and financial contributions.', icon: Send },
                                { title: 'Unified Dashboard', desc: 'A stunning comprehensive view of all events, attendees, and metrics.', icon: LayoutDashboard },
                                { title: 'Smart Alerts', desc: 'Zero-clutter transparent notifications for crucial reception milestones.', icon: Bell }
                            ].map((feature, i) => (
                                <div key={i} className="p-8 rounded-[2.5rem] border border-white/60 glass-panel shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(244,114,182,0.12)] hover:-translate-y-2 transition-all duration-400">
                                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center mb-6 shadow-sm border border-pink-100 bg-white text-pink-500">
                                        <feature.icon size={26} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-slate-800">{feature.title}</h3>
                                    <p className="text-sm leading-relaxed text-slate-500 font-medium">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>
                </section>

                {/* Trusted By Couples Section */}
                <section className="py-20 sm:py-24 relative z-10">
                    <ScrollReveal className="container mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                            <div className="flex items-center justify-center gap-1 mb-4 sm:gap-1.5 sm:mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={20} className="text-amber-400 fill-amber-400 drop-shadow-sm sm:size-6" />
                                ))}
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black mb-6 text-slate-800 tracking-tight">Trusted By Couples</h2>
                            <div className="h-1.5 w-16 sm:w-24 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-rose-300 opacity-60" />
                        </div>

                        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
                            {/* Gradient Fades for depth - blending with the section background */}
                            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-[#fdfbfb] to-transparent z-10 pointer-events-none" />
                            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-[#fdfbfb] to-transparent z-10 pointer-events-none" />

                            <div className="flex gap-4 sm:gap-8 animate-marquee hover:[animation-play-state:paused] w-max py-6 sm:py-10 px-4">
                                {[
                                    { name: 'Rajkumar & Priya', msg: "Absolutely stunning software. The QR invites made our reception flawlessly smooth, and the modern UI was a joy to use.", pic: "https://i.pravatar.cc/150?img=47" },
                                    { name: 'Rahul & Neha', msg: "The pastel UI and glass feel fits exactly the vibe we wanted for our wedding organization. Super reliable.", pic: "https://i.pravatar.cc/150?img=33" },
                                    { name: 'Sneha & Rohan', msg: "So effortless! Tracking all the gifts securely through the dashboard removed an entire layer of post-wedding stress.", pic: "https://i.pravatar.cc/150?img=44" }
                                ].concat([
                                    { name: 'Rajkumar & Priya', msg: "Absolutely stunning software. The QR invites made our reception flawlessly smooth, and the modern UI was a joy to use.", pic: "https://i.pravatar.cc/150?img=47" },
                                    { name: 'Rahul & Neha', msg: "The pastel UI and glass feel fits exactly the vibe we wanted for our wedding organization. Super reliable.", pic: "https://i.pravatar.cc/150?img=33" },
                                    { name: 'Sneha & Rohan', msg: "So effortless! Tracking all the gifts securely through the dashboard removed an entire layer of post-wedding stress.", pic: "https://i.pravatar.cc/150?img=44" }
                                ]).concat([
                                    { name: 'Rajkumar & Priya', msg: "Absolutely stunning software. The QR invites made our reception flawlessly smooth, and the modern UI was a joy to use.", pic: "https://i.pravatar.cc/150?img=47" },
                                    { name: 'Rahul & Neha', msg: "The pastel UI and glass feel fits exactly the vibe we wanted for our wedding organization. Super reliable.", pic: "https://i.pravatar.cc/150?img=33" },
                                    { name: 'Sneha & Rohan', msg: "So effortless! Tracking all the gifts securely through the dashboard removed an entire layer of post-wedding stress.", pic: "https://i.pravatar.cc/150?img=44" }
                                ]).map((review, i) => (
                                    <div key={i} className="w-[280px] sm:w-[450px] p-6 sm:p-10 rounded-[2rem] border border-white/40 glass-panel flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out flex-shrink-0">
                                        <p className="italic text-slate-600 mb-6 sm:mb-8 leading-relaxed font-medium text-sm sm:text-lg">"{review.msg}"</p>
                                        <div className="flex items-center gap-3 sm:gap-4 mt-auto">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-pink-100 rounded-full animate-pulse opacity-40" />
                                                <img src={review.pic} alt={review.name} className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white shadow-md object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="font-bold text-xs sm:text-base tracking-wide text-slate-800">{review.name}</h4>
                                                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Couple</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* Doubt Section */}
                <section id="doubt" className="py-24 relative z-10">
                    <ScrollReveal className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-5xl mx-auto rounded-[3rem] overflow-hidden flex flex-col md:flex-row border border-white/80 shadow-[0_20px_50px_rgba(244,114,182,0.1)] glass-panel">
                            <div className="p-10 sm:p-14 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200/60 bg-white/40">
                                <h2 className="text-4xl font-black mb-6 text-slate-800">Need Assistance?</h2>
                                <p className="mb-10 text-lg leading-relaxed text-slate-500 font-medium">Our delightful support team is here for you throughout your planning phase. Direct replies, zero bots.</p>
                                <div className="space-y-6 text-sm font-bold text-slate-700">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500"><Phone size={18} /></div>
                                        <span>+91 9149891771</span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500"><Mail size={18} /></div>
                                        <span>hi@wedtrack.in</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 sm:p-14 md:w-1/2 bg-white/80 backdrop-blur-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 blur-[40px] rounded-full pointer-events-none" />
                                <form onSubmit={handleWhatsAppSubmit} className="space-y-6 relative z-10">
                                    <div>
                                        <label className="block text-[11px] font-bold mb-2 uppercase tracking-[0.15em] text-slate-400">Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={doubtName}
                                            onChange={(e) => setDoubtName(e.target.value)}
                                            placeholder="Your full name"
                                            className="w-full px-6 py-4 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 bg-white transition-all shadow-inner text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold mb-2 uppercase tracking-[0.15em] text-slate-400">Inquiry Message</label>
                                        <textarea 
                                            rows={3} 
                                            required
                                            value={doubtMessage}
                                            onChange={(e) => setDoubtMessage(e.target.value)}
                                            placeholder="How can we assist you?"
                                            className="w-full px-6 py-4 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 bg-white transition-all shadow-inner text-slate-700 resize-none"
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white shadow-[0_8px_15px_rgba(0,0,0,0.1)]">
                                        Send Message
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>
                
                {/* FAQ Section */}
                <ScrollReveal>
                    <FAQSection />
                </ScrollReveal>
            </main>

            {/* Footer */}
            <footer className="pt-24 pb-10 border-t border-slate-200/60 bg-white/40 backdrop-blur-lg relative z-10">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12 sm:mb-16 pb-12 sm:pb-16 border-b border-slate-200/80">
                        <div className="col-span-2 space-y-6">
                            <Logo size="lg" />
                            <p className="max-w-sm leading-relaxed text-[13px] sm:text-sm text-slate-500 font-medium">The elegant, uncompromised solution to wedding management. Secure invitations, real-time logging, and beautiful tracking.</p>
                            <div className="flex gap-3 sm:gap-4 pt-2">
                                {[
                                    { Icon: Instagram, href: "https://www.instagram.com/wedtrackss/" },
                                    { Icon: Linkedin, href: "https://www.linkedin.com/in/wedtrack" }
                                ].map(({Icon, href}, i) => (
                                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110 hover:border-pink-300 hover:text-pink-500 text-slate-500">
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>
                        
                        <div className="col-span-1">
                            <h4 className="font-extrabold text-[10px] sm:text-[11px] mb-6 tracking-widest uppercase text-slate-800">Quick Links</h4>
                            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-medium text-slate-500">
                                {navItems.map((item) => (
                                    <li key={item.label}>
                                        <button onClick={() => scrollToSection(item.sectionId)} className="hover:text-pink-500 transition-colors">
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="col-span-1">
                            <h4 className="font-extrabold text-[10px] sm:text-[11px] mb-6 tracking-widest uppercase text-slate-800">Contact</h4>
                            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-medium text-slate-500">
                                <li className="flex items-center gap-2 sm:gap-3 hover:text-slate-800"><MapPin size={14} className="text-pink-400 shrink-0"/> Coimbatore</li>
                                <li className="flex items-center gap-2 sm:gap-3 hover:text-slate-800"><Phone size={14} className="text-pink-400 shrink-0"/> +91 91498...</li>
                                <li className="flex items-center gap-2 sm:gap-3 hover:text-slate-800"><Mail size={14} className="text-pink-400 shrink-0"/> hi@wed...</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="text-center mb-8" style={{ fontSize: '14px' }}>
                        <a href="/privacy" className="hover:text-pink-500 transition-colors">Privacy policy</a> | 
                        <a href="/terms" className="hover:text-pink-500 transition-colors ml-1">Terms of Service</a>
                    </div>
                    
                    <div className="text-center text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
                        © 2024 WedTrack. Elegantly Crafted for Your Special Day.
                    </div>
                </div>
            </footer>
        </div>
    );
}
