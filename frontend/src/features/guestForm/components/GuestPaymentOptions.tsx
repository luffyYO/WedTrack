import { useState } from 'react';
import { Copy, Check, Download, QrCode, Info, ExternalLink } from 'lucide-react';
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

  const method = paymentMethods.find((m) => m.is_primary) || paymentMethods[0];
  if (!method) return null;

  const hasQR = !!method.payment_qr_url;
  const hasUPI = !!method.upi_id;

  if (!hasQR && !hasUPI) return null;

  const handleCopy = () => {
    if (!method.upi_id) return;
    
    // 1. Copy UPI ID
    navigator.clipboard.writeText(method.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);

    // 2. Attempt lightweight app invocation (Chooser)
    // We intentionally avoid upi://pay?pa=... to prevent forced payment gateways
    // Just opening the scheme often triggers the Android/iOS app chooser
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    setTimeout(() => {
      try {
        if (isAndroid) {
          // Android generic intent to open UPI apps
          window.location.href = "intent://#Intent;scheme=upi;action=android.intent.action.VIEW;end";
        } else if (isIOS) {
          // iOS generic UPI scheme
          window.location.href = "upi://";
        }
      } catch (err) {
        console.warn('App chooser invocation blocked or failed', err);
      }
      
      // 3. Show helper instructions regardless, as fallback
      setShowHelperModal(true);
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
    } catch (error) {
      console.error('Failed to download QR code:', error);
      window.open(method.payment_qr_url, '_blank');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in mt-6">
      <div className="flex items-center gap-2 mb-2 ml-1">
        <QrCode size={18} className="text-pink-500 animate-pulse" />
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
          UPI Payment Details
        </h3>
      </div>

      <div className="bg-white border border-pink-100 shadow-[0_8px_30px_rgba(244,63,94,0.06)] backdrop-blur-md rounded-[2rem] p-6 sm:p-8">
        
        {/* QR Section */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="bg-slate-50/50 p-4 rounded-[2rem] border-2 border-pink-50/80 shadow-xl shadow-pink-500/5 w-56 h-56 flex items-center justify-center relative overflow-hidden">
            {hasQR ? (
              <img 
                src={method.payment_qr_url} 
                alt="UPI Payment QR" 
                className="w-full h-full object-contain rounded-xl"
                loading="eager"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-4">
                <QrCode size={36} className="text-slate-200 mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  QR not uploaded<br/>by host yet
                </p>
              </div>
            )}
          </div>
          
          {hasQR && (
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-pink-100 hover:border-pink-200 bg-pink-50/50 hover:bg-pink-100/50 text-pink-600 text-[11px] font-black tracking-wider uppercase transition-all active:scale-95"
            >
              <Download size={14} />
              Download QR Image
            </button>
          )}
        </div>

        {/* Receiver Name */}
        {method.receiver_name && (
          <div className="text-center mt-2 mb-6">
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1">Payee Name</span>
            <span className="text-base font-black text-slate-800 block">{method.receiver_name}</span>
          </div>
        )}

        {/* UPI ID Section */}
        {hasUPI && (
          <div className="bg-pink-50/30 border border-pink-100/60 rounded-2xl p-4 flex items-center justify-between gap-3 group mt-4 hover:border-pink-200 transition-colors">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">UPI ID</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-700 truncate font-mono select-all">
                {method.upi_id}
              </span>
            </div>
            <button 
              type="button"
              onClick={handleCopy}
              className={`shrink-0 h-10 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm active:scale-95 ${
                copied 
                  ? 'bg-emerald-500 text-white border-none' 
                  : 'bg-white border border-pink-200 text-pink-600 hover:bg-pink-50'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied ✓
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>
        )}

        {/* Dynamic Helper Modal / Alert */}
        {showHelperModal && (
          <div className="bg-slate-800 text-white rounded-2xl p-4 mt-4 animate-fade-up shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-white/10 p-1.5 rounded-lg shrink-0">
                <ExternalLink size={16} className="text-pink-400" />
              </div>
              <div>
                <p className="text-xs font-bold leading-relaxed">
                  UPI ID copied. Paste it in your UPI app to pay.
                </p>
                <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed font-medium">
                  Open PhonePe, GPay, Paytm, or BHIM. Paste the copied ID, complete the payment, and return here.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        <div className="mt-8 border-t border-slate-100 pt-5 space-y-3">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Info size={14} className="text-pink-500" /> Quick Steps
          </h4>
          <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside font-medium leading-relaxed pl-1">
            <li>Open <span className="font-black text-slate-800">PhonePe, GPay, Paytm, or BHIM</span>.</li>
            {hasUPI ? (
              <li>Paste the copied UPI ID or scan the QR code.</li>
            ) : (
              <li>Scan the QR code shown above.</li>
            )}
            <li>
              Complete payment of{' '}
              <span className="font-black text-slate-800 bg-pink-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                ₹{amount || '0'}
              </span>
              .
            </li>
            <li>Return here and tap <span className="font-bold text-pink-600">"I have paid"</span> below.</li>
          </ol>
        </div>

        {/* I Have Paid Confirmation Button */}
        <div className="mt-8 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 active:scale-[0.98] uppercase tracking-[0.2em] text-xs disabled:opacity-75 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>I Have Paid</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

