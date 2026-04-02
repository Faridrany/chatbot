"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "./utils";

/* ================= ROOT ================= */
export function Select(props) {
  return <SelectPrimitive.Root {...props} />;
}

export function SelectGroup(props) {
  return <SelectPrimitive.Group {...props} />;
}

export function SelectValue(props) {
  return <SelectPrimitive.Value {...props} />;
}

/* ================= TRIGGER ================= */
export function SelectTrigger({ className, size = "default", children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
        size === "default" && "h-9",
        size === "sm" && "h-8",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="w-4 h-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/* ================= CONTENT ================= */
export function SelectContent({ className, children, position = "popper", ...props }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn("relative z-50 min-w-8rem max-h-96 overflow-auto rounded-md border bg-white shadow-md", className)}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/* ================= LABEL ================= */
export function SelectLabel({ className, ...props }) {
  return <SelectPrimitive.Label className={cn("px-2 py-1.5 text-xs text-gray-500", className)} {...props} />;
}

/* ================= ITEM ================= */
export function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm hover:bg-gray-100",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex items-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="w-4 h-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/* ================= SEPARATOR ================= */
export function SelectSeparator({ className, ...props }) {
  return <SelectPrimitive.Separator className={cn("my-1 h-px bg-gray-200", className)} {...props} />;
}

/* ================= SCROLL BUTTON ================= */
export function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton className={cn("flex justify-center py-1", className)} {...props}>
      <ChevronUpIcon className="w-4 h-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

export function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton className={cn("flex justify-center py-1", className)} {...props}>
      <ChevronDownIcon className="w-4 h-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}
