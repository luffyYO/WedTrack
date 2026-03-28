import { useState } from 'react';
import { 
    Settings, 
    BellRing, 
    Mail, 
    MessageCircle, 
    Moon, 
    Sun, 
    Globe, 
    Lock, 
    ShieldCheck, 
    CheckCircle2,
    Palette
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';

// Utility for Toggle
function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
    return (
        <button 
            type="button"
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${active ? 'bg-pink-400' : 'bg-slate-200'}`}
            onClick={onClick}
        >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}

export default function SettingsPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Notification State
    const [pushNotif, setPushNotif] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);
    const [waNotif, setWaNotif] = useState(false);

    // Display State
    const [darkMode, setDarkMode] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [currency, setCurrency] = useState('INR');

    // Security/Event State
    const [privateMode, setPrivateMode] = useState(false);
    const [autoApprove, setAutoApprove] = useState(true);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        }, 800);
    };

    return (
        <div className="w-full pb-10 px-4 sm:px-6 animate-fade-up">
            <PageHeader 
                title="Application Settings" 
                description="Customize your WedTrack experience and default event protocols." 
            />

            <form onSubmit={handleSave} className="max-w-5xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* ── Column 1 ── */}
                <div className="flex flex-col gap-6">
                    {/* Notifications Panel */}
                    <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-transparent pointer-events-none" />
                        
                        <div className="mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <span className="bg-blue-100/50 text-blue-500 p-1.5 rounded-lg">
                                    <BellRing size={18} />
                                </span>
                                Notification Preferences
                            </h3>
                            <p className="text-[13px] text-slate-500 mt-2">Manage how you are alerted about guest updates.</p>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/70 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                        <BellRing size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[14px] text-slate-800">Push Notifications</h4>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">Instant alerts for new RSVPs on your device.</p>
                                    </div>
                                </div>
                                <Toggle active={pushNotif} onClick={() => setPushNotif(!pushNotif)} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/70 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[14px] text-slate-800">Email Digest</h4>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">Receive a daily summary of contributions.</p>
                                    </div>
                                </div>
                                <Toggle active={emailNotif} onClick={() => setEmailNotif(!emailNotif)} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/70 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-emerald-100/50 rounded-xl text-emerald-600">
                                        <MessageCircle size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[14px] text-slate-800">WhatsApp Alerts</h4>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">Pings directed straight to your WhatsApp.</p>
                                    </div>
                                </div>
                                <Toggle active={waNotif} onClick={() => setWaNotif(!waNotif)} />
                            </div>
                        </div>
                    </div>

                    {/* Display & Aesthetics */}
                    <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-transparent pointer-events-none" />
                        
                        <div className="mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <span className="bg-purple-100/50 text-purple-500 p-1.5 rounded-lg">
                                    <Palette size={18} />
                                </span>
                                Display Aesthetics
                            </h3>
                            <p className="text-[13px] text-slate-500 mt-2">Adjust the visual presentation of your dashboard.</p>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/70 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-100 text-slate-600'} transition-colors`}>
                                        {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[14px] text-slate-800">Dark Mode</h4>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">Turn on the lights, or embrace the shadows.</p>
                                    </div>
                                </div>
                                <Toggle active={darkMode} onClick={() => setDarkMode(!darkMode)} />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/70 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                        <div className="w-[18px] h-[18px] border-[2px] border-current rounded-[4px] relative bg-black/10">
                                            <div className="absolute bottom-[-1px] right-[-1px] w-[9px] h-[9px] bg-current rounded-tl-sm rounded-br-[3px]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[14px] text-slate-800">High Contrast UI</h4>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">Boosts legibility in bright outdoor environments.</p>
                                    </div>
                                </div>
                                <Toggle active={highContrast} onClick={() => setHighContrast(!highContrast)} />
                            </div>

                        </div>
                    </div>
                </div>

                {/* ── Column 2 ── */}
                <div className="flex flex-col gap-6">
                    {/* Event Defaults Panel */}
                    <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 to-transparent pointer-events-none" />
                        
                        <div className="mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <span className="bg-amber-100/50 text-amber-500 p-1.5 rounded-lg">
                                    <Settings size={18} />
                                </span>
                                Event Defaults
                            </h3>
                            <p className="text-[13px] text-slate-500 mt-2">Adjust standard behaviors for newly created wedding tracks.</p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/70 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[14px] text-slate-800">Auto-Approve Entries</h4>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">Mark guests as arrived immediately on scan.</p>
                                    </div>
                                </div>
                                <Toggle active={autoApprove} onClick={() => setAutoApprove(!autoApprove)} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/70 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[14px] text-slate-800">Private Events by Default</h4>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">New tracks will not be searchable directly.</p>
                                    </div>
                                </div>
                                <Toggle active={privateMode} onClick={() => setPrivateMode(!privateMode)} />
                            </div>

                            <div className="rounded-2xl bg-white/40 border border-slate-100/50 p-5">
                                <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5 mb-2">
                                    <Globe size={14} className="opacity-70" /> Default Currency
                                </label>
                                <select 
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full bg-slate-50/50 border-b-2 border-slate-200/80 focus:border-pink-400 px-4 py-3 rounded-t-xl outline-none transition-colors text-slate-800 font-medium cursor-pointer"
                                >
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="GBP">British Pound (£)</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col justify-center items-center text-center bg-white/30 backdrop-blur-xl">
                        <p className="text-[13px] text-slate-500 mb-6 px-4">
                            Changes saved here will apply automatically to all your managed events moving forward.
                        </p>
                        <Button 
                            type="submit" 
                            size="lg"
                            variant="primary" 
                            disabled={isSaving}
                            className={`w-full max-w-[280px] shadow-lg shadow-pink-500/20 ${isSaved ? '!bg-emerald-500 hover:!bg-emerald-600' : ''}`}
                        >
                            {isSaving ? 'Applying Settings...' : isSaved ? <span className="flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Verified & Saved</span> : 'Save Preferences'}
                        </Button>
                    </div>
                </div>

            </form>
        </div>
    );
}
