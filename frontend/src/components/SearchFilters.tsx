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
        <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-xl mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-6">
                <div>
                    <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Search Category</h4>
                    <div className="flex flex-wrap gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => onFilterChange(filter)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border",
                                    activeFilter === filter
                                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md scale-105"
                                        : "bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {activeFilter === 'Amount' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 border-t border-neutral-50 dark:border-neutral-800 pt-4">
                        <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Amount Threshold</h4>
                        <div className="flex flex-wrap gap-3">
                            {amountPresets.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => onAmountRangeChange(amount)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                        selectedAmountRange === amount
                                            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md scale-105"
                                            : "bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
                                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                                        : "bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {activeFilter === 'Payment Method' && onPaymentMethodChange && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 border-t border-neutral-50 dark:border-neutral-800 pt-4 mt-4">
                        <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Select Method</h4>
                        <div className="flex flex-wrap gap-3">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method}
                                    onClick={() => onPaymentMethodChange(method)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                        selectedPaymentMethod === method
                                            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md scale-105"
                                            : "bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
                                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                                        : "bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
                {activeFilter === 'Side' && onPaymentMethodChange && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 border-t border-neutral-50 dark:border-neutral-800 pt-4 mt-4">
                        <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Select Side</h4>
                        <div className="flex flex-wrap gap-3">
                            {['Bride', 'Groom'].map((side) => (
                                <button
                                    key={side}
                                    onClick={() => onPaymentMethodChange(side)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                        selectedPaymentMethod === side
                                            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md scale-105"
                                            : "bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
                                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                                        : "bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
