'use client';
import { useState } from 'react';
import { Filter, Search, MapPin, Tag, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface FilterOptions {
  search: string;
  area: string;
  status: string;
  tags: string[];
  amountRange: {
    min: string;
    max: string;
  };
}

interface CollectionFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  areas: string[];
  availableTags: string[];
  isAdmin?: boolean;
}

export default function CollectionFilters({ 
  filters, 
  onFiltersChange, 
  areas, 
  availableTags,
  isAdmin = false 
}: CollectionFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      area: '',
      status: '',
      tags: [],
      amountRange: { min: '', max: '' }
    });
  };

  const hasActiveFilters = filters.search || filters.area || filters.status || 
    filters.tags.length > 0 || filters.amountRange.min || filters.amountRange.max;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-600" />
          <span className="font-semibold text-neutral-900">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Area Filter */}
        {isAdmin && (
          <Select
            value={filters.area}
            onChange={(e) => updateFilter('area', e.target.value)}
            options={[
              { value: '', label: 'All Areas' },
              ...areas.map(area => ({ value: area, label: area }))
            ]}
          />
        )}

        {/* Status Filter */}
        <Select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          options={[
            { value: '', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'collected', label: 'Collected' },
            { value: 'failed', label: 'Failed' },
            { value: 'partial', label: 'Partial' }
          ]}
        />
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Amount Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min amount"
                value={filters.amountRange.min}
                onChange={(e) => updateFilter('amountRange', { ...filters.amountRange, min: e.target.value })}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max amount"
                value={filters.amountRange.max}
                onChange={(e) => updateFilter('amountRange', { ...filters.amountRange, max: e.target.value })}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Tags</label>
            
            {/* Selected Tags */}
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                  >
                    <Tag size={12} />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-primary-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Available Tags */}
            <div className="flex flex-wrap gap-2">
              {availableTags
                .filter(tag => !filters.tags.includes(tag))
                .map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => addTag(tag)}
                    className="flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    <Tag size={12} />
                    {tag}
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}