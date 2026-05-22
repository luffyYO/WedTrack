import { useState } from 'react';
import { Copy, Check, Download, QrCode, Info, ExternalLink, X, Maximize2, Sparkles, Smartphone } from 'lucide-react';
import type { PaymentMethod } from '../../weddingTrack/types/weddingTrack.types';

interface GuestPaymentOptionsProps {
  paymentMethods: PaymentMethod[];
  amount: string;
  submitting: boolean;
  weddingName?: string;
}

export default function GuestPaymentOptions({ 
  paymentMethods, 
  amount, 
  submitting,
  weddingName
}: GuestPaymentOptionsProps) {
  const [copied, setCopied] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const method = paymentMethods.find((m) => m.is_primary) || paymentMethods[0];
  if (!method) return null;

  const hasQR = !!method.payment_qr_url;
  const hasUPI = !!method.upi_id;

  if (!hasQR && !hasUPI) return null;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const openUPIAppChooser = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    try {
      if (isAndroid) {
        // Android generic intent or standard upi://pay
        window.location.href = "upi://pay";
      } else if (isIOS) {
        // iOS generic UPI scheme
        window.location.href = "upi://";
      } else {
        // Fallback for others
        window.location.href = "upi://pay";
      }
    } catch (err) {
      console.warn('App chooser invocation blocked or failed', err);
    }
  };

  const attemptOpenUPIApp = () => {
    const start = Date.now();
    let hasAppOpened = false;

    const handleBlur = () => {
      hasAppOpened = true;
      window.removeEventListener('blur', handleBlur);
    };
    window.addEventListener('blur', handleBlur);

    openUPIAppChooser();

    // Check after 1.5 seconds if the window lost focus
    setTimeout(() => {
      window.removeEventListener('blur', handleBlur);
      if (!hasAppOpened && Date.now() - start < 2000) {
        // App opening failed, show the helper instructions/modal
        setShowHelperModal(true);
      }
    }, 1500);
  };

  const handleCopy = () => {
    if (!method.upi_id) return;
    
    // 1. Copy UPI ID
    navigator.clipboard.writeText(method.upi_id);
    setCopied(true);
    showToast("UPI ID copied successfully");
    setTimeout(() => setCopied(false), 4000);

    // 2. Attempt lightweight app invocation (Chooser)
    setTimeout(() => {
      attemptOpenUPIApp();
    }, 300);
  };

  const handleDownloadQR = async () => {
    if (!method.payment_qr_url) return;
    try {
      const response = await fetch(method.payment_qr_url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${weddingName ? weddingName.replace(/\s+/g, '_') : 'wedding'}_payment_qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast("QR Code downloaded successfully");
    } catch (error) {
      console.error('Failed to download QR code:', error);
      window.open(method.payment_qr_url, '_blank');
    }
  };

  return (
    <div className="space-y-6 mt-6 max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-neutral-800/95 text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl border border-white/10 text-xs font-bold whitespace-nowrap backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fullscreen QR Modal */}
      {isQrModalOpen && hasQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 max-w-md w-full border border-pink-100 dark:border-neutral-800 shadow-2xl relative overflow-hidden">
            {/* Elegant background shapes */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-100/30 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-pink-500" />
                <h3 className="text-xs font-black text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
                  Scan QR Code
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsQrModalOpen(false)}
                className="p-2 bg-slate-100 dark:bg-neutral-800 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-full transition-colors active:scale-90"
              >
                <X size={16} className="text-slate-500 dark:text-neutral-400" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 relative z-10">
              {/* Payee Name */}
              {method.receiver_name && (
                <div className="text-center w-full">
                  <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest block mb-0.5">Payee</span>
                  <span className="text-base font-black text-slate-800 dark:text-white block">{method.receiver_name}</span>
                </div>
              )}

              {/* Large QR Container */}
              <div className="bg-slate-50 dark:bg-neutral-950/50 p-6 rounded-[2rem] border-2 border-pink-50 dark:border-neutral-800 shadow-lg w-72 h-72 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={method.payment_qr_url} 
                  alt="UPI Payment QR Large" 
                  className="w-full h-full object-contain rounded-2xl"
                  loading="eager"
                />
              </div>

              {/* Amount Badge */}
              <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 px-4 py-2 rounded-2xl flex items-center gap-1.5">
                <span className="text-[10px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-wider">Amount:</span>
                <span className="text-base font-black text-slate-800 dark:text-white">₹{amount || '0'}</span>
              </div>

              {/* Action Buttons in Modal */}
              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={attemptOpenUPIApp}
                  className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black tracking-widest uppercase transition-all shadow-md shadow-pink-500/25 active:scale-95"
                >
                  <Smartphone size={14} />
                  Open UPI Apps
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border border-pink-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-pink-600 dark:text-pink-400 text-xs font-black tracking-widest uppercase transition-all active:scale-95"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>

              <p className="text-[9px] text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-center max-w-[240px] leading-relaxed">
                Take a screenshot to scan from GPay/PhonePe or click "Open UPI Apps" to launch them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white dark:bg-neutral-900 border border-pink-50/80 dark:border-neutral-800/80 shadow-[0_15px_40px_rgba(244,63,94,0.04)] dark:shadow-none rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50/40 dark:bg-pink-950/10 rounded-full blur-xl pointer-events-none" />

        {/* QR Section */}
        <div className="flex flex-col items-center gap-5">
          <div 
            onClick={() => hasQR && setIsQrModalOpen(true)}
            className={`bg-slate-50/50 dark:bg-neutral-950/30 p-5 rounded-[2rem] border-2 border-pink-50/60 dark:border-neutral-800/50 shadow-xl shadow-pink-500/[0.02] w-64 h-64 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
              hasQR ? 'cursor-pointer hover:scale-[1.02] group/qr' : ''
            }`}
          >
            {hasQR ? (
              <>
                <img 
                  src={method.payment_qr_url} 
                  alt="UPI Payment QR" 
                  className="w-full h-full object-contain rounded-2xl transition-all duration-300 group-hover/qr:scale-[1.01]"
                  loading="eager"
                />
                {/* Click to expand overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                  <div className="p-2.5 bg-white/20 rounded-full backdrop-blur-sm">
                    <Maximize2 size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase">Click to Expand</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-4">
                <QrCode size={40} className="text-slate-200 dark:text-neutral-800 mb-3" />
                <p className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest leading-relaxed">
                  QR not uploaded<br/>by host yet
                </p>
              </div>
            )}
          </div>
          
          {hasQR && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-pink-100 dark:border-neutral-800 bg-pink-50/40 dark:bg-pink-950/20 hover:bg-pink-100/40 text-pink-600 dark:text-pink-400 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
              >
                <Maximize2 size={13} />
                View Fullscreen
              </button>
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-300 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
              >
                <Download size={13} />
                Download QR
              </button>
            </div>
          )}
        </div>

        {/* Payee Details */}
        {method.receiver_name && (
          <div className="text-center mt-6 mb-6">
            <span className="text-[9px] font-black text-pink-400 dark:text-pink-500 uppercase tracking-[0.2em] block mb-0.5">Receiver</span>
            <span className="text-base font-black text-slate-800 dark:text-white block">{method.receiver_name}</span>
          </div>
        )}

        {/* UPI ID Copy Section */}
        {hasUPI && (
          <div className="space-y-3">
            <div className="bg-pink-50/20 dark:bg-neutral-950/20 border border-pink-100/40 dark:border-neutral-800 rounded-3xl p-4 flex items-center justify-between gap-3 group hover:border-pink-200 dark:hover:border-neutral-700 transition-all duration-300">
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-widest mb-0.5">UPI ID</span>
                <span className="text-sm sm:text-base font-black text-slate-700 dark:text-neutral-300 truncate font-mono select-all">
                  {method.upi_id}
                </span>
              </div>
              <button 
                type="button"
                onClick={handleCopy}
                className={`shrink-0 h-11 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all duration-300 shadow-sm active:scale-95 ${
                  copied 
                    ? 'bg-emerald-500 text-white border-none' 
                    : 'bg-white dark:bg-neutral-800 border border-pink-200 dark:border-neutral-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50/30'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={13} /> Copied ✓
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy ID
                  </>
                )}
              </button>
            </div>

            {/* Quick Open UPI Button */}
            <button
              type="button"
              onClick={attemptOpenUPIApp}
              className="w-full h-12 rounded-3xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-500/10 hover:shadow-lg active:scale-95"
            >
              <Smartphone size={14} />
              Open UPI Apps
            </button>
          </div>
        )}

        {/* Dynamic Helper Alert */}
        {showHelperModal && (
          <div className="bg-slate-900/95 dark:bg-neutral-800/95 text-white rounded-3xl p-5 mt-5 shadow-xl relative overflow-hidden border border-white/5 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500" />
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 bg-white/10 p-2 rounded-xl shrink-0">
                <ExternalLink size={16} className="text-pink-400" />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black tracking-wide">
                    UPI ID Copied & Ready!
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setShowHelperModal(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={12} className="text-slate-400 hover:text-white" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 mt-2 leading-relaxed font-semibold">
                  We attempted to launch your UPI apps. If it didn't open automatically:
                </p>
                <ol className="text-[9px] text-slate-400 mt-2 space-y-1.5 list-decimal list-inside font-bold uppercase tracking-wider pl-0.5">
                  <li>Open <span className="text-white">PhonePe, GPay, Paytm, or BHIM</span></li>
                  <li>Select "Pay to Mobile/UPI ID"</li>
                  <li>Paste <span className="text-pink-400 font-mono text-[10px]">{method.upi_id}</span></li>
                  <li>Complete payment of <span className="text-white">₹{amount || '0'}</span></li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Quick Steps Guide */}
        <div className="mt-8 border-t border-slate-100 dark:border-neutral-800 pt-6 space-y-3.5">
          <h4 className="text-[11px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Info size={14} className="text-pink-500" /> Payment Steps
          </h4>
          <ol className="text-xs text-slate-600 dark:text-neutral-400 space-y-3 list-decimal list-inside font-semibold leading-relaxed pl-1">
            <li>
              Tap <span className="font-black text-slate-800 dark:text-white">Copy ID</span> or click <span className="font-black text-slate-800 dark:text-white">View Fullscreen</span> to scan QR.
            </li>
            <li>
              Open any UPI app (<span className="text-pink-500 font-black">PhonePe, GPay, Paytm, BHIM</span>).
            </li>
            <li>
              Paste the UPI ID or scan QR and pay{' '}
              <span className="font-black text-pink-600 bg-pink-50 dark:bg-pink-950/20 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
                ₹{amount || '0'}
              </span>
              .
            </li>
            <li>Return to this page and click the button below to confirm.</li>
          </ol>
        </div>

        {/* Submit / Confirmation Button */}
        <div className="mt-8 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 dark:bg-neutral-800 hover:bg-slate-950 dark:hover:bg-neutral-700 text-white font-black py-4 px-4 rounded-3xl transition-all shadow-xl shadow-slate-200 dark:shadow-none hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] uppercase tracking-[0.25em] text-xs disabled:opacity-75 disabled:hover:scale-100 disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-pink-400 animate-pulse" />
                <span>I Have Paid</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
