import React from 'react';
import { Search } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface AdminTableFiltersProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    key: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
}

export const AdminTableFilters: React.FC<AdminTableFiltersProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
}) => {
  return (
    <div className="bg-gray-900 border border-gray-800 p-4 mb-1 flex flex-col md:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase tracking-wider font-bold placeholder:text-gray-600 placeholder:normal-case placeholder:font-normal"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Dynamic Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center gap-2 min-w-[150px]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                {filter.label}
              </span>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="block w-full bg-gray-800 border border-gray-700 text-white text-xs px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors font-black uppercase tracking-tighter cursor-pointer"
              >
                <option value="">ALL</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
