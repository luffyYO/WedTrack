import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
                <p className="text-[72px] font-bold text-neutral-200 leading-none select-none">404</p>
                <h1 className="text-heading-xl text-[var(--color-text-primary)] mt-2">Page not found</h1>
                <p className="text-body-md text-[var(--color-text-secondary)] mt-2">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Button
                    className="mt-6"
                    icon={<Home size={15} />}
                    onClick={() => navigate('/')}
                >
                    Go home
                </Button>
            </div>
        </div>
    );
}
