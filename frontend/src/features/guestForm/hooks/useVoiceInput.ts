import { useState, useRef, useCallback, useEffect } from 'react';
import apiClient from '@/api/client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ParsedVoiceData {
  name: string;
  father_name: string;
  village: string;
  amount: number;
  message: string;
  phone: string;
}

export type VoiceStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'done'
  | 'error'
  | 'unsupported';

export type SupportedLanguage = 'en-IN' | 'hi-IN' | 'te-IN';

// ── Browser type augmentation ───────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useVoiceInput(language: SupportedLanguage = 'en-IN') {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedVoiceData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');

  // ── Check browser support ────────────────────────────────────────────────
  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
    }
  }, [isSupported]);

  // ── Initialize (or re-initialize on language change) ────────────────────
  const initRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition!;
    const recognition = new SpeechRecognitionCtor();

    recognition.lang = language;
    recognition.interimResults = true;  // stream partial results in real-time
    recognition.maxAlternatives = 1;
    recognition.continuous = false;     // single utterance per hold

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript + ' ';
        } else {
          interim += r[0].transcript;
        }
      }
      finalTranscriptRef.current = final || interim;
      setTranscript(finalTranscriptRef.current.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setErrorMsg('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        setErrorMsg('Microphone access denied. Please allow mic permission.');
      } else if (event.error === 'network') {
        setErrorMsg('Network error during speech recognition.');
      } else {
        setErrorMsg(`Speech error: ${event.error}`);
      }
      setStatus('error');
    };

    recognition.onend = () => {
      // Only process if we have a transcript (not aborted manually)
      const finalText = finalTranscriptRef.current.trim();
      if (finalText.length > 2) {
        parseTranscript(finalText);
      } else {
        setStatus('idle');
      }
    };

    return recognition;
  }, [language, isSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Parse via Edge Function ──────────────────────────────────────────────
  const parseTranscript = useCallback(async (text: string) => {
    setStatus('processing');
    try {
      const response = await apiClient.post<{ success: boolean; data: ParsedVoiceData }>(
        'parse-voice',
        { transcript: text }
      );

      const data = response.data?.data ?? response.data;
      setParsedData(data as ParsedVoiceData);
      setStatus('done');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to parse speech. Try again.';
      setErrorMsg(msg);
      setStatus('error');
    }
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!isSupported) return;
    finalTranscriptRef.current = '';
    setTranscript('');
    setParsedData(null);
    setErrorMsg('');

    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setStatus('listening');

    try {
      recognition.start();
    } catch {
      // Already started — ignore
    }
  }, [isSupported, initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // onend will fire and trigger parseTranscript if transcript exists
  }, []);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    finalTranscriptRef.current = '';
    setTranscript('');
    setParsedData(null);
    setErrorMsg('');
    setStatus(isSupported ? 'idle' : 'unsupported');
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    status,
    transcript,
    parsedData,
    errorMsg,
    isSupported,
    startListening,
    stopListening,
    reset,
  };
}
