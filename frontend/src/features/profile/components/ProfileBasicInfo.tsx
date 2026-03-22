import { Card, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import type { UserProfile } from '../types/profile.types';
import { User, Mail, Phone, Shield } from 'lucide-react';

interface ProfileBasicInfoProps {
    data: UserProfile;
    isEditing: boolean;
    onChange: (field: keyof UserProfile, value: string) => void;
    errors?: Partial<Record<keyof UserProfile, string>>;
}

const ROLE_OPTIONS = [
    { value: 'Bride', label: 'Bride' },
    { value: 'Groom', label: 'Groom' },
    { value: 'Planner', label: 'Planner' },
    { value: 'Family Member', label: 'Family Member' },
    { value: 'Guest', label: 'Guest' },
];

export default function ProfileBasicInfo({ data, isEditing, onChange, errors }: ProfileBasicInfoProps) {
    return (
        <Card className="w-full relative overflow-hidden p-0 border-none sm:border-solid bg-transparent sm:bg-[var(--color-surface)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-black dark:bg-white hidden sm:block" />
            <CardHeader
                title="Account Information"
                subtitle="Your required login and contact details."
                className="px-6 pt-6 mb-5"
            />

            <div className="p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Full Name"
                        value={data.fullName}
                        onChange={(e) => onChange('fullName', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.fullName}
                        icon={<User size={16} />}
                        placeholder="e.g. Ravi Teja"
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        value={data.email}
                        disabled={true} // Email typically not editable directly here
                        icon={<Mail size={16} />}
                        hint="Contact support to change email"
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        value={data.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        disabled={!isEditing}
                        error={errors?.phone}
                        icon={<Phone size={16} />}
                        placeholder="+91 98765 43210"
                    />
                    <Dropdown
                        label="Primary Role"
                        value={data.role}
                        onChange={(val) => onChange('role', val)}
                        options={ROLE_OPTIONS}
                        disabled={!isEditing}
                        error={errors?.role}
                        icon={<Shield size={16} />}
                    />
                </div>
            </div>
        </Card>
    );
}
