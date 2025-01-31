import React from 'react';
import { Select } from "./components/ui/select";

const FilterSelect = ({ 
  label, 
  value, 
  onChange, 
  onClear, 
  options,
  className = "" 
}) => {
  // Filter out empty, null, or undefined values
  const validOptions = options.filter(option => option && option.trim() !== "");

  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-custom">{label}</label>
      <div className="relative">
        <Select
          value={value || ""}
          onChange={onChange}
          className={`pr-10 ${className}`}
        >
          <option value="">All</option>
          {validOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        {value && (
          <button
            onClick={onClear}
            className="clear-btn right-8 top-1/2 -translate-y-1/2"
            aria-label="Clear filter"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterSelect;