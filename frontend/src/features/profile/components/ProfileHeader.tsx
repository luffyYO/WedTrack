import { Camera, Edit2, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getInitials } from '@/utils/formatters';
import type { UserProfile } from '../types/profile.types';

interface ProfileHeaderProps {
    profile: UserProfile;
    isEditing: boolean;
    onEditToggle: () => void;
    onSignOut: () => void;
}

export default function ProfileHeader({ profile, isEditing, onEditToggle, onSignOut }: ProfileHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] relative overflow-hidden">

            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-100 dark:bg-neutral-800 rounded-bl-[100px] -z-10 opacity-50" />
            <div className="absolute -top-4 -right-4 text-neutral-200/40 dark:text-neutral-800/40 -z-10">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.5" />
                    <path d="M16 11V8l-4-4-4 4v3H6v2h2v5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-5h2v-2h-2zm-6 5V8.83l2-2 2 2V16h-4z" />
                </svg>
            </div>

            {/* Avatar */}
            <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-display-xs font-semibold shadow-md border-4 border-[var(--color-surface)]">
                    {getInitials(profile.fullName)}
                </div>

                {/* Hover overlay for changing picture */}
                <button className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer border-4 border-transparent">
                    <Camera size={20} className="mb-1" />
                    <span className="text-[10px] font-medium leading-tight">Change</span>
                </button>
            </div>

            {/* Info & Actions */}
            <div className="flex flex-col sm:flex-row flex-1 w-full justify-between items-center sm:items-start gap-4">
                <div className="text-center sm:text-left">
                    <h2 className="text-display-xs text-[var(--color-text-primary)]">{profile.fullName}</h2>
                    <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
                        Wedding <span className="font-medium text-[var(--color-text-primary)]">{profile.role}</span> Account
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-caption text-[var(--color-text-muted)]">
                        <span>{profile.email}</span>
                        <span>•</span>
                        <span>Member since 2026</span>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button
                        variant={isEditing ? 'outline' : 'secondary'}
                        size="sm"
                        icon={<Edit2 size={14} />}
                        onClick={onEditToggle}
                        className="flex-1 sm:flex-none"
                    >
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        icon={<LogOut size={14} />}
                        onClick={onSignOut}
                        className="flex-1 sm:flex-none text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
