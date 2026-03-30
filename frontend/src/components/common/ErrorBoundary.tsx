import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    isChunkError: boolean;
}

/**
 * Detects whether an error is a dynamic-import / chunk load failure.
 *
 * These happen when:
 *  1. A new deployment replaces hashed JS chunk files on the server.
 *  2. The user's browser (still running the old app) tries to lazy-load a
 *     route chunk by its OLD filename → 404 → this error.
 *
 * Fix: reload the page once so the browser fetches the new index.html and
 * then correctly resolves the new chunk filenames.
 * A sessionStorage flag prevents an infinite reload loop if the reload itself
 * somehow causes the same error.
 */
function isChunkLoadError(error: Error): boolean {
    const msg = error?.message ?? '';
    const name = error?.name ?? '';
    return (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('error loading dynamically imported module') ||
        name === 'ChunkLoadError' ||
        /Loading chunk \d+ failed/.test(msg)
    );
}

const RELOAD_FLAG_KEY = 'wedtrack_chunk_reload_attempted';

class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{ fallback?: React.ReactNode }>,
    ErrorBoundaryState
> {
    constructor(props: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
        super(props);
        this.state = { hasError: false, isChunkError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        const chunkError = isChunkLoadError(error);

        if (chunkError) {
            const alreadyRetried = sessionStorage.getItem(RELOAD_FLAG_KEY) === '1';
            if (!alreadyRetried) {
                // Mark that we've attempted a reload, then hard-reload.
                // The reload fetches the new index.html + new chunk filenames.
                sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
                window.location.reload();
                // Return a loading state — the reload will happen before render.
                return { hasError: false, isChunkError: true };
            }
        }

        return { hasError: true, error, isChunkError: chunkError };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        if (!isChunkLoadError(error)) {
            console.error('[ErrorBoundary]', error, info);
        }
    }

    componentDidMount() {
        // Clear the reload flag on successful mount — resets the guard for
        // any future deployments where a fresh chunk load failure may occur.
        sessionStorage.removeItem(RELOAD_FLAG_KEY);
    }

    render() {
        if (!this.state.hasError) return this.props.children;
        if (this.props.fallback) return this.props.fallback;

        const { isChunkError, error } = this.state;

        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-danger-bg)] flex items-center justify-center">
                    <AlertTriangle size={22} className="text-[var(--color-danger)]" />
                </div>
                <div>
                    <h3 className="text-heading-md text-[var(--color-text-primary)]">
                        {isChunkError ? 'Update Available' : 'Something went wrong'}
                    </h3>
                    <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-sm">
                        {isChunkError
                            ? 'A new version of WedTrack was deployed. Please reload the page to get the latest version.'
                            : (error?.message ?? 'An unexpected error occurred.')}
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        if (isChunkError) {
                            sessionStorage.removeItem(RELOAD_FLAG_KEY);
                            window.location.reload();
                        } else {
                            this.setState({ hasError: false, error: undefined, isChunkError: false });
                        }
                    }}
                >
                    {isChunkError ? (
                        <span className="flex items-center gap-2">
                            <RefreshCw size={14} />
                            Reload Page
                        </span>
                    ) : 'Try again'}
                </Button>
            </div>
        );
    }
}

export default ErrorBoundary;
