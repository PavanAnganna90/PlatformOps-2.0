/**
 * Resource Search Component
 *
 * Search input for filtering resources by name, labels, or status.
 */

import React, { useState, useCallback } from "react";
import { Search, X, Filter } from "lucide-react";

interface ResourceSearchProps {
  /**
   * Current search query
   */
  value: string;

  /**
   * Callback when search query changes
   */
  onChange: (query: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ResourceSearch: React.FC<ResourceSearchProps> = ({
  value,
  onChange,
  placeholder = "Search resources...",
  className = "",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div
      className={`
        relative flex items-center
        ${className}
      `}
    >
      <div
        className={`
          flex items-center gap-2 px-3 py-2 w-full
          bg-white dark:bg-[#0F1115]
          border rounded-lg
          transition-all duration-200
          ${
            isFocused
              ? "border-primary ring-2 ring-primary/20"
              : "border-slate-200 dark:border-white/10"
          }
        `}
      >
        <Search
          size={14}
          className={`shrink-0 ${
            isFocused ? "text-primary" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="
            flex-1 bg-transparent text-sm
            text-slate-900 dark:text-white
            placeholder:text-slate-400
            focus:outline-none
            min-w-0
          "
        />
        {value && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Resource Filter Bar
 *
 * Combined search and filter controls for resource lists.
 */
interface ResourceFilterBarProps {
  /**
   * Search query
   */
  searchQuery: string;

  /**
   * Callback when search changes
   */
  onSearchChange: (query: string) => void;

  /**
   * Selected resource types to show
   */
  selectedTypes?: string[];

  /**
   * Callback when type filter changes
   */
  onTypeChange?: (types: string[]) => void;

  /**
   * Available resource types
   */
  availableTypes?: string[];

  /**
   * Additional children (e.g., namespace filter)
   */
  children?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ResourceFilterBar: React.FC<ResourceFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTypes = [],
  onTypeChange,
  availableTypes = ["node", "pod", "deployment", "service"],
  children,
  className = "",
}) => {
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const toggleType = (type: string) => {
    if (!onTypeChange) return;

    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Search Input */}
      <ResourceSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search by name, label, or status..."
        className="flex-1 min-w-[200px]"
      />

      {/* Type Filter */}
      {onTypeChange && (
        <div className="relative">
          <button
            onClick={() => setShowTypeFilter(!showTypeFilter)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              bg-white dark:bg-[#0F1115]
              border border-slate-200 dark:border-white/10
              hover:border-primary/30 dark:hover:border-white/20
              transition-all text-sm
              ${selectedTypes.length > 0 ? "border-primary/50" : ""}
            `}
          >
            <Filter size={14} className="text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300">Type</span>
            {selectedTypes.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {selectedTypes.length}
              </span>
            )}
          </button>

          {showTypeFilter && (
            <div
              className="
                absolute top-full right-0 mt-2 w-48 z-50
                bg-white dark:bg-[#0F1115]
                border border-slate-200 dark:border-white/10
                rounded-xl shadow-xl
                overflow-hidden
              "
            >
              <div className="p-2">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`
                      w-full px-3 py-2 rounded-lg text-left text-sm
                      flex items-center justify-between
                      hover:bg-slate-50 dark:hover:bg-white/5
                      transition-colors
                      ${
                        selectedTypes.includes(type)
                          ? "bg-primary/5 text-primary"
                          : "text-slate-700 dark:text-slate-300"
                      }
                    `}
                  >
                    <span className="capitalize">{type}</span>
                    {selectedTypes.includes(type) && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional Filters (e.g., namespace) */}
      {children}
    </div>
  );
};

export default ResourceSearch;

