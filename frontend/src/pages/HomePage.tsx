import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutDashboard, HeartHandshake, QrCode } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';
import { WeddingNameDisplay } from '@/components/ui';
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
                    <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-[36px] py-1.5 px-3.5 text-sm rounded-lg"
                            icon={<LayoutDashboard size={15} />}
                            onClick={() => navigate('/dashboard')}
                        >
                            Open Dashboard
                        </Button>
                        <Button
                            size="sm"
                            className="h-[36px] py-1.5 px-3.5 text-sm rounded-lg"
                            icon={<Plus size={15} />}
                            onClick={() => navigate('/wedding-track/new')}
                        >
                            Create Wedding QR
                        </Button>
                    </div>
                }
            />

            <div className="mt-6 max-w-[900px] mx-auto space-y-8">
                <div className="flex justify-center">
                    {/* Compact Primary Statistic Card */}
                    <div className="bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-700))] rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col items-center justify-center text-center h-[110px] w-full max-w-[340px]">
                        <div className="absolute -right-1 -top-2 opacity-10">
                            <HeartHandshake size={60} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-primary-100 font-bold uppercase tracking-wider text-xs sm:text-[13px] mb-0.5">
                                Weddings Tracked
                            </h3>
                            {loading ? (
                                <div className="animate-pulse h-8 w-12 bg-white/20 rounded mx-auto mt-1"></div>
                            ) : (
                                <div className="text-3xl sm:text-[36px] font-black tracking-tight leading-none">
                                    {weddings.length}
                                </div>
                            )}
                            <div className="text-[11px] text-white/60 font-medium uppercase tracking-tighter mt-0.5">Active Tracks</div>
                        </div>
                    </div>
                </div>

                {/* Weddings List */}
                <div className="mt-0">
                    <h2 className="text-xl font-bold text-gray-900 mb-5">Your Tracked Weddings QR</h2>
                
                {loading ? (
                    <div className="w-full flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : weddings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No weddings QR created yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weddings.map(w => (
                            <div key={w.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <WeddingNameDisplay 
                                        brideName={w.bride_name} 
                                        groomName={w.groom_name} 
                                        size="md"
                                        className="mb-1"
                                    />
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
