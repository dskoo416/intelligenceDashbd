import React from 'react';
import { cn } from "@/lib/utils";
import { 
  Building2, Cpu, HeartPulse, Landmark, ShoppingCart, 
  Zap, Plane, Factory, Leaf, Wifi, ChevronRight
} from 'lucide-react';

const iconMap = {
  Building2, Cpu, HeartPulse, Landmark, ShoppingCart,
  Zap, Plane, Factory, Leaf, Wifi
};

export default function SectorSidebar({ sectors, activeSector, onSelectSector, isLoading }) {
  const getIcon = (iconName) => {
    const Icon = iconMap[iconName] || Building2;
    return Icon;
  };

  if (isLoading) {
    return (
      <div className="h-full bg-slate-950 border-r border-slate-800/50 p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 border-r border-slate-800/50 flex flex-col">
      <div className="p-4 border-b border-slate-800/50">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sectors</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {sectors.length === 0 ? (
          <p className="text-slate-500 text-sm p-3 text-center">
            No sectors yet. Add sectors in settings.
          </p>
        ) : (
          sectors.map((sector) => {
            const Icon = getIcon(sector.icon);
            const isActive = activeSector?.id === sector.id;
            
            return (
              <button
                key={sector.id}
                onClick={() => onSelectSector(sector)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-white border border-blue-500/30" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-blue-500/20 text-blue-400" 
                    : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left text-sm font-medium truncate">
                  {sector.name}
                </span>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-all",
                  isActive ? "opacity-100 text-blue-400" : "opacity-0 group-hover:opacity-50"
                )} />
              </button>
            );
          })
        )}
      </nav>
    </div>
  );
}