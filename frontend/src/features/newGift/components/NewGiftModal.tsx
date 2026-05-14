import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { NewGiftEntry } from '@/lib/giftQueries';

interface NewGiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<NewGiftEntry>) => Promise<void>;
    initialData?: NewGiftEntry | null;
}

const AMOUNT_TYPES = ['Cash', 'Gold', 'Silver', 'Gift'];

const NewGiftModal: React.FC<NewGiftModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [personName, setPersonName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [amount, setAmount] = useState('');
    const [amountType, setAmountType] = useState('Cash');
    const [village, setVillage] = useState('');
    const [giftDate, setGiftDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setPersonName(initialData.person_name);
                setFatherName(initialData.father_name || '');
                setAmount(initialData.amount.toString());
                setAmountType(initialData.amount_type);
                setVillage(initialData.village || '');
                setGiftDate(initialData.gift_date ? new Date(initialData.gift_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            } else {
                setPersonName('');
                setFatherName('');
                setAmount('');
                setAmountType('Cash');
                setVillage('');
                setGiftDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({
                person_name: personName,
                father_name: fatherName,
                amount: Number(amount) || 0,
                amount_type: amountType,
                village: village,
                gift_date: new Date(giftDate).toISOString(),
            });
            onClose();
        } catch (error) {
            console.error('Failed to submit gift', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Gift Entry" : "Create New Gift Entry"}
            icon={<Gift className="text-pink-500" size={24} />}
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Person Name *"
                        placeholder="E.g., Ravi Kumar"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        required
                    />
                    <Input
                        label="Father's Name"
                        placeholder="Optional"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Amount / Value *"
                        type="number"
                        placeholder="e.g., 5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Amount Type
                        </label>
                        <select
                            value={amountType}
                            onChange={(e) => setAmountType(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                        >
                            {AMOUNT_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Village / City"
                        placeholder="E.g., Hyderabad"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                    />
                    <DatePicker
                        id="gift-date"
                        label="Gift Date *"
                        value={giftDate}
                        onChange={(val) => setGiftDate(val)}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting}>
                        {initialData ? "Save Changes" : "Submit Entry"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default NewGiftModal;
