import React from 'react';
import { cn } from "@/lib/utils";
import { Folder, Upload, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function DocumentsSidebar({ 
  folders, 
  activeView, 
  onSelectView, 
  onOpenFoldersModal,
  onUploadDocument,
  theme 
}) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';

  return (
    <div className={cn("h-full flex flex-col border-r overflow-y-auto",
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#0D0D0D] border-[#1F1F1F]" : "bg-white border-gray-200")}>
      
      <div className={cn("p-2 space-y-1")}>
        <button
          onClick={() => onSelectView('all')}
          className={cn(
            "w-full text-left px-2 py-1 text-[11px] transition-colors flex items-center gap-2",
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

        {folders.map(folder => (
          <button
            key={folder.id}
            onClick={() => onSelectView(folder.id)}
            className={cn(
              "w-full text-left px-2 py-1 text-[11px] transition-colors flex items-center gap-2",
              activeView === folder.id
                ? (isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                   isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600")
                : (isPastel ? "text-[#D0D2E0] hover:bg-[#42456C]" :
                   isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600 hover:bg-gray-100")
            )}
          >
            <Folder className="w-3 h-3" />
            {folder.name}
          </button>
        ))}
      </div>

      <div className="mt-auto p-2 space-y-1">
        <Button
          onClick={onUploadDocument}
          className={cn("w-full text-[11px] h-7 gap-2",
            isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B] text-white" :
            isDark ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-600 hover:bg-orange-700")}
        >
          <Upload className="w-3 h-3" />
          Upload Document
        </Button>
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
    </div>
  );
}