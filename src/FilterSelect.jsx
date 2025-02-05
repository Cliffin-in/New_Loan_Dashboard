import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const FilterSelect = ({ 
  label, 
  selectedValues = [], 
  onChange, 
  onClear, 
  options,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Filter out empty, null, or undefined values
  const validOptions = options.filter(option => option && option.trim() !== "");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckboxChange = (option) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(value => value !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === validOptions.length) {
      onChange([]);
    } else {
      onChange([...validOptions]);
    }
  };

  const isAllSelected = validOptions.length > 0 && selectedValues.length === validOptions.length;

  return (
    <div className="relative flex flex-col gap-2" ref={dropdownRef}>
      <label className="text-custom">{label}</label>
      <div className="relative">
        <div
          className={`w-full h-10 px-3 py-2 bg-[var(--input-bg)] text-custom border border-[var(--border-color)] rounded-md shadow-sm cursor-pointer flex items-center justify-between pr-8 ${className}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">
            {selectedValues.length > 0 ? selectedValues.join(', ') : `Select ${label}`}
          </span>
          <ChevronDown className={`w-4 h-4 absolute right-2 transition-transform text-custom ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {selectedValues.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="clear-btn right-8 top-1/2 -translate-y-1/2"
            aria-label="Clear filter"
          >
            ✕
          </button>
        )}

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Select All Option */}
            <div
              className="flex items-center px-3 py-2 hover:bg-[var(--hover-bg)] cursor-pointer text-custom border-b border-[var(--border-color)]"
              onClick={handleSelectAll}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--input-bg)] text-[#238636] focus:ring-[#238636]"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="ml-2 font-medium">Select All</span>
            </div>

            {/* Individual Options */}
            {validOptions.map((option) => (
              <div
                key={option}
                className="flex items-center px-3 py-2 hover:bg-[var(--hover-bg)] cursor-pointer text-custom"
                onClick={() => handleCheckboxChange(option)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                  className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--input-bg)] text-[#238636] focus:ring-[#238636]"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="ml-2">{option}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSelect;