import { Settings } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

/**
 * SettingsPage – scaffold placeholder.
 */
export default function SettingsPage() {
    return (
        <div>
            <PageHeader title="Settings" description="Application and account settings." />
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
                <Settings size={28} className="text-neutral-300" />
                <p className="text-body-sm text-[var(--color-text-muted)]">Settings UI — coming soon</p>
            </div>
        </div>
    );
}
