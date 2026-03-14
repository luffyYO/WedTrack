import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutDashboard, HeartHandshake, QrCode } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store';

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
        <div className="w-full pb-10">
            <PageHeader
                title="Home Overview"
                description={`Welcome back, ${user?.user_metadata?.first_name || 'Admin'}!`}
                action={
                    <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                        <Button
                            size="sm"
                            fullWidth
                            icon={<Plus size={15} />}
                            onClick={() => navigate('/wedding-track/new')}
                        >
                            Create Wedding Track
                        </Button>
                    </div>
                }
            />

            <div className="mt-8 max-w-[900px] mx-auto space-y-10">
                <div className="grid grid-cols-2 gap-4 max-w-[700px] mx-auto">
                    {/* Primary Statistic Card */}
                    <div className="bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-700))] rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col items-center justify-center text-center h-[105px] sm:h-[140px]">
                        <div className="absolute -right-2 -top-4 opacity-10">
                            <HeartHandshake size={50} className="sm:w-[90px] sm:h-[90px]" />
                        </div>
                        <div className="relative z-10 space-y-0.5">
                            <h3 className="text-primary-100 font-bold uppercase tracking-wider text-xs sm:text-sm">
                                Weddings Tracked
                            </h3>
                            {loading ? (
                                <div className="animate-pulse h-8 w-12 sm:h-12 sm:w-20 bg-white/20 rounded mx-auto mt-2"></div>
                            ) : (
                                <div className="text-3xl sm:text-4xl lg:text-4xl font-black tracking-tight leading-none">
                                    {weddings.length}
                                </div>
                            )}
                            <div className="text-[9px] sm:text-[10px] text-white/60 font-medium uppercase tracking-tighter">Active Tracks</div>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col items-center justify-center text-center h-[105px] sm:h-[140px] gap-2">
                        <div className="bg-primary-50 p-1.5 sm:p-2.5 rounded-full text-primary-600">
                            <LayoutDashboard size={18} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-gray-900 font-black text-xs sm:text-base leading-tight">Data Dashboard</h3>
                            <p className="text-gray-500 text-[10px] hidden sm:block max-w-[150px] leading-tight">
                                Gift insights & stats
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-1 sm:mt-0 text-[10px] sm:text-xs py-0.5 sm:py-1.5 h-auto px-2 sm:px-4"
                            onClick={() => navigate('/dashboard')}
                        >
                            Open Dashboard
                        </Button>
                    </div>
                </div>

                {/* Weddings List */}
                <div className="mt-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Your Tracked Weddings</h2>
                
                {loading ? (
                    <div className="w-full flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : weddings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No weddings created yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weddings.map(w => (
                            <div key={w.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{w.bride_name} & {w.groom_name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                        {formatDate(w.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">{w.venue}, {w.location}</p>
                                </div>
                                <Button 
                                    className="mt-6 w-full" 
                                    variant="outline"
                                    icon={<QrCode size={16} />}
                                    onClick={() => navigate(`/wedding-track/qr/${w.id}`)}
                                >
                                    View Details & QR
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}
