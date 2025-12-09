import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import DocumentsSidebar from '@/components/documents/DocumentsSidebar';
import SavedSidebar from '@/components/saved/SavedSidebar';
import FileList from '@/components/documents/FileList';
import ReportBuilder from '@/components/documents/ReportBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Documents() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('documents'); // 'documents' or 'saved'
  const [activeView, setActiveView] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [foldersModalOpen, setFoldersModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || { theme: 'dark' };
  const isDark = settings.theme === 'dark';
  const isPastel = settings.theme === 'pastel';
  const viewMode = localStorage.getItem('newsViewMode') || 'compact';

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list('order'),
  });

  const { data: savedArticles = [] } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list('-created_date'),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => base44.entities.Collection.list('order'),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Extract text content using LLM
      let content = '';
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Extract all text content from this document. Return only the text, no commentary.',
          file_urls: [file_url]
        });
        content = result;
      } catch (error) {
        console.error('Content extraction failed:', error);
      }

      return base44.entities.Document.create({
        title: file.name,
        file_url: file_url,
        file_type: file.type,
        folder_ids: [],
        content: content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded');
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name) => {
      const maxOrder = Math.max(0, ...folders.map(f => f.order || 0));
      return base44.entities.Folder.create({ name, order: maxOrder + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setNewFolderName('');
      toast.success('Folder created');
    },
  });

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) uploadDocumentMutation.mutate(file);
    };
    input.click();
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRemoveSelected = (id) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleGenerateReport = async (instructions) => {
    if (selectedIds.length === 0) return;
    
    setIsGenerating(true);
    
    const items = mode === 'documents' 
      ? documents.filter(d => selectedIds.includes(d.id))
      : savedArticles.filter(a => selectedIds.includes(a.id));

    const contentSummary = items.map(item => {
      if (mode === 'documents') {
        return `Document: ${item.title}\n${item.content || ''}`;
      } else {
        return `Article: ${item.title}\n${item.description || ''}`;
      }
    }).join('\n\n');

    const exampleFormat = `# Report Title

## Executive Summary
[Brief overview of key findings]

## Key Insights
- Point 1
- Point 2
- Point 3

## Detailed Analysis
[In-depth analysis based on documents]

## Conclusion
[Summary and recommendations]`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive report based on the following content.

User Instructions: ${instructions || 'Create a detailed summary report'}

Follow this exact format:
${exampleFormat}

Content to analyze:
${contentSummary}

Generate the report now:`,
      });

      setReportContent(result);
      toast.success('Report generated');
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report');
    }
    
    setIsGenerating(false);
  };

  const filteredItems = mode === 'documents'
    ? (activeView === 'all' 
        ? documents 
        : documents.filter(d => d.folder_ids?.includes(activeView)))
    : (activeView === 'all'
        ? savedArticles
        : savedArticles.filter(a => a.collection_ids?.includes(activeView)));

  const selectedItems = mode === 'documents'
    ? documents.filter(d => selectedIds.includes(d.id))
    : savedArticles.filter(a => selectedIds.includes(a.id));

  const textSize = localStorage.getItem('textSize') || 'medium';

  return (
    <main className={cn(
      "flex-1 overflow-hidden flex flex-col text-content",
      `text-${textSize}`,
      isPastel ? "bg-[#2B2D42]" :
      isDark ? "bg-neutral-950" : "bg-gray-50"
    )}>
      {/* Mode Switch */}
      <div className={cn("px-4 py-2 border-b flex items-center gap-2",
        isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
        isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
        <button
          onClick={() => { setMode('documents'); setActiveView('all'); setSelectedIds([]); }}
          className={cn("px-3 py-1 text-[11px] font-medium transition-colors border",
            mode === 'documents'
              ? (isPastel ? "bg-[#9B8B6B] text-white border-[#9B8B6B]" :
                 isDark ? "bg-orange-600 text-white border-orange-600" : "bg-orange-600 text-white border-orange-600")
              : (isPastel ? "bg-transparent text-[#A5A8C0] border-[#4A4D6C] hover:bg-[#42456C]" :
                 isDark ? "bg-transparent text-neutral-400 border-neutral-700 hover:bg-neutral-800" : "bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100")
          )}
        >
          My Documents
        </button>
        <button
          onClick={() => { setMode('saved'); setActiveView('all'); setSelectedIds([]); }}
          className={cn("px-3 py-1 text-[11px] font-medium transition-colors border",
            mode === 'saved'
              ? (isPastel ? "bg-[#9B8B6B] text-white border-[#9B8B6B]" :
                 isDark ? "bg-orange-600 text-white border-orange-600" : "bg-orange-600 text-white border-orange-600")
              : (isPastel ? "bg-transparent text-[#A5A8C0] border-[#4A4D6C] hover:bg-[#42456C]" :
                 isDark ? "bg-transparent text-neutral-400 border-neutral-700 hover:bg-neutral-800" : "bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100")
          )}
        >
          Saved
        </button>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-[208px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left Sidebar */}
        <div className="overflow-hidden">
          {mode === 'documents' ? (
            <DocumentsSidebar
              folders={folders}
              activeView={activeView}
              onSelectView={setActiveView}
              onOpenFoldersModal={() => setFoldersModalOpen(true)}
              onUploadDocument={handleUpload}
              theme={settings.theme}
            />
          ) : (
            <SavedSidebar
              savedArticles={savedArticles}
              collections={collections}
              activeView={activeView}
              onSelectView={setActiveView}
              onOpenCollectionsModal={() => {}}
              theme={settings.theme}
            />
          )}
        </div>

        {/* Center File List */}
        <div className={cn("overflow-hidden border-r",
          isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
          isDark ? "bg-neutral-950 border-[#1F1F1F]" : "bg-white border-gray-200")}>
          <FileList
            items={filteredItems}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            theme={settings.theme}
            viewMode={viewMode}
          />
        </div>

        {/* Right Report Builder */}
        <div className={cn("overflow-hidden",
          isPastel ? "bg-[#2B2D42]" :
          isDark ? "bg-neutral-950" : "bg-white")}>
          <ReportBuilder
            selectedItems={selectedItems}
            onRemoveItem={handleRemoveSelected}
            onGenerateReport={handleGenerateReport}
            reportContent={reportContent}
            onReportChange={setReportContent}
            theme={settings.theme}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Folders Modal */}
      <Dialog open={foldersModalOpen} onOpenChange={setFoldersModalOpen}>
        <DialogContent className={cn("max-w-md",
          isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
          isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={cn(
              isPastel ? "text-white" :
              isDark ? "text-white" : "text-gray-900")}>
              Manage Folders
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className={cn(
                  isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                  isDark ? "bg-neutral-800 border-neutral-700 text-white" : "")}
              />
              <Button
                onClick={() => createFolderMutation.mutate(newFolderName)}
                disabled={!newFolderName}
                className={cn(
                  isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" :
                  isDark ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-600")}
              >
                Add
              </Button>
            </div>
            <div className={cn("divide-y max-h-60 overflow-y-auto",
              isPastel ? "divide-[#4A4D6C]" :
              isDark ? "divide-neutral-800" : "divide-gray-200")}>
              {folders.map(folder => (
                <div key={folder.id} className="py-2 text-sm">
                  {folder.name}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}