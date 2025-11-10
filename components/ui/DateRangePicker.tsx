'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

type DateRange = {
  start: Date;
  end: Date;
};

type Preset = {
  label: string;
  getValue: () => DateRange;
};

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Preset[];
  compareEnabled?: boolean;
  onCompareChange?: (enabled: boolean) => void;
  className?: string;
};

const defaultPresets: Preset[] = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    },
  },
  {
    label: '7 Days',
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: '30 Days',
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: '90 Days',
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: 'YTD',
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { start, end };
    },
  },
];

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
  compareEnabled = false,
  onCompareChange,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompareEnabled, setIsCompareEnabled] = useState(compareEnabled);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getValue();
    onChange(range);
    setActivePreset(preset.label);
  };

  const handleCompareToggle = () => {
    const newValue = !isCompareEnabled;
    setIsCompareEnabled(newValue);
    onCompareChange?.(newValue);
  };

  const formatDateRange = (range: DateRange) => {
    const startStr = range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Preset Buttons */}
      <div className="flex items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                activePreset === preset.label
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Custom
        </button>
      </div>

      {/* Custom Date Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Select Date Range</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Selection Display */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Selected Range</div>
              <div className="text-white text-sm">{formatDateRange(value)}</div>
            </div>

            {/* Calendar Component */}
            <CalendarGrid value={value} onChange={onChange} />

            {/* Comparison Toggle */}
            {onCompareChange && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCompareEnabled}
                    onChange={handleCompareToggle}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-white/80 text-sm">Compare to previous period</span>
                </label>
              </div>
            )}

            {/* Apply Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-6 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Calendar Grid Component
function CalendarGrid({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<Date | null>(value.start);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (selecting === 'start') {
      setTempStart(selectedDate);
      setSelecting('end');
    } else {
      if (tempStart && selectedDate < tempStart) {
        // Swap if end is before start
        onChange({ start: selectedDate, end: tempStart });
      } else if (tempStart) {
        onChange({ start: tempStart, end: selectedDate });
      }
      setSelecting('start');
    }
  };

  const isDateInRange = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= value.start && date <= value.end;
  };

  const isStartDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === value.start.toDateString();
  };

  const isEndDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === value.end.toDateString();
  };

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-white font-medium">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={nextMonth}
          className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-white/40 text-xs font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const inRange = isDateInRange(day);
          const isStart = isStartDate(day);
          const isEnd = isEndDate(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all duration-150
                ${
                  isStart || isEnd
                    ? 'bg-blue-500 text-white shadow-lg'
                    : inRange
                    ? 'bg-blue-500/20 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
