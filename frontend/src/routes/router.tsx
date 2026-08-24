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
const NewGiftPage = lazy(() => import('@/features/newGift/pages/NewGiftPage'));
const GiftTallyPage = lazy(() => import('@/features/giftTally/pages/GiftTallyPage'));
const AIScanPage = lazy(() => import('@/features/aiScan/pages/AIScanPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const WishesPage = lazy(() => import('@/pages/WishesPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));

// Feature pages
const WeddingTrackCreatePage = lazy(() => import('@/features/weddingTrack/pages/WeddingTrackCreatePage'));
const WeddingTrackVerifyPage = lazy(() => import('@/features/weddingTrack/pages/WeddingTrackVerifyPage'));
const WeddingQRPage = lazy(() => import('@/features/qr/pages/WeddingQRPage'));
const GuestFormPage = lazy(() => import('@/features/guestForm/pages/GuestFormPage'));
const QRRedirectPage = lazy(() => import('@/features/qr/pages/QRRedirectPage'));
const QRErrorPage = lazy(() => import('@/pages/QRErrorPage'));

// Admin pages
const AdminLogin = lazy(() => import('@/features/admin/pages/AdminLogin'));
const AdminLayout = lazy(() => import('@/features/admin/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'));
const AdminUsers = lazy(() => import('@/features/admin/pages/AdminUsers'));
const AdminWeddings = lazy(() => import('@/features/admin/pages/AdminWeddings'));
const AdminQrs = lazy(() => import('@/features/admin/pages/AdminQrs'));
const AdminLogs = lazy(() => import('@/features/admin/pages/AdminLogs'));
const AdminSettings = lazy(() => import('@/features/admin/pages/AdminSettings'));
const AdminAdmins = lazy(() => import('@/features/admin/pages/AdminAdmins'));

const router = createBrowserRouter([
    // ── Public / Auth routes ───────────────────────────────────────────────────
    {
        element: <Suspense fallback={<Loader />}><AuthLayout /></Suspense>,
        children: [
            { path: '/login', element: <LoginPage /> },
        ],
    },
    { path: '/', element: <Suspense fallback={<Loader />}><LandingPage /></Suspense> },
    { path: '/privacy', element: <Suspense fallback={<Loader />}><PrivacyPolicy /></Suspense> },
    { path: '/terms', element: <Suspense fallback={<Loader />}><TermsOfService /></Suspense> },

    // ── Universal QR redirect (scanned from any QR scanner / payment app) ──────
    // No layout, no auth — renders immediately on scan
    { path: '/q/:token', element: <Suspense fallback={null}><QRRedirectPage /></Suspense> },
    { path: '/qr-error', element: <Suspense fallback={null}><QRErrorPage /></Suspense> },

    // ── Public / Guest routes (Scanned from QR) ────────────────────────────────
    { path: '/guest-form/:weddingId', element: <Suspense fallback={<Loader />}><GuestFormPage /></Suspense> },
    { path: '/g/:weddingId', element: <Suspense fallback={<Loader />}><GuestFormPage /></Suspense> },

    // ── Protected / App routes ─────────────────────────────────────────────────
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/home', element: <Suspense fallback={<Loader />}><HomePage /></Suspense> },
                    { path: '/dashboard', element: <Suspense fallback={<Loader />}><DashboardPage /></Suspense> },
                    { path: '/new-gift', element: <Suspense fallback={<Loader />}><NewGiftPage /></Suspense> },
                    { path: '/gift-tally', element: <Suspense fallback={<Loader />}><GiftTallyPage /></Suspense> },
                    { path: '/dashboard/:weddingId/ai-scan', element: <Suspense fallback={<Loader />}><AIScanPage /></Suspense> },
                    { path: '/ai-scan', element: <Suspense fallback={<Loader />}><AIScanPage /></Suspense> },
                    { path: '/tasks', element: <Suspense fallback={<Loader />}><TasksPage /></Suspense> },
                    { path: '/wishes', element: <Suspense fallback={<Loader />}><WishesPage /></Suspense> },
                    { path: '/profile', element: <Suspense fallback={<Loader />}><ProfilePage /></Suspense> },
                    { path: '/settings', element: <Suspense fallback={<Loader />}><SettingsPage /></Suspense> },
                    { path: '/wedding-track/new', element: <Suspense fallback={<Loader />}><WeddingTrackCreatePage /></Suspense> },
                    { path: '/wedding-track/verify', element: <Suspense fallback={<Loader />}><WeddingTrackVerifyPage /></Suspense> },
                    { path: '/wedding-track/qr/:trackId', element: <Suspense fallback={<Loader />}><WeddingQRPage /></Suspense> },
                ],
            },
        ],
    },

    // ── Admin routes ───────────────────────────────────────────────────────────
    { path: '/admin/login', element: <Suspense fallback={<Loader />}><AdminLogin /></Suspense> },
    {
        path: '/admin',
        element: <Suspense fallback={<Loader />}><AdminLayout /></Suspense>,
        children: [
            { index: true, element: <Suspense fallback={<Loader />}><AdminDashboard /></Suspense> },
            { path: 'dashboard', element: <Suspense fallback={<Loader />}><AdminDashboard /></Suspense> },
            { path: 'users', element: <Suspense fallback={<Loader />}><AdminUsers /></Suspense> },
            { path: 'weddings', element: <Suspense fallback={<Loader />}><AdminWeddings /></Suspense> },
            { path: 'qrs', element: <Suspense fallback={<Loader />}><AdminQrs /></Suspense> },
            { path: 'admins', element: <Suspense fallback={<Loader />}><AdminAdmins /></Suspense> },
            { path: 'logs', element: <Suspense fallback={<Loader />}><AdminLogs /></Suspense> },
            { path: 'settings', element: <Suspense fallback={<Loader />}><AdminSettings /></Suspense> },
        ]
    },

    // ── 404 ────────────────────────────────────────────────────────────────────
    { path: '*', element: <Suspense fallback={<Loader />}><NotFoundPage /></Suspense> },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
