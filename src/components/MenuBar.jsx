import React, { useState, useEffect } from 'react';
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
  autoLoadNews,
  onToggleAutoLoadGist,
  onToggleAutoLoadCritical,
  onToggleAutoLoadNews,
  viewMode,
  onToggleViewMode,
  onToggleTheme,
  onNavigateToIntelligence,
  onNavigateToSaved,
  textSize,
  onChangeTextSize,
  sidebarVisible,
  onToggleSidebarVisibility,
  settings,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const isDark = theme === 'dark';
  const [aboutOpen, setAboutOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInTimezone = (timezone) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return formatter.format(currentTime);
    } catch {
      return '';
    }
  };

  const getTimezoneAbbr = (timezone) => {
    if (timezone === 'Asia/Seoul') return 'KST';
    if (timezone === 'America/New_York') return 'EST';
    if (timezone === 'America/Los_Angeles') return 'PST';
    if (timezone === 'Europe/London') return 'GMT';
    if (timezone === 'Asia/Tokyo') return 'JST';
    return timezone.split('/')[1] || timezone;
  };

  const clockDisplay = settings?.clock_display || 'dual';
  const timezone1 = settings?.clock_timezone_1 || 'America/New_York';
  const timezone2 = settings?.clock_timezone_2 || 'Asia/Seoul';

  return (
    <>
      <div className={cn(
        "h-8 border-b flex items-center px-3 gap-1 justify-between",
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-1">
        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium transition-colors",
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              Actions
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => window.history.back()}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Back
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onUndo}
              disabled={!canUndo}
              className={cn("text-xs rounded-none", 
                !canUndo && "opacity-50 cursor-not-allowed",
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600"
              )}
            >
              Undo
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onRedo}
              disabled={!canRedo}
              className={cn("text-xs rounded-none", 
                !canRedo && "opacity-50 cursor-not-allowed",
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600"
              )}
            >
              Redo
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onRefresh}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onExport}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onNavigateToIntelligence}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Intelligence
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onNavigateToSaved}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Saved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium transition-colors",
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              Edit
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onOpenSectorsSettings}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Sectors
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenCollectionsSettings}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Collections
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenRSSSettings}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Add Source
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onToggleAutoLoadGist}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              {autoLoadGist && <CheckCircle2 className="w-3 h-3 mr-2 text-orange-500" />}
              {!autoLoadGist && <div className="w-3 h-3 mr-2" />}
              Auto Load Gist
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleAutoLoadCritical}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              {autoLoadCritical && <CheckCircle2 className="w-3 h-3 mr-2 text-orange-500" />}
              {!autoLoadCritical && <div className="w-3 h-3 mr-2" />}
              Auto Load Featured
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleAutoLoadNews}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              {autoLoadNews && <CheckCircle2 className="w-3 h-3 mr-2 text-orange-500" />}
              {!autoLoadNews && <div className="w-3 h-3 mr-2" />}
              Auto Load News
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium transition-colors",
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              View
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onToggleViewMode}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Density: {viewMode === 'compact' ? 'Compact' : 'Regular'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleTheme}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Appearance: {isDark ? 'Dark' : 'Light'}
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onToggleSidebarVisibility}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              {sidebarVisible ? 'Hide Navigation' : 'Show Navigation'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium transition-colors",
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              Help
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => setAboutOpen(true)}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              About
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenSettings}
              className={cn("text-xs rounded-none", isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        {clockDisplay !== 'none' && (
          <div className="flex items-center gap-3 text-[11px] font-medium">
            {clockDisplay === 'dual' && (
              <>
                <span className={cn(isDark ? "text-neutral-400" : "text-gray-600")}>
                  {getTimezoneAbbr(timezone2)} {getTimeInTimezone(timezone2)}
                </span>
                <span className={cn(isDark ? "text-neutral-400" : "text-gray-600")}>
                  {getTimezoneAbbr(timezone1)} {getTimeInTimezone(timezone1)}
                </span>
              </>
            )}
            {clockDisplay === 'single' && (
              <span className={cn(isDark ? "text-neutral-400" : "text-gray-600")}>
                {getTimezoneAbbr(timezone1)} {getTimeInTimezone(timezone1)}
              </span>
            )}
          </div>
        )}
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