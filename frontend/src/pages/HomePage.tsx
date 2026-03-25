import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutDashboard, HeartHandshake, QrCode, Star, Sparkles, Navigation } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';
import { WeddingNameDisplay } from '@/components/ui';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store';

// ─── QR Status Dot ───────────────────────────────────────────────────────────

type QrStatus = 'active' | 'expiring' | 'expired' | 'inactive';

function getQrStatus(activationTime: string | null, expiryTime: string | null): QrStatus {
    if (!activationTime || !expiryTime) return 'inactive';
    const now = Date.now();
    const activation = new Date(activationTime).getTime();
    const expiry = new Date(expiryTime).getTime();
    if (now < activation) return 'inactive';
    if (now >= expiry) return 'expired';
    // Within 48 hours of expiry → expiring soon
    if (expiry - now <= 48 * 60 * 60 * 1000) return 'expiring';
    return 'active';
}

const STATUS_CONFIG: Record<QrStatus, { color: string; label: string }> = {
    active:   { color: 'bg-emerald-400',  label: 'Active'         },
    expiring: { color: 'bg-amber-400',    label: 'Expiring Soon'  },
    expired:  { color: 'bg-rose-500',     label: 'Expired'        },
    inactive: { color: 'bg-slate-300',    label: 'Not Yet Active' },
};

