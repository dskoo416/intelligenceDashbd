import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function MenuBar({ 
  theme, 
  onRefresh, 
  onExport, 
  currentPage,
  onOpenSettings,
  onOpenSectorsSettings,
  onOpenCollectionsSettings,
  onOpenRSSSettings,
  autoLoadGist,
  autoLoadCritical,
  onToggleAutoLoadGist,
  onToggleAutoLoadCritical,
  viewMode,
  onToggleViewMode,
  onToggleTheme,
  onNavigateToIntelligence,
  onNavigateToSaved
}) {
  const isDark = theme === 'dark';
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <div className={cn(
        "h-8 border-b flex items-center px-3 gap-1",
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
      )}>
        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              Actions
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => window.history.back()}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Back
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onRefresh}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onExport}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onNavigateToIntelligence}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Intelligence
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onNavigateToSaved}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Saved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              Edit
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onOpenSectorsSettings}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Sectors
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenCollectionsSettings}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Collections
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenRSSSettings}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Add Source
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onToggleAutoLoadGist}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              {autoLoadGist && <CheckCircle2 className="w-3 h-3 mr-2" />}
              {!autoLoadGist && <div className="w-3 h-3 mr-2" />}
              Auto Load Gist
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleAutoLoadCritical}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              {autoLoadCritical && <CheckCircle2 className="w-3 h-3 mr-2" />}
              {!autoLoadCritical && <div className="w-3 h-3 mr-2" />}
              Auto Load Featured
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              View
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onToggleViewMode}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              {viewMode === 'compact' ? 'Regular' : 'Compact'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleTheme}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              {isDark ? 'Light' : 'Dark'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              Help
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => setAboutOpen(true)}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              About
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenSettings}
              className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className={cn("max-w-sm", isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-gray-200 text-gray-900")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>About</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className={cn("text-sm mb-2", isDark ? "text-neutral-400" : "text-gray-600")}>
              Intelligence Feed
            </p>
            <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
              Version 1.0
            </p>
            <p className={cn("text-sm", isDark ? "text-neutral-500" : "text-gray-500")}>
              Dec 2025
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}