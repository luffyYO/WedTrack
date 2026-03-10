import type { TaskStatus, TaskPriority } from '@/types';

// Display labels for task status
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

// Display labels for task priority
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
};

export type TaskFilter = {
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
};
