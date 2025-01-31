import React from 'react';
import { Input } from "./components/ui/input";
import { RotateCw } from "lucide-react";

const SearchField = ({ 
  value, 
  onChange, 
  onClear,
  onRefresh 
}) => {
  return (
    <div className="flex gap-4">
      <div className="relative flex-grow">
        <Input
          placeholder="Search..."
          className="input-custom rounded-md pr-8"
          value={value}
          onChange={onChange}
        />
        {value && (
          <button
            onClick={onClear}
            className="clear-btn right-2 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      <button className="btn-base btn-icon" onClick={onRefresh}>
        <RotateCw className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SearchField;