import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
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
    Send
} from 'lucide-react';
import Button from '@/components/ui/Button';
import MobileMenuPanel from '@/components/navigation/MobileMenuPanel';

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // State for Doubt Form
    const [doubtName, setDoubtName] = useState('');
    const [doubtMessage, setDoubtMessage] = useState('');

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/home');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const Logo = ({ size = "md" }) => (
        <div className="flex items-center gap-2">
            <div className={`${size === "lg" ? "w-14 h-14" : "w-10 h-10"} rounded-full bg-primary-600 flex items-center justify-center shadow-lg border-2 border-white`}>
                <svg viewBox="0 0 14 14" fill="none" className={`${size === "lg" ? "w-8 h-8" : "w-6 h-6"}`}>
                    <path
                        d="M2 4L4.5 10L7 5.5L9.5 10L12 4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <span className={`font-bold tracking-tight text-neutral-900 ${size === "lg" ? "text-3xl" : "text-xl"}`}>WedTrack</span>
        </div>
    );

    const navItems = [
        { label: 'About', sectionId: 'about', icon: Info },
        { label: 'New Feature', sectionId: 'features', icon: Sparkles },
        { label: 'Doubt', sectionId: 'doubt', icon: HelpCircle }
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };

    const handleWhatsAppSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const adminNumber = '9149891771';
        const text = `*New Doubt/Feedback from WedTrack Landing*%0A%0A*Name:* ${doubtName}%0A*Message:* ${doubtMessage}`;
        window.open(`https://wa.me/${adminNumber}?text=${text}`, '_blank');
        setDoubtName('');
        setDoubtMessage('');
    };

    const mobileNavItems = navItems.map(item => ({
        label: item.label,
        icon: item.icon,
        onClick: () => scrollToSection(item.sectionId)
    }));

    return (
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 overflow-x-hidden relative" style={{ scrollPaddingTop: '80px' }}>
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <Logo />
                    
                    <div className="flex items-center gap-1.5 sm:gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate('/login')}
                            className="text-neutral-600 hover:text-primary-600 font-bold"
                        >
                            Login
                        </Button>
                        <Button 
                            size="sm"
                            onClick={() => navigate('/signup')}
                            className="bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all rounded-full px-4 sm:px-6 py-2 font-bold whitespace-nowrap"
                        >
                            Signup
                        </Button>
                        <button 
                            className="p-2 text-neutral-600 hover:text-primary-600 transition-colors"
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
            
            {/* Wedding Background Decorations (Global) */}
            <div className="wedding-bg">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i} 
                        className="petal"
                        style={{
                            left: `${Math.random() * 100}vw`,
                            width: `${15 + Math.random() * 25}px`,
                            height: `${15 + Math.random() * 25}px`,
                            animationDuration: `${15 + Math.random() * 15}s, ${6 + Math.random() * 4}s`,
                            animationDelay: `${-Math.random() * 20}s, 0s`,
                            opacity: 0.6 + Math.random() * 0.4
                        }}
                    />
                ))}
                
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i} 
                        className="sparkle"
                        style={{
                            top: `${Math.random() * 100}vh`,
                            left: `${Math.random() * 100}vw`,
                            '--duration': `${2 + Math.random() * 3}s`
                        } as React.CSSProperties}
                    />
                ))}

                <div className="floral-decor top-0 left-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/floral-paper.png')] -rotate-45 opacity-10" />
                <div className="floral-decor bottom-0 right-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/floral-paper.png')] rotate-135 opacity-10" />
            </div>

            <main className="pt-2 sm:pt-4 relative z-10">
                {/* Hero Section */}
                <section className="relative py-4 sm:py-6 overflow-hidden px-4">
                    <div className="container mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div className="text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-bold text-sm tracking-wide border border-primary-100 shadow-sm mb-2 animate-fade-in">
                                    <Sparkles size={16} />
                                    <span>Revolutionizing Wedding Planning</span>
                                </div>
                                
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1] mb-3 animate-fade-in-up">
                                    The Future of <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                                        Wedding Management
                                    </span>
                                </h1>
                                
                                <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl leading-relaxed mb-4 animate-fade-in-up delay-100">
                                    WedTrack simplifies every aspect of your special day. From guest entry to real-time payment tracking, we ensure your wedding is perfect.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 animate-fade-in-up delay-200">
                                    <Button 
                                        size="lg" 
                                        onClick={() => navigate('/signup')} 
                                        className="w-full sm:w-auto px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-full text-lg font-bold"
                                    >
                                        Create Wedding QR
                                    </Button>
                                    <Button 
                                        size="lg" 
                                        variant="outline" 
                                        onClick={() => scrollToSection('about')} 
                                        className="w-full sm:w-auto px-10 py-4 border-2 border-neutral-200 hover:border-primary-600 text-neutral-700 hover:text-primary-600 transition-all rounded-full text-lg font-bold bg-white/50 backdrop-blur-sm"
                                    >
                                        Learn More
                                    </Button>
                                </div>
                            </div>

                            <div className="hidden md:flex justify-end animate-fade-in delay-300 mt-0">
                                <div className="relative w-full max-w-sm">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-400/20 rounded-[2rem] blur-3xl" />
                                    <img 
                                        src="/Landingpage.png" 
                                        alt="WedTrack Landing" 
                                        className="relative w-full rounded-3xl shadow-2xl object-contain border-2 border-white/20 hover:scale-105 transition-transform duration-500"
                                        style={{ aspectRatio: '4/5', minHeight: '350px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="py-24 bg-neutral-900 text-white relative">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mb-16">
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">How We Solve <br />The Problem</h2>
                            <div className="h-1.5 w-24 bg-primary-600 rounded-full" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <div className="bg-neutral-800/50 p-8 rounded-3xl border border-neutral-700 transition-colors group">
                                    <div className="text-primary-400 font-bold mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30 group-hover:bg-primary-500 group-hover:text-white transition-all text-sm italic">01</span>
                                        <span>Traditional Struggles</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">Chaotic Guest Management</h3>
                                    <p className="text-neutral-400 leading-relaxed">Manual logs, paper entries, and unrecorded expenses lead to financial leaks and planning stress.</p>
                                </div>

                                <div className="bg-neutral-800/50 p-8 rounded-3xl border border-neutral-700 transition-colors group">
                                    <div className="text-primary-400 font-bold mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30 group-hover:bg-primary-500 group-hover:text-white transition-all text-sm italic">02</span>
                                        <span>The Solution</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">Automated Excellence</h3>
                                    <p className="text-neutral-400 leading-relaxed">Integrated QR codes for entries, real-time dashboard, and automated expense tracking keep everything under control.</p>
                                </div>
                            </div>

                            <div className="relative aspect-square bg-gradient-to-br from-primary-600/20 to-neutral-800 rounded-3xl border border-neutral-700 flex items-center justify-center p-12 overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                                <div className="relative z-10 text-center space-y-6">
                                    <div className="w-24 h-24 rounded-full bg-primary-600 mx-auto flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                                        <QrCode size={40} className="text-white" />
                                    </div>
                                    <h4 className="text-2xl font-bold">Smart Entry System</h4>
                                    <p className="text-neutral-400 text-sm">One scan to record attendance, gift details, and entry timing instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Premium Features</h2>
                            <p className="text-neutral-500 font-medium">Everything you need to manage your wedding like a pro.</p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            {[
                                { title: 'QR Guest Entry', desc: 'Secure and fast entry with unique QR codes for every guest.', icon: QrCode },
                                { title: 'Payment Tracking', desc: 'Instant updates on all wedding payments and vendor expenses.', icon: Send },
                                { title: 'Full Dashboard', desc: 'Real-time overview of events, guests, and total budget.', icon: LayoutDashboard },
                                { title: 'Notifications', desc: 'Smart alerts for upcoming payments and important tasks.', icon: Bell }
                            ].map((feature, i) => (
                                <div key={i} className="p-8 rounded-3xl bg-neutral-50 border border-neutral-100 hover:bg-white hover:shadow-2xl transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all">
                                        <feature.icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Doubt Section */}
                <section id="doubt" className="py-24 bg-primary-50 relative overflow-hidden">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-primary-100">
                            <div className="p-8 sm:p-12 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-neutral-100">
                                <h2 className="text-4xl font-extrabold mb-6">Have a Doubt?</h2>
                                <p className="text-neutral-500 mb-8 font-medium">Message us any time. Our team is here to help you make your wedding seamless.</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-neutral-600">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600"><Phone size={18} /></div>
                                        <span className="font-bold">+91 9149891771</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-neutral-600">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600"><Mail size={18} /></div>
                                        <span className="font-bold">hi@wedtrack.in</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 sm:p-12 md:w-1/2 bg-neutral-50/50">
                                <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wide">Your Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={doubtName}
                                            onChange={(e) => setDoubtName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full px-6 py-4 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wide">Your Query</label>
                                        <textarea 
                                            rows={4} 
                                            required
                                            value={doubtMessage}
                                            onChange={(e) => setDoubtMessage(e.target.value)}
                                            placeholder="How can we help?"
                                            className="w-full px-6 py-4 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white font-medium resize-none"
                                        ></textarea>
                                    </div>
                                    <Button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-lg font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95">
                                        Submit Feedback
                                        <Send size={18} />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Review Section */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Loved by Couples</h2>
                            <div className="flex items-center justify-center gap-1 text-yellow-400">
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <span className="text-neutral-400 ml-2 font-bold">5.0/5.0 rating</span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { name: 'rajkumar & priya', msg: "WedTrack made our guest management so easy. The QR entry was a huge hit!", pic: "https://i.pravatar.cc/150?u=1" },
                                { name: 'Rahul & Priya', msg: "Tracking payments was my biggest worry, but the dashboard kept us on budget.", pic: "https://i.pravatar.cc/150?u=2" },
                                { name: 'Sneha & Rohan', msg: "Super professional and sleek UI. Highly recommended for modern weddings.", pic: "https://i.pravatar.cc/150?u=3" }
                            ].map((review, i) => (
                                <div key={i} className="p-8 rounded-[2.5rem] bg-neutral-50 border border-neutral-100 flex flex-col h-full hover:bg-white hover:shadow-2xl transition-all group">
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={review.pic} alt={review.name} className="w-14 h-14 rounded-full border-2 border-white shadow-md grayscale group-hover:grayscale-0 transition-all" />
                                        <div>
                                            <h4 className="font-extrabold text-neutral-900">{review.name}</h4>
                                            <div className="flex text-yellow-500"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                                        </div>
                                    </div>
                                    <p className="text-neutral-500 italic leading-relaxed flex-grow">"{review.msg}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-neutral-900 text-white pt-20 pb-10 relative z-10">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-16 pb-16 border-b border-neutral-800">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <Logo size="lg" />
                            <p className="text-neutral-400 max-w-sm leading-relaxed font-medium">The most advanced platform for modern wedding management. Seamless, secure, and smart.</p>
                            <div className="flex gap-4">
                                {[Linkedin, Instagram, Facebook].map((Icon, i) => (
                                    <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-primary-600 hover:text-white transition-all shadow-lg hover:-translate-y-1">
                                        <Icon size={22} />
                                    </a>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-extrabold text-lg mb-6 tracking-wide uppercase">Quick Links</h4>
                            <ul className="space-y-4 text-neutral-400 font-medium">
                                {navItems.map((item) => (
                                    <li key={item.label}>
                                        <button onClick={() => scrollToSection(item.sectionId)} className="hover:text-primary-500 transition-colors text-left w-full">
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-extrabold text-lg mb-6 tracking-wide uppercase">Contact</h4>
                            <ul className="space-y-4 text-neutral-400 font-medium">
                                <li className="flex items-center gap-3"><MapPin size={18} className="text-primary-500"/> Delhi NCR</li>
                                <li className="flex items-center gap-3"><Phone size={18} className="text-primary-500"/> +91 9149891771</li>
                                <li className="flex items-center gap-3"><Mail size={18} className="text-primary-500"/> hi@wedtrack.in</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="text-center text-neutral-500 text-sm font-bold tracking-widest uppercase">
                        © 2024 WedTrack. ALL RIGHTS RESERVED.
                    </div>
                </div>
            </footer>
        </div>
    );
}
