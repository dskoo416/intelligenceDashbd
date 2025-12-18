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
  onUpdateSettings,
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
  const isPastel = theme === 'pastel';
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
    if (timezone === 'America/Chicago') return 'CST';
    if (timezone === 'America/Denver') return 'MST';
    if (timezone === 'America/Los_Angeles') return 'PST';
    if (timezone === 'America/Anchorage') return 'AKST';
    if (timezone === 'Pacific/Honolulu') return 'HST';
    if (timezone === 'Europe/London') return 'GMT';
    if (timezone === 'Asia/Tokyo') return 'JST';
    if (timezone === 'Asia/Shanghai') return 'CST';
    return timezone.split('/')[1] || timezone;
  };

  const clockDisplay = settings?.clock_display || 'dual';
  const timezone1 = settings?.clock_timezone_1 || 'America/New_York';
  const timezone2 = settings?.clock_timezone_2 || 'Asia/Seoul';

  return (
    <>
      <div className={cn(
        "h-8 border-b flex items-center px-3 gap-1 justify-between",
        isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-1">
        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "px-2 py-0.5 text-[11px] font-medium transition-colors",
              isPastel ? "text-[#E8E9F0] hover:bg-[#9B8B6B]/10 hover:text-[#9B8B6B]" :
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              Actions
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", 
            isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
            isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => window.history.back()}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
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
            <DropdownMenuSeparator className={cn(
            isPastel ? "bg-[#4A4D6C]" :
            isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onRefresh}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onExport}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(
            isPastel ? "bg-[#4A4D6C]" :
            isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={() => window.location.href = '/'}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Home
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onNavigateToIntelligence}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Intelligence Feed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onNavigateToSaved}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
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
              isPastel ? "text-[#E8E9F0] hover:bg-[#9B8B6B]/10 hover:text-[#9B8B6B]" :
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              Edit
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", 
            isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
            isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onOpenSectorsSettings}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Sectors
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenCollectionsSettings}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Collections
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenRSSSettings}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Add Source
            </DropdownMenuItem>
            <DropdownMenuSeparator className={cn(
            isPastel ? "bg-[#4A4D6C]" :
            isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onToggleAutoLoadGist}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              {autoLoadGist && <CheckCircle2 className="w-3 h-3 mr-2 text-orange-500" />}
              {!autoLoadGist && <div className="w-3 h-3 mr-2" />}
              Auto Load Summaries
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleAutoLoadCritical}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              {autoLoadCritical && <CheckCircle2 className="w-3 h-3 mr-2 text-orange-500" />}
              {!autoLoadCritical && <div className="w-3 h-3 mr-2" />}
              Auto Load Featured
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onToggleAutoLoadNews}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
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
              isPastel ? "text-[#E8E9F0] hover:bg-[#9B8B6B]/10 hover:text-[#9B8B6B]" :
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              View
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", 
            isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
            isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={onToggleViewMode}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              Density: {viewMode === 'compact' ? 'Compact' : 'Regular'}
            </DropdownMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={cn("px-2 py-1.5 text-xs rounded-none cursor-pointer flex items-center justify-between hover:bg-opacity-10",
                  isPastel ? "text-[#E8E9F0] hover:bg-[#9B8B6B]/20" :
                  isDark ? "text-neutral-200 hover:bg-orange-500/20" : "text-gray-700 hover:bg-orange-50")}>
                  Appearance
                  <span className="ml-2">›</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className={cn("rounded-none",
                isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
                <DropdownMenuItem
                  onClick={() => {
                    const newSettings = { ...settings, theme: 'light' };
                    onUpdateSettings(newSettings);
                  }}
                  className={cn("text-xs rounded-none flex items-center gap-2",
                    isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                    isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
                >
                  {settings?.theme === 'light' && <span className="text-orange-500">✓</span>}
                  {settings?.theme !== 'light' && <span className="w-3" />}
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const newSettings = { ...settings, theme: 'dark' };
                    onUpdateSettings(newSettings);
                  }}
                  className={cn("text-xs rounded-none flex items-center gap-2",
                    isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                    isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
                >
                  {settings?.theme === 'dark' && <span className="text-orange-500">✓</span>}
                  {settings?.theme !== 'dark' && <span className="w-3" />}
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const newSettings = { ...settings, theme: 'pastel' };
                    onUpdateSettings(newSettings);
                  }}
                  className={cn("text-xs rounded-none flex items-center gap-2",
                    isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                    isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
                >
                  {settings?.theme === 'pastel' && <span className="text-orange-500">✓</span>}
                  {settings?.theme !== 'pastel' && <span className="w-3" />}
                  Pastel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenuSeparator className={cn(
            isPastel ? "bg-[#4A4D6C]" :
            isDark ? "bg-neutral-700" : "bg-gray-200")} />
            <DropdownMenuItem 
              onClick={onToggleSidebarVisibility}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
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
              isPastel ? "text-[#E8E9F0] hover:bg-[#9B8B6B]/10 hover:text-[#9B8B6B]" :
              isDark ? "text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            )}>
              Help
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("rounded-none", 
            isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
            isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            <DropdownMenuItem 
              onClick={() => setAboutOpen(true)}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
            >
              About
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenSettings}
              className={cn("text-xs rounded-none", 
                isPastel ? "text-[#E8E9F0] focus:bg-[#9B8B6B]/20 focus:text-[#9B8B6B]" :
                isDark ? "text-neutral-200 focus:bg-orange-500/20 focus:text-orange-400" : "text-gray-700 focus:bg-orange-50 focus:text-orange-600")}
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
                <span className={cn(
                  isPastel ? "text-[#9B9EBC]" :
                  isDark ? "text-neutral-400" : "text-gray-600")}>
                  {getTimezoneAbbr(timezone2)} {getTimeInTimezone(timezone2)}
                </span>
                <span className={cn(
                  isPastel ? "text-[#9B9EBC]" :
                  isDark ? "text-neutral-400" : "text-gray-600")}>
                  {getTimezoneAbbr(timezone1)} {getTimeInTimezone(timezone1)}
                </span>
              </>
            )}
            {clockDisplay === 'single' && (
              <span className={cn(
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-400" : "text-gray-600")}>
                {getTimezoneAbbr(timezone1)} {getTimeInTimezone(timezone1)}
              </span>
            )}
          </div>
        )}
      </div>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className={cn("max-w-sm", 
          isPastel ? "bg-[#3A3D5C] border-[#4A4D6C] text-white" :
          isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-gray-200 text-gray-900")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-semibold", 
              isPastel ? "text-white" :
              isDark ? "text-white" : "text-gray-900")}>About</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className={cn("text-sm mb-2", 
              isPastel ? "text-[#D0D2E0]" :
              isDark ? "text-neutral-400" : "text-gray-600")}>
              Intelligence Feed
            </p>
            <p className={cn("font-medium", 
              isPastel ? "text-white" :
              isDark ? "text-white" : "text-gray-900")}>
              Version 1.0
            </p>
            <p className={cn("text-sm", 
              isPastel ? "text-[#9B9EBC]" :
              isDark ? "text-neutral-500" : "text-gray-500")}>
              Dec 2025
            </p>
            <p className={cn("text-sm", 
              isPastel ? "text-[#9B9EBC]" :
              isDark ? "text-neutral-500" : "text-gray-500")}>
              Made for LG Chem America
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}