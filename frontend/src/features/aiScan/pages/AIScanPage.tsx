import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Sparkles, Copy, Check, ExternalLink, ClipboardPaste,
    ChevronRight, CheckCircle2, ArrowLeft, AlertTriangle,
    Plus, Trash2, RotateCcw,
} from 'lucide-react';
import { useAuthStore, useAppStore } from '@/store';
import { supabase } from '@/config/supabaseClient';
import { fetchUserWeddings } from '@/lib/queries';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { parseAIPastedText, AI_EXTRACTION_PROMPT } from '../services/aiParserService';
import type { OcrRow } from '../services/aiParserService';
import { cn } from '@/utils/cn';

type Step = 'upload' | 'paste' | 'review' | 'success';

const AI_TOOLS = [
    { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-700 dark:text-emerald-300' },
    { name: 'Gemini', url: 'https://gemini.google.com', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-700 dark:text-blue-300' },
    { name: 'Claude', url: 'https://claude.ai', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-300' },
];

const genId = () => Math.random().toString(36).substring(2, 9);

export default function AIScanPage() {
    const navigate = useNavigate();
    const { weddingId: urlWeddingId } = useParams<{ weddingId: string }>();
    const { user } = useAuthStore();
    const { activeWedding: zustandWedding } = useAppStore();

    const { data: weddings = [], isLoading: weddingsLoading } = useQuery({
        queryKey: ['weddings', user?.id],
        queryFn: () => fetchUserWeddings(user!.id),
        enabled: !!user?.id,
        staleTime: 60_000,
    });

    const weddingId = urlWeddingId || zustandWedding?.id;
    const activeWedding = weddings.find(w => w.id === weddingId);
    const hasAccess = !!activeWedding;

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
        setRows(parsed);
        setStep('review');
    }, [pasteText]);

    // ── Inline edit ───────────────────────────────────────────────────────────
    const updateRow = (id: string, field: keyof OcrRow, value: string | number) =>
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

    const deleteRow = (id: string) =>
        setRows(prev => prev.filter(r => r.id !== id));

    const addRow = () =>
        setRows(prev => [...prev, {
            id: genId(), person_name: '', father_name: '', village: '',
            amount: 0, amount_type: 'Cash',
            gift_date: new Date().toISOString().split('T')[0],
        }]);

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!user?.id || !activeWedding) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            const validRows = rows.filter(r => r.person_name.trim());
            let count = 0;
            for (const row of validRows) {
                const { error } = await supabase.from('guests').insert({
                    wedding_id: activeWedding.id,
                    fullname: row.person_name,
                    father_fullname: row.father_name || null,
                    village: row.village || null,
                    amount: row.amount || 0,
                    payment_type: row.amount_type || 'Cash',
                    payment_status: 'paid',
                    is_paid: true,
                    is_read: false,
                });
                if (error) throw new Error(error.message);
                count++;
            }
            setSavedCount(count);
            setStep('success');
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (weddingsLoading) return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-9 h-9 border-[3px] border-slate-200 border-t-pink-500 rounded-full animate-spin" />
        </div>
    );

    if (!hasAccess) return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div className="glass-panel max-w-md w-full rounded-3xl p-8 text-center space-y-4">
                <AlertTriangle size={36} className="mx-auto text-amber-500" />
                <p className="font-bold text-lg">No active wedding selected.</p>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
        </div>
    );

    // ── Step indicator ────────────────────────────────────────────────────────
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
                        <span className={cn('font-semibold', active ? 'text-pink-500' : done ? 'text-emerald-500' : 'text-slate-400')}>
                            {done ? <CheckCircle2 size={11} className="inline mr-0.5" /> : null}
                            {s.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="w-full pb-12 animate-fade-up">
            <div className="px-4 sm:px-6">
                <PageHeader
                    title={<span className="flex items-center gap-2"><Sparkles className="text-pink-500" size={24} />AI Extract</span>}
                    description={`Use ChatGPT / Gemini / Claude to extract entries from handwritten sheets for "${activeWedding.bride_name} & ${activeWedding.groom_name}".`}
                    action={stepIndicator}
                    breadcrumbs={
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 hover:text-pink-500 transition-colors text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <ArrowLeft size={12} /> Dashboard
                        </button>
                    }
                />
            </div>

            <div className="mt-6 px-4 sm:px-6 max-w-4xl mx-auto space-y-5">

                {/* ── STEP 1: Upload ── */}
                {step === 'upload' && (
                    <div className="glass-panel rounded-2xl p-8 space-y-6">
                        <div>
                            <h2 className="text-[17px] font-bold text-[var(--color-text-primary)]">Upload your handwritten sheet</h2>
                            <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                                Select the photo — you'll upload it to an AI assistant in the next step.
                            </p>
                        </div>

                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-pink-200 dark:border-pink-900/50 rounded-2xl p-12 flex flex-col items-center gap-4 hover:bg-pink-50/40 dark:hover:bg-pink-950/10 transition-colors cursor-pointer group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Sparkles size={28} className="text-pink-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-[15px] text-[var(--color-text-primary)]">Choose Photo</p>
                                <p className="text-[13px] text-[var(--color-text-muted)] mt-1">JPG, PNG or HEIC · tap to browse</p>
                            </div>
                        </button>

                        <p className="text-[12px] text-center text-slate-400">
                            Already have the data as text?{' '}
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
                            <div className="glass-panel rounded-2xl overflow-hidden">
                                <img src={imagePreview} alt="Uploaded sheet" className="w-full max-h-56 object-contain bg-slate-50 dark:bg-slate-900 py-3" />
                            </div>
                        )}

                        {/* Step A: Copy prompt */}
                        <div className="glass-panel rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                                <h3 className="font-bold text-[14px] text-[var(--color-text-primary)]">Copy the extraction prompt</h3>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 border border-slate-100 dark:border-slate-800">
                                {AI_EXTRACTION_PROMPT.substring(0, 200)}…
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
                                        className={cn('flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[12px] font-bold transition-all hover:scale-[1.02]', tool.bg, tool.border, tool.text)}
                                    >
                                        {tool.name} <ExternalLink size={11} />
                                    </a>
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-400 text-center">Upload your photo + paste the copied prompt → run it</p>
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
                                placeholder={`Paste JSON, table, or plain text from the AI assistant...\n\nExample:\n[\n  {"name":"K. Ramchand","father_name":"Bichu","village":"Bachapuram","amount":"750"}\n]`}
                                rows={9}
                                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-3 text-[13px] font-mono text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-300 placeholder:text-slate-400 placeholder:font-sans"
                            />
                            {parseError && (
                                <p className="flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400">
                                    <AlertTriangle size={13} /> {parseError}
                                </p>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleParse}
                                disabled={!pasteText.trim()}
                                className="w-full"
                                icon={<ClipboardPaste size={15} />}
                            >
                                Parse &amp; Review Rows
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Review table ── */}
                {step === 'review' && (
                    <div className="space-y-4">
                        <div className="glass-panel rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h2 className="font-bold text-[16px] text-[var(--color-text-primary)]">Review &amp; Edit Entries</h2>
                                    <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{rows.length} rows extracted · click any cell to edit</p>
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

                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-[13px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500">
                                            <th className="py-2.5 px-3 text-center font-bold w-10">#</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[130px]">Name</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[120px]">Father's Name</th>
                                            <th className="py-2.5 px-3 text-left font-bold min-w-[110px]">Village / Town</th>
                                            <th className="py-2.5 px-3 text-right font-bold min-w-[90px]">Amount ₹</th>
                                            <th className="py-2.5 px-2 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {rows.map((row, i) => {
                                            const invalid = !row.person_name.trim();
                                            return (
                                                <tr key={row.id} className={cn('group transition-colors', invalid ? 'bg-rose-50/20' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20')}>
                                                    <td className="py-2 px-3 text-center text-slate-400 text-[12px]">{i + 1}</td>
                                                    {(['person_name', 'father_name', 'village'] as const).map(field => (
                                                        <td key={field} className="py-1.5 px-2">
                                                            <input
                                                                type="text"
                                                                value={String(row[field] ?? '')}
                                                                onChange={e => updateRow(row.id, field, e.target.value)}
                                                                className={cn(
                                                                    'w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[13px] text-[var(--color-text-primary)] transition-colors',
                                                                    field === 'person_name' && invalid && 'border-red-300'
                                                                )}
                                                                placeholder={field === 'person_name' ? 'Required' : '—'}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="py-1.5 px-2">
                                                        <input
                                                            type="number"
                                                            value={row.amount || ''}
                                                            onChange={e => updateRow(row.id, 'amount', Number(e.target.value))}
                                                            className="w-full bg-transparent border-b border-transparent focus:border-pink-400 focus:outline-none px-1 py-0.5 text-[13px] text-right text-[var(--color-text-primary)] transition-colors"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-2">
                                                        <button
                                                            onClick={() => deleteRow(row.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {rows.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400 text-[13px]">No rows · add one manually</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {saveError && (
                                <p className="flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400">
                                    <AlertTriangle size={13} /> {saveError}
                                </p>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setStep('paste')} className="text-[13px] text-slate-500 hover:text-slate-700 font-semibold">← Back</button>
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
                    </div>
                )}

                {/* ── STEP 4: Success ── */}
                {step === 'success' && (
                    <div className="glass-panel rounded-2xl p-10 flex flex-col items-center text-center gap-5">
                        <div className="p-5 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30 shadow-inner">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">{savedCount} Entries Saved!</h2>
                            <p className="text-[14px] text-[var(--color-text-muted)] mt-2 max-w-xs mx-auto">
                                All verified entries have been added to your guest list.
                            </p>
                        </div>
                        <div className="flex gap-3 flex-wrap justify-center">
                            <button
                                onClick={() => { setStep('upload'); setPasteText(''); setRows([]); setImagePreview(null); }}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Extract Another Sheet
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2.5 rounded-xl font-semibold text-white text-[14px] bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)] hover:-translate-y-0.5 transition-all"
                            >
                                View Dashboard →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
