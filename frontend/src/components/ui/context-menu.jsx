"use client";

import React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "./utils";

// Root
function ContextMenu(props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

// Trigger
function ContextMenuTrigger(props) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

// Group
function ContextMenuGroup(props) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

// Portal
function ContextMenuPortal(props) {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

// Sub
function ContextMenuSub(props) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

// Radio Group
function ContextMenuRadioGroup(props) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

// Sub Trigger
function ContextMenuSubTrigger({ className, inset, children, ...props }) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex items-center rounded-sm px-2 py-1.5 text-sm cursor-default outline-none select-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

// Sub Content
function ContextMenuSubContent({ className, ...props }) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      className={cn("bg-popover text-popover-foreground rounded-md border p-1 shadow-lg z-50 min-w-8rem", className)}
      {...props}
    />
  );
}

// Content
function ContextMenuContent({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn("bg-popover text-popover-foreground rounded-md border p-1 shadow-md z-50 min-w-8rem", className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

// Item
function ContextMenuItem({ className, inset, variant = "default", ...props }) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-default outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        variant === "destructive" && "text-destructive",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

// Checkbox Item
function ContextMenuCheckboxItem({ className, children, checked, ...props }) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(
        "flex items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

// Radio Item
function ContextMenuRadioItem({ className, children, ...props }) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(
        "flex items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

// Label
function ContextMenuLabel({ className, inset, ...props }) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      className={cn("px-2 py-1.5 text-sm font-medium", inset && "pl-8", className)}
      {...props}
    />
  );
}

// Separator
function ContextMenuSeparator({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("bg-border my-1 h-px", className)}
      {...props}
    />
  );
}

// Shortcut
function ContextMenuShortcut({ className, ...props }) {
  return <span data-slot="context-menu-shortcut" className={cn("ml-auto text-xs text-muted-foreground", className)} {...props} />;
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
