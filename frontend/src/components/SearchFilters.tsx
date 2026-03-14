import React from 'react';
import { cn } from '@/utils/cn';

export type FilterType = 'Name' | 'Location' | 'Amount' | 'Payment Method' | 'Side';

interface SearchFiltersProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    onAmountRangeChange: (range: number | null) => void;
    selectedAmountRange: number | null;
    onPaymentMethodChange?: (method: string | null) => void;
    selectedPaymentMethod?: string | null;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
    activeFilter, 
    onFilterChange,
    onAmountRangeChange,
    selectedAmountRange,
    onPaymentMethodChange,
    selectedPaymentMethod
}) => {
    const filters: FilterType[] = ['Name', 'Location', 'Payment Method', 'Amount', 'Side'];
    const amountPresets = [100, 250, 500, 1000];
    const paymentMethods = ['PhonePe', 'GPay', 'Paytm', 'Cash'];

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-6">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Search Category</h4>
                    <div className="flex flex-wrap gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => onFilterChange(filter)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border",
                                    activeFilter === filter
                                        ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100 scale-105"
                                        : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100 hover:border-gray-200"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {activeFilter === 'Amount' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 border-t border-gray-50 pt-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Amount Threshold</h4>
                        <div className="flex flex-wrap gap-3">
                            {amountPresets.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => onAmountRangeChange(amount)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                        selectedAmountRange === amount
                                            ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100 scale-105"
                                            : "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100"
                                    )}
                                >
                                    &lt; {amount}
                                </button>
                            ))}
                            <button
                                onClick={() => onAmountRangeChange(null)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                    selectedAmountRange === null
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {activeFilter === 'Payment Method' && onPaymentMethodChange && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 border-t border-gray-50 pt-4 mt-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Method</h4>
                        <div className="flex flex-wrap gap-3">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method}
                                    onClick={() => onPaymentMethodChange(method)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                        selectedPaymentMethod === method
                                            ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100 scale-105"
                                            : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                                    )}
                                >
                                    {method}
                                </button>
                            ))}
                            <button
                                onClick={() => onPaymentMethodChange(null)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                    selectedPaymentMethod === null
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
                {activeFilter === 'Side' && onPaymentMethodChange && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 border-t border-gray-50 pt-4 mt-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Side</h4>
                        <div className="flex flex-wrap gap-3">
                            {['Bride', 'Groom'].map((side) => (
                                <button
                                    key={side}
                                    onClick={() => onPaymentMethodChange(side)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                        selectedPaymentMethod === side
                                            ? "bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-100 scale-105"
                                            : "bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100"
                                    )}
                                >
                                    {side} Side
                                </button>
                            ))}
                            <button
                                onClick={() => onPaymentMethodChange(null)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                    selectedPaymentMethod === null
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchFilters;
