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
  const [expandedSectors, setExpandedSectors] = useState(() => {
    const saved = localStorage.getItem('sidebar_tree_expanded');
    if (saved) return JSON.parse(saved);
    // Default: expand all on first load
    const allExpanded = {};
    sectors.forEach(s => {
      if (s.id) allExpanded[s.id] = true;
    });
    return allExpanded;
  });

  React.useEffect(() => {
    localStorage.setItem('sidebar_tree_expanded', JSON.stringify(expandedSectors));
  }, [expandedSectors]);

  // Auto-expand all nodes when sectors load
  React.useEffect(() => {
    if (sectors.length > 0) {
      const allExpanded = {};
      sectors.forEach(s => {
        if (s.id) allExpanded[s.id] = true;
      });
      setExpandedSectors(prev => ({ ...allExpanded, ...prev }));
    }
  }, [sectors]);

  const toggleExpand = (sectorId, e) => {
    e.stopPropagation();
    setExpandedSectors(prev => ({ ...prev, [sectorId]: !prev[sectorId] }));
  };

  // Build hierarchical tree structure
  const getChildren = (parentId = null) => {
    return sectors
      .filter(s => (s.parent_id === parentId) || (parentId === null && !s.parent_id))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getRootNodes = () => {
    return sectors
      .filter(s => !s.parent_id || s.parent_id === null)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Recursive tree node renderer
  const renderTreeNode = (sector, depth = 0) => {
    const children = getChildren(sector.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedSectors[sector.id] === true || expandedSectors[sector.id] === undefined;
    const isActive = activeSector?.id === sector.id;

    return (
      <div key={sector.id}>
        <div className="flex items-center">
          {hasChildren && (
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
              !hasChildren && "ml-4",
              isActive && currentPage === 'IntelligenceFeed'
                ? "bg-orange-500/10 text-orange-500"
                : isPastel
                  ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
                  : isDark
                    ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {sector.name}
          </Link>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
            No levels yet
          </p>
        ) : (
          getRootNodes().map(sector => renderTreeNode(sector, 0))
        )}
      </nav>
      

    </div>
  );
}