import { Download, IndianRupee } from 'lucide-react';

interface GuestSummaryBarProps {
    filteredGuests: any[];
    filteredVerifiedAmount: number;
    filteredVerifiedGiftsCount: number;
    searchQuery: string;
    activeFilter: string;
    selectedAmountRange: number | null;
    selectedPaymentMethod: string | null;
    pdfLoading: boolean;
    onDownloadPDF: () => void;
}

export default function GuestSummaryBar({
    filteredGuests,
    filteredVerifiedAmount,
    filteredVerifiedGiftsCount,
    searchQuery,
    activeFilter,
    selectedAmountRange,
    selectedPaymentMethod,
    pdfLoading,
    onDownloadPDF,
}: GuestSummaryBarProps) {
    const title =
        searchQuery || (activeFilter === 'Amount' && selectedAmountRange)
            ? 'Active Results'
            : activeFilter === 'Side' && selectedPaymentMethod
            ? `${selectedPaymentMethod === 'bride' ? 'Bride' : 'Groom'} Side`
            : 'Recent Submissions';

    return (
        <div className="px-4 sm:px-6">
            <div className="bg-white dark:bg-[#161b22] rounded-[1.25rem] shadow-[0_4px_24px_-4px_rgba(25,28,30,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] border border-transparent dark:border-[rgba(99,120,150,0.3)] px-4 py-[14px] flex flex-col gap-[10px]">
                {/* Row 1: Heading + count + PDF button */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[15px] font-bold text-[#191c1e] dark:text-[#e6edf3] tracking-[-0.01em] leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis">
                            {title}
                        </span>
                        <span className="inline-flex items-center bg-[#f2f4f6] dark:bg-[#1c2333] text-[#544249] dark:text-[#8b97a8] text-[11px] font-black px-2 py-0.5 rounded-full tracking-[0.02em] shrink-0">
                            {filteredGuests.length}
                        </span>
                    </div>

                    <button
                        onClick={onDownloadPDF}
                        disabled={filteredGuests.length === 0 || pdfLoading}
                        title={pdfLoading ? 'Generating PDF…' : 'Export verified guest PDF'}
                        className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-xl border border-[rgba(218,192,201,0.35)] dark:border-[rgba(99,120,150,0.35)] bg-white dark:bg-[#1c2333] text-[#544249] dark:text-[#8b97a8] text-[11px] font-semibold cursor-pointer shrink-0 transition-all hover:border-pink-300 dark:hover:border-pink-800"
                        style={{ opacity: filteredGuests.length === 0 || pdfLoading ? 0.4 : 1 }}
                    >
                        {pdfLoading
                            ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin" />
                            : <Download size={13} />}
                        <span className="hidden sm:inline">Export PDF</span>
                    </button>
                </div>

                <div className="h-px bg-[#f2f4f6] dark:bg-[rgba(99,120,150,0.2)] -mx-0.5" />

                {/* Row 2: Verified amount */}
                <div className="flex items-center gap-2 flex-nowrap">
                    <span className="text-[9px] font-black text-[#87717a] dark:text-[#6a7585] tracking-[0.1em] uppercase shrink-0">
                        Verified
                    </span>

                    <div className="flex items-center gap-px font-black text-[#191c1e] dark:text-[#e6edf3] text-[15px] tracking-[-0.02em] flex-1">
                        <IndianRupee size={13} className="text-[#544249] dark:text-[#8b97a8] shrink-0" />
                        <span className="[font-variant-numeric:tabular-nums]">
                            {filteredVerifiedAmount.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <span className="inline-flex items-center gap-[3px] bg-[#6ffbbe] dark:bg-emerald-900/40 text-[#002113] dark:text-emerald-300 text-[10px] font-black px-2 py-[3px] rounded-full shrink-0 tracking-[0.02em]">
                        {filteredVerifiedGiftsCount}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </div>
            </div>
        </div>
    );
}
