// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'guest';
    avatarUrl?: string;
    createdAt: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// ─── Wedding ───────────────────────────────────────────────────────────────────

export interface Wedding {
    id: string;
    name: string;
    date: string;
    venue?: string;
    qrCode?: string;
    qrLink?: string;
    createdAt: string;
    updatedAt: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    weddingId: string;
    assignedTo?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    priority: TaskPriority;
    weddingId: string;
    assignedTo?: string;
    dueDate?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
    status?: TaskStatus;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface SelectOption<T = string> {
    label: string;
    value: T;
    disabled?: boolean;
}

import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string;
    href: string;
    icon?: LucideIcon;
    badge?: number;
}
