import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  sectors, 
  rssSources,
  onUpdateSettings,
  onSaveSector,
  onDeleteSector,
  onSaveRSSSource,
  onDeleteRSSSource,
  onUpdateRSSSource
}) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [editingSector, setEditingSector] = useState(null);
  const [newSector, setNewSector] = useState({ name: '', keywords: [] });
  const [newKeyword, setNewKeyword] = useState('');
  const [newRSSSource, setNewRSSSource] = useState({ name: '', url: '', sector_id: '' });
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      const target = editingSector || newSector;
      const setter = editingSector ? setEditingSector : setNewSector;
      setter({
        ...target,
        keywords: [...(target.keywords || []), newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index, isEditing) => {
    const target = isEditing ? editingSector : newSector;
    const setter = isEditing ? setEditingSector : setNewSector;
    setter({
      ...target,
      keywords: target.keywords.filter((_, i) => i !== index)
    });
  };

  const handleSaveSector = async () => {
    if (editingSector) {
      await onSaveSector(editingSector);
      setEditingSector(null);
    } else if (newSector.name) {
      await onSaveSector(newSector);
      setNewSector({ name: '', keywords: [] });
    }
  };

  const handleSaveRSSSource = async () => {
    if (newRSSSource.name && newRSSSource.url && newRSSSource.sector_id) {
      await onSaveRSSSource(newRSSSource);
      setNewRSSSource({ name: '', url: '', sector_id: '' });
    }
  };

  const handleRSSCategoryChange = async (sourceId, newSectorId) => {
    await onUpdateRSSSource(sourceId, { sector_id: newSectorId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-neutral-900 border-neutral-800 text-white rounded">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-4 bg-neutral-800/50 rounded">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-neutral-700 rounded text-xs">Appearance</TabsTrigger>
            <TabsTrigger value="sectors" className="data-[state=active]:bg-neutral-700 rounded text-xs">Sectors</TabsTrigger>
            <TabsTrigger value="rss" className="data-[state=active]:bg-neutral-700 rounded text-xs">RSS Sources</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-neutral-700 rounded text-xs">AI Settings</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 overflow-y-auto max-h-[55vh] pr-2">
            <TabsContent value="appearance" className="space-y-6 mt-0">
              <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded">
                <div>
                  <p className="font-medium text-sm">Theme</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Toggle dark/light mode</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs", localSettings?.theme === 'light' ? "text-white" : "text-neutral-500")}>Light</span>
                  <Switch
                    checked={localSettings?.theme === 'dark'}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...localSettings, theme: checked ? 'dark' : 'light' };
                      setLocalSettings(newSettings);
                      onUpdateSettings(newSettings);
                    }}
                  />
                  <span className={cn("text-xs", localSettings?.theme === 'dark' ? "text-white" : "text-neutral-500")}>Dark</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sectors" className="space-y-4 mt-0">
              <div className="p-4 bg-neutral-800/50 rounded space-y-4">
                <h4 className="font-medium text-xs text-neutral-300">
                  {editingSector ? 'Edit Sector' : 'Add New Sector'}
                </h4>
                <div>
                  <Label className="text-neutral-400 text-xs">Name</Label>
                  <Input
                    value={editingSector?.name || newSector.name}
                    onChange={(e) => editingSector 
                      ? setEditingSector({ ...editingSector, name: e.target.value })
                      : setNewSector({ ...newSector, name: e.target.value })
                    }
                    placeholder="e.g., Technology"
                    className="mt-1 bg-neutral-900 border-neutral-700 rounded"
                  />
                </div>
                <div>
                  <Label className="text-neutral-400 text-xs">Keywords (for critical articles)</Label>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Press Enter to add keyword"
                    className="mt-1 bg-neutral-900 border-neutral-700 rounded"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editingSector?.keywords || newSector.keywords || []).map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-neutral-700 text-neutral-300 rounded">
                        {kw}
                        <button onClick={() => handleRemoveKeyword(idx, !!editingSector)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSector} size="sm" className="bg-neutral-700 hover:bg-neutral-600 rounded text-xs">
                    {editingSector ? 'Update' : 'Add'} Sector
                  </Button>
                  {editingSector && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingSector(null)} className="text-xs">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium text-xs text-neutral-400 mb-2">Existing Sectors</h4>
                {sectors.map((sector) => (
                  <div key={sector.id} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{sector.name}</span>
                      {sector.keywords?.length > 0 && (
                        <span className="text-xs text-neutral-500">
                          ({sector.keywords.length} keywords)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingSector(sector)} className="text-xs h-7">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 text-xs h-7" onClick={() => onDeleteSector(sector.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="rss" className="space-y-4 mt-0">
              <div className="p-4 bg-neutral-800/50 rounded space-y-4">
                <h4 className="font-medium text-xs text-neutral-300">Add RSS Source</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-neutral-400 text-xs">Source Name</Label>
                    <Input
                      value={newRSSSource.name}
                      onChange={(e) => setNewRSSSource({ ...newRSSSource, name: e.target.value })}
                      placeholder="e.g., TechCrunch"
                      className="mt-1 bg-neutral-900 border-neutral-700 rounded"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs">RSS Feed URL</Label>
                    <Input
                      value={newRSSSource.url}
                      onChange={(e) => setNewRSSSource({ ...newRSSSource, url: e.target.value })}
                      placeholder="https://example.com/rss"
                      className="mt-1 bg-neutral-900 border-neutral-700 rounded"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs">Sector</Label>
                    <Select
                      value={newRSSSource.sector_id}
                      onValueChange={(value) => setNewRSSSource({ ...newRSSSource, sector_id: value })}
                    >
                      <SelectTrigger className="mt-1 bg-neutral-900 border-neutral-700 rounded">
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveRSSSource} size="sm" className="bg-neutral-700 hover:bg-neutral-600 rounded text-xs">
                  Add RSS Source
                </Button>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium text-xs text-neutral-400 mb-2">Existing RSS Sources</h4>
                {rssSources.length === 0 ? (
                  <p className="text-neutral-500 text-sm p-4 text-center">No RSS sources added yet.</p>
                ) : (
                  rssSources.map((source) => {
                    const sector = sectors.find(s => s.id === source.sector_id);
                    return (
                      <div key={source.id} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{source.name}</span>
                          <p className="text-xs text-neutral-500 truncate">{source.url}</p>
                        </div>
                        <Select
                          value={source.sector_id}
                          onValueChange={(value) => handleRSSCategoryChange(source.id, value)}
                        >
                          <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700 rounded h-8 text-xs">
                            <SelectValue>{sector?.name || 'Select'}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                            {sectors.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className="text-red-400 text-xs h-7" onClick={() => onDeleteRSSSource(source.id)}>
                          Delete
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <Label className="text-neutral-400 text-xs">Default Gist Instructions</Label>
                  <Textarea
                    value={localSettings?.default_gist_instructions || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, default_gist_instructions: e.target.value })}
                    placeholder="Instructions for AI when generating the summary..."
                    className="mt-1 bg-neutral-900 border-neutral-700 min-h-[80px] rounded"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    These instructions guide the AI when creating the intelligence summary.
                  </p>
                </div>
                <div>
                  <Label className="text-neutral-400 text-xs">Default Critical Article Instructions</Label>
                  <Textarea
                    value={localSettings?.default_critical_instructions || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, default_critical_instructions: e.target.value })}
                    placeholder="Instructions for AI when selecting critical articles..."
                    className="mt-1 bg-neutral-900 border-neutral-700 min-h-[80px] rounded"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    These instructions guide the AI when selecting critical articles.
                  </p>
                </div>
                <Button 
                  onClick={() => onUpdateSettings(localSettings)}
                  size="sm"
                  className="bg-neutral-700 hover:bg-neutral-600 rounded text-xs"
                >
                  Save AI Settings
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}