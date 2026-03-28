import { useState, useEffect } from 'react';
import { User, Mail, Phone, Bell, Shield, LogOut, CheckCircle2, ChevronRight, Camera } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store';
import { supabase } from '@/config/supabaseClient';

export default function ProfilePage() {
    const { user, logout, setUser } = useAuthStore();
    
    // Local state for the form
    const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
    const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Sync state if user loads later
    useEffect(() => {
        if (user) {
            setFirstName(user.user_metadata?.first_name || '');
            setLastName(user.user_metadata?.last_name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: { 
                    first_name: firstName,
                    last_name: lastName
                }
            });

            if (error) throw error;

            if (data.user) {
                setUser(data.user);
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full pb-10 px-4 sm:px-6 animate-fade-up">
            <PageHeader 
                title="Your Identity" 
                description="Manage your profile information and digital preferences." 
            />

            <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ── Left Column: Avatar & Quick Actions ── */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="glass-panel p-8 rounded-[2rem] flex flex-col items-center text-center relative overflow-hidden group border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                        {/* Soft Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 to-transparent pointer-events-none" />
                        
                        <div className="relative mb-6">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-100 to-pink-50 p-1 shadow-inner">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-pink-300 overflow-hidden">
                                    <User size={48} strokeWidth={1.5} />
                                </div>
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md text-slate-500 hover:text-pink-500 transition-colors border border-slate-100">
                                <Camera size={16} />
                            </button>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight z-10">
                            {firstName || lastName ? `${firstName} ${lastName}` : (user?.email?.split('@')[0] || 'User')}
                        </h2>
                        <p className="text-[13px] text-slate-500 font-medium mt-1 mb-6 flex items-center justify-center gap-1.5 z-10">
                            <Mail size={14} />
                            {user?.email || 'No email provided'}
                        </p>
                        
                        <div className="w-full border-t border-slate-200/60 pt-6 z-10 flex flex-col gap-2">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-[13px] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </div>
                                <ChevronRight size={16} className="opacity-50" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Details & Settings ── */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Form Section */}
                    <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/60 shadow-sm relative">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <span className="bg-pink-100/50 text-pink-500 p-1.5 rounded-lg">
                                    <User size={18} />
                                </span>
                                Personal Information
                            </h3>
                            <p className="text-[14px] text-slate-500 mt-2">Update your contact details and display name.</p>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 ml-1">First Name</label>
                                    <input 
                                        type="text" 
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-slate-50/50 border-b-2 border-slate-200/80 focus:border-pink-400 px-4 py-3 rounded-t-xl outline-none transition-colors text-slate-800 font-medium placeholder:text-slate-400"
                                        placeholder="Jane"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 ml-1">Last Name</label>
                                    <input 
                                        type="text" 
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full bg-slate-50/50 border-b-2 border-slate-200/80 focus:border-pink-400 px-4 py-3 rounded-t-xl outline-none transition-colors text-slate-800 font-medium placeholder:text-slate-400"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                                    <Phone size={14} className="opacity-70" /> Phone Number
                                </label>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-50/50 border-b-2 border-slate-200/80 focus:border-pink-400 px-4 py-3 rounded-t-xl outline-none transition-colors text-slate-800 font-medium placeholder:text-slate-400"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={isSaving}
                                    className={isSaved ? '!bg-emerald-500 hover:!bg-emerald-600' : ''}
                                >
                                    {isSaving ? 'Saving...' : isSaved ? <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Saved Successfully</span> : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Settings / Preferences Section */}
                    <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/60 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-8">
                            <span className="bg-amber-100/50 text-amber-500 p-1.5 rounded-lg">
                                <Shield size={18} />
                            </span>
                            Account Preferences
                        </h3>
                        
                        <div className="space-y-4">
                            {[
                                { title: 'Email Notifications', desc: 'Receive daily digests and RSVP updates.', icon: <Bell size={18} />, active: true },
                                { title: 'Two-Factor Authentication', desc: 'Secure your account with an extra layer.', icon: <Shield size={18} />, active: false },
                            ].map((pref, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-slate-100/50 hover:bg-white/60 transition-colors gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                            {pref.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[14px] text-slate-800">{pref.title}</h4>
                                            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{pref.desc}</p>
                                        </div>
                                    </div>
                                    {/* Custom Toggle Switch */}
                                    <button 
                                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${pref.active ? 'bg-pink-400' : 'bg-slate-200'}`}
                                        onClick={(e) => {
                                            const el = e.currentTarget;
                                            const isActive = el.classList.contains('bg-pink-400');
                                            if (isActive) {
                                                el.classList.replace('bg-pink-400', 'bg-slate-200');
                                                el.children[0].classList.replace('translate-x-6', 'translate-x-1');
                                            } else {
                                                el.classList.replace('bg-slate-200', 'bg-pink-400');
                                                el.children[0].classList.replace('translate-x-1', 'translate-x-6');
                                            }
                                        }}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${pref.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
