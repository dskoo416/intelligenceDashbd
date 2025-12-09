import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Folder, Upload, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DocumentsSidebar({ 
  mode,
  onModeChange,
  folders, 
  activeView, 
  onSelectView, 
  onOpenFoldersModal,
  onUploadDocument,
  collections,
  savedArticles,
  theme 
}) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleUploadToFolder = (folderId) => {
    onUploadDocument(folderId);
  };

  const rootFolders = folders.filter(f => !f.parent_id);
  const getChildFolders = (parentId) => folders.filter(f => f.parent_id === parentId);

  const renderFolder = (folder, depth = 0) => {
    const hasChildren = getChildFolders(folder.id).length > 0;
    const isExpanded = expandedFolders[folder.id];
    
    return (
      <div key={folder.id}>
        <div className="flex items-center">
          <button
            onClick={() => hasChildren && toggleFolder(folder.id)}
            className={cn("flex-shrink-0 p-1", !hasChildren && "invisible")}
          >
            {isExpanded ? (
              <ChevronDown className={cn("w-3 h-3",
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-500" : "text-gray-500")} />
            ) : (
              <ChevronRight className={cn("w-3 h-3",
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-500" : "text-gray-500")} />
            )}
          </button>
          <button
            onClick={() => onSelectView(folder.id)}
            className={cn(
              "flex-1 text-left px-2 py-1 text-[11px] transition-colors flex items-center gap-2",
              activeView === folder.id
                ? (isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                   isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600")
                : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C]" :
                   isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600 hover:bg-gray-100")
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <Folder className="w-3 h-3" />
            {folder.name}
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {getChildFolders(folder.id).map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Group saved articles by month
  const articlesByMonth = {};
  savedArticles.forEach(article => {
    if (article.created_date) {
      const monthKey = new Date(article.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!articlesByMonth[monthKey]) articlesByMonth[monthKey] = [];
      articlesByMonth[monthKey].push(article);
    }
  });

  return (
    <div className={cn("h-full flex flex-col border-r overflow-y-auto",
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#0D0D0D] border-[#1F1F1F]" : "bg-white border-gray-200")}>
      
      {/* Mode Switch */}
      <div className={cn("p-2 border-b flex gap-1",
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#1F1F1F]" : "border-gray-200")}>
        <button
          onClick={() => onModeChange('documents')}
          className={cn("flex-1 px-2 py-1 text-[11px] font-medium transition-colors border",
            mode === 'documents'
              ? (isPastel ? "bg-[#9B8B6B] text-white border-[#9B8B6B]" :
                 isDark ? "bg-orange-600 text-white border-orange-600" : "bg-orange-600 text-white border-orange-600")
              : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C] border-[#4A4D6C]" :
                 isDark ? "text-neutral-400 hover:bg-neutral-800 border-neutral-700" : "text-gray-600 hover:bg-gray-100 border-gray-300")
          )}
        >
          My Documents
        </button>
        <button
          onClick={() => onModeChange('saved')}
          className={cn("flex-1 px-2 py-1 text-[11px] font-medium transition-colors border",
            mode === 'saved'
              ? (isPastel ? "bg-[#9B8B6B] text-white border-[#9B8B6B]" :
                 isDark ? "bg-orange-600 text-white border-orange-600" : "bg-orange-600 text-white border-orange-600")
              : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C] border-[#4A4D6C]" :
                 isDark ? "text-neutral-400 hover:bg-neutral-800 border-neutral-700" : "text-gray-600 hover:bg-gray-100 border-gray-300")
          )}
        >
          Saved
        </button>
      </div>

      {/* Content based on mode */}
      {mode === 'documents' ? (
        <>
          <div className={cn("p-2 space-y-1 flex-1 overflow-y-auto")}>
            <button
              onClick={() => onSelectView('all')}
              className={cn(
                "w-full text-left px-2 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors flex items-center gap-2",
                activeView === 'all'
                  ? (isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                     isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600")
                  : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C]" :
                     isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600 hover:bg-gray-100")
              )}
            >
              <Folder className="w-3 h-3" />
              All
            </button>

            {rootFolders.map(folder => renderFolder(folder))}
          </div>

          <div className="p-2 space-y-1 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={cn("w-full text-[11px] h-7 gap-2 justify-between",
                    isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B] text-white" :
                    isDark ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-600 hover:bg-orange-700")}
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-3 h-3" />
                    Upload Document
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn(
                isDark ? "bg-neutral-800 border-neutral-700" : "")}>
                <DropdownMenuItem onClick={() => handleUploadToFolder(null)}>
                  All Documents
                </DropdownMenuItem>
                {rootFolders.map(folder => (
                  <DropdownMenuItem key={folder.id} onClick={() => handleUploadToFolder(folder.id)}>
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={onOpenFoldersModal}
              variant="ghost"
              className={cn("w-full text-[11px] h-7 gap-2",
                isPastel ? "text-[#A5A8C0] hover:bg-[#42456C]" :
                isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600 hover:bg-gray-100")}
            >
              <Settings className="w-3 h-3" />
              Edit Folders
            </Button>
          </div>
        </>
      ) : (
        <div className={cn("p-2 space-y-1 flex-1 overflow-y-auto")}>
          <button
            onClick={() => onSelectView('all')}
            className={cn(
              "w-full text-left px-2 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors flex items-center gap-2",
              activeView === 'all'
                ? (isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                   isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600")
                : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C]" :
                   isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600 hover:bg-gray-100")
            )}
          >
            All
          </button>

          {Object.keys(articlesByMonth).length > 0 && (
            <>
              <div className={cn("px-2 py-1 text-[9px] uppercase tracking-wider font-semibold",
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-600" : "text-gray-500")}>
                By Month
              </div>
              {Object.entries(articlesByMonth).map(([month, articles]) => (
                <button
                  key={month}
                  onClick={() => onSelectView(month)}
                  className={cn(
                    "w-full text-left px-2 py-1 text-[11px] transition-colors",
                    activeView === month
                      ? (isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                         isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600")
                      : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C]" :
                         isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600 hover:bg-gray-100")
                  )}
                >
                  {month} ({articles.length})
                </button>
              ))}
            </>
          )}

          {collections.length > 0 && (
            <>
              <div className={cn("px-2 py-1 text-[9px] uppercase tracking-wider font-semibold",
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-600" : "text-gray-500")}>
                Collections
              </div>
              {collections.map(collection => (
                <button
                  key={collection.id}
                  onClick={() => onSelectView(collection.id)}
                  className={cn(
                    "w-full text-left px-2 py-1 text-[11px] transition-colors",
                    activeView === collection.id
                      ? (isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                         isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600")
                      : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C]" :
                         isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600 hover:bg-gray-100")
                  )}
                >
                  {collection.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}