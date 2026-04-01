import { LayoutDashboard } from 'lucide-react';
import { WeddingNameDisplay } from '@/components/ui';

interface WeddingSelectorProps {
    weddings: any[];
    selectedWeddingId: string;
    loading: boolean;
    onSelect: (wedding: any) => void;
}

export default function WeddingSelector({
    weddings,
    selectedWeddingId,
    loading,
    onSelect,
}: WeddingSelectorProps) {
    const selectedW = weddings.find((w: any) => w.id === selectedWeddingId);

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center glass-panel p-5 rounded-[1.5rem] relative z-30 group mx-4 sm:mx-6">
            <div className="flex items-center gap-2 text-slate-400">
                <LayoutDashboard size={18} className="group-hover:text-pink-400 transition-colors" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Active Channel:</span>
            </div>

            <div className="relative w-full sm:min-w-[340px] z-[60]">
                {/* Trigger */}
                <div
                    className="w-full bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white hover:border-pink-300 transition-all shadow-sm"
                    onClick={(e) => {
                        const dropdown = e.currentTarget.nextElementSibling;
                        dropdown?.classList.toggle('hidden');
                    }}
                >
                    <div className="overflow-hidden">
                        {loading ? (
                            <div className="animate-pulse bg-slate-200/60 h-5 w-40 rounded-md" />
                        ) : selectedW ? (
                            <div className="flex items-center gap-1.5 truncate">
                                <WeddingNameDisplay
                                    brideName={selectedW.bride_name}
                                    groomName={selectedW.groom_name}
                                    size="sm"
                                    className="text-slate-800"
                                />
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400">Select an event record...</span>
                        )}
                    </div>
                    <svg className="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Dropdown */}
                <div className="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[60] py-2 animate-fade-up duration-200">
                    {weddings.map((w: any) => (
                        <div
                            key={w.id}
                            className={`px-4 py-3 cursor-pointer hover:bg-pink-50/50 transition-colors border-b border-slate-100 last:border-0 ${selectedWeddingId === w.id ? 'bg-pink-50/80' : ''}`}
                            onClick={(e) => {
                                onSelect(w);
                                e.currentTarget.parentElement?.classList.add('hidden');
                            }}
                        >
                            <WeddingNameDisplay
                                brideName={w.bride_name}
                                groomName={w.groom_name}
                                size="sm"
                                className="text-slate-800"
                            />
                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                                Location: {[w.village, w.location].filter(Boolean).join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
