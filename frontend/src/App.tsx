import AppRouter from '@/routes/router';

/**
 * App root — thin wrapper that mounts the router.
 * Global providers (theme, notifications, query client) can be added here later.
 */
export default function App() {
    return <AppRouter />;
}
