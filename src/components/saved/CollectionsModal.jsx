import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CollectionsModal({ isOpen, onClose, collections, onSaveCollection, onDeleteCollection, onReorderCollections }) {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollection, setEditingCollection] = useState(null);

  const handleSave = async () => {
    if (editingCollection) {
      await onSaveCollection(editingCollection);
      setEditingCollection(null);
    } else if (newCollectionName.trim()) {
      await onSaveCollection({ name: newCollectionName.trim() });
      setNewCollectionName('');
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    onReorderCollections(index, index - 1);
  };

  const handleMoveDown = (index) => {
    if (index === collections.length - 1) return;
    onReorderCollections(index, index + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-neutral-900 border-neutral-800 text-white rounded">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Manage Collections</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-neutral-800/50 rounded space-y-3">
            <h4 className="font-medium text-xs text-neutral-300">
              {editingCollection ? 'Edit Collection' : 'Add New Collection'}
            </h4>
            <div>
              <Label className="text-neutral-400 text-xs">Collection Name</Label>
              <Input
                value={editingCollection ? editingCollection.name : newCollectionName}
                onChange={(e) => editingCollection 
                  ? setEditingCollection({ ...editingCollection, name: e.target.value })
                  : setNewCollectionName(e.target.value)
                }
                placeholder="e.g., Important Articles"
                className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-neutral-700 hover:bg-neutral-600 rounded text-xs">
                {editingCollection ? 'Update' : 'Add'} Collection
              </Button>
              {editingCollection && (
                <Button variant="ghost" size="sm" onClick={() => setEditingCollection(null)} className="text-xs">
                  Cancel
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <h4 className="font-medium text-xs text-neutral-400 mb-2">Existing Collections</h4>
            {collections.length === 0 ? (
              <p className="text-neutral-500 text-sm p-4 text-center">No collections yet.</p>
            ) : (
              collections.map((collection, index) => (
                <div key={collection.id} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button 
                        onClick={() => handleMoveUp(index)} 
                        disabled={index === 0}
                        className={cn("p-0.5", index === 0 ? "text-neutral-700" : "text-neutral-500 hover:text-white")}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleMoveDown(index)} 
                        disabled={index === collections.length - 1}
                        className={cn("p-0.5", index === collections.length - 1 ? "text-neutral-700" : "text-neutral-500 hover:text-white")}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm text-white">{collection.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingCollection(collection)} className="text-xs h-7 text-neutral-300">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 text-xs h-7" onClick={() => onDeleteCollection(collection.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}