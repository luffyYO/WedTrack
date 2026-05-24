/**
 * Shared Export Service
 * Exports data as CSV or triggers PDF download for guests/newGift entries.
 */

// ── CSV ───────────────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
    const str = val == null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Dashboard Guests ──────────────────────────────────────────────────────────

export interface GuestExportRow {
    fullname: string;
    father_fullname?: string;
    village?: string;
    amount: number;
    payment_type?: string;
    is_paid: boolean;
    created_at: string;
}

export function exportGuestsCSV(guests: GuestExportRow[], filename = 'contributions.csv') {
    const headers = ['Name', "Father's Name", 'Village', 'Amount (₹)', 'Payment Type', 'Status', 'Date'];
    const rows = guests.map(g => [
        escapeCSV(g.fullname),
        escapeCSV(g.father_fullname || ''),
        escapeCSV(g.village || ''),
        escapeCSV(g.amount),
        escapeCSV(g.payment_type || 'Cash'),
        escapeCSV(g.is_paid ? 'Verified' : 'Pending'),
        escapeCSV(g.created_at ? new Date(g.created_at).toLocaleDateString('en-IN') : ''),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

// ── NewGift Entries ───────────────────────────────────────────────────────────

export interface GiftExportRow {
    person_name: string;
    father_name?: string;
    village?: string;
    amount: number;
    amount_type: string;
    gift_date?: string;
    created_at: string;
}

export function exportGiftEntriesCSV(entries: GiftExportRow[], filename = 'gift-entries.csv') {
    const headers = ['Person Name', "Father's Name", 'Village', 'Amount', 'Type', 'Gift Date', 'Recorded On'];
    const rows = entries.map(e => [
        escapeCSV(e.person_name),
        escapeCSV(e.father_name || ''),
        escapeCSV(e.village || ''),
        escapeCSV(e.amount),
        escapeCSV(e.amount_type),
        escapeCSV(e.gift_date ? new Date(e.gift_date).toLocaleDateString('en-IN') : ''),
        escapeCSV(e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : ''),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}
