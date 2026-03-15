import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, AlertCircle } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';

import WeddingBanner from '../components/WeddingBanner';
import WeddingTrackForm from '../components/WeddingTrackForm';
import { weddingTrackService } from '../services/weddingTrackService';
import type {
  WeddingTrackFormData,
  WeddingTrackFormErrors,
  WeddingTrackFormState,
} from '../types/weddingTrack.types';

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

  // ── Field change ────────────────────────────────────────────────────────────
  const handleChange = useCallback((field: keyof WeddingTrackFormData, value: string) => {
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: undefined },
    }));
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
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

    setFormState((prev) => ({ ...prev, isSubmitting: true }));
    setApiError(null);

    // Trim all fields before sending
    const trimmedData = {
      ...formState.data,
      brideName: formState.data.brideName.trim(),
      groomName: formState.data.groomName.trim(),
      venue: formState.data.venue.trim(),
      village: formState.data.village.trim(),
    };

    try {
      const { data: res } = await weddingTrackService.create(trimmedData);

      // Navigate to QR page — backend is now the source of truth
      navigate(`/wedding-track/qr/${res.weddingId}`);
    } catch (err: any) {
      const apiData = err.response?.data;
      // prioritize .error from backend as requested by user
      const message = apiData?.error || apiData?.message || apiData?.details || 'Failed to create wedding track. Please enter valid details';
      setApiError(message);
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // ── Dynamic title ──────────────────────────────────────────────────────────
  const { brideName, groomName } = formState.data;
  const dynamicTitle =
    brideName && groomName ? `${brideName} & ${groomName}` : 'Create Wedding Track';

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={dynamicTitle}
        description="Enter the wedding details to generate a unique QR track."
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={15} />}
            onClick={() => navigate('/dashboard')}
          >
            Back
          </Button>
        }
      />

      <WeddingBanner />

      <WeddingTrackForm
        data={formState.data}
        errors={formState.errors}
        onChange={handleChange}
        disabled={formState.isSubmitting}
      />

      {apiError && (
        <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] border border-red-200">
          <AlertCircle size={16} className="text-[var(--color-danger)] mt-0.5 shrink-0" />
          <p className="text-body-sm text-[var(--color-danger)]">{apiError}</p>
        </div>
      )}

      <div className="mt-6">
        <Button
          fullWidth
          size="lg"
          icon={<QrCode size={17} />}
          isLoading={formState.isSubmitting}
          onClick={handleGenerateQR}
        >
          Generate Wedding QR
        </Button>
        <p className="text-caption text-[var(--color-text-muted)] text-center mt-2">
          You will be redirected to your unique QR code page.
        </p>
      </div>
    </div>
  );
}
