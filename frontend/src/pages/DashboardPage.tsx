import { LayoutDashboard } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

/**
 * DashboardPage – scaffold placeholder.
 * Full UI will be implemented in the feature/dashboard branch.
 */
export default function DashboardPage() {
    return (
        <div>
            <PageHeader
                title="Dashboard"
                description="Overview of wedding events, gift tracking, and recent activity."
            />
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
                <LayoutDashboard size={28} className="text-neutral-300" />
                <p className="text-body-sm text-[var(--color-text-muted)]">
                    Dashboard UI — <code className="text-mono">feature/dashboard</code>
                </p>
            </div>
        </div>
    );
}
