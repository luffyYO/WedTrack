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

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Statistic Card */}
                <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                    <div className="absolute -right-4 -top-8 opacity-10">
                        <HeartHandshake size={150} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-primary-100 font-semibold uppercase tracking-wider text-sm mb-1">
                            No. of Weddings Tracked
                        </h3>
                        {loading ? (
                            <div className="animate-pulse h-10 w-16 bg-white/20 rounded mt-2"></div>
                        ) : (
                            <div className="text-5xl md:text-6xl font-bold tracking-tight">
                                {weddings.length}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center justify-center min-h-[160px] gap-3">
                    <div className="bg-primary-50 p-3 rounded-full text-primary-600 mb-2">
                        <LayoutDashboard size={28} />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg">View Guest Entries</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                        See detailed breakdowns of all incoming gift transactions.
                    </p>
                    <Button 
                        variant="outline" 
                        className="mt-2 w-full sm:w-auto"
                        onClick={() => navigate('/dashboard')}
                    >
                        Go to Data Dashboard
                    </Button>
                </div>
            </div>

            {/* Weddings List */}
            <div className="mt-10">
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
    );
}
