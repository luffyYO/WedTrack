import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import type { VoiceStatus, SupportedLanguage } from '../hooks/useVoiceInput';

interface VoiceButtonProps {
  status: VoiceStatus;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

const LANG_OPTIONS: { value: SupportedLanguage; label: string; flag: string }[] = [
  { value: 'en-IN', label: 'English', flag: '🇬🇧' },
  { value: 'hi-IN', label: 'हिंदी',   flag: '🇮🇳' },
  { value: 'te-IN', label: 'తెలుగు',  flag: '🌸' },
];

export default function VoiceButton({
  status,
  isSupported,
  onStart,
  onStop,
  language,
  onLanguageChange,
}: VoiceButtonProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const isListening  = status === 'listening';
  const isProcessing = status === 'processing';
  const isDone       = status === 'done';
  const isError      = status === 'error';
  const isDisabled   = !isSupported || isProcessing || isDone;

  // ── Event handlers (pointer = unified touch + mouse) ──────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isDisabled || isListening) return;
    onStart();
  };
  const handlePointerUp = () => {
    if (!isListening) return;
    onStop();
  };

  const selectedLang = LANG_OPTIONS.find(l => l.value === language) ?? LANG_OPTIONS[0];

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-400 text-[12px] font-medium">
        <MicOff size={16} />
        <span>Voice input not supported in this browser. Use Chrome or Samsung Internet.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* ── Language Selector ────────────────────────────────────────────── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLangMenu(v => !v)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-pink-600 transition-colors px-3 py-1 rounded-full bg-white/60 border border-slate-200/60 hover:border-pink-200"
        >
          <span>{selectedLang.flag}</span>
          <span>{selectedLang.label}</span>
          <svg className="w-3 h-3 opacity-50" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.25 7.5L10 12.25l4.75-4.75" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </button>

        {showLangMenu && (
          <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 min-w-[130px]">
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onLanguageChange(opt.value); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-pink-50 hover:text-pink-600 ${language === opt.value ? 'text-pink-600 bg-pink-50/60' : 'text-slate-600'}`}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
                {language === opt.value && <span className="ml-auto text-pink-400">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Mic Button ──────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center gap-2">
        {/* Outer pulse ring when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-400 opacity-25 animate-ping" style={{ width: 72, height: 72, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            <span className="absolute inset-0 rounded-full bg-rose-400 opacity-15 animate-ping" style={{ width: 88, height: 88, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animationDelay: '0.4s' }} />
          </>
        )}

        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          disabled={isDisabled && !isListening}
          className={`
            relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center
            transition-all duration-200 select-none touch-none
            shadow-lg active:scale-95
            ${isListening  ? 'bg-gradient-to-br from-rose-500 to-red-500 shadow-rose-300/50 scale-105' : ''}
            ${isProcessing ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-amber-200/50' : ''}
            ${isDone       ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200/50' : ''}
            ${isError      ? 'bg-gradient-to-br from-slate-400 to-slate-500' : ''}
            ${!isListening && !isProcessing && !isDone && !isError
                ? 'bg-gradient-to-br from-pink-500 to-rose-400 shadow-pink-300/40 hover:shadow-pink-400/50 hover:scale-105'
                : ''}
          `}
          aria-label={isListening ? 'Release to stop recording' : 'Hold to speak'}
        >
          {isProcessing ? (
            <Loader2 size={28} className="text-white animate-spin" />
          ) : (
            <Mic size={28} className="text-white" />
          )}
        </button>

        {/* ── Label below button ──────────────────────────────────────────── */}
        <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
          isListening  ? 'text-rose-500 animate-pulse'  :
          isProcessing ? 'text-amber-500'               :
          isDone       ? 'text-emerald-600'             :
          isError      ? 'text-slate-400'               :
                         'text-slate-400'
        }`}>
          {isListening  ? '● Recording...'   :
           isProcessing ? 'Analysing...'     :
           isDone       ? '✓ Done'           :
           isError      ? 'Try Again'        :
                          'Hold to Speak'}
        </span>
      </div>

      {/* ── Visual wave (active recording indicator) ─────────────────────── */}
      {isListening && (
        <div className="flex items-end gap-[3px] h-6">
          {[0.7, 1, 0.4, 0.9, 0.5, 1, 0.6].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-rose-400 rounded-full animate-bounce"
              style={{
                height: `${h * 20}px`,
                animationDelay:    `${i * 0.12}s`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
