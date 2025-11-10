"use client";

import { Fragment, ReactNode } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { ds } from "@/lib/design-system";

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  width?: string;
}

/**
 * 🎯 Standardized Dropdown Component
 *
 * Features:
 * - Auto-positioning to prevent overflow
 * - Compact, minimal padding
 * - Design system fonts
 * - Smooth animations
 */
export function Dropdown({ trigger, items, align = "right", width = "w-48" }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as="div" className="cursor-pointer">
        {trigger}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1 ${width} origin-top-${align}
            ${ds.colors.bg.primary} ${ds.colors.border.default} border ${ds.effects.radius.lg}
            ${ds.effects.shadow.lg}
            focus:outline-none z-50 overflow-hidden max-h-[70vh] overflow-y-auto`}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <Menu.Item key={index} disabled={item.disabled}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-left
                      ${ds.typography.size.xs} ${ds.typography.weight.light}
                      ${item.variant === "danger" ? ds.colors.status.error : ds.colors.text.secondary}
                      ${active && !item.disabled ? ds.colors.bg.hover : ""}
                      ${item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                      transition-colors duration-150
                    `}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

/**
 * Compact dropdown trigger button
 */
export function DropdownTrigger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5
        ${ds.colors.bg.elevated} hover:${ds.colors.bg.hover}
        ${ds.colors.border.default} border ${ds.effects.radius.md}
        ${ds.typography.size.xs} ${ds.typography.weight.light} ${ds.colors.text.tertiary}
        ${ds.effects.transition.normal}
        ${className}
      `}
    >
      {children}
      <ChevronDown size={12} className={ds.colors.text.quaternary} strokeWidth={2} />
    </div>
  );
}
