import React from 'react';
import { cn } from "@/lib/utils";

export default function SectorSidebar({ sectors, activeSector, onSelectSector, isLoading, theme }) {
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className={cn("h-full border-r p-4 space-y-2", isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200")}>
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
      
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sectors.length === 0 ? (
          <p className={cn("text-sm p-3 text-center", isDark ? "text-neutral-500" : "text-gray-500")}>
            No sectors yet. Add sectors in settings.
          </p>
        ) : (
          sectors.map((sector) => {
            const isActive = activeSector?.id === sector.id;
            
            return (
              <button
                key={sector.id}
                onClick={() => onSelectSector(sector)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded transition-all duration-150 text-sm font-medium",
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
            );
          })
        )}
      </nav>
    </div>
  );
}