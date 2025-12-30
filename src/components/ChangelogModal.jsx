import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangelogModal({ isOpen, onClose, theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: ''
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['changelogEntries'],
    queryFn: () => base44.entities.ChangelogEntry.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChangelogEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelogEntries'] });
      setIsAdding(false);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: ''
      });
      toast.success('Entry added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChangelogEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelogEntries'] });
      toast.success('Entry deleted');
    },
  });

  const handleAdd = () => {
    if (!newEntry.title.trim() || !newEntry.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createMutation.mutate(newEntry);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl max-h-[80vh]", 
        isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
        <DialogHeader>
          <DialogTitle className={cn("text-lg font-semibold flex items-center justify-between", 
            isPastel ? "text-white" :
            isDark ? "text-white" : "text-gray-900")}>
            Changelog
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              className="h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Entry
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {isAdding && (
            <div className={cn("p-3 border space-y-2",
              isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
              isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50 border-gray-200")}>
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className={cn("h-8 text-sm",
                  isPastel ? "bg-[#3A3D5C] border-[#4A4D6C] text-white" :
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
              />
              <Input
                placeholder="Short title"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                className={cn("h-8 text-sm",
                  isPastel ? "bg-[#3A3D5C] border-[#4A4D6C] text-white" :
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
              />
              <Textarea
                placeholder="One-line description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                className={cn("text-sm",
                  isPastel ? "bg-[#3A3D5C] border-[#4A4D6C] text-white" :
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} className="flex-1">
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div className={cn("text-center py-8 text-sm",
              isPastel ? "text-[#9B9EBC]" :
              isDark ? "text-neutral-500" : "text-gray-500")}>
              No changelog entries yet
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className={cn("p-3 border",
                isPastel ? "bg-[#4A4D6C] border-[#5A5D7C]" :
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50 border-gray-200")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-medium",
                        isPastel ? "text-[#9B8B6B]" :
                        isDark ? "text-orange-400" : "text-orange-600")}>
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className={cn("text-sm font-semibold",
                        isPastel ? "text-white" :
                        isDark ? "text-white" : "text-gray-900")}>
                        {entry.title}
                      </span>
                    </div>
                    <p className={cn("text-xs mt-1",
                      isPastel ? "text-[#D0D2E0]" :
                      isDark ? "text-neutral-400" : "text-gray-600")}>
                      {entry.description}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(entry.id)}
                    className={cn("ml-2 p-1 hover:bg-red-500/10 transition-colors",
                      isPastel ? "text-[#9B9EBC] hover:text-red-400" :
                      isDark ? "text-neutral-500 hover:text-red-400" : "text-gray-400 hover:text-red-500")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}