import { User } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

/**
 * ProfilePage – scaffold placeholder.
 * Full UI will be implemented in the feature/profile branch.
 */
export default function ProfilePage() {
    return (
        <div>
            <PageHeader title="Profile" description="Manage your account information and preferences." />
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
                <User size={28} className="text-neutral-300" />
                <p className="text-body-sm text-[var(--color-text-muted)]">
                    Profile UI — <code className="text-mono">feature/profile</code>
                </p>
            </div>
        </div>
    );
}
