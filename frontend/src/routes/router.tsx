import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Page imports
import HomePage from '@/pages/HomePage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import TasksPage from '@/pages/TasksPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Feature pages
import WeddingTrackCreatePage from '@/features/weddingTrack/pages/WeddingTrackCreatePage';
import WeddingQRPage from '@/features/qr/pages/WeddingQRPage';
import GuestFormPage from '@/features/guestForm/pages/GuestFormPage';

const router = createBrowserRouter([
    // ── Public / Auth routes ───────────────────────────────────────────────────
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/signup', element: <SignupPage /> },
        ],
    },
    { path: '/', element: <LandingPage /> },

    // ── Public / Guest routes (Scanned from QR) ────────────────────────────────
    { path: '/guest-form/:weddingId', element: <GuestFormPage /> },

    // ── Protected / App routes ─────────────────────────────────────────────────
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/home', element: <HomePage /> },
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/tasks', element: <TasksPage /> },
                    { path: '/profile', element: <ProfilePage /> },
                    { path: '/settings', element: <SettingsPage /> },
                    { path: '/wedding-track/new', element: <WeddingTrackCreatePage /> },
                    { path: '/wedding-track/qr/:trackId', element: <WeddingQRPage /> },
                ],
            },
        ],
    },

    // ── 404 ────────────────────────────────────────────────────────────────────
    { path: '*', element: <NotFoundPage /> },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
