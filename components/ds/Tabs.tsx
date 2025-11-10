"use client";

import { ReactNode } from "react";
import { Tab } from "@headlessui/react";
import { ds, cn } from "@/lib/design-system";

interface TabItem {
  label: string;
  content: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
}

/**
 * 🎯 Standardized Tabs Component
 *
 * Compact, professional tabs
 */
export function Tabs({ tabs, defaultIndex = 0, onChange }: TabsProps) {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List
        className={cn(
          "flex gap-1 p-1",
          ds.colors.bg.primary,
          ds.colors.border.default,
          "border",
          ds.effects.radius.lg,
        )}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            className={({ selected }) =>
              cn(
                "flex items-center gap-1.5 px-2.5 py-1.5",
                ds.effects.radius.md,
                ds.typography.size.xs,
                ds.typography.weight.light,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                ds.effects.transition.normal,
                "outline-none",
                selected
                  ? cn(
                      ds.colors.bg.elevated,
                      ds.colors.text.secondary,
                      ds.colors.border.default,
                      "border",
                    )
                  : cn(
                      "bg-transparent",
                      ds.colors.text.quaternary,
                      "hover:" + ds.colors.text.tertiary,
                    ),
              )
            }
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5",
                  ds.effects.radius.md,
                  ds.typography.size.micro,
                  ds.colors.bg.hover,
                  ds.colors.text.quaternary,
                )}
              >
                {tab.count}
              </span>
            )}
          </Tab>
        ))}
      </Tab.List>

      <Tab.Panels className="mt-3">
        {tabs.map((tab, index) => (
          <Tab.Panel
            key={index}
            className={cn("outline-none", ds.effects.transition.normal)}
          >
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
