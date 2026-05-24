import PageHeader from '@/components/layout/PageHeader';
import { useGiftTally } from '@/lib/tallyQueries';
import GiftTallyStats from '../components/GiftTallyStats';
import GiftTallyTable from '../components/GiftTallyTable';

export default function GiftTallyPage() {
    const { data: tally = [], isLoading } = useGiftTally();

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-24">
            <PageHeader
                title="Gift Tally"
                description="Automatically match and track the gifts you gave against what was returned."
            />

            <div className="px-4 sm:px-6 lg:px-8 mt-6">
                <GiftTallyStats tally={tally} loading={isLoading} />
            </div>

            <div className="px-4 sm:px-6 lg:px-8 mt-10">
                <GiftTallyTable tally={tally} loading={isLoading} />
            </div>
        </div>
    );
}
