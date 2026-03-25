import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onSearchClick: () => void;
    onFilterToggle: () => void;
    isFilterOpen?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    placeholder = "Search...", 
    value, 
    onChange,
    onSearchClick,
    onFilterToggle,
    isFilterOpen
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch(value);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row w-full gap-3 sm:items-center">
            <div className="flex-1 w-full relative">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    icon={<Search size={18} />}
                    fullWidth
                    className="bg-white dark:bg-black border-neutral-300 dark:border-neutral-700 shadow-sm focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 h-[48px] sm:h-[42px] text-base sm:text-sm"
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                    onClick={onSearchClick}
                    className="flex-1 sm:flex-none whitespace-nowrap h-[48px] sm:h-[42px] px-6 shadow-md hover:shadow-lg transition-all text-base sm:text-sm font-bold"
                >
                    Search
                </Button>
                <Button 
                    variant={isFilterOpen ? "primary" : "outline"}
                    onClick={onFilterToggle}
                    icon={<SlidersHorizontal size={18} className="sm:w-4 sm:h-4" />}
                    className="flex-1 sm:flex-none whitespace-nowrap h-[48px] sm:h-[42px] px-4 shadow-sm text-base sm:text-sm font-bold"
                >
                    Filter
                </Button>
            </div>
        </div>
    );
};

export default SearchBar;
