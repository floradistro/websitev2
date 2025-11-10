"use client";

import { useState } from "react";
import { Clock, X, Plus } from "lucide-react";
import { ds, cn } from "@/lib/design-system";
import type { BusinessHours, DayHours } from "@/types/branding";

interface BusinessHoursEditorProps {
  value: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

/**
 * 🕐 Business Hours Editor Component
 *
 * Visual editor for setting store operating hours
 */
export function BusinessHoursEditor({ value, onChange }: BusinessHoursEditorProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const updateDayHours = (day: string, hours: DayHours | undefined) => {
    onChange({
      ...value,
      [day]: hours,
    });
  };

  const toggleClosed = (day: string) => {
    const current = value[day as keyof BusinessHours];
    if (current?.closed) {
      // Reopen with default hours
      updateDayHours(day, {
        open: "09:00",
        close: "21:00",
        closed: false,
      });
    } else {
      // Mark as closed
      updateDayHours(day, {
        open: "",
        close: "",
        closed: true,
      });
    }
  };

  const copyToAll = (day: string) => {
    const hours = value[day as keyof BusinessHours];
    if (!hours) return;

    const newHours: BusinessHours = {};
    DAYS.forEach(({ key }) => {
      newHours[key] = { ...hours };
    });
    onChange(newHours);
  };

  const clearAll = () => {
    onChange({});
  };

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <label
          className={cn(
            ds.typography.size.xs,
            ds.typography.weight.medium,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary,
          )}
        >
          Business Hours
        </label>

        <button
          type="button"
          onClick={clearAll}
          className={cn(
            ds.typography.size.micro,
            ds.colors.text.quaternary,
            "hover:text-white/40",
            ds.effects.transition.fast,
          )}
        >
          Clear All
        </button>
      </div>

      {/* Days list */}
      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const hours = value[key as keyof BusinessHours];
          const isClosed = hours?.closed || false;
          const isExpanded = expandedDay === key;

          return (
            <div
              key={key}
              className={cn(
                "border",
                ds.colors.border.default,
                ds.effects.radius.lg,
                "overflow-hidden",
                ds.effects.transition.normal,
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  "flex items-center justify-between",
                  "px-4 py-3",
                  ds.colors.bg.elevated,
                  "cursor-pointer",
                  "hover:bg-white/[0.06]",
                  ds.effects.transition.fast,
                )}
                onClick={() => setExpandedDay(isExpanded ? null : key)}
              >
                <div className="flex items-center gap-3">
                  <Clock size={14} className={ds.colors.text.quaternary} />
                  <span
                    className={cn(
                      ds.typography.size.sm,
                      ds.colors.text.secondary,
                      ds.typography.weight.medium,
                    )}
                  >
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isClosed ? (
                    <span
                      className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "italic")}
                    >
                      Closed
                    </span>
                  ) : hours ? (
                    <span
                      className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "font-mono")}
                    >
                      {hours.open} - {hours.close}
                    </span>
                  ) : (
                    <span
                      className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "italic")}
                    >
                      Not set
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDay(isExpanded ? null : key);
                    }}
                    className={cn(
                      "p-1",
                      ds.colors.text.quaternary,
                      "hover:text-white/40",
                      ds.effects.transition.fast,
                    )}
                  >
                    <Plus
                      size={14}
                      className={cn(ds.effects.transition.fast, isExpanded && "rotate-45")}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded editor */}
              {isExpanded && (
                <div className={cn("px-4 py-4", "border-t", ds.colors.border.default, "space-y-3")}>
                  {/* Closed toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={() => toggleClosed(key)}
                      className={cn(
                        "w-4 h-4",
                        "bg-black/20 border border-white/10 rounded",
                        "text-white",
                        "focus:ring-2 focus:ring-white/20",
                        "cursor-pointer",
                      )}
                    />
                    <span className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                      Closed on {label}
                    </span>
                  </label>

                  {!isClosed && (
                    <>
                      {/* Time inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            className={cn(
                              "block mb-2",
                              ds.typography.size.micro,
                              ds.typography.transform.uppercase,
                              ds.typography.tracking.wide,
                              ds.colors.text.quaternary,
                            )}
                          >
                            Opening Time
                          </label>
                          <input
                            type="time"
                            value={hours?.open || "09:00"}
                            onChange={(e) =>
                              updateDayHours(key, {
                                ...hours,
                                open: e.target.value,
                                close: hours?.close || "21:00",
                                closed: false,
                              })
                            }
                            className={cn(
                              "w-full h-10",
                              "px-3",
                              ds.colors.bg.input,
                              "border",
                              ds.colors.border.default,
                              ds.colors.text.secondary,
                              ds.effects.radius.lg,
                              ds.effects.transition.normal,
                              ds.typography.size.sm,
                              "font-mono",
                              "focus:outline-none focus:border-white/20",
                            )}
                          />
                        </div>

                        <div>
                          <label
                            className={cn(
                              "block mb-2",
                              ds.typography.size.micro,
                              ds.typography.transform.uppercase,
                              ds.typography.tracking.wide,
                              ds.colors.text.quaternary,
                            )}
                          >
                            Closing Time
                          </label>
                          <input
                            type="time"
                            value={hours?.close || "21:00"}
                            onChange={(e) =>
                              updateDayHours(key, {
                                ...hours,
                                open: hours?.open || "09:00",
                                close: e.target.value,
                                closed: false,
                              })
                            }
                            className={cn(
                              "w-full h-10",
                              "px-3",
                              ds.colors.bg.input,
                              "border",
                              ds.colors.border.default,
                              ds.colors.text.secondary,
                              ds.effects.radius.lg,
                              ds.effects.transition.normal,
                              ds.typography.size.sm,
                              "font-mono",
                              "focus:outline-none focus:border-white/20",
                            )}
                          />
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyToAll(key)}
                          className={cn(
                            "flex-1",
                            "px-3 py-2",
                            ds.colors.bg.elevated,
                            "hover:bg-white/[0.06]",
                            "border",
                            ds.colors.border.default,
                            ds.colors.text.tertiary,
                            "hover:text-white/70",
                            ds.effects.radius.md,
                            ds.effects.transition.fast,
                            ds.typography.size.xs,
                          )}
                        >
                          Copy to all days
                        </button>

                        <button
                          type="button"
                          onClick={() => updateDayHours(key, undefined)}
                          className={cn(
                            "px-3 py-2",
                            ds.colors.bg.elevated,
                            "hover:bg-red-500/10",
                            "border",
                            ds.colors.border.default,
                            "hover:border-red-500/30",
                            ds.colors.text.quaternary,
                            "hover:text-red-400",
                            ds.effects.radius.md,
                            ds.effects.transition.fast,
                          )}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div
        className={cn(
          "p-3",
          ds.colors.bg.elevated,
          "border",
          ds.colors.border.default,
          ds.effects.radius.lg,
        )}
      >
        <div className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "space-y-1")}>
          <div>
            💡 <strong>Tip:</strong> Set hours that appear on your storefront
          </div>
          <div>• Click any day to edit hours</div>
          <div>• Use "Copy to all days" for consistent hours</div>
          <div>• Mark days as closed when you're not operating</div>
        </div>
      </div>
    </div>
  );
}
