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
        <div className="flex w-full gap-2 items-center">
            <div className="flex-1">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    icon={<Search size={18} />}
                    fullWidth
                    className="bg-white border-gray-200 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
            </div>
            <div className="flex gap-2">
                <Button 
                    onClick={onSearchClick}
                    className="whitespace-nowrap h-[42px] px-6 shadow-md hover:shadow-lg transition-all"
                >
                    Search
                </Button>
                <Button 
                    variant={isFilterOpen ? "primary" : "outline"}
                    onClick={onFilterToggle}
                    icon={<SlidersHorizontal size={16} />}
                    className="whitespace-nowrap h-[42px] px-4 shadow-sm"
                >
                    Filter
                </Button>
            </div>
        </div>
    );
};

export default SearchBar;
