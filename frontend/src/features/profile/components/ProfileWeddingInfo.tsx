import { Card, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { UserProfile } from '../types/profile.types';
import { Heart, MapPin, Calendar, Map, Globe } from 'lucide-react';

interface ProfileWeddingInfoProps {
    data: UserProfile;
    isEditing: boolean;
    onChange: (field: keyof UserProfile, value: string) => void;
    errors?: Partial<Record<keyof UserProfile, string>>;
}

export default function ProfileWeddingInfo({ data, isEditing, onChange, errors }: ProfileWeddingInfoProps) {
    return (
        <Card className="w-full relative overflow-hidden p-0 border-none sm:border-solid bg-transparent sm:bg-[var(--color-surface)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-400 hidden sm:block" />
            <CardHeader
                title="Wedding Details"
                subtitle="Core information about the special day."
                className="px-6 pt-6 mb-5"
            />

            <div className="p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Bride's Name"
                        value={data.brideName}
                        onChange={(e) => onChange('brideName', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.brideName}
                        icon={<Heart size={16} className="text-rose-400" />}
                        placeholder="e.g. Priya Sharma"
                    />
                    <Input
                        label="Groom's Name"
                        value={data.groomName}
                        onChange={(e) => onChange('groomName', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.groomName}
                        icon={<Heart size={16} className="text-blue-400" />}
                        placeholder="e.g. Arjun Mehta"
                    />
                    <Input
                        label="Wedding Date"
                        type="date"
                        value={data.weddingDate}
                        onChange={(e) => onChange('weddingDate', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.weddingDate}
                        icon={<Calendar size={16} />}
                        fullWidth
                        className="sm:col-span-2 md:col-span-1"
                    />
                    <Input
                        label="Primary Venue"
                        value={data.venue}
                        onChange={(e) => onChange('venue', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.venue}
                        icon={<MapPin size={16} />}
                        placeholder="e.g. Royal Banquet Hall"
                    />
                    <Input
                        label="Village / City"
                        value={data.village}
                        onChange={(e) => onChange('village', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.village}
                        icon={<Map size={16} />}
                        placeholder="e.g. Coimbatore"
                    />
                    <Input
                        label="Country"
                        value={data.country}
                        onChange={(e) => onChange('country', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.country}
                        icon={<Globe size={16} />}
                        placeholder="e.g. India"
                    />
                </div>
            </div>
        </Card>
    );
}
