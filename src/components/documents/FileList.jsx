import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { FileText, Trash2, ChevronDown, MoreVertical, Copy, Scissors, Edit2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FileList({ 
  items, 
  selectedIds, 
  onToggleSelect,
  onDelete,
  onMoveToFolder,
  onRename,
  onCopy,
  onCut,
  folders,
  mode,
  theme,
  viewMode = 'compact'
}) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');

  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-[11px]",
        isPastel ? "text-[#7B7E9C]" :
        isDark ? "text-neutral-600" : "text-gray-500")}>
        No items yet
      </div>
    );
  }

  return (
    <div className={cn("divide-y overflow-y-auto h-full",
      isPastel ? "divide-[#4A4D6C]" :
      isDark ? "divide-[#1F1F1F]" : "divide-gray-200")}>
      {items.map(item => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <div
            key={item.id}
            className={cn(
              "px-3 py-2 flex items-start gap-3 transition-colors",
              isPastel ? "hover:bg-[#42456C]" :
              isDark ? "hover:bg-[#17181b]" : "hover:bg-gray-50",
              isSelected && (isPastel ? "bg-[#42456C]/50" :
                isDark ? "bg-[#17181b]" : "bg-orange-50")
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <FileText className={cn("w-3 h-3 mt-0.5 flex-shrink-0",
                  isPastel ? "text-[#9B9EBC]" :
                  isDark ? "text-neutral-500" : "text-gray-500")} />
                <div className="flex-1 min-w-0">
                  {renamingId === item.id ? (
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onRename(item.id, newName);
                          setRenamingId(null);
                        } else if (e.key === 'Escape') {
                          setRenamingId(null);
                        }
                      }}
                      onBlur={() => setRenamingId(null)}
                      className={cn("h-6 text-[11px]",
                        isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                        isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                      autoFocus
                    />
                  ) : (
                    <div className={cn("text-[11px] font-medium",
                      isPastel ? "text-[#E8E9F0]" :
                      isDark ? "text-neutral-300" : "text-gray-900")}>
                      {item.title}
                    </div>
                  )}
                  {viewMode === 'regular' && item.content && (
                    <p className={cn("text-[10px] mt-0.5 line-clamp-2",
                      isPastel ? "text-[#9B9EBC]" :
                      isDark ? "text-neutral-600" : "text-gray-600")}>
                      {item.content.slice(0, 150)}...
                    </p>
                  )}
                  <div className={cn("text-[9px] mt-0.5",
                    isPastel ? "text-[#7B7E9C]" :
                    isDark ? "text-neutral-700" : "text-gray-500")}>
                    {item.created_date && format(new Date(item.created_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn("p-1 transition-colors",
                      isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" :
                      isDark ? "text-neutral-500 hover:text-neutral-300" : "text-gray-400 hover:text-gray-600")}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={cn(
                  isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
                  isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
                  <DropdownMenuItem onClick={() => {
                    setRenamingId(item.id);
                    setNewName(item.title);
                  }} className={cn(isPastel ? "text-[#D0D2E0]" : isDark ? "text-neutral-300" : "")}>
                    <Edit2 className="w-3 h-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopy(item)} className={cn(isPastel ? "text-[#D0D2E0]" : isDark ? "text-neutral-300" : "")}>
                    <Copy className="w-3 h-3 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCut(item)} className={cn(isPastel ? "text-[#D0D2E0]" : isDark ? "text-neutral-300" : "")}>
                    <Scissors className="w-3 h-3 mr-2" />
                    Cut
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-500">
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {mode === 'documents' && folders && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn("p-1 rounded hover:bg-orange-500/10 transition-all",
                        item.folder_ids?.length > 0
                          ? "text-orange-500"
                          : isPastel
                            ? "text-[#7B7E9C] hover:text-orange-500"
                            : isDark
                              ? "text-neutral-500 hover:text-orange-500"
                              : "text-gray-400 hover:text-orange-500"
                      )}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn("w-56",
                      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
                      isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}
                    align="end"
                  >
                    <div className="space-y-2">
                      <p className={cn("text-xs font-medium",
                        isPastel ? "text-[#E8E9F0]" :
                        isDark ? "text-neutral-300" : "text-gray-700")}>
                        Move to folder:
                      </p>
                      <button
                        onClick={() => onMoveToFolder(item.id, null)}
                        className={cn("w-full text-left px-2 py-1 text-xs transition-colors",
                          isPastel ? "text-white hover:bg-[#42456C]" :
                          isDark ? "text-white hover:bg-neutral-700" : "text-gray-900 hover:bg-gray-100")}
                      >
                        Remove from folders
                      </button>
                      {folders.map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => onMoveToFolder(item.id, folder.id)}
                          className={cn("w-full text-left px-2 py-1 text-xs transition-colors",
                            isPastel ? "text-white hover:bg-[#42456C]" :
                            isDark ? "text-white hover:bg-neutral-700" : "text-gray-900 hover:bg-gray-100")}
                        >
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(item.id)}
                className={cn("w-4 h-4 rounded-sm data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600",
                  isPastel ? "border-[#7B7E9C]" :
                  isDark ? "border-neutral-600" : "border-gray-400")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}