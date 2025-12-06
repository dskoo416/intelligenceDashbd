import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Download, Zap, BookmarkIcon, Grid3x3, Plus, CheckCircle2, Eye, Sun, Moon, HelpCircle, Settings } from 'lucide-react';
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
              "px-2 py-1 text-xs font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              Actions
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => window.history.back()}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onRefresh}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onExport}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onNavigateToIntelligence}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <Zap className="w-4 h-4 mr-2" />
              Intelligence
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onNavigateToSaved}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Saved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-1 text-xs font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              Edit
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onOpenSectorsSettings}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Sectors
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenCollectionsSettings}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Collections
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenRSSSettings}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onToggleAutoLoadGist}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              {autoLoadGist && <CheckCircle2 className="w-4 h-4 mr-2" />}
              {!autoLoadGist && <div className="w-4 h-4 mr-2" />}
              Auto Load Gist
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleAutoLoadCritical}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              {autoLoadCritical && <CheckCircle2 className="w-4 h-4 mr-2" />}
              {!autoLoadCritical && <div className="w-4 h-4 mr-2" />}
              Auto Load Critical Articles
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-1 text-xs font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              View
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onToggleViewMode}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <Eye className="w-4 h-4 mr-2" />
              {viewMode === 'compact' ? 'Regular' : 'Compact'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleTheme}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {isDark ? 'Light' : 'Dark'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-1 text-xs font-medium rounded hover:bg-opacity-10 transition-colors",
              isDark ? "text-neutral-300 hover:bg-white" : "text-gray-700 hover:bg-gray-900"
            )}>
              Help
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => setAboutOpen(true)}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              About
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenSettings}
              className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
            >
              <Settings className="w-4 h-4 mr-2" />
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