import { useState, useCallback, useRef } from 'react';
import {
    Sparkles, Copy, Check, ExternalLink, ClipboardPaste,
    AlertTriangle, X, ChevronRight, Plus, Trash2, RotateCcw,
    CheckCircle2, Upload, CopyPlus
} from 'lucide-react';
import { parseAIPastedText, AI_EXTRACTION_PROMPT } from '@/features/aiScan/services/aiParserService';
import type { OcrRow } from '@/features/aiScan/services/aiParserService';
import { cn } from '@/utils/cn';
import { createGiftEntries } from '@/lib/giftQueries';
import type { NewGiftEntry } from '@/lib/giftQueries';
import { useAuthStore } from '@/store';
import Button from '@/components/ui/Button';

interface NewGiftAIModalProps {
    onClose: () => void;
    onSaved: (newEntries: NewGiftEntry[]) => void;
}

type Step = 'upload' | 'paste' | 'review' | 'success';

const AI_TOOLS = [
    { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-700 dark:text-emerald-300' },
    { name: 'Gemini', url: 'https://gemini.google.com', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-700 dark:text-blue-300' },
    { name: 'Claude', url: 'https://claude.ai', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-300' },
];

const AMOUNT_TYPES = ['Cash', 'PhonePe', 'GPay', 'Paytm'];

const genId = () => Math.random().toString(36).substring(2, 9);

export default function NewGiftAIModal({ onClose, onSaved }: NewGiftAIModalProps) {
    const { user } = useAuthStore();
    const [step, setStep] = useState<Step>('upload');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [promptCopied, setPromptCopied] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [rows, setRows] = useState<OcrRow[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedCount, setSavedCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Image pick ────────────────────────────────────────────────────────────
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        setStep('paste');
    }, []);

    // ── Copy prompt ───────────────────────────────────────────────────────────
    const handleCopyPrompt = useCallback(async () => {
        await navigator.clipboard.writeText(AI_EXTRACTION_PROMPT);
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 2500);
    }, []);

    // ── Parse pasted text ─────────────────────────────────────────────────────
    const handleParse = useCallback(() => {
        setParseError(null);
        const parsed = parseAIPastedText(pasteText);
        if (parsed.length === 0) {
            setParseError('Could not parse any rows. Try JSON format or check the pasted text.');
            return;
        }
        // Ensure every parsed row has amount_type and gift_date
        const normalized = parsed.map(row => ({
            ...row,
            amount_type: row.amount_type || 'Cash',
            gift_date: row.gift_date || new Date().toISOString().split('T')[0]
        }));
        setRows(normalized);
        setStep('review');
    }, [pasteText]);

    // ── Inline edit operations ────────────────────────────────────────────────
    const updateRow = (id: string, field: keyof OcrRow, value: string | number) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const deleteRow = (id: string) => {
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const duplicateRow = (row: OcrRow) => {
        setRows(prev => {
            const idx = prev.findIndex(r => r.id === row.id);
            if (idx === -1) return prev;
            const newRow = {
                ...row,
                id: genId(),
                person_name: row.person_name ? `${row.person_name} (Copy)` : '',
                confidence: 1.0,
                needs_review: false
            };
            const updated = [...prev];
            updated.splice(idx + 1, 0, newRow);
            return updated;
        });
    };

    const addRow = () => {
        setRows(prev => [...prev, {
            id: genId(),
            person_name: '',
            father_name: '',
            village: '',
            amount: 0,
            amount_type: 'Cash',
            gift_date: new Date().toISOString().split('T')[0],
            confidence: 1.0,
            needs_review: false
        }]);
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            const validRows = rows.filter(r => r.person_name.trim());
            if (validRows.length === 0) {
                setSaveError('Please add at least one row with a Person Name.');
                setIsSaving(false);
                return;
            }

            const entriesToInsert = validRows.map(row => ({
                user_id: user.id,
                person_name: row.person_name,
                father_name: row.father_name || '',
                amount: Number(row.amount) || 0,
                amount_type: row.amount_type || 'Cash',
                village: row.village || '',
                gift_date: new Date(row.gift_date).toISOString(),
            }));

            const inserted = await createGiftEntries(entriesToInsert);
            setSavedCount(inserted.length);
            onSaved(inserted);
            setStep('success');
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Helper to check row state ─────────────────────────────────────────────
    const getRowValidation = (row: OcrRow) => {
        const isLowConfidence = row.confidence !== undefined && row.confidence < 0.90;
        const isMissingName = !row.person_name || !row.person_name.trim();
        const isZeroAmount = !row.amount || row.amount <= 0;
        const needsReview = isLowConfidence || row.needs_review || isMissingName || isZeroAmount;
        return {
            isLowConfidence,
            isMissingName,
            isZeroAmount,
            needsReview
        };
    };

    // ── Step Indicators ───────────────────────────────────────────────────────
    const STEPS: { key: Step; label: string }[] = [
        { key: 'upload', label: 'Upload' },
        { key: 'paste', label: 'AI Extract' },
        { key: 'review', label: 'Review' },
        { key: 'success', label: 'Done' },
    ];
    const stepIdx = STEPS.findIndex(s => s.key === step);

    const stepIndicator = (
        <div className="flex items-center gap-1.5 text-[12px]">
            {STEPS.map((s, i) => {
                const done = i < stepIdx;
                const active = i === stepIdx;
                return (
                    <div key={s.key} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight size={11} className={done ? 'text-pink-400' : 'text-slate-300 dark:text-slate-600'} />}
                        <span className={cn('font-semibold flex items-center gap-0.5', active ? 'text-pink-500' : done ? 'text-emerald-500' : 'text-slate-400')}>
                            {done ? <CheckCircle2 size={11} className="inline" /> : null}
                            {s.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={cn(
                "w-full bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50 flex flex-col overflow-hidden animate-fade-up transition-all duration-300 max-h-[90vh]",
                step === 'review' ? 'max-w-5xl' : 'max-w-lg'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/30 flex items-center justify-center">
                            <Sparkles size={16} className="text-pink-500" />
                        </div>
                        <div>
                            <p className="font-bold text-[14px] text-[var(--color-text-primary)]">AI Gift Extractor</p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">Upload slip &amp; verify entries</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {stepIndicator}
                        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ── STEP 1: Upload ── */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-[17px] font-bold text-[var(--color-text-primary)]">Upload your handwritten gift sheet</h2>
                                <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                                    Choose the photo of the handwritten gift entries — you can copy the extraction prompt and paste it into ChatGPT/Gemini/Claude in the next step.
                                </p>
                            </div>

                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-pink-200 dark:border-pink-900/50 rounded-2xl p-12 flex flex-col items-center gap-4 hover:bg-pink-50/40 dark:hover:bg-pink-950/10 transition-colors cursor-pointer group"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Upload size={28} className="text-pink-500" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-[15px] text-[var(--color-text-primary)]">Choose Photo</p>
                                    <p className="text-[13px] text-[var(--color-text-muted)] mt-1">JPG, PNG or HEIC · tap to browse</p>
                                </div>
                            </button>

                            <p className="text-[12px] text-center text-slate-400">
                                Already have the response data?{' '}
                                <button onClick={() => setStep('paste')} className="text-pink-500 font-semibold hover:underline">
                                    Skip to paste →
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ── STEP 2: AI Helper ── */}
                    {step === 'paste' && (
                        <div className="space-y-4">
                            {/* Image preview */}
                            {imagePreview && (
                                <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                    <img src={imagePreview} alt="Uploaded sheet" className="w-full max-h-48 object-contain bg-slate-50 dark:bg-slate-900 py-3" />
                                </div>
                            )}

                            {/* Step A: Copy prompt */}
                            <div className="glass-panel rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                                    <h3 className="font-bold text-[14px] text-[var(--color-text-primary)]">Copy the extraction prompt</h3>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 border border-slate-100 dark:border-slate-800">
                                    {AI_EXTRACTION_PROMPT.substring(0, 180)}…
                                </div>
                                <button
                                    onClick={handleCopyPrompt}
                                    className={cn(
                                        'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] transition-all',
                                        promptCopied
                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40'
                                            : 'bg-pink-500 hover:bg-pink-600 text-white shadow-[0_4px_14px_-4px_rgba(236,72,153,0.5)]'
                                    )}
                                >
                                    {promptCopied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Prompt</>}
                                </button>
                            </div>

                            {/* Step B: Open AI tool */}
                            <div className="glass-panel rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                                    <h3 className="font-bold text-[14px] text-[var(--color-text-primary)]">Open an AI assistant &amp; paste image + prompt</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {AI_TOOLS.map(tool => (
                                        <a
                                            key={tool.name}
                                            href={tool.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn('flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-bold transition-all hover:scale-[1.02]', tool.bg, tool.border, tool.text)}
                                        >
                                            {tool.name} <ExternalLink size={11} />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Step C: Paste output */}
                            <div className="glass-panel rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                                    <h3 className="font-bold text-[14px] text-[var(--color-text-primary)]">Paste the AI's response here</h3>
                                </div>
                                <textarea
                                    value={pasteText}
                                    onChange={e => { setPasteText(e.target.value); setParseError(null); }}
                                    placeholder={`Paste JSON, table, or plain text from the AI assistant...\n\nExample:\n[\n  {"name":"Ravi Kumar","father_name":"Ramesh","village":"Bachupuram","amount":5000}\n]`}
                                    rows={6}
                                    className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-3 text-[13px] font-mono text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-300 placeholder:text-slate-400 placeholder:font-sans"
                                />
                                {parseError && (
                                    <p className="flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400">
                                        <AlertTriangle size={13} /> {parseError}
                                    </p>
                                )}
                                <div className="flex gap-3">
                                    <button onClick={() => setStep('upload')} className="text-[13px] text-slate-500 hover:text-slate-700 font-semibold">← Back</button>
                                    <Button
                                        variant="primary"
                                        onClick={handleParse}
                                        disabled={!pasteText.trim()}
                                        className="flex-1"
                                        icon={<ClipboardPaste size={15} />}
                                    >
                                        Parse &amp; Review Rows
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Review Table ── */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h2 className="font-bold text-[16px] text-[var(--color-text-primary)]">Review &amp; Edit Entries</h2>
                                    <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{rows.length} rows extracted · edit cells below inline</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setRows([]); setPasteText(''); setStep('paste'); }}
                                        className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-pink-500 transition-colors font-semibold"
                                    >
                                        <RotateCcw size={12} /> Re-paste
                                    </button>
                                    <button
                                        onClick={addRow}
                                        className="flex items-center gap-1.5 text-[12px] bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900/40 px-3 py-1.5 rounded-lg font-bold hover:bg-pink-100 dark:hover:bg-pink-950/50 transition-colors"
                                    >
                                        <Plus size={12} /> Add Row
                                    </button>
                                </div>
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-[13px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500">
                                            <th className="py-2.5 px-3 text-center font-bold w-10">#</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[130px]">Person Name *</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[120px]">Father's Name</th>
                                            <th className="py-2.5 px-3 text-right font-bold min-w-[90px]">Amount</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[100px]">Amount Type</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[110px]">Village</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[125px]">Gift Date</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[110px]">Confidence</th>
                                            <th className="py-2.5 px-2 w-20 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {rows.map((row, i) => {
                                            const validation = getRowValidation(row);
                                            return (
                                                <tr key={row.id} className={cn(
                                                    'group transition-colors',
                                                    validation.isMissingName ? 'bg-rose-50/20 dark:bg-rose-950/5' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
                                                )}>
                                                    <td className="py-2 px-3 text-center text-slate-400 text-[12px]">{i + 1}</td>
                                                    
                                                    {/* Person Name */}
                                                    <td className="py-1.5 px-2">
                                                        <input
                                                            type="text"
                                                            value={row.person_name}
                                                            onChange={e => updateRow(row.id, 'person_name', e.target.value)}
                                                            className={cn(
                                                                'w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[13px] text-[var(--color-text-primary)] transition-colors',
                                                                validation.isMissingName && 'border-red-300 dark:border-red-900/50 bg-red-50/30'
                                                            )}
                                                            placeholder="Required"
                                                        />
                                                    </td>

                                                    {/* Father Name */}
                                                    <td className="py-1.5 px-2">
                                                        <input
                                                            type="text"
                                                            value={row.father_name || ''}
                                                            onChange={e => updateRow(row.id, 'father_name', e.target.value)}
                                                            className="w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[13px] text-[var(--color-text-primary)] transition-colors"
                                                            placeholder="—"
                                                        />
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="py-1.5 px-2">
                                                        <input
                                                            type="number"
                                                            value={row.amount || ''}
                                                            onChange={e => updateRow(row.id, 'amount', Number(e.target.value))}
                                                            className="w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[13px] text-right text-[var(--color-text-primary)] transition-colors font-semibold"
                                                            placeholder="0"
                                                        />
                                                    </td>

                                                    {/* Amount Type */}
                                                    <td className="py-1.5 px-2">
                                                        <select
                                                            value={row.amount_type}
                                                            onChange={e => updateRow(row.id, 'amount_type', e.target.value)}
                                                            className="w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[13px] text-[var(--color-text-primary)] transition-colors appearance-none cursor-pointer"
                                                        >
                                                            {AMOUNT_TYPES.map(type => (
                                                                <option key={type} value={type} className="dark:bg-slate-800">{type}</option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* Village */}
                                                    <td className="py-1.5 px-2">
                                                        <input
                                                            type="text"
                                                            value={row.village || ''}
                                                            onChange={e => updateRow(row.id, 'village', e.target.value)}
                                                            className="w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[13px] text-[var(--color-text-primary)] transition-colors"
                                                            placeholder="—"
                                                        />
                                                    </td>

                                                    {/* Gift Date */}
                                                    <td className="py-1.5 px-2">
                                                        <input
                                                            type="date"
                                                            value={row.gift_date ? row.gift_date.split('T')[0] : ''}
                                                            onChange={e => updateRow(row.id, 'gift_date', e.target.value)}
                                                            className="w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[12px] text-[var(--color-text-primary)] transition-colors"
                                                        />
                                                    </td>

                                                    {/* Confidence */}
                                                    <td className="py-1.5 px-2">
                                                        {validation.needsReview ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                                                                <AlertTriangle size={10} /> Needs Review
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                                                                <Check size={10} /> High
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-1.5 px-2 text-center">
                                                        <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => duplicateRow(row)}
                                                                title="Duplicate Row"
                                                                className="p-1 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all"
                                                            >
                                                                <CopyPlus size={13} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteRow(row.id)}
                                                                title="Delete Row"
                                                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {rows.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="py-8 text-center text-slate-400 text-[13px]">No rows · add one manually</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Stacked Cards View */}
                            <div className="block md:hidden space-y-4">
                                {rows.map((row, i) => {
                                    const validation = getRowValidation(row);
                                    return (
                                        <div key={row.id} className={cn(
                                            "p-4 rounded-2xl border bg-white dark:bg-slate-900/30 space-y-3 transition-colors relative",
                                            validation.isMissingName ? 'border-red-200 bg-red-50/10' : 'border-slate-100 dark:border-slate-800'
                                        )}>
                                            {/* Mobile Card Header */}
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entry #{i + 1}</span>
                                                <div className="flex items-center gap-2">
                                                    {validation.needsReview ? (
                                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                                                            <AlertTriangle size={9} /> Review
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                                                            <Check size={9} /> OK
                                                        </span>
                                                    )}
                                                    <button onClick={() => duplicateRow(row)} className="p-1 rounded text-slate-400 hover:text-pink-500">
                                                        <CopyPlus size={12} />
                                                    </button>
                                                    <button onClick={() => deleteRow(row.id)} className="p-1 rounded text-slate-400 hover:text-red-500">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Person Name Input */}
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Person Name *</label>
                                                <input
                                                    type="text"
                                                    value={row.person_name}
                                                    onChange={e => updateRow(row.id, 'person_name', e.target.value)}
                                                    className={cn(
                                                        'w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-pink-500',
                                                        validation.isMissingName && 'border-red-300 dark:border-red-900/50 bg-red-50/20'
                                                    )}
                                                    placeholder="Required"
                                                />
                                            </div>

                                            {/* Father's Name & Village */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Father's Name</label>
                                                    <input
                                                        type="text"
                                                        value={row.father_name || ''}
                                                        onChange={e => updateRow(row.id, 'father_name', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-pink-500"
                                                        placeholder="—"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Village</label>
                                                    <input
                                                        type="text"
                                                        value={row.village || ''}
                                                        onChange={e => updateRow(row.id, 'village', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-pink-500"
                                                        placeholder="—"
                                                    />
                                                </div>
                                            </div>

                                            {/* Amount, Type & Date */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</label>
                                                    <input
                                                        type="number"
                                                        value={row.amount || ''}
                                                        onChange={e => updateRow(row.id, 'amount', Number(e.target.value))}
                                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-[12px] text-[var(--color-text-primary)] text-right font-semibold focus:outline-none focus:border-pink-500"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</label>
                                                    <select
                                                        value={row.amount_type}
                                                        onChange={e => updateRow(row.id, 'amount_type', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-pink-500"
                                                    >
                                                        {AMOUNT_TYPES.map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                                                    <input
                                                        type="date"
                                                        value={row.gift_date ? row.gift_date.split('T')[0] : ''}
                                                        onChange={e => updateRow(row.id, 'gift_date', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-[var(--color-text-primary)] focus:outline-none focus:border-pink-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {rows.length === 0 && (
                                    <div className="py-8 text-center text-slate-400 text-[13px] border border-dashed border-slate-100 rounded-2xl">No rows · add one manually</div>
                                )}
                            </div>

                            {saveError && (
                                <p className="flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 p-3 rounded-xl border border-red-200/50">
                                    <AlertTriangle size={14} className="shrink-0" /> {saveError}
                                </p>
                            )}

                            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <button onClick={() => setStep('paste')} className="text-[13px] text-slate-500 hover:text-slate-700 font-semibold px-4">← Back</button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    disabled={isSaving || rows.filter(r => r.person_name.trim()).length === 0}
                                    className="flex-1"
                                >
                                    {isSaving ? 'Saving…' : `Import ${rows.filter(r => r.person_name.trim()).length} Entries →`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Success ── */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center text-center gap-5 py-8">
                            <div className="p-5 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30 shadow-inner">
                                <CheckCircle2 size={40} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">{savedCount} Entries Saved!</h2>
                                <p className="text-[14px] text-[var(--color-text-muted)] mt-2 max-w-xs mx-auto">
                                    All verified entries have been added to your NewGift list.
                                </p>
                            </div>
                            <div className="flex gap-3 flex-wrap justify-center pt-2">
                                <button
                                    onClick={() => { setStep('upload'); setPasteText(''); setRows([]); setImagePreview(null); }}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Extract Another Sheet
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-white text-[14px] bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)] hover:-translate-y-0.5 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
