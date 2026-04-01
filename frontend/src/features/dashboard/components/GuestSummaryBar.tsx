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
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '1.25rem',
                    boxShadow: '0 4px 24px -4px rgba(25,28,30,0.06)',
                    padding: '14px 16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}
            >
                {/* Row 1: Heading + count + PDF button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#191c1e',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.3,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {title}
                        </span>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: '#f2f4f6',
                                color: '#544249',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                letterSpacing: '0.02em',
                                flexShrink: 0,
                            }}
                        >
                            {filteredGuests.length}
                        </span>
                    </div>

                    <button
                        onClick={onDownloadPDF}
                        disabled={filteredGuests.length === 0 || pdfLoading}
                        title={pdfLoading ? 'Generating PDF…' : 'Export verified guest PDF'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 10px',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(218,192,201,0.35)',
                            background: '#ffffff',
                            color: '#544249',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            flexShrink: 0,
                            opacity: filteredGuests.length === 0 || pdfLoading ? 0.4 : 1,
                            transition: 'all 0.15s',
                        }}
                    >
                        {pdfLoading
                            ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin" />
                            : <Download size={13} />}
                        <span className="hidden sm:inline">Export PDF</span>
                    </button>
                </div>

                <div style={{ height: '1px', background: '#f2f4f6', margin: '0 -2px' }} />

                {/* Row 2: Verified amount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                    <span
                        style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#87717a',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                        }}
                    >
                        Verified
                    </span>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1px',
                            fontWeight: 800,
                            color: '#191c1e',
                            fontSize: '15px',
                            letterSpacing: '-0.02em',
                            flex: 1,
                        }}
                    >
                        <IndianRupee size={13} style={{ color: '#544249', flexShrink: 0 }} />
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {filteredVerifiedAmount.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#6ffbbe',
                            color: '#002113',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            flexShrink: 0,
                            letterSpacing: '0.02em',
                        }}
                    >
                        {filteredVerifiedGiftsCount}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="#002113" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </div>
            </div>
        </div>
    );
}
