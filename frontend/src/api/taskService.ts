import client from './client';
import type { Task, CreateTaskData, UpdateTaskData, PaginatedResponse } from '@/types';

export interface TaskFilters {
    weddingId?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
}

export const taskService = {
    /**
     * Retrieve a paginated list of tasks, with optional filters.
     */
    getTasks: (filters?: TaskFilters) =>
        client.get<PaginatedResponse<Task>>('/tasks', { params: filters }),

    /**
     * Fetch a single task by its ID.
     */
    getTaskById: (id: string) => client.get<Task>(`/tasks/${id}`),

    /**
     * Create a new task.
     */
    createTask: (data: CreateTaskData) => client.post<Task>('/tasks', data),

    /**
     * Update an existing task.
     */
    updateTask: (id: string, data: UpdateTaskData) => client.put<Task>(`/tasks/${id}`, data),

    /**
     * Delete a task permanently.
     */
    deleteTask: (id: string) => client.delete(`/tasks/${id}`),
};
