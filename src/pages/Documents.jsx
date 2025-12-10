import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import DocumentsSidebar from '@/components/documents/DocumentsSidebar';
import SavedSidebar from '@/components/saved/SavedSidebar';
import FileList from '@/components/documents/FileList';
import ReportBuilder from '@/components/documents/ReportBuilder';
import FoldersModal from '@/components/documents/FoldersModal';

export default function Documents() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('documents'); // 'documents' or 'saved'
  const [activeView, setActiveView] = useState('main');
  const [selectedIds, setSelectedIds] = useState([]);
  const [foldersModalOpen, setFoldersModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [clipboard, setClipboard] = useState(null);

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



  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parent_id }) => {
      const maxOrder = Math.max(0, ...folders.map(f => f.order || 0));
      return base44.entities.Folder.create({ name, parent_id, order: maxOrder + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder created');
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Folder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder updated');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => base44.entities.Folder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder deleted');
    },
  });

  const handleUpload = (folderId = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
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

        await base44.entities.Document.create({
          title: file.name,
          file_url: file_url,
          file_type: file.type,
          folder_ids: folderId ? [folderId] : [],
          content: content
        });
        
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        toast.success('Document uploaded');
      }
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

  const handleGenerateReport = async (instructions, reportFormatItems) => {
    if (selectedIds.length === 0) return;
    
    setIsGenerating(true);
    
    // Get all selected items from both documents and saved articles
    const selectedDocs = documents.filter(d => selectedIds.includes(d.id));
    const selectedSaved = savedArticles.filter(a => selectedIds.includes(a.id));

    const contentSummary = [
      ...selectedDocs.map(doc => `Document: ${doc.title}\n${doc.content || ''}`),
      ...selectedSaved.map(article => `Article: ${article.title}\n${article.description || ''}`)
    ].join('\n\n');

    const formatText = reportFormatItems && reportFormatItems.length > 0
      ? reportFormatItems.map(item => item.content || item.description || '').join('\n\n')
      : `# Report Title

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

Follow this exact format structure:
${formatText}

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

  const handleMoveToFolder = async (documentId, folderId) => {
    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;
    
    const newFolderIds = folderId ? [folderId] : [];
    await base44.entities.Document.update(documentId, { folder_ids: newFolderIds });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    toast.success('Document moved');
  };

  const handleRename = async (documentId, newName) => {
    await base44.entities.Document.update(documentId, { title: newName });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    toast.success('Renamed');
  };

  const handleCopy = (item) => {
    setClipboard({ action: 'copy', item });
    toast.success('Copied');
  };

  const handleCut = (item) => {
    setClipboard({ action: 'cut', item });
    toast.success('Cut');
  };

  const handleDelete = async (documentId) => {
    await base44.entities.Document.delete(documentId);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    toast.success('Deleted');
  };

  const filteredItems = mode === 'documents'
    ? (activeView === 'main' 
        ? documents 
        : documents.filter(d => d.folder_ids?.includes(activeView)))
    : (() => {
        if (activeView === 'main') return savedArticles;
        
        // Check if it's a collection ID
        const collection = collections.find(c => c.id === activeView);
        if (collection) {
          return savedArticles.filter(a => a.collection_ids?.includes(activeView));
        }
        
        // Otherwise it's a month string
        return savedArticles.filter(article => {
          if (!article.created_date) return false;
          const monthKey = new Date(article.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          return monthKey === activeView;
        });
      })();

  // Combine selected items from both documents and saved articles
  const selectedItems = [
    ...documents.filter(d => selectedIds.includes(d.id)),
    ...savedArticles.filter(a => selectedIds.includes(a.id))
  ];

  const textSize = localStorage.getItem('textSize') || 'medium';

  return (
    <main className={cn(
      "flex-1 overflow-hidden flex flex-col text-content",
      `text-${textSize}`,
      isPastel ? "bg-[#2B2D42]" :
      isDark ? "bg-neutral-950" : "bg-gray-50"
    )}>
      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-[208px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left Sidebar */}
        <div className="overflow-hidden">
          <DocumentsSidebar
            mode={mode}
            onModeChange={(newMode) => { setMode(newMode); setActiveView('main'); }}
            folders={folders}
            activeView={activeView}
            onSelectView={setActiveView}
            onOpenFoldersModal={() => setFoldersModalOpen(true)}
            onUploadDocument={handleUpload}
            collections={collections}
            savedArticles={savedArticles}
            theme={settings.theme}
          />
        </div>

        {/* Center File List */}
        <div className={cn("overflow-hidden border-r",
          isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
          isDark ? "bg-neutral-950 border-[#1F1F1F]" : "bg-white border-gray-200")}>
          <FileList
            items={filteredItems}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onMoveToFolder={handleMoveToFolder}
            onRename={handleRename}
            onCopy={handleCopy}
            onCut={handleCut}
            onDelete={handleDelete}
            folders={folders}
            mode={mode}
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
      <FoldersModal
        isOpen={foldersModalOpen}
        onClose={() => setFoldersModalOpen(false)}
        folders={folders}
        onCreateFolder={(name, parent_id) => createFolderMutation.mutate({ name, parent_id })}
        onUpdateFolder={(id, data) => updateFolderMutation.mutate({ id, data })}
        onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
        theme={settings.theme}
      />
    </main>
  );
}