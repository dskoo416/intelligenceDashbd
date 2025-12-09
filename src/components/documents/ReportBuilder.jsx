import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { X, FileText, Check, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactQuill from 'react-quill';
import { toast } from 'sonner';

export default function ReportBuilder({ 
  selectedItems,
  onRemoveItem,
  onGenerateReport,
  reportContent,
  onReportChange,
  theme,
  isGenerating
}) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [instructions, setInstructions] = useState('');
  const [reportFormatIds, setReportFormatIds] = useState([]);

  const reportFormatItems = selectedItems.filter(item => reportFormatIds.includes(item.id));

  const handleDownload = () => {
    if (!reportContent) {
      toast.error('No report to download');
      return;
    }
    
    const blob = new Blob([reportContent.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Selected Items */}
      <div className={cn("p-3 border-b",
        isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
        isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2",
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          Selected Items ({selectedItems.length})
        </h3>
        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
          {selectedItems.map(item => {
            const isReportFormat = reportFormatIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  setReportFormatIds(prev => 
                    prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                  );
                }}
                className={cn("flex items-center gap-1 px-2 py-1 text-[10px] border cursor-pointer transition-colors",
                  isReportFormat
                    ? (isPastel ? "bg-[#9B8B6B] border-[#9B8B6B] text-white" :
                       isDark ? "bg-orange-600 border-orange-600 text-white" : "bg-orange-600 border-orange-600 text-white")
                    : (isPastel ? "bg-[#42456C] border-[#4A4D6C] text-[#D0D2E0] hover:border-[#9B8B6B]" :
                       isDark ? "bg-[#1A1A1A] border-[#262629] text-neutral-400 hover:border-orange-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:border-orange-600")
                )}
              >
                {isReportFormat && <Check className="w-3 h-3" />}
                <FileText className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{item.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                    setReportFormatIds(prev => prev.filter(id => id !== item.id));
                  }}
                  className={cn("hover:opacity-70",
                    isReportFormat ? "text-white" :
                    isPastel ? "text-[#9B8B6B]" :
                    isDark ? "text-orange-500" : "text-orange-600")}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Format */}
      <div className={cn("p-3 border-b",
        isPastel ? "bg-[#32354C] border-[#4A4D6C]" :
        isDark ? "bg-[#0f0f10] border-[#262629]" : "bg-gray-50 border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2",
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          Report Format
        </h3>
        <div className={cn("p-2 text-[10px] h-24 overflow-y-auto border",
          isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-[#9B9EBC]" :
          isDark ? "bg-[#0A0A0A] border-[#1F1F1F] text-neutral-400" : "bg-white border-gray-300 text-gray-600")}>
          {reportFormatItems.length > 0 ? (
            <div className="space-y-1">
              {reportFormatItems.map(item => (
                <div key={item.id} className="flex items-center gap-1">
                  <Check className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn("text-center py-4",
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-700" : "text-gray-500")}>
              Click selected items above to use as format
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className={cn("p-3 border-b",
        isPastel ? "bg-[#32354C] border-[#4A4D6C]" :
        isDark ? "bg-[#0f0f10] border-[#262629]" : "bg-gray-50 border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2",
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          Instructions
        </h3>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter report instructions..."
          className={cn("h-20 text-[10px]",
            isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-[#D0D2E0]" :
            isDark ? "bg-[#0A0A0A] border-[#1F1F1F] text-neutral-300" : "bg-white")}
        />
        <div className="flex gap-2 mt-2">
          <Button
            onClick={() => onGenerateReport(instructions, reportFormatItems)}
            disabled={selectedItems.length === 0 || isGenerating}
            className={cn("flex-1 text-[11px] h-7",
              isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" :
              isDark ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-600 hover:bg-orange-700")}
          >
            {isGenerating ? 'Generating...' : 'Create Report'}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!reportContent}
            variant="outline"
            className={cn("text-[11px] h-7 px-3",
              isPastel ? "border-[#4A4D6C] text-[#A5A8C0] hover:bg-[#42456C]" :
              isDark ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800" : "")}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Report Output */}
      <div className={cn("p-3 border-t flex-1 flex flex-col",
        isPastel ? "bg-[#32354C] border-[#4A4D6C]" :
        isDark ? "bg-[#0f0f10] border-[#262629]" : "bg-gray-50 border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2",
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          Generated Report
        </h3>
        <Textarea
          value={reportContent}
          onChange={(e) => onReportChange(e.target.value)}
          placeholder="Generated report will appear here..."
          className={cn("flex-1 text-[10px] font-mono resize-none",
            isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-[#D0D2E0]" :
            isDark ? "bg-[#0A0A0A] border-[#1F1F1F] text-neutral-300" : "bg-white")}
        />
      </div>
    </div>
  );
}