import { type ChangeEvent } from 'react';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { WeddingTrackFormData, WeddingTrackFormErrors } from '../types/weddingTrack.types';

interface WeddingTrackFormProps {
    data: WeddingTrackFormData;
    errors: WeddingTrackFormErrors;
    onChange: (field: keyof WeddingTrackFormData, value: string) => void;
    disabled?: boolean;
}

// ─── Label map ────────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<keyof WeddingTrackFormData, string> = {
    brideName: "Bride's Name",
    groomName: "Groom's Name",
    venue: 'Venue',
    date: 'Wedding Date',
    village: 'Village / Town',
    extraCell: 'Extra Mobile / Notes (Optional)',
};

const FIELD_PLACEHOLDERS: Record<keyof WeddingTrackFormData, string> = {
    brideName: 'e.g. Priya Sharma',
    groomName: 'e.g. Arjun Mehta',
    venue: 'e.g. Royal Banquet Hall',
    date: '',
    village: 'e.g. Coimbatore',
    extraCell: 'e.g. +91 9988776655',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeddingTrackForm({
    data,
    errors,
    onChange,
    disabled = false,
}: WeddingTrackFormProps) {
    const handleChange =
        (field: keyof WeddingTrackFormData) =>
            (e: ChangeEvent<HTMLInputElement>) =>
                onChange(field, e.target.value);

    return (
        <Card className="w-full">
            <div className="grid grid-cols-1 gap-5">

                {/* Row 1: Bride & Groom side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        id="brideName"
                        label={FIELD_LABELS.brideName}
                        placeholder={FIELD_PLACEHOLDERS.brideName}
                        value={data.brideName}
                        onChange={handleChange('brideName')}
                        error={errors.brideName}
                        disabled={disabled}
                        fullWidth
                        autoComplete="off"
                    />
                    <Input
                        id="groomName"
                        label={FIELD_LABELS.groomName}
                        placeholder={FIELD_PLACEHOLDERS.groomName}
                        value={data.groomName}
                        onChange={handleChange('groomName')}
                        error={errors.groomName}
                        disabled={disabled}
                        fullWidth
                        autoComplete="off"
                    />
                </div>

                {/* Row 2: Venue and Extra Cell side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        id="venue"
                        label={FIELD_LABELS.venue}
                        placeholder={FIELD_PLACEHOLDERS.venue}
                        value={data.venue}
                        onChange={handleChange('venue')}
                        error={errors.venue}
                        disabled={disabled}
                        fullWidth
                        autoComplete="off"
                    />
                    <Input
                        id="extraCell"
                        label={FIELD_LABELS.extraCell}
                        placeholder={FIELD_PLACEHOLDERS.extraCell}
                        value={data.extraCell || ''}
                        onChange={handleChange('extraCell')}
                        error={errors.extraCell}
                        disabled={disabled}
                        fullWidth
                        autoComplete="off"
                    />
                </div>

                {/* Row 3: Date & Village side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        id="date"
                        label={FIELD_LABELS.date}
                        type="date"
                        value={data.date}
                        onChange={handleChange('date')}
                        error={errors.date}
                        disabled={disabled}
                        fullWidth
                    />
                    <Input
                        id="village"
                        label={FIELD_LABELS.village}
                        placeholder={FIELD_PLACEHOLDERS.village}
                        value={data.village}
                        onChange={handleChange('village')}
                        error={errors.village}
                        disabled={disabled}
                        fullWidth
                        autoComplete="off"
                    />
                </div>

            </div>
        </Card>
    );
}
