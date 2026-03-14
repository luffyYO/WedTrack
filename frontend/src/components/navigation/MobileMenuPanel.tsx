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
                    "absolute right-0 top-0 bottom-0 w-[65%] sm:w-[50%] bg-white shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
                    <span className="font-bold text-neutral-400 text-sm uppercase tracking-widest">Menu</span>
                    <button 
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-900 border border-neutral-100 rounded-xl transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex flex-col gap-2">
                    {items.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                item.onClick();
                                onClose();
                            }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50 text-neutral-700 font-bold transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-sm border border-white group-hover:scale-110 transition-transform flex-shrink-0">
                                <item.icon size={18} />
                            </div>
                            <span className="text-lg">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 text-center">
                    <p className="text-xs text-neutral-300 font-bold">© 2024 WedTrack</p>
                </div>
            </aside>
        </div>
    );
}
