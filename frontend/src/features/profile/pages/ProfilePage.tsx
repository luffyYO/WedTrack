import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Save, AlertCircle } from 'lucide-react';

import ProfileHeader from '../components/ProfileHeader';
import ProfileBasicInfo from '../components/ProfileBasicInfo';

import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/config/supabaseClient';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, ProfileFormState } from '../types/profile.types';

export default function ProfilePage() {
    const { user, logout, setUser } = useAuthStore();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [formState, setFormState] = useState<ProfileFormState>({
        data: {} as UserProfile,
        errors: {},
        isSubmitting: false,
        isDirty: false,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // ── Hydrate Profile from Supabase User ──────────────────────────────────────
    useEffect(() => {
        if (user) {
            // Map Supabase auth.user to our frontend UserProfile
            const mappedProfile: UserProfile = {
                id: user.id,
                fullName: user.user_metadata?.full_name || '',
                email: user.email || '',
                phone: user.user_metadata?.phone || '',
                role: user.user_metadata?.role || 'Planner',
                weddingDate: user.user_metadata?.weddingDate || '',
                venue: user.user_metadata?.venue || '',
                village: user.user_metadata?.village || '',
                country: user.user_metadata?.country || '',
                brideName: user.user_metadata?.brideName || '',
                groomName: user.user_metadata?.groomName || '',
                guestCapacityEstimate: user.user_metadata?.guestCapacityEstimate || 0,
                preferredLanguage: user.user_metadata?.preferredLanguage || 'English',
            };
            setProfile(mappedProfile);
            setFormState((prev) => ({ ...prev, data: mappedProfile }));
            setIsLoading(false);
        } else {
            setFetchError('No authenticated user found.');
            setIsLoading(false);
        }
    }, [user]);

    // ── Handlers ────────────────────────────────────────────────────────────────
    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel edit: revert form data to original profile
            if (profile) setFormState({ data: profile, errors: {}, isSubmitting: false, isDirty: false });
            setSaveSuccess(false);
        }
        setIsEditing(!isEditing);
    };

    const handleFieldChange = (field: keyof UserProfile, value: string | number) => {
        setFormState((prev) => ({
            ...prev,
            data: { ...prev.data, [field]: value },
            isDirty: true,
            errors: { ...prev.errors, [field]: undefined }, // Clear error on change
        }));
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        setFormState((prev) => ({ ...prev, isSubmitting: true }));
        setSaveSuccess(false);

        try {
            // Push edits directly to Supabase User Metadata
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: formState.data.fullName,
                    phone: formState.data.phone,
                    role: formState.data.role,
                    weddingDate: formState.data.weddingDate,
                    venue: formState.data.venue,
                    village: formState.data.village,
                    country: formState.data.country,
                    guestCapacityEstimate: formState.data.guestCapacityEstimate,
                    preferredLanguage: formState.data.preferredLanguage
                }
            });

            if (error) throw error;

            if (data?.user) {
                setUser(data.user);
            }

            setProfile(formState.data);
            setFormState((prev) => ({
                ...prev,
                isSubmitting: false,
                isDirty: false
            }));
            setIsEditing(false);
            setSaveSuccess(true);

            // Auto-hide success message
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (err: any) {
            setFormState((prev) => ({
                ...prev,
                isSubmitting: false,
                errors: { fullName: err.message || 'Failed to update profile.' }
            }));
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        logout();
        navigate('/');
    };

    // ── Render States ───────────────────────────────────────────────────────────
    if (isLoading) {
        return <LoadingSpinner text="Loading profile..." fullScreen />;
    }

    if (fetchError || !profile) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-12 text-center text-[var(--color-text-secondary)]">
                <AlertCircle size={40} className="text-red-500 mb-4" />
                <h2 className="text-heading-sm mb-2">Failed to load profile</h2>
                <p>{fetchError}</p>
                <Button className="mt-6" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    // ── Main Page ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-3xl mx-auto pb-12 animate-fade-in">
            <PageHeader
                title="My Profile"
                description="Manage your account details and personal preferences."
                action={
                    isEditing && (
                        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                            <Button
                                variant="primary"
                                icon={<Save size={15} />}
                                onClick={handleSave}
                                isLoading={formState.isSubmitting}
                                disabled={!formState.isDirty}
                                fullWidth
                            >
                                Save Changes
                            </Button>
                        </div>
                    )
                }
            />

            {saveSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-[var(--radius-md)] flex items-center gap-3 animate-slide-in-right">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                        <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M2 7L5 10L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span className="text-body-sm font-medium">Profile updated successfully.</span>
                </div>
            )}

            <div className="flex flex-col gap-6 sm:gap-8">
                <ProfileHeader
                    profile={profile}
                    isEditing={isEditing}
                    onEditToggle={handleEditToggle}
                    onSignOut={handleSignOut}
                />

                <ProfileBasicInfo
                    data={formState.data}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                    errors={formState.errors}
                />
            </div>
        </div>
    );
}
