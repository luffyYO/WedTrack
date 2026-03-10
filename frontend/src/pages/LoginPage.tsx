/**
 * LoginPage – scaffold placeholder.
 * Authentication UI will be implemented in the feature/login-page branch.
 */
export default function LoginPage() {
    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)] text-center">
            <h1 className="text-heading-lg text-[var(--color-text-primary)]">Sign in to WedTrack</h1>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-2">
                Login form will be implemented in the <code className="text-mono bg-neutral-100 px-1.5 py-0.5 rounded text-xs">feature/login-page</code> branch.
            </p>
        </div>
    );
}
