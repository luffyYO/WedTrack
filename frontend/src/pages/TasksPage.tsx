import { CheckSquare } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

/**
 * TasksPage – scaffold placeholder.
 * Full UI will be implemented in the feature/tasks branch.
 */
export default function TasksPage() {
    return (
        <div>
            <PageHeader
                title="Tasks"
                description="Manage and track wedding planning tasks."
                action={
                    <Button icon={<Plus size={15} />} size="sm" disabled>
                        New Task
                    </Button>
                }
            />
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
                <CheckSquare size={28} className="text-neutral-300" />
                <p className="text-body-sm text-[var(--color-text-muted)]">
                    Task list UI — <code className="text-mono">feature/tasks</code>
                </p>
            </div>
        </div>
    );
}
