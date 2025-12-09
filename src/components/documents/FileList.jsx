import React from 'react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { FileText, Trash2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

export default function FileList({ 
  items, 
  selectedIds, 
  onToggleSelect,
  onDelete,
  theme,
  viewMode = 'compact'
}) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';

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
                  <div className={cn("text-[11px] font-medium",
                    isPastel ? "text-[#E8E9F0]" :
                    isDark ? "text-neutral-300" : "text-gray-900")}>
                    {item.title}
                  </div>
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
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(item.id)}
                className={cn("w-4 h-4",
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