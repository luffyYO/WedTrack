import { useState } from 'react';
import { CheckCircle2, Edit3, ChevronDown, ChevronUp, User, UserCheck, MapPin, IndianRupee, MessageCircle, Phone } from 'lucide-react';
import type { ParsedVoiceData } from '../hooks/useVoiceInput';

interface VoiceConfirmCardProps {
  parsedData: ParsedVoiceData;
  transcript: string;
  onConfirm: (data: ParsedVoiceData) => void;
  onEdit: () => void;
}

interface FieldRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}

function FieldRow({ icon, label, value, highlight }: FieldRowProps) {
  const displayValue = value === 0 || value === '' ? <span className="text-slate-300 italic">Not detected</span> : value;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${highlight ? 'bg-pink-50/60 border border-pink-100' : 'bg-slate-50/40'}`}>
      <div className="text-slate-400 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</div>
        <div className={`text-[14px] font-semibold truncate ${highlight ? 'text-slate-800' : 'text-slate-600'}`}>{displayValue}</div>
      </div>
    </div>
  );
}

export default function VoiceConfirmCard({ parsedData, transcript, onConfirm, onEdit }: VoiceConfirmCardProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  const detectedCount = [
    parsedData.name,
    parsedData.father_name,
    parsedData.village,
    parsedData.amount > 0 ? 'ok' : '',
    parsedData.message,
    parsedData.phone,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 backdrop-blur-sm animate-fade-up">
      <div className="w-full sm:max-w-[400px] bg-white/95 backdrop-blur-xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-5 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className="font-black text-base tracking-tight">Detected Details</h3>
            <p className="text-[12px] text-white/80 mt-0.5">{detectedCount} of 6 fields captured</p>
          </div>
          {/* Accuracy pill */}
          <div className="ml-auto bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            {Math.round((detectedCount / 6) * 100)}%
          </div>
        </div>

        <div className="px-5 py-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {/* ── Parsed Fields ──────────────────────────────────────────── */}
          <FieldRow icon={<User size={16} />}        label="Full Name"    value={parsedData.name}        highlight={!!parsedData.name} />
          <FieldRow icon={<UserCheck size={16} />}   label="Father's Name" value={parsedData.father_name} highlight={!!parsedData.father_name} />
          <FieldRow icon={<MapPin size={16} />}      label="Village / Town" value={parsedData.village}    highlight={!!parsedData.village} />
          <FieldRow icon={<IndianRupee size={16} />} label="Gift Amount"  value={parsedData.amount > 0 ? `₹ ${parsedData.amount}` : 0} highlight={parsedData.amount > 0} />
          <FieldRow icon={<MessageCircle size={16} />} label="Message"    value={parsedData.message}     highlight={!!parsedData.message} />
          <FieldRow icon={<Phone size={16} />}       label="Phone"        value={parsedData.phone}       highlight={!!parsedData.phone} />

          {/* ── Transcript Preview (collapsible) ───────────────────────── */}
          {transcript && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowTranscript(v => !v)}
                className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors w-full"
              >
                <span>Your speech transcript</span>
                {showTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showTranscript && (
                <div className="mt-2 bg-slate-50 rounded-xl p-3 text-[13px] text-slate-500 leading-relaxed italic border border-slate-100">
                  "{transcript}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Action Buttons ──────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-slate-100 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <Edit3 size={15} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onConfirm(parsedData)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-[13px] hover:from-pink-600 hover:to-rose-500 shadow-md shadow-pink-300/30 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 size={15} />
            Use Details
          </button>
        </div>
      </div>
    </div>
  );
}
