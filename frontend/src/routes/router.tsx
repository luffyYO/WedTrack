import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import Loader from '@/components/ui/Loader';

// Lazy-loaded page components
const HomePage = lazy(() => import('@/pages/HomePage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const WishesPage = lazy(() => import('@/pages/WishesPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Feature pages
const WeddingTrackCreatePage = lazy(() => import('@/features/weddingTrack/pages/WeddingTrackCreatePage'));
const WeddingQRPage = lazy(() => import('@/features/qr/pages/WeddingQRPage'));
const GuestFormPage = lazy(() => import('@/features/guestForm/pages/GuestFormPage'));

const router = createBrowserRouter([
    // ── Public / Auth routes ───────────────────────────────────────────────────
    {
        element: <Suspense fallback={<Loader />}><AuthLayout /></Suspense>,
        children: [
            { path: '/login', element: <LoginPage /> },
        ],
    },
    { path: '/', element: <Suspense fallback={<Loader />}><LandingPage /></Suspense> },

    // ── Public / Guest routes (Scanned from QR) ────────────────────────────────
    { path: '/guest-form/:weddingId', element: <Suspense fallback={<Loader />}><GuestFormPage /></Suspense> },

    // ── Protected / App routes ─────────────────────────────────────────────────
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/home', element: <Suspense fallback={<Loader />}><HomePage /></Suspense> },
                    { path: '/dashboard', element: <Suspense fallback={<Loader />}><DashboardPage /></Suspense> },
                    { path: '/tasks', element: <Suspense fallback={<Loader />}><TasksPage /></Suspense> },
                    { path: '/wishes', element: <Suspense fallback={<Loader />}><WishesPage /></Suspense> },
                    { path: '/profile', element: <Suspense fallback={<Loader />}><ProfilePage /></Suspense> },
                    { path: '/settings', element: <Suspense fallback={<Loader />}><SettingsPage /></Suspense> },
                    { path: '/wedding-track/new', element: <Suspense fallback={<Loader />}><WeddingTrackCreatePage /></Suspense> },
                    { path: '/wedding-track/qr/:trackId', element: <Suspense fallback={<Loader />}><WeddingQRPage /></Suspense> },
                ],
            },
        ],
    },

    // ── 404 ────────────────────────────────────────────────────────────────────
    { path: '*', element: <Suspense fallback={<Loader />}><NotFoundPage /></Suspense> },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
