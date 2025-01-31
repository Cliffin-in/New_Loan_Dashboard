import React from 'react';
import DatePicker from "react-datepicker";

const DateRangeFilter = ({
  label,
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onFromClear,
  onToClear
}) => {
  return (
    <div className="flex flex-col">
      <label className="text-custom mb-2">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-grow max-w-[200px]">
          <DatePicker
            selected={fromDate}
            onChange={onFromChange}
            className="w-full bg-[#161b22] text-custom border-custom rounded-md p-2 pr-8"
            placeholderText="From"
            dateFormat="yyyy-MM-dd"
            calendarClassName="bg-[#161b22] border border-custom rounded-md shadow-lg"
            popperClassName="z-[9999]"
          />
          {fromDate && (
            <button
              onClick={onFromClear}
              className="clear-filter-btn absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-sm font-medium"
              aria-label="Clear from date"
            >
              ✕
            </button>
          )}
        </div>
        <div className="relative flex-grow max-w-[200px]">
          <DatePicker
            selected={toDate}
            onChange={onToChange}
            className="w-full bg-[#161b22] text-custom border-custom rounded-md p-2 pr-8"
            placeholderText="To"
            dateFormat="yyyy-MM-dd"
            calendarClassName="bg-[#161b22] border border-custom rounded-md shadow-lg"
            popperClassName="z-[9999]"
          />
          {toDate && (
            <button
              onClick={onToClear}
              className="clear-filter-btn absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-sm font-medium"
              aria-label="Clear to date"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;