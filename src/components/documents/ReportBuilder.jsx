import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { X, FileText, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactQuill from 'react-quill';

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
  const [reportFormatId, setReportFormatId] = useState(null);

  const reportFormatItem = selectedItems.find(item => item.id === reportFormatId);

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
            const isReportFormat = item.id === reportFormatId;
            return (
              <div
                key={item.id}
                onClick={() => setReportFormatId(item.id)}
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
                    if (reportFormatId === item.id) setReportFormatId(null);
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
        <div className={cn("p-2 text-[9px] h-24 overflow-y-auto border font-mono",
          isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-[#9B9EBC]" :
          isDark ? "bg-[#0A0A0A] border-[#1F1F1F] text-neutral-600" : "bg-white border-gray-300 text-gray-600")}>
          {reportFormatItem ? (
            <pre className="whitespace-pre-wrap">{reportFormatItem.content || reportFormatItem.description || 'No content available'}</pre>
          ) : (
            <div className={cn("text-center py-4",
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-700" : "text-gray-500")}>
              Click a selected item above to use as format
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
        <Button
          onClick={() => onGenerateReport(instructions, reportFormatItem)}
          disabled={selectedItems.length === 0 || isGenerating}
          className={cn("w-full mt-2 text-[11px] h-7",
            isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" :
            isDark ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-600 hover:bg-orange-700")}
        >
          {isGenerating ? 'Generating...' : 'Create Report'}
        </Button>
      </div>

      {/* Text Editor */}
      <div className="flex-1 overflow-hidden">
        <ReactQuill
          value={reportContent}
          onChange={onReportChange}
          theme="snow"
          className={cn("h-full",
            isDark && "quill-dark")}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['clean']
            ]
          }}
        />
      </div>
    </div>
  );
}