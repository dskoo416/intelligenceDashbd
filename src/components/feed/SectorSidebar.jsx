import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SectorSidebar({ sectors, activeSector, activeSubsector, onSelectSector, onSelectSubsector, isLoading, theme, onEditSectors }) {
  const isDark = theme === 'dark';
  const [expandedSectors, setExpandedSectors] = useState({});

  const toggleExpand = (sectorId, e) => {
    e.stopPropagation();
    setExpandedSectors(prev => ({ ...prev, [sectorId]: !prev[sectorId] }));
  };

  if (isLoading) {
    return (
      <div className={cn("h-full border-r p-4 space-y-2 flex flex-col", isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200")}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn("h-10 rounded animate-pulse", isDark ? "bg-neutral-800" : "bg-gray-100")} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("h-full border-r flex flex-col", isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200")}>
      <div className={cn("p-4 border-b", isDark ? "border-neutral-800" : "border-gray-200")}>
        <h2 className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-500")}>
          Sectors
        </h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {sectors.length === 0 ? (
          <p className={cn("text-sm p-3 text-center", isDark ? "text-neutral-500" : "text-gray-500")}>
            No sectors yet. Add sectors in settings.
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
                      className={cn("p-1 mr-1", isDark ? "text-neutral-500 hover:text-neutral-300" : "text-gray-400 hover:text-gray-600")}
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  )}
                  <button
                    onClick={() => { onSelectSector(sector); onSelectSubsector && onSelectSubsector(null); }}
                    className={cn(
                      "flex-1 text-left px-2 py-2 rounded transition-all duration-150 text-sm font-medium",
                      !hasSubsectors && "ml-5",
                      isActive 
                        ? isDark 
                          ? "bg-neutral-800 text-white" 
                          : "bg-gray-100 text-gray-900"
                        : isDark
                          ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    {sector.name}
                  </button>
                </div>
                
                {hasSubsectors && isExpanded && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {sector.subsectors.map((sub, idx) => {
                      const isSubActive = activeSector?.id === sector.id && activeSubsector?.name === sub.name;
                      const hasSubSub = sub.subsubsectors?.length > 0;
                      
                      return (
                        <div key={idx}>
                          <button
                            onClick={() => { onSelectSector(sector); onSelectSubsector && onSelectSubsector(sub); }}
                            className={cn(
                              "w-full text-left px-2 py-1.5 rounded transition-all duration-150 text-xs",
                              isSubActive 
                                ? isDark 
                                  ? "bg-neutral-800 text-white" 
                                  : "bg-gray-100 text-gray-900"
                                : isDark
                                  ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            {sub.name}
                          </button>
                          {hasSubSub && (
                            <div className="ml-3 mt-0.5 space-y-0.5">
                              {sub.subsubsectors.map((subsub, ssIdx) => (
                                <button
                                  key={ssIdx}
                                  onClick={() => { onSelectSector(sector); onSelectSubsector && onSelectSubsector({ name: subsub, parent: sub.name }); }}
                                  className={cn(
                                    "w-full text-left px-2 py-1 rounded transition-all duration-150 text-xs",
                                    isDark
                                      ? "text-neutral-600 hover:text-white hover:bg-neutral-800/50"
                                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                                  )}
                                >
                                  {subsub}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>
      
      <div className={cn("p-2 border-t", isDark ? "border-neutral-800" : "border-gray-200")}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditSectors}
          className={cn(
            "w-full text-xs h-8",
            isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          Edit Sectors
        </Button>
      </div>
    </div>
  );
}