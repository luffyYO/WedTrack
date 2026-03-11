import { Card, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import type { UserProfile } from '../types/profile.types';
import { PhoneCall, Users, UsersRound, Languages, FileText } from 'lucide-react';

interface ProfileOptionalDetailsProps {
    data: UserProfile;
    isEditing: boolean;
    onChange: (field: keyof UserProfile, value: string | number) => void;
    errors?: Partial<Record<keyof UserProfile, string>>;
}

const LANGUAGE_OPTIONS = [
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Malayalam', label: 'Malayalam' },
    { value: 'Kannada', label: 'Kannada' },
    { value: 'Other', label: 'Other' },
];

export default function ProfileOptionalDetails({ data, isEditing, onChange, errors }: ProfileOptionalDetailsProps) {
    return (
        <Card className="w-full relative overflow-hidden p-0 border-none sm:border-solid bg-transparent sm:bg-[var(--color-surface)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-neutral-400 hidden sm:block" />
            <CardHeader
                title="Optional Details"
                subtitle="Additional information that helps us personalize your experience."
                className="px-6 pt-6 mb-5"
            />

            <div className="p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Alternate Contact Number"
                        type="tel"
                        value={data.alternatePhone || ''}
                        onChange={(e) => onChange('alternatePhone', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.alternatePhone}
                        icon={<PhoneCall size={16} />}
                        placeholder="e.g. +91 99887 76655"
                    />
                    <Input
                        label="Family Contact Person"
                        value={data.familyContactPerson || ''}
                        onChange={(e) => onChange('familyContactPerson', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.familyContactPerson}
                        icon={<Users size={16} />}
                        placeholder="e.g. Mr. Sharma (Father)"
                    />
                    <Input
                        label="Guest Capacity Estimate"
                        type="number"
                        min={10}
                        step={10}
                        value={data.guestCapacityEstimate || ''}
                        onChange={(e) => onChange('guestCapacityEstimate', parseInt(e.target.value, 10))}
                        disabled={!isEditing}
                        error={errors?.guestCapacityEstimate}
                        icon={<UsersRound size={16} />}
                        placeholder="e.g. 500"
                    />
                    <Dropdown
                        label="Preferred Language"
                        value={data.preferredLanguage || ''}
                        onChange={(val) => onChange('preferredLanguage', val)}
                        options={LANGUAGE_OPTIONS}
                        disabled={!isEditing}
                        error={errors?.preferredLanguage}
                        icon={<Languages size={16} />}
                    />
                    <div className="sm:col-span-2">
                        <div className="flex flex-col gap-1.5 w-full">
                            <label htmlFor="specialNotes" className="text-body-sm font-medium text-[var(--color-text-primary)]">
                                Special Notes
                            </label>
                            <div className="relative flex">
                                <span className="absolute top-3 left-3 text-[var(--color-text-muted)] pointer-events-none">
                                    <FileText size={16} />
                                </span>
                                <textarea
                                    id="specialNotes"
                                    value={data.specialNotes || ''}
                                    onChange={(e) => onChange('specialNotes', e.target.value)}
                                    disabled={!isEditing}
                                    rows={3}
                                    className="w-full pl-9 pr-3 py-2 text-[14px] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-150 resize-y"
                                    placeholder="Any specific requirements or notes..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
