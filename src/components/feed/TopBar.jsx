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
      "h-10 border-b flex items-center justify-between px-4",
      isDark ? "bg-[#0f0f10] border-[#262629]" : "bg-white border-gray-300"
    )}>
      <div className="flex items-center gap-0 h-full">
        <Link
          to={createPageUrl('Home')}
          className={cn(
            "px-4 h-full flex items-center text-[11px] font-medium uppercase tracking-wide transition-colors border-b-2",
            currentPage === 'Home'
              ? "border-orange-500 text-orange-500"
              : isDark
                ? "border-transparent text-neutral-500 hover:text-neutral-300"
                : "border-transparent text-gray-600 hover:text-gray-900"
          )}
        >
          Home
        </Link>
        <Link
          to={createPageUrl('IntelligenceFeed')}
          className={cn(
            "px-4 h-full flex items-center text-[11px] font-medium uppercase tracking-wide transition-colors border-b-2",
            currentPage === 'IntelligenceFeed'
              ? "border-orange-500 text-orange-500"
              : isDark
                ? "border-transparent text-neutral-500 hover:text-neutral-300"
                : "border-transparent text-gray-600 hover:text-gray-900"
          )}
        >
          Intelligence Feed
        </Link>
        <Link
          to={createPageUrl('Saved')}
          className={cn(
            "px-4 h-full flex items-center text-[11px] font-medium uppercase tracking-wide transition-colors border-b-2",
            currentPage === 'Saved'
              ? "border-orange-500 text-orange-500"
              : isDark
                ? "border-transparent text-neutral-500 hover:text-neutral-300"
                : "border-transparent text-gray-600 hover:text-gray-900"
          )}
        >
          Saved
        </Link>
      </div>
    </header>
  );
}