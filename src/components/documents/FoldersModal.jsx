import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Edit2, Trash2, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FoldersModal({ 
  isOpen, 
  onClose, 
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  theme 
}) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName, newFolderParent);
      setNewFolderName('');
      setNewFolderParent(null);
    }
  };

  const handleStartEdit = (folder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const handleSaveEdit = (folderId) => {
    if (editName.trim()) {
      onUpdateFolder(folderId, { name: editName });
      setEditingId(null);
      setEditName('');
    }
  };

  const renderFolderTree = (parentId = null, depth = 0) => {
    const childFolders = folders.filter(f => f.parent_id === parentId);
    
    return childFolders.map(folder => (
      <div key={folder.id}>
        <div className={cn("flex items-center gap-2 py-2",
          isPastel ? "border-b border-[#4A4D6C]" :
          isDark ? "border-b border-neutral-800" : "border-b border-gray-200")}
          style={{ paddingLeft: `${depth * 16}px` }}>
          <Folder className={cn("w-4 h-4",
            isPastel ? "text-[#9B9EBC]" :
            isDark ? "text-neutral-500" : "text-gray-500")} />
          {editingId === folder.id ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(folder.id)}
              className={cn("flex-1 h-7 text-sm",
                isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "")}
              autoFocus
            />
          ) : (
            <span className={cn("flex-1 text-sm",
              isPastel ? "text-[#E8E9F0]" :
              isDark ? "text-white" : "text-gray-900")}>
              {folder.name}
            </span>
          )}
          <div className="flex items-center gap-1">
            {editingId === folder.id ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSaveEdit(folder.id)}
                  className={cn("h-7 px-2 text-xs",
                    isPastel ? "text-[#9B8B6B] hover:bg-[#42456C]" :
                    isDark ? "text-orange-500 hover:bg-neutral-800" : "text-orange-600")}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  className={cn("h-7 px-2 text-xs",
                    isPastel ? "text-[#9B9EBC] hover:bg-[#42456C]" :
                    isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-600")}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStartEdit(folder)}
                  className={cn("h-7 w-7 p-0",
                    isPastel ? "text-[#9B9EBC] hover:bg-[#42456C]" :
                    isDark ? "text-neutral-400 hover:bg-neutral-800" : "text-gray-500")}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteFolder(folder.id)}
                  className={cn("h-7 w-7 p-0",
                    "text-red-500 hover:bg-red-500/10")}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        {renderFolderTree(folder.id, depth + 1)}
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-xl max-h-[80vh]",
        isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
        <DialogHeader>
          <DialogTitle className={cn("text-base",
            isPastel ? "text-white" :
            isDark ? "text-white" : "text-gray-900")}>
            Manage Folders
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Create New Folder */}
          <div className={cn("p-3 border space-y-2",
            isPastel ? "bg-[#32354C] border-[#4A4D6C]" :
            isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50 border-gray-200")}>
            <h4 className={cn("text-sm font-medium",
              isPastel ? "text-[#E8E9F0]" :
              isDark ? "text-white" : "text-gray-900")}>
              Create New Folder
            </h4>
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Folder name"
                className={cn("flex-1 text-sm",
                  isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
              />
              <Select value={newFolderParent || 'none'} onValueChange={(v) => setNewFolderParent(v === 'none' ? null : v)}>
                <SelectTrigger className={cn("w-40 text-sm",
                  isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}>
                  <SelectValue placeholder="Parent folder" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-neutral-800 border-neutral-700" : ""}>
                  <SelectItem value="none">Root Level</SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreate}
                disabled={!newFolderName.trim()}
                className={cn("text-sm",
                  isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" :
                  isDark ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-600")}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Existing Folders */}
          <div className={cn("border overflow-y-auto",
            isPastel ? "border-[#4A4D6C]" :
            isDark ? "border-neutral-800" : "border-gray-200")}
            style={{ maxHeight: '400px' }}>
            {folders.length === 0 ? (
              <div className={cn("text-center py-8 text-sm",
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-600" : "text-gray-500")}>
                No folders yet
              </div>
            ) : (
              renderFolderTree()
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}