function QrStatusDot({ activationTime, expiryTime }: { activationTime: string | null; expiryTime: string | null }) {
    const status = getQrStatus(activationTime, expiryTime);
    const { color, label } = STATUS_CONFIG[status];
    return (
        <div className="group absolute top-4 right-4 z-10">
            <span className={`block w-3.5 h-3.5 rounded-full ${color} shadow-sm border-[2px] border-white/80`} />
            {/* Tooltip */}
            <span className="pointer-events-none absolute top-6 right-0 z-10 whitespace-nowrap rounded-[var(--radius-md)] bg-slate-800/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl">
                {label}
            </span>
        </div>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [weddings, setWeddings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await apiClient.get('/weddings');
                if (data.data) {
                    setWeddings(data.data);
                }
            } catch (err) {
                console.error("Failed to load home page stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="w-full pb-10 px-4 sm:px-6 animate-fade-up">
            <PageHeader
                title="Platform Overview"
                description={`Welcome back, ${user?.user_metadata?.first_name || 'Admin'}!`}
                action={
                    <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="secondary"
                            size="md"
                            icon={<LayoutDashboard size={16} />}
                            onClick={() => navigate('/dashboard')}
                        >
                            Open Dashboard
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            icon={<Plus size={16} />}
                            onClick={() => navigate('/wedding-track/new')}
                        >
                            Create Track
                        </Button>
                    </div>
                }
            />

            <div className="mt-8 max-w-[1000px] mx-auto space-y-12">
                {/* ── Premium Primary Statistic Card ── */}
                <div className="flex justify-center">
                    <div className="glass-panel rounded-[2rem] p-10 text-slate-800 w-full max-w-[420px] relative overflow-hidden flex flex-col items-center justify-center text-center transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 group border-[1.5px] border-white/70">
                        {/* Soft background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/40 to-transparent pointer-events-none" />
                        <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                            <HeartHandshake size={180} />
                        </div>
                        
                        <div className="relative z-10 w-full">
                            <h3 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[11px] mb-4">
                                Fleet Status
                            </h3>
                            {loading ? (
                                <div className="animate-pulse h-16 w-24 bg-slate-200/50 rounded-2xl mx-auto mt-2 mb-4"></div>
                            ) : (
                                <div className="text-7xl font-black tracking-tighter leading-none bg-gradient-to-br from-slate-800 to-slate-500 bg-clip-text text-transparent mb-4">
                                    {weddings.length}
                                </div>
                            )}
                            <div className="text-[13px] text-slate-600 font-semibold uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
                                Active Events
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Weddings List ── */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2.5">
                        <Navigation size={22} className="text-pink-400" />
                        Your Tracked Weddings
                    </h2>
                
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-panel p-4 sm:p-5 rounded-2xl h-[180px] flex flex-col justify-between animate-pulse">
                                <div className="space-y-3 w-full mt-2">
                                    <div className="h-6 bg-slate-200/50 rounded-md w-3/4"></div>
                                    <div className="h-5 bg-slate-200/50 rounded-md w-1/2 bg-white/40"></div>
                                    <div className="h-5 bg-slate-200/50 rounded-md w-2/3 bg-white/40"></div>
                                </div>
                                <div className="h-9 bg-slate-200/50 rounded-md w-full mt-3"></div>
                            </div>
                        ))}
                    </div>
                ) : weddings.length === 0 ? (
                    <div className="text-center py-24 glass-panel rounded-[2.5rem] border border-dashed border-slate-300/60 animate-fade-up">
                        <div className="w-24 h-24 bg-white/80 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm text-slate-400">
                            <QrCode size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-2xl mb-3 tracking-tight">Initialize Your First Track</h3>
                        <p className="text-slate-500 text-base max-w-sm mx-auto mb-10 leading-relaxed">
                            Generate a unique QR code to start tracking guest entries and gift contributions for your wedding event.
                        </p>
                        <Button 
                            size="lg"
                            icon={<Plus size={18} />}
                            onClick={() => navigate('/wedding-track/new')} 
                        >
                            Create Wedding QR
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weddings.map((w, index) => (
                            <div 
                                key={w.id} 
                                className="relative glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between group overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-400"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <QrStatusDot
                                    activationTime={w.qr_activation_time ?? null}
                                    expiryTime={w.qr_expires_at ?? null}
                                />
                                <div className="z-10 relative">
                                    <WeddingNameDisplay 
                                        brideName={w.bride_name} 
                                        groomName={w.groom_name} 
                                        size="md"
                                        className="mb-2 text-slate-800 tracking-tight"
                                    />
                                    <div className="flex flex-col gap-1.5 mt-3">
                                        <p className="text-[13px] text-slate-600 flex items-start gap-2.5 font-medium bg-white/40 p-1.5 rounded-lg border border-white/50 break-words">
                                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                                            <span>{w.village || '—'}</span>
                                        </p>
                                        <p className="text-[13px] text-slate-600 flex items-start gap-2.5 font-medium bg-white/40 p-1.5 rounded-lg border border-white/50 break-words">
                                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                                            <span>{w.location || '—'}</span>
                                        </p>
                                    </div>
                                    {w.qr_expires_at && (
                                        <p className="text-[11px] text-slate-400 font-semibold tracking-wide mt-3 text-center border-t border-slate-100/50 pt-2">
                                            Expires: {formatDate(w.qr_expires_at, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                        </p>
                                    )}
                                </div>
                                <Button 
                                    className="mt-4 w-full shadow-sm relative z-10" 
                                    variant="secondary"
                                    size="sm"
                                    icon={<QrCode size={16} />}
                                    onClick={() => navigate(`/wedding-track/qr/${w.id}`)}
                                >
                                    Manage Details
                                </Button>
                                {/* Hover Gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-pink-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )}
                </div>

                {/* ── Quick Actions / Tips ── */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8">
                    <div className="glass-panel p-8 rounded-[2rem]">
                        <h4 className="font-bold text-lg mb-6 text-slate-800 uppercase tracking-widest flex items-center gap-2.5">
                            <Star size={20} className="text-amber-400" />
                            Quick Protocol
                        </h4>
                        <ul className="space-y-4">
                            {[
                                "Share the QR code with guests via WhatsApp",
                                "Track entries in real-time on the Dashboard",
                                "Verify gift payments as they arrive",
                                "Download final guest list as PDF"
                            ].map((tip, i) => (
                                <li key={i} className="text-[14px] text-slate-600 flex items-start gap-3 font-medium">
                                    <span className="font-mono text-[11px] font-bold text-pink-400 bg-pink-50 px-1.5 py-0.5 rounded-md mt-0.5">0{i+1}</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="glass-panel p-8 rounded-[2rem] flex flex-col justify-center items-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 pointer-events-none" />
                        <Sparkles size={36} className="mb-5 text-pink-400 animate-pulse-glow rounded-full bg-white/80 p-2 shadow-sm" />
                        <h4 className="font-bold text-xl text-slate-800 mb-2 relative z-10">Need Assistance?</h4>
                        <p className="text-[14px] text-slate-500 mb-8 max-w-[240px] relative z-10">Our support team is active 24/7 for any technical inquiries.</p>
                        <Button 
                            variant="primary"
                            onClick={() => window.open('https://wa.me/9149891771', '_blank')}
                            className="relative z-10"
                        >
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
