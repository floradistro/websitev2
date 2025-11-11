"use client";

import { useState } from "react";
import { Check, ChevronDown } from "@/lib/icons";

/**
 * Apple-Style Comparison Selector
 *
 * Tim Cook: "I want to compare this week vs last week,
 * this month vs last month. Show me year-over-year growth."
 *
 * Features:
 * - Previous Period
 * - Same Period Last Year
 * - Custom (future)
 * - "No Comparison" option
 */

export type ComparisonType = 'none' | 'previous_period' | 'same_period_last_year' | 'day_over_day' | 'week_over_week' | 'month_over_month' | 'quarter_over_quarter' | 'custom';

interface ComparisonOption {
  value: ComparisonType;
  label: string;
  description: string;
}

interface ComparisonSelectorProps {
  value: ComparisonType;
  onChange: (value: ComparisonType) => void;
  className?: string;
}

const COMPARISON_OPTIONS: ComparisonOption[] = [
  {
    value: 'none',
    label: 'No Comparison',
    description: 'View current period only',
  },
  {
    value: 'previous_period',
    label: 'Previous Period',
    description: 'Compare with the period before',
  },
  {
    value: 'day_over_day',
    label: 'Day over Day',
    description: 'Compare today vs yesterday',
  },
  {
    value: 'week_over_week',
    label: 'Week over Week',
    description: 'Compare this week vs last week',
  },
  {
    value: 'month_over_month',
    label: 'Month over Month',
    description: 'Compare this month vs last month',
  },
  {
    value: 'quarter_over_quarter',
    label: 'Quarter over Quarter',
    description: 'Compare this quarter vs last quarter',
  },
  {
    value: 'same_period_last_year',
    label: 'Year over Year',
    description: 'Compare same period vs last year',
  },
];

export function ComparisonSelector({
  value,
  onChange,
  className = '',
}: ComparisonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = COMPARISON_OPTIONS.find(opt => opt.value === value) || COMPARISON_OPTIONS[0];

  const handleSelect = (optionValue: ComparisonType) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
      >
        <svg
          className="w-4 h-4 text-white/60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12H3M21 6H3M21 18H3" />
          <path d="M12 3v18" strokeDasharray="2 4" />
        </svg>
        <span>{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Transparent Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-[320px] z-[101] bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">
            <div className="p-3">
              {COMPARISON_OPTIONS.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                      isSelected
                        ? 'bg-white/[0.08]'
                        : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Checkmark */}
                    <div className="flex items-center justify-center w-5 h-5 mt-0.5 flex-shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                      )}
                    </div>

                    {/* Label & Description */}
                    <div className="flex-1">
                      <div className={`text-sm font-medium transition-colors ${
                        isSelected ? 'text-white' : 'text-white/80'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Footer */}
            {value !== 'none' && (
              <div className="px-4 py-3 border-t border-white/5">
                <div className="flex items-start gap-2 text-xs text-white/50">
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    Comparison bars will appear in KPI cards showing the difference vs {selectedOption.label.toLowerCase()}.
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: slide-in-from-top 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
    </div>
  );
}

/**
 * Comparison Badge
 * Shows the comparison mode status next to KPI metrics
 */
interface ComparisonBadgeProps {
  comparisonType: ComparisonType;
  changePercent: number;
  changeValue: number;
  valueFormatter?: (value: number) => string;
}

export function ComparisonBadge({
  comparisonType,
  changePercent,
  changeValue,
  valueFormatter = (v) => v.toFixed(2),
}: ComparisonBadgeProps) {
  if (comparisonType === 'none') return null;

  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;
  const isNeutral = changePercent === 0;

  // Get contextual label
  const getComparisonLabel = (type: ComparisonType): string => {
    switch (type) {
      case 'previous_period': return 'previous';
      case 'day_over_day': return 'yesterday';
      case 'week_over_week': return 'last week';
      case 'month_over_month': return 'last month';
      case 'quarter_over_quarter': return 'last quarter';
      case 'same_period_last_year': return 'last year';
      case 'custom': return 'custom period';
      default: return 'previous';
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
      {/* Change Indicator */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
        isPositive ? 'bg-green-500/10 text-green-400' :
        isNegative ? 'bg-red-500/10 text-red-400' :
        'bg-white/5 text-white/50'
      }`}>
        {isPositive && <span>↑</span>}
        {isNegative && <span>↓</span>}
        {isNeutral && <span>→</span>}
        <span>{Math.abs(changePercent).toFixed(1)}%</span>
      </div>

      {/* Change Value */}
      <div className="text-xs text-white/50">
        {isPositive && '+'}
        {valueFormatter(changeValue)} vs{' '}
        {getComparisonLabel(comparisonType)}
      </div>
    </div>
  );
}
