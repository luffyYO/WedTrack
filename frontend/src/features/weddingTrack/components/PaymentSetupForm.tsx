import { useRef } from 'react';
import { Plus, Trash2, UploadCloud, CreditCard } from 'lucide-react';
import type { PaymentMethod } from '../types/weddingTrack.types';

interface PaymentSetupFormProps {
  paymentMethods: PaymentMethod[];
  onChange: (methods: PaymentMethod[]) => void;
  disabled?: boolean;
}

export default function PaymentSetupForm({ paymentMethods, onChange, disabled }: PaymentSetupFormProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleAdd = () => {
    const newMethod: PaymentMethod = {
      id: Math.random().toString(36).substring(7),
      upi_id: '',
      receiver_name: '',
      label: '',
      is_primary: paymentMethods.length === 0,
    };
    onChange([...paymentMethods, newMethod]);
  };

  const handleRemove = (id: string) => {
    const newMethods = paymentMethods.filter((m) => m.id !== id);
    // If we removed the primary, make the first one primary
    if (paymentMethods.find((m) => m.id === id)?.is_primary && newMethods.length > 0) {
      newMethods[0].is_primary = true;
    }
    onChange(newMethods);
  };

  const handleChange = (id: string, field: keyof PaymentMethod, value: any) => {
    onChange(
      paymentMethods.map((m) => {
        if (m.id === id) {
          return { ...m, [field]: value };
        }
        // Enforce only one primary
        if (field === 'is_primary' && value === true) {
          return { ...m, is_primary: false };
        }
        return m;
      })
    );
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange(id, 'qrFile', file);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CreditCard size={20} className="text-pink-500" />
            Payment Setup
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Add UPI IDs and QR codes for guests to send gifts securely. At least one is required.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method, index) => (
          <div
            key={method.id || index}
            className={`p-5 rounded-2xl border-2 transition-all bg-white/60 backdrop-blur-sm shadow-sm relative ${
              method.is_primary ? 'border-pink-300' : 'border-slate-200'
            }`}
          >
            {method.is_primary && (
              <span className="absolute -top-3 left-4 bg-pink-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                Primary
              </span>
            )}

            <button
              type="button"
              onClick={() => handleRemove(method.id as string)}
              disabled={disabled}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
              title="Remove payment method"
            >
              <Trash2 size={18} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    UPI ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={method.upi_id}
                    onChange={(e) => handleChange(method.id as string, 'upi_id', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g. 9876543210@ybl"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Receiver Name
                  </label>
                  <input
                    type="text"
                    value={method.receiver_name || ''}
                    onChange={(e) => handleChange(method.id as string, 'receiver_name', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Label / Note
                    </label>
                    <input
                      type="text"
                      value={method.label || ''}
                      onChange={(e) => handleChange(method.id as string, 'label', e.target.value)}
                      disabled={disabled}
                      placeholder="e.g. Backup"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={method.is_primary}
                        onChange={(e) => handleChange(method.id as string, 'is_primary', e.target.checked)}
                        disabled={disabled || method.is_primary} // Can't uncheck primary directly, must check another
                        className="w-4 h-4 text-pink-500 focus:ring-pink-500 border-slate-300 rounded"
                      />
                      <span className="text-xs font-bold text-slate-600">Set Primary</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* QR Upload Section */}
              <div className="flex flex-col">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Payment QR Image <span className="text-rose-400">*</span>
                </label>
                <div 
                  className={`flex-1 min-h-[140px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all relative overflow-hidden group ${
                    method.qrFile || method.payment_qr_url ? 'border-pink-300 bg-pink-50/30' : 'border-slate-300 hover:border-pink-300 bg-slate-50 hover:bg-slate-100/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!disabled && !method.qrFile && !method.payment_qr_url) {
                      fileInputRefs.current[method.id as string]?.click();
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[method.id as string] = el)}
                    onChange={(e) => handleFileChange(method.id as string, e)}
                    accept="image/*"
                    className="hidden"
                    disabled={disabled}
                  />

                  {method.qrFile ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center">
                      <img 
                        src={URL.createObjectURL(method.qrFile)} 
                        alt="Payment QR Preview" 
                        className="max-h-24 object-contain mb-2 rounded-lg border border-pink-100 shadow-sm"
                      />
                      <p className="text-xs font-semibold text-slate-700 truncate max-w-full px-2">
                        {method.qrFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChange(method.id as string, 'qrFile', undefined);
                        }}
                        className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 hover:underline"
                        disabled={disabled}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : method.payment_qr_url ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center">
                      <img src={method.payment_qr_url} alt="Payment QR" className="max-h-24 object-contain mb-2 rounded-lg border border-pink-100 shadow-sm" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChange(method.id as string, 'payment_qr_url', undefined);
                        }}
                        className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 hover:underline"
                        disabled={disabled}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                        <UploadCloud size={20} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                      </div>
                      <p className="text-xs font-medium text-slate-500">
                        Click to upload QR
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <p className="text-sm text-slate-500 font-medium">No payment methods added.</p>
          <p className="text-xs text-slate-400 mt-1">You must add at least one UPI ID to continue.</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="w-full py-4 border-2 border-dashed border-pink-200 hover:border-pink-400 hover:bg-pink-50 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-pink-600 transition-all shadow-sm"
      >
        <Plus size={18} />
        Add Payment Method
      </button>
    </div>
  );
}
