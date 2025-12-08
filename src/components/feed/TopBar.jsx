import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TopBar({ onOpenSettings, onExport, onRefresh, isRefreshing, onToggleSidebar, showRefresh, currentPage, sidebarOpen, theme }) {
  const isDark = theme === 'dark';

  return (
    <header className={cn(
      "h-12 border-b flex items-center justify-between px-6",
      isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center gap-1">
        <Link
          to={createPageUrl('Home')}
          className={cn(
            "px-3 py-1.5 rounded text-xs font-medium transition-colors",
            currentPage === 'Home'
              ? "bg-orange-500/10 text-orange-500"
              : isDark
                ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          Home
        </Link>
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
      
      <div className="flex items-center gap-3 flex-1 justify-end">
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
        )}
        

      </div>
    </header>
  );
}