import { X, LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MobileNavItem {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
}

interface MobileMenuPanelProps {
    isOpen: boolean;
    onClose: () => void;
    items: MobileNavItem[];
}

export default function MobileMenuPanel({ isOpen, onClose, items }: MobileMenuPanelProps) {
    return (
        <div 
            className={cn(
                "fixed inset-0 z-[1000] lg:hidden transition-opacity duration-300",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" 
                onClick={onClose}
            ></div>
            
            {/* Panel */}
            <aside 
                className={cn(
                    "absolute right-0 top-0 bottom-0 w-[80%] sm:w-[50%] bg-white/80 backdrop-blur-3xl border-l border-white/40 shadow-2xl p-6 flex flex-col transition-transform duration-500 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-100">
                    <span className="font-bold text-slate-400 text-xs uppercase tracking-[0.2em]">Menu</span>
                    <button 
                        onClick={onClose}
                        className="p-2 sm:hidden text-slate-400 hover:text-pink-500 transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex flex-col gap-4">
                    {items.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                item.onClick();
                                onClose();
                            }}
                            className="w-full flex items-center gap-5 p-4 rounded-2xl hover:bg-white/60 text-slate-700 font-bold transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-pink-500 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-pink-100 transition-all flex-shrink-0">
                                <item.icon size={22} />
                            </div>
                            <span className="text-xl tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-300 font-bold tracking-[0.2em] uppercase">© 2024 WedTrack</p>
                </div>
            </aside>
        </div>
    );
}
