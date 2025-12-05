import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TopBar({ onOpenSettings, onExport, onRefresh, isRefreshing, onToggleSidebar, showRefresh, currentPage, theme }) {
  const isDark = theme === 'dark';

  return (
    <header className={cn(
      "h-12 border-b flex items-center justify-between px-6",
      isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className={cn(
            "h-8 w-8 p-0",
            isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <Menu className="w-4 h-4" />
        </Button>
        <h1 className={cn("text-sm font-semibold tracking-tight", isDark ? "text-white" : "text-gray-900")}>
          Intelligence Feed
        </h1>
        <div className="flex items-center gap-1 ml-4">
          <Link
            to={createPageUrl('IntelligenceFeed')}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-medium transition-colors",
              currentPage === 'IntelligenceFeed'
                ? "bg-orange-500/10 text-orange-500"
                : isDark
                  ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            Intelligence Feed
          </Link>
          <Link
            to={createPageUrl('Saved')}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-medium transition-colors",
              currentPage === 'Saved'
                ? "bg-orange-500/10 text-orange-500"
                : isDark
                  ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            Saved
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {showRefresh && (
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
        )}
        
        {showRefresh && onExport && (
          <>
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
          </>
        )}
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