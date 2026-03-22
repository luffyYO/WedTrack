import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore, useThemeStore } from '@/store';
import { 
    Linkedin, 
    Instagram, 
    Facebook, 
    Menu, 
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
    Moon,
    Sun
} from 'lucide-react';
import MobileMenuPanel from '@/components/navigation/MobileMenuPanel';

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const { isDarkMode, toggleDarkMode } = useThemeStore();
    
    // 3D Animated Splash Screen
    const [showSplash, setShowSplash] = useState(true);

    // State for Doubt Form
    const [doubtName, setDoubtName] = useState('');
    const [doubtMessage, setDoubtMessage] = useState('');

    useEffect(() => {
        // Delay to show splash screen
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);
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
        const text = `*New Doubt/Feedback from WedTrack Landing*%0A%0A*Name:* ${doubtName}%0A*Message:* ${doubtMessage}`;
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
            <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-colors duration-1000 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="relative animate-spin-3d">
                    <img 
                        src="/logo.jpeg" 
                        alt="WedTrack 3D Logo" 
                        className={`w-40 h-40 rounded-full object-cover shadow-2xl border-4 ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`} 
                    />
                </div>
            </div>
        );
    }

    // Theme Variables for Monochrome Look
    const mainBg = isDarkMode ? 'bg-black text-white' : 'bg-white text-black';
    const altBg = isDarkMode ? 'bg-neutral-900' : 'bg-neutral-50';
    const cardBg = isDarkMode ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-white' : 'bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-black';
    const textMuted = isDarkMode ? 'text-neutral-400' : 'text-neutral-500';
    const invertBtn = isDarkMode ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800';
    const borderLine = isDarkMode ? 'border-neutral-800' : 'border-neutral-200';
    const headerBg = isDarkMode ? 'bg-black/90 border-neutral-800' : 'bg-white/90 border-neutral-100';

    const Logo = ({ size = "md" }) => (
        <div className="flex items-center gap-3">
            <img 
                src="/logo.jpeg" 
                alt="WedTrack logo" 
                className={`${size === "lg" ? "w-14 h-14" : "w-10 h-10"} rounded-full object-cover shadow-sm border border-neutral-200`}
            />
            <span className={`font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'} ${size === "lg" ? "text-3xl" : "text-xl"}`}>
                WedTrack
            </span>
        </div>
    );

    const navItems = [
        { label: 'About', sectionId: 'about', icon: Info },
        { label: 'Features', sectionId: 'features', icon: Sparkles },
        { label: 'Doubt', sectionId: 'doubt', icon: HelpCircle }
    ];

    const mobileNavItems = navItems.map(item => ({
        label: item.label,
        icon: item.icon,
        onClick: () => scrollToSection(item.sectionId)
    }));

    return (
        <div className={`min-h-screen font-sans overflow-x-hidden relative transition-colors duration-500 ${mainBg}`}>
            
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-500 ${headerBg}`}>
                <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <Logo />
                    
                    <div className="flex items-center gap-3 sm:gap-6">
                        {/* Day / Night Toggle */}
                        <button 
                            onClick={toggleDarkMode}
                            aria-label="Toggle Dark Mode"
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-neutral-800 text-yellow-400 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button 
                            onClick={() => navigate('/login')}
                            className={`px-5 py-2 rounded-full font-bold transition-all text-sm tracking-wide ${invertBtn}`}
                        >
                            LOGIN
                        </button>

                        <button 
                            className={`p-2 transition-colors ${isDarkMode ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-600'}`}
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenuPanel 
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                items={mobileNavItems}
            />
            
            <main className="pt-20 sm:pt-28 relative z-10">
                {/* Hero Section */}
                <section className="relative py-16 sm:py-24 overflow-hidden px-4">
                    <div className="container mx-auto">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase border shadow-sm mb-8 animate-fade-in ${isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-300 text-black'}`}>
                                <Sparkles size={16} />
                                <span>The Minimalist Wedding Platform</span>
                            </div>
                            
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 animate-fade-in-up">
                                Uncompromised <br />
                                <span>Simplicity.</span>
                            </h1>
                            
                            <p className={`text-xl max-w-2xl mx-auto leading-relaxed mb-12 animate-fade-in-up delay-100 ${textMuted}`}>
                                We removed all the noise so you can focus on the signal. Manage guests, log entries securely with QR codes, and track gifts in real-time.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
                                <button 
                                    onClick={() => navigate('/login')} 
                                    className={`w-full sm:w-auto px-10 py-5 rounded-full text-lg font-bold shadow-lg hover:-translate-y-1 transition-all ${invertBtn}`}
                                >
                                    Start Managing
                                </button>
                                <button 
                                    onClick={() => scrollToSection('about')} 
                                    className={`w-full sm:w-auto px-10 py-5 border-2 transition-all rounded-full text-lg font-bold ${isDarkMode ? 'border-neutral-700 hover:border-neutral-500 text-white' : 'border-neutral-300 hover:border-neutral-500 text-black'}`}
                                >
                                    Learn More
                                </button>
                            </div>
                        </div>

                        <div className="mt-20 mx-auto max-w-5xl animate-fade-in delay-300">
                            <div className={`rounded-3xl p-2 sm:p-4 shadow-2xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-100 border-neutral-200'}`}>
                                <img 
                                    src="/Landingpage.png" 
                                    alt="WedTrack Dashboard Preview" 
                                    className="w-full rounded-2xl grayscale hover:grayscale-0 transition-all duration-1000 object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className={`py-24 border-y ${altBg} ${borderLine}`}>
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mb-16 mx-auto text-center">
                            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">The Modern Problem</h2>
                            <div className={`h-1 w-24 mx-auto rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            <div className={`p-10 rounded-[2rem] border transition-all ${cardBg}`}>
                                <div className="font-mono text-xl mb-4 font-bold opacity-50">01.</div>
                                <h3 className="text-2xl font-bold mb-4">The Chaos of Paper</h3>
                                <p className={`leading-relaxed ${textMuted}`}>Physical guest lists and unrecorded gift envelopes lead to financial leaks, confusion at the gates, and unnecessary wedding day stress.</p>
                            </div>

                            <div className={`p-10 rounded-[2rem] border transition-all ${cardBg}`}>
                                <div className="font-mono text-xl mb-4 font-bold opacity-50">02.</div>
                                <h3 className="text-2xl font-bold mb-4">The Digital Order</h3>
                                <p className={`leading-relaxed ${textMuted}`}>Smart QR passes guarantee secure entry. Real-time dashboards provide a unified view of attendance and gift tracking instantly.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">Built for Efficiency</h2>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {[
                                { title: 'QR Entry', desc: 'Secure, unique QR codes eliminating unauthorized access.', icon: QrCode },
                                { title: 'Live Ledger', desc: 'Real-time tracking of wishes and financial gifts.', icon: Send },
                                { title: 'Dashboard', desc: 'A unified view of guests, events, and metrics.', icon: LayoutDashboard },
                                { title: 'Alerts', desc: 'Zero-clutter notifications for crucial milestones.', icon: Bell }
                            ].map((feature, i) => (
                                <div key={i} className={`p-8 rounded-[2rem] border transition-all duration-300 hover:-translate-y-2 ${cardBg}`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${invertBtn}`}>
                                        <feature.icon size={26} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className={`text-sm leading-relaxed ${textMuted}`}>{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Review Section */}
                <section className={`py-24 border-y ${altBg} ${borderLine}`}>
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">Tested & Proven</h2>
                            <div className="flex items-center justify-center gap-1.5 opacity-80">
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {[
                                { name: 'Rajkumar & Priya', msg: "Finally, a tool that strips away the fluff. QR entry worked flawlessly at the gates.", pic: "https://i.pravatar.cc/150?img=47" },
                                { name: 'Rahul & Neha', msg: "The monochrome dashboard was a relief to our eyes during stressful planning nights. Excellent.", pic: "https://i.pravatar.cc/150?img=33" },
                                { name: 'Sneha & Rohan', msg: "Pure functionality wrapped in a minimalist design. Exactly what we needed to track our event.", pic: "https://i.pravatar.cc/150?img=44" }
                            ].map((review, i) => (
                                <div key={i} className={`p-8 rounded-[2rem] border transition-all hover:-translate-y-1 ${cardBg}`}>
                                    <p className={`italic text-lg mb-8 leading-relaxed ${textMuted}`}>"{review.msg}"</p>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <img src={review.pic} alt={review.name} className="w-12 h-12 rounded-full border border-neutral-400 grayscale" />
                                        <h4 className="font-bold text-sm uppercase tracking-wide">{review.name}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Doubt Section */}
                <section id="doubt" className="py-24">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className={`max-w-5xl mx-auto rounded-[3rem] overflow-hidden flex flex-col md:flex-row border shadow-xl ${cardBg}`}>
                            <div className={`p-10 sm:p-14 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r ${borderLine}`}>
                                <h2 className="text-4xl font-extrabold mb-6">Inquiries.</h2>
                                <p className={`mb-10 text-lg leading-relaxed ${textMuted}`}>Direct support when you need it. No bots, no wait times.</p>
                                <div className="space-y-6 text-sm font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-5">
                                        <Phone size={20} />
                                        <span>+91 9149891771</span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <Mail size={20} />
                                        <span>hi@wedtrack.in</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`p-10 sm:p-14 md:w-1/2 ${isDarkMode ? 'bg-neutral-800/30' : 'bg-neutral-50/50'}`}>
                                <form onSubmit={handleWhatsAppSubmit} className="space-y-6">
                                    <div>
                                        <label className={`block text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Identifier</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={doubtName}
                                            onChange={(e) => setDoubtName(e.target.value)}
                                            placeholder="Your Name"
                                            className={`w-full px-6 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-current bg-transparent font-medium ${borderLine} ${textMuted}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Message</label>
                                        <textarea 
                                            rows={3} 
                                            required
                                            value={doubtMessage}
                                            onChange={(e) => setDoubtMessage(e.target.value)}
                                            placeholder="State your inquiry..."
                                            className={`w-full px-6 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-current bg-transparent font-medium resize-none ${borderLine} ${textMuted}`}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className={`w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${invertBtn}`}>
                                        Transmit
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className={`pt-24 pb-10 border-t ${cardBg}`}>
                <div className="container mx-auto px-4 sm:px-6">
                    <div className={`grid md:grid-cols-4 gap-12 mb-16 pb-16 border-b ${borderLine}`}>
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <Logo size="lg" />
                            <p className={`max-w-sm leading-relaxed text-sm ${textMuted}`}>The brutalist, uncompromised solution to wedding management. Secure protocol, encrypted paths, and live telemetry.</p>
                            <div className="flex gap-4 pt-4">
                                {[Linkedin, Instagram, Facebook].map((Icon, i) => (
                                    <a key={i} href="#" className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'border-neutral-700 hover:bg-white hover:text-black' : 'border-neutral-300 hover:bg-black hover:text-white'}`}>
                                        <Icon size={20} />
                                    </a>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-extrabold text-xs mb-6 tracking-widest uppercase">Index</h4>
                            <ul className={`space-y-4 text-sm font-medium ${textMuted}`}>
                                {navItems.map((item) => (
                                    <li key={item.label}>
                                        <button onClick={() => scrollToSection(item.sectionId)} className="hover:opacity-60 transition-opacity">
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-extrabold text-xs mb-6 tracking-widest uppercase">Nodes</h4>
                            <ul className={`space-y-4 text-sm font-medium ${textMuted}`}>
                                <li className="flex items-center gap-3"><MapPin size={16}/> Delhi NCR</li>
                                <li className="flex items-center gap-3"><Phone size={16}/> +91 9149891771</li>
                                <li className="flex items-center gap-3"><Mail size={16}/> hi@wedtrack.in</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className={`text-center text-xs font-bold tracking-[0.3em] uppercase opacity-50`}>
                        © 2024 WedTrack. ALL SYSTEMS OPERATIONAL.
                    </div>
                </div>
            </footer>
        </div>
    );
}
