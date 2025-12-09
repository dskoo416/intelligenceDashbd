import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NavigationSidebar({ 
  sectors, 
  activeSector, 
  activeSubsector, 
  onSelectSector, 
  onSelectSubsector, 
  currentPage,
  onOpenSettings,
  theme 
}) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [expandedSectors, setExpandedSectors] = useState({});
  const [showSectors, setShowSectors] = useState(true);

  const toggleExpand = (sectorId, e) => {
    e.stopPropagation();
    setExpandedSectors(prev => ({ ...prev, [sectorId]: !prev[sectorId] }));
  };

  return (
    <div className={cn("h-full border-r flex flex-col", 
      isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
      isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200")}>
      <nav className="flex-1 overflow-y-auto p-2 pt-4 space-y-0.5 custom-scrollbar">
        <button
          onClick={() => {
            onSelectSector(null);
            onSelectSubsector(null);
          }}
          className={cn(
            "w-full text-left flex items-center gap-2 px-3 py-2 rounded transition-all duration-150 text-sm font-medium",
            !activeSector
              ? "bg-orange-500/10 text-orange-500"
              : isPastel
                ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
                : isDark
                  ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          Main
        </button>

        {sectors.length === 0 ? (
          <p className={cn("text-xs p-2 text-center", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-400")}>
            No sectors yet
          </p>
        ) : (
          sectors.map((sector) => {
            const isActive = activeSector?.id === sector.id && !activeSubsector;
            const hasSubsectors = sector.subsectors?.length > 0;
            const isExpanded = expandedSectors[sector.id];
            
            return (
              <div key={sector.id}>
                <div className="flex items-center">
                  {hasSubsectors && (
                    <button
                      onClick={(e) => toggleExpand(sector.id, e)}
                      className={cn("p-1", 
                        isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" :
                        isDark ? "text-neutral-500 hover:text-neutral-300" : "text-gray-400 hover:text-gray-600")}
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  )}
                  <Link
                    to={createPageUrl('IntelligenceFeed')}
                    onClick={() => { onSelectSector(sector); onSelectSubsector && onSelectSubsector(null); }}
                    className={cn(
                      "flex-1 text-left px-2 py-1.5 rounded transition-all duration-150 text-xs font-medium",
                      !hasSubsectors && "ml-4",
                      isActive && currentPage === 'IntelligenceFeed'
                        ? "bg-orange-500/10 text-orange-500"
                        : isPastel
                          ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
                          : isDark
                            ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    {sector.name}
                  </Link>
                </div>
                
                {hasSubsectors && isExpanded && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {sector.subsectors.map((sub, idx) => {
                      const isSubActive = activeSector?.id === sector.id && activeSubsector?.name === sub.name;
                      
                      return (
                        <Link
                          key={idx}
                          to={createPageUrl('IntelligenceFeed')}
                          onClick={() => { onSelectSector(sector); onSelectSubsector && onSelectSubsector(sub); }}
                          className={cn(
                            "block w-full text-left px-2 py-1 rounded transition-all duration-150 text-xs",
                            isSubActive && currentPage === 'IntelligenceFeed'
                              ? "bg-orange-500/10 text-orange-500"
                              : isPastel
                                ? "text-[#7B7E9C] hover:text-white hover:bg-[#3A3D5C]/50"
                                : isDark
                                  ? "text-neutral-600 hover:text-white hover:bg-neutral-800/50"
                                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>
      

    </div>
  );
}