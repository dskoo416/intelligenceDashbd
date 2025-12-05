import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TopBar({ onOpenSettings, onExport, onRefresh, isRefreshing, theme }) {
  const isDark = theme === 'dark';

  return (
    <header className={cn(
      "h-12 border-b flex items-center justify-between px-6",
      isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <h1 className={cn("text-sm font-semibold tracking-tight", isDark ? "text-white" : "text-gray-900")}>
        Market Feed
      </h1>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "text-xs h-8 rounded",
            isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className={cn(
            "text-xs h-8 rounded",
            isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          Export
        </Button>
        
        <div className={cn("w-px h-5 mx-1", isDark ? "bg-neutral-800" : "bg-gray-200")} />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          className={cn(
            "text-xs h-8 rounded",
            isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          Settings
        </Button>
      </div>
    </header>
  );
}