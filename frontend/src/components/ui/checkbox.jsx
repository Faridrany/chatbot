"use client";

import React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";

import { cn } from "./utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";

// Root
function Command({ className, ...props }) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md", className)}
      {...props}
    />
  );
}

// Dialog wrapper
function CommandDialog({ title = "Command Palette", description = "Search for a command to run...", children, ...props }) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <DialogContent className="overflow-hidden p-0">
        <Command className=":[&_[cmdk-group-heading]]:text-muted-foreground">{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

// Input
function CommandInput({ className, ...props }) {
  return (
    <div data-slot="command-input-wrapper" className="flex h-9 items-center gap-2 border-b px-3">
      <SearchIcon className="size-4 shrink-0 opacity-50" />

      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground", className)}
        {...props}
      />
    </div>
  );
}

// List
function CommandList({ className, ...props }) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  );
}

// Empty
function CommandEmpty(props) {
  return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm" {...props} />;
}

// Group
function CommandGroup({ className, ...props }) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn("p-1 text-foreground :[&_[cmdk-group-heading]]:text-xs :[&_[cmdk-group-heading]]:font-medium", className)}
      {...props}
    />
  );
}

// Separator
function CommandSeparator({ className, ...props }) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn("bg-border h-px my-1", className)} {...props} />;
}

// Item
function CommandItem({ className, ...props }) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-default",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}

// Shortcut
function CommandShortcut({ className, ...props }) {
  return <span data-slot="command-shortcut" className={cn("ml-auto text-xs text-muted-foreground", className)} {...props} />;
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
