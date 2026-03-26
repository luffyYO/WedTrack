import { type ChangeEvent } from 'react';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import FloatingHearts from '@/components/ui/FloatingHearts';
import { useState } from 'react';
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
    const [heartsActive, setHeartsActive] = useState(false);

    const handleChange =
        (field: keyof WeddingTrackFormData) =>
            (e: ChangeEvent<HTMLInputElement>) =>
                onChange(field, e.target.value);

    // Calculate today's date for 'min' attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <Card className="w-full relative overflow-visible z-10 border border-white/40 shadow-xl shadow-pink-900/5 group hover:shadow-2xl hover:shadow-pink-900/10 transition-all duration-500 bg-white/60">
            <FloatingHearts active={heartsActive} />
            <div className="grid grid-cols-1 gap-6 sm:gap-8 relative z-10">

                {/* Row 1: Bride & Groom side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <Input
                        id="brideName"
                        label={FIELD_LABELS.brideName}
                        placeholder={FIELD_PLACEHOLDERS.brideName}
                        value={data.brideName}
                        onChange={(e) => onChange('brideName', e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                        onFocus={() => setHeartsActive(true)}
                        onBlur={() => setHeartsActive(false)}
                        error={errors.brideName}
                        disabled={disabled}
                        maxLength={50}
                        fullWidth
                        autoComplete="off"
                        className="h-12 sm:h-14 !text-base shadow-sm focus:shadow-md transition-shadow"
                    />
                    <Input
                        id="groomName"
                        label={FIELD_LABELS.groomName}
                        placeholder={FIELD_PLACEHOLDERS.groomName}
                        value={data.groomName}
                        onChange={(e) => onChange('groomName', e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                        onFocus={() => setHeartsActive(true)}
                        onBlur={() => setHeartsActive(false)}
                        error={errors.groomName}
                        disabled={disabled}
                        maxLength={50}
                        fullWidth
                        autoComplete="off"
                        className="h-12 sm:h-14 !text-base shadow-sm focus:shadow-md transition-shadow"
                    />
                </div>

                {/* Row 2: Venue and Extra Cell side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <Input
                        id="venue"
                        label={FIELD_LABELS.venue}
                        placeholder={FIELD_PLACEHOLDERS.venue}
                        value={data.venue}
                        onChange={handleChange('venue')}
                        error={errors.venue}
                        disabled={disabled}
                        maxLength={100}
                        fullWidth
                        autoComplete="off"
                        className="h-12 sm:h-14 !text-base shadow-sm focus:shadow-md transition-shadow"
                    />
                    <Input
                        id="extraCell"
                        label={FIELD_LABELS.extraCell}
                        placeholder={FIELD_PLACEHOLDERS.extraCell}
                        value={data.extraCell || ''}
                        onChange={handleChange('extraCell')}
                        error={errors.extraCell}
                        disabled={disabled}
                        maxLength={200}
                        fullWidth
                        autoComplete="off"
                        className="h-12 sm:h-14 !text-base shadow-sm focus:shadow-md transition-shadow"
                    />
                </div>

                {/* Row 3: Date & Village side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div className="relative">
                        <DatePicker
                            id="date"
                            label={FIELD_LABELS.date}
                            value={data.date}
                            onChange={(val: string) => onChange('date', val)}
                            error={errors.date}
                            disabled={disabled}
                            min={today}
                            fullWidth
                        />
                    </div>
                    <Input
                        id="village"
                        label={FIELD_LABELS.village}
                        placeholder={FIELD_PLACEHOLDERS.village}
                        value={data.village}
                        onChange={handleChange('village')}
                        error={errors.village}
                        disabled={disabled}
                        maxLength={100}
                        fullWidth
                        autoComplete="off"
                        className="h-12 sm:h-14 !text-base shadow-sm focus:shadow-md transition-shadow"
                    />
                </div>

            </div>
        </Card>
    );
}
