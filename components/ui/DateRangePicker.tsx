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
  const [activePreset, setActivePreset] = useState<string | null>('30 Days');
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
    if (!range || !range.start || !range.end) return 'Select dates';
    try {
      const startStr = range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } catch (e) {
      return 'Select dates';
    }
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
              px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all duration-200
              ${
                activePreset === preset.label
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-black/20 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider bg-black/20 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70 transition-all duration-200 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Custom
        </button>
      </div>

      {/* Custom Date Popover - Dropdown Style */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />

          {/* Popover */}
          <div
            ref={modalRef}
            className="absolute right-0 top-full mt-2 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl w-[360px] p-5 z-[9999]"
            style={{
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Select Range</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Selection Display */}
            <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/5">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1 font-medium">Selected Range</div>
              <div className="text-white text-sm font-medium">{formatDateRange(value)}</div>
            </div>

            {/* Calendar Component */}
            <CalendarGrid value={value} onChange={onChange} onClose={() => setIsOpen(false)} />

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-sm font-medium transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-lg text-sm font-medium transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Calendar Grid Component - Apple Style
function CalendarGrid({
  value,
  onChange,
  onClose,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onClose?: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<Date | null>(null);

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
    selectedDate.setHours(0, 0, 0, 0);

    if (selecting === 'start') {
      setTempStart(selectedDate);
      setSelecting('end');
    } else {
      if (tempStart && selectedDate < tempStart) {
        // Swap if end is before start
        const endDate = new Date(tempStart);
        endDate.setHours(23, 59, 59, 999);
        onChange({ start: selectedDate, end: endDate });
      } else if (tempStart) {
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        onChange({ start: tempStart, end: endDate });
      }
      setSelecting('start');
      setTempStart(null);
    }
  };

  const isDateInRange = (day: number) => {
    if (!value?.start || !value?.end) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= value.start && date <= value.end;
  };

  const isStartDate = (day: number) => {
    if (!value?.start) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === value.start.toDateString();
  };

  const isEndDate = (day: number) => {
    if (!value?.end) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === value.end.toDateString();
  };

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div>
      {/* Month Navigation - Compact */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-white text-sm font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Headers - Compact */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={`${day}-${idx}`} className="text-center text-white/40 text-[10px] font-semibold py-1 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days - Compact */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="w-10 h-10" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const inRange = isDateInRange(day);
          const isStart = isStartDate(day);
          const isEnd = isEndDate(day);
          const today = isToday(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                w-10 h-10 rounded-full text-xs font-semibold transition-all duration-150
                flex items-center justify-center relative
                ${
                  isStart || isEnd
                    ? 'bg-[#007AFF] text-white'
                    : inRange
                    ? 'bg-[#007AFF]/20 text-white'
                    : today
                    ? 'bg-white/5 text-white ring-1 ring-[#007AFF]'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selection Hint */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-white/40 text-[10px] text-center uppercase tracking-wide">
          {selecting === 'start' ? 'Select start date' : 'Select end date'}
        </div>
      </div>
    </div>
  );
}
