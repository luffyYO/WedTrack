import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Page imports
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

const router = createBrowserRouter([
    // ── Public / Auth routes ─────────────────────────────────────────────────────
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
        ],
    },

    // ── Protected / App routes ───────────────────────────────────────────────────
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/', element: <HomePage /> },
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/tasks', element: <TasksPage /> },
                    { path: '/profile', element: <ProfilePage /> },
                    { path: '/settings', element: <SettingsPage /> },
                ],
            },
        ],
    },

    // ── 404 ──────────────────────────────────────────────────────────────────────
    { path: '*', element: <NotFoundPage /> },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
