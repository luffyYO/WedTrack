import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{ fallback?: React.ReactNode }>,
    ErrorBoundaryState
> {
    constructor(props: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-danger-bg)] flex items-center justify-center">
                        <AlertTriangle size={22} className="text-[var(--color-danger)]" />
                    </div>
                    <div>
                        <h3 className="text-heading-md text-[var(--color-text-primary)]">Something went wrong</h3>
                        <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
                            {this.state.error?.message ?? 'An unexpected error occurred.'}
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                    >
                        Try again
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
