import React from 'react';
import { Category, ItemStatus } from '../types';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (cat: Category | 'All') => void;
  selectedStatus: ItemStatus | 'All';
  onSelectStatus: (status: ItemStatus | 'All') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalFilteredCount: number;
  allCategories?: string[];
  allStatuses?: string[];
  onManageCategories?: () => void;
  onManageStatuses?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  totalFilteredCount,
  allCategories = ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories', 'Dresses'],
  allStatuses = ['Unworn', 'Worn', 'Posted', 'Needs Returning'],
  onManageCategories,
  onManageStatuses,
}) => {
  const CATEGORIES = ['All', ...allCategories];
  const STATUSES = [
    { id: 'All', label: 'All Statuses' },
    ...allStatuses.map(s => ({ id: s, label: s }))
  ];
  const isFiltered = selectedCategory !== 'All' || selectedStatus !== 'All' || searchQuery.length > 0;

  const handleResetFilters = () => {
    onSelectCategory('All');
    onSelectStatus('All');
    onSearchChange('');
  };

  return (
    <div className="space-y-3.5 mb-6">
      {/* Top search & quick clear row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by brand, campaign, or tag..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white border border-neutral-200 rounded-lg placeholder-neutral-400 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-neutral-500">
          <span className="tabular-nums font-medium">
            Showing <strong className="text-neutral-900 font-semibold">{totalFilteredCount}</strong> items
          </span>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-950 font-medium hover:underline cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs: Clean horizontal scroll on mobile, flex on desktop */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button 
          onClick={onManageCategories}
          className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-900 uppercase tracking-wider mr-1 hidden lg:inline shrink-0 cursor-pointer transition-colors"
        >
          Category:
        </button>
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                active
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white/80 text-neutral-600 hover:text-neutral-900 hover:bg-white border border-neutral-200/70'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Status Segmented Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button 
          onClick={onManageStatuses}
          className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-900 uppercase tracking-wider mr-1 shrink-0 cursor-pointer transition-colors"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span className="hidden sm:inline">Status:</span>
        </button>
        {STATUSES.map((st) => {
          const active = selectedStatus === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onSelectStatus(st.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-neutral-200/90 text-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              {st.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
