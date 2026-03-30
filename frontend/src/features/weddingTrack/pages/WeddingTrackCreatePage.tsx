import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, AlertCircle } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { WeddingNameDisplay } from '@/components/ui';

import WeddingBanner from '../components/WeddingBanner';
import WeddingTrackForm from '../components/WeddingTrackForm';
import ImageGalleryUpload from '../components/ImageGalleryUpload';
import { weddingTrackService } from '../services/weddingTrackService';
import { uploadWeddingGallery } from '@/api/uploadService';
import type {
  WeddingTrackFormData,
  WeddingTrackFormErrors,
  WeddingTrackFormState,
} from '../types/weddingTrack.types';
import { load } from '@cashfreepayments/cashfree-js';
import PricingModal from '../components/PricingModal';

// ─── Initial state ────────────────────────────────────────────────────────────

const EMPTY_FORM: WeddingTrackFormData = {
  brideName: '',
  groomName: '',
  venue: '',
  date: '',
  village: '',
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(data: WeddingTrackFormData): WeddingTrackFormErrors {
  const errors: WeddingTrackFormErrors = {};
  if (!data.brideName.trim()) errors.brideName = "Bride's name is required";
  if (!data.groomName.trim()) errors.groomName = "Groom's name is required";
  if (!data.venue.trim()) errors.venue = 'Venue is required';
  if (!data.date) {
    errors.date = 'Wedding date is required';
  } else {
    // Check if the date is in the past (using local time comparison)
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignore time for comparison
    
    if (selectedDate < today) {
      errors.date = 'Wedding or reception date cannot be in the past. Please select today or a future date.';
    } else {
      // Basic fallback to verify the year isn't absurdly long or short
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        errors.date = 'Please enter a valid date with a 4-digit year.';
      }
    }
  }
  if (!data.village.trim()) errors.village = 'Village / town is required';
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeddingTrackCreatePage() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState<WeddingTrackFormState>({
    data: EMPTY_FORM,
    errors: {},
    isSubmitting: false,
    submittedId: null,
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  // ── Field change ────────────────────────────────────────────────────────────
  const handleChange = useCallback((field: keyof WeddingTrackFormData, value: string) => {
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: undefined },
    }));
  }, []);

  // ── Step 1: Validate & Choose Plan ──────────────────────────────────────────
  const handleGenerateQR = async () => {
    const errors = validate(formState.data);
    
    // Additional strict name validation
    const nameRegex = /^[A-Za-z\s]{2,50}$/;
    if (formState.data.brideName && !nameRegex.test(formState.data.brideName)) {
      errors.brideName = "Name must contain only alphabets and spaces (2–50 characters)";
    }
    if (formState.data.groomName && !nameRegex.test(formState.data.groomName)) {
      errors.groomName = "Name must contain only alphabets and spaces (2–50 characters)";
    }

    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({ ...prev, errors }));
      return;
    }

    // If valid, show pricing
    setIsPricingOpen(true);
  };

  // ── Step 2: Finalize & Pay ──────────────────────────────────────────────────
  const handlePlanSelect = async (plan: 'basic' | 'pro', amount: number) => {
    setFormState((prev) => ({ ...prev, isSubmitting: true }));
    setApiError(null);

    try {
      let uploadedUrls: string[] = [];
      if (galleryFiles.length > 0) {
        uploadedUrls = await uploadWeddingGallery(galleryFiles);
      }

      const payload = {
        bride_name: formState.data.brideName.trim(),
        groom_name: formState.data.groomName.trim(),
        location: formState.data.venue.trim(),
        wedding_date: formState.data.date,
        village: formState.data.village.trim(),
        extra_cell: formState.data.extraCell?.trim(),
        gallery_images: uploadedUrls,
        selected_plan: plan,
        amount: amount
      };

      const axiosResponse = await weddingTrackService.create(payload as any);
      const sessionData = axiosResponse.data?.data;

      if (!sessionData?.payment_session_id || !sessionData?.order_id) {
        throw new Error('Server did not return a valid payment session.');
      }

      const cashfree = await load({
        mode: import.meta.env.VITE_CASHFREE_ENV === 'PROD' ? 'production' : 'sandbox'
      });

      setIsPricingOpen(false); // Close pricing modal before opening checkout

      cashfree.checkout({
        paymentSessionId: sessionData.payment_session_id,
        redirectTarget: "_modal",
      }).then((result: any) => {
        if (result.error) {
          setApiError(result.error.message || 'Payment was cancelled or failed.');
          setFormState((prev) => ({ ...prev, isSubmitting: false }));
        } else if (result.paymentDetails) {
          navigate(`/wedding-track/verify?order_id=${sessionData.order_id}`);
        }
      });
    } catch (err: any) {
      setApiError(err.message || 'Failed to initiate payment.');
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
      setIsPricingOpen(false);
    }
  };

  const { brideName, groomName } = formState.data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-up">
      <div className="bg-white/30 backdrop-blur-xl rounded-[2.5rem] p-4 sm:p-8 lg:p-10 border border-white/60 shadow-2xl shadow-pink-900/5 relative overflow-hidden">
        {/* Subtle decorative background blur for premium feel */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-glow" aria-hidden="true"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-glow" aria-hidden="true" style={{animationDelay: '1s'}}></div>
        
        <div className="relative z-10">
          <PageHeader
            title="Create Wedding Track"
            description="Enter the wedding details to generate a unique QR track."
            action={
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowLeft size={15} />}
                onClick={() => navigate('/dashboard')}
                className="hover:bg-pink-50 hover:text-pink-600 transition-colors"
              >
                Back
              </Button>
            }
          />

          <div className="mt-2 sm:mt-6 flex flex-col items-center">
            <WeddingBanner />
            {brideName && groomName && (
              <div className="mt-2 mb-4 w-full flex justify-center animate-fade-up">
                <div className="px-6 py-3 sm:px-8 sm:py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-pink-100/50 shadow-lg shadow-pink-500/10">
                  <WeddingNameDisplay brideName={brideName} groomName={groomName} size="xl" className="text-pink-950" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-8">
            <WeddingTrackForm
              data={formState.data}
              errors={formState.errors}
              onChange={handleChange}
              disabled={formState.isSubmitting}
            />
          </div>

          <div className="mt-8 sm:mt-12">
            <ImageGalleryUpload 
              files={galleryFiles} 
              onChange={setGalleryFiles} 
              disabled={formState.isSubmitting}
            />
          </div>

          {apiError && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-red-600">{apiError}</p>
            </div>
          )}

          <div className="mt-10 sm:mt-14 max-w-md mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500 group-hover:duration-200"></div>
            <Button
              fullWidth
              size="lg"
              icon={<QrCode size={18} />}
              isLoading={formState.isSubmitting}
              onClick={handleGenerateQR}
              className="relative h-14 sm:h-16 text-base sm:text-lg rounded-full font-bold shadow-xl shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
            >
              Generate Wedding QR
            </Button>
            <p className="text-xs sm:text-sm text-slate-400 text-center mt-4 italic font-medium">
              Choose a plan to continue with your wedding track.
            </p>
          </div>

          <PricingModal 
            isOpen={isPricingOpen}
            onClose={() => setIsPricingOpen(false)}
            onSelectPlan={handlePlanSelect}
            isSubmitting={formState.isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
