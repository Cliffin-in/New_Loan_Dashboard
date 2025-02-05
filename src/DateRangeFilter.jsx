import React from "react";
import DatePicker from "react-datepicker";

const DateRangeFilter = ({
  label,
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onFromClear,
  onToClear,
}) => {
  const handleFromChange = (date) => {
    // If selecting a date later than the current "to" date, update "to" date as well
    if (toDate && date > toDate) {
      onToChange(date);
    }
    onFromChange(date);
  };

  const handleToChange = (date) => {
    // If selecting a date earlier than the current "from" date, update "from" date as well
    if (fromDate && date < fromDate) {
      onFromChange(date);
    }
    onToChange(date);
  };

  return (
    <div className="flex flex-col">
      <label className="text-custom mb-2">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-grow max-w-[200px]">
          <DatePicker
            selected={fromDate}
            onChange={handleFromChange}
            className="w-full bg-[var(--input-bg)] text-custom border-custom rounded-md p-2 pr-8"
            placeholderText="From"
            dateFormat="yyyy-MM-dd"
            calendarClassName="bg-[var(--input-bg)] border border-custom rounded-md shadow-lg"
            popperClassName="z-[9999]"
            maxDate={toDate || null}
          />
          {fromDate && (
            <button
              onClick={onFromClear}
              className="clear-btn right-6 top-1/2 -translate-y-1/2"
              aria-label="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
        <div className="relative flex-grow max-w-[200px]">
          <DatePicker
            selected={toDate}
            onChange={handleToChange}
            className="w-full bg-[var(--input-bg)] text-custom border-custom rounded-md p-2 pr-8"
            placeholderText="To"
            dateFormat="yyyy-MM-dd"
            calendarClassName="bg-[var(--input-bg)] border border-custom rounded-md shadow-lg"
            popperClassName="z-[9999]"
            minDate={fromDate || null}
          />
          {toDate && (
            <button
              onClick={onToClear}
              className="clear-btn right-6 top-1/2 -translate-y-1/2"
              aria-label="Clear filter"
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
