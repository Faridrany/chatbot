"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeftIcon } from "lucide-react";

import { useIsMobile } from "./use-mobile";
import { cn } from "./utils";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

/* ================= CONTEXT ================= */
const SidebarContext = React.createContext(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

/* ================= PROVIDER ================= */
export function SidebarProvider({ defaultOpen = true, open: openProp, onOpenChange, children, className, style, ...props }) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);

  const open = openProp ?? _open;

  const setOpen = (value) => {
    const newValue = typeof value === "function" ? value(open) : value;
    if (onOpenChange) onOpenChange(newValue);
    else _setOpen(newValue);

    document.cookie = `sidebar_state=${newValue}; path=/; max-age=${60 * 60 * 24 * 7}`;
  };

  const toggleSidebar = () => {
    return isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev);
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const value = {
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
    state: open ? "expanded" : "collapsed",
  };

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        <div className={cn("flex min-h-screen w-full", className)} style={style} {...props}>
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

/* ================= SIDEBAR ================= */
export function Sidebar({ children, className, ...props }) {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent className="w-64 p-0">
          <div className="flex flex-col h-full">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("hidden md:flex w-64 flex-col bg-gray-900 text-white", className)} {...props}>
      {children}
    </div>
  );
}

/* ================= TRIGGER ================= */
export function SidebarTrigger({ className, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button variant="ghost" size="icon" className={cn("size-7", className)} onClick={toggleSidebar} {...props}>
      <PanelLeftIcon />
    </Button>
  );
}

/* ================= PARTS ================= */
export function SidebarHeader({ className, ...props }) {
  return <div className={cn("p-2", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }) {
  return <div className={cn("p-2", className)} {...props} />;
}

export function SidebarContent({ className, ...props }) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />;
}

export function SidebarInput(props) {
  return <Input className="h-8" {...props} />;
}

export function SidebarSeparator(props) {
  return <Separator className="my-2" {...props} />;
}

/* ================= MENU ================= */
export function SidebarMenu({ className, ...props }) {
  return <ul className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }) {
  return <li className={cn("", className)} {...props} />;
}

export function SidebarMenuButton({ children, className, tooltip, ...props }) {
  const button = (
    <button className={cn("flex items-center gap-2 p-2 rounded-md hover:bg-gray-800", className)} {...props}>
      {children}
    </button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/* ================= EXPORT ================= */
export default Sidebar;
