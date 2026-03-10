import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Construction size={24} className="text-neutral-400" />
            </div>
            <div>
                <h2 className="text-heading-lg text-[var(--color-text-primary)]">{title}</h2>
                <p className="text-body-md text-[var(--color-text-secondary)] mt-1 max-w-sm">{description}</p>
            </div>
            <span className="text-label text-[var(--color-text-muted)] bg-neutral-100 px-3 py-1 rounded-full">
                Coming soon
            </span>
        </div>
    );
}

export default function HomePage() {
    return <PlaceholderPage title="Home" description="Welcome to WedTrack. Your dashboard overview will appear here." />;
}
