"use client";

import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "./utils";

/* ================= ROOT ================= */
export function NavigationMenu({ className, children, viewport = true, ...props }) {
  return (
    <NavigationMenuPrimitive.Root
      data-viewport={viewport}
      className={cn("relative flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}

/* ================= LIST ================= */
export function NavigationMenuList({ className, ...props }) {
  return <NavigationMenuPrimitive.List className={cn("flex list-none items-center gap-1", className)} {...props} />;
}

/* ================= ITEM ================= */
export function NavigationMenuItem({ className, ...props }) {
  return <NavigationMenuPrimitive.Item className={cn("relative", className)} {...props} />;
}

/* ================= STYLE ================= */
export const navigationMenuTriggerStyle = cva(
  "inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
);

/* ================= TRIGGER ================= */
export function NavigationMenuTrigger({ className, children, ...props }) {
  return (
    <NavigationMenuPrimitive.Trigger className={cn(navigationMenuTriggerStyle(), className)} {...props}>
      {children}
      <ChevronDownIcon className="ml-1 w-3 h-3 transition group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  );
}

/* ================= CONTENT ================= */
export function NavigationMenuContent({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.Content
      className={cn("absolute left-0 top-full w-full md:w-auto p-2 bg-white border rounded-md shadow", className)}
      {...props}
    />
  );
}

/* ================= VIEWPORT ================= */
export function NavigationMenuViewport({ className, ...props }) {
  return (
    <div className="absolute top-full left-0 flex justify-center z-50">
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "mt-1.5 w-full md:w-var(--radix-navigation-menu-viewport-width) rounded-md border bg-white shadow",
          className
        )}
        {...props}
      />
    </div>
  );
}

/* ================= LINK ================= */
export function NavigationMenuLink({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.Link
      className={cn("flex flex-col gap-1 rounded-sm p-2 text-sm hover:bg-gray-100 transition", className)}
      {...props}
    />
  );
}

/* ================= INDICATOR ================= */
export function NavigationMenuIndicator({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.Indicator className={cn("flex justify-center top-full h-1.5", className)} {...props}>
      <div className="h-2 w-2 rotate-45 bg-gray-300" />
    </NavigationMenuPrimitive.Indicator>
  );
}
