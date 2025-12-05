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
import { 
  Sun, Moon, Building2, Cpu, HeartPulse, Landmark, ShoppingCart, 
  Zap, Plane, Factory, Leaf, Wifi, Plus, Trash2, X, Save, Rss
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const iconOptions = [
  { value: 'Building2', label: 'Building', icon: Building2 },
  { value: 'Cpu', label: 'Technology', icon: Cpu },
  { value: 'HeartPulse', label: 'Healthcare', icon: HeartPulse },
  { value: 'Landmark', label: 'Finance', icon: Landmark },
  { value: 'ShoppingCart', label: 'Retail', icon: ShoppingCart },
  { value: 'Zap', label: 'Energy', icon: Zap },
  { value: 'Plane', label: 'Travel', icon: Plane },
  { value: 'Factory', label: 'Industrial', icon: Factory },
  { value: 'Leaf', label: 'Sustainability', icon: Leaf },
  { value: 'Wifi', label: 'Telecom', icon: Wifi },
];

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
  onDeleteRSSSource
}) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [editingSector, setEditingSector] = useState(null);
  const [newSector, setNewSector] = useState({ name: '', icon: 'Building2', keywords: [] });
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
      setNewSector({ name: '', icon: 'Building2', keywords: [] });
    }
  };

  const handleSaveRSSSource = async () => {
    if (newRSSSource.name && newRSSSource.url && newRSSSource.sector_id) {
      await onSaveRSSSource(newRSSSource);
      setNewRSSSource({ name: '', url: '', sector_id: '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-slate-700">Appearance</TabsTrigger>
            <TabsTrigger value="sectors" className="data-[state=active]:bg-slate-700">Sectors</TabsTrigger>
            <TabsTrigger value="rss" className="data-[state=active]:bg-slate-700">RSS Sources</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-slate-700">AI Settings</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 overflow-y-auto max-h-[60vh] pr-2">
            <TabsContent value="appearance" className="space-y-6 mt-0">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {localSettings?.theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-slate-400">Toggle dark/light mode</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings?.theme === 'dark'}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...localSettings, theme: checked ? 'dark' : 'light' };
                    setLocalSettings(newSettings);
                    onUpdateSettings(newSettings);
                  }}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="sectors" className="space-y-4 mt-0">
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
                <h4 className="font-medium text-sm text-slate-300">
                  {editingSector ? 'Edit Sector' : 'Add New Sector'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Name</Label>
                    <Input
                      value={editingSector?.name || newSector.name}
                      onChange={(e) => editingSector 
                        ? setEditingSector({ ...editingSector, name: e.target.value })
                        : setNewSector({ ...newSector, name: e.target.value })
                      }
                      placeholder="e.g., Technology"
                      className="mt-1 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Icon</Label>
                    <Select
                      value={editingSector?.icon || newSector.icon}
                      onValueChange={(value) => editingSector
                        ? setEditingSector({ ...editingSector, icon: value })
                        : setNewSector({ ...newSector, icon: value })
                      }
                    >
                      <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {iconOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <opt.icon className="w-4 h-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Keywords (for critical articles)</Label>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Press Enter to add keyword"
                    className="mt-1 bg-slate-900 border-slate-700"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editingSector?.keywords || newSector.keywords || []).map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-700 text-slate-300">
                        {kw}
                        <button onClick={() => handleRemoveKeyword(idx, !!editingSector)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSector} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingSector ? 'Update' : 'Add'} Sector
                  </Button>
                  {editingSector && (
                    <Button variant="ghost" onClick={() => setEditingSector(null)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-slate-400">Existing Sectors</h4>
                {sectors.map((sector) => {
                  const IconComp = iconOptions.find(o => o.value === sector.icon)?.icon || Building2;
                  return (
                    <div key={sector.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComp className="w-4 h-4 text-slate-400" />
                        <span>{sector.name}</span>
                        {sector.keywords?.length > 0 && (
                          <span className="text-xs text-slate-500">
                            ({sector.keywords.length} keywords)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingSector(sector)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => onDeleteSector(sector.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="rss" className="space-y-4 mt-0">
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
                <h4 className="font-medium text-sm text-slate-300">Add RSS Source</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Source Name</Label>
                    <Input
                      value={newRSSSource.name}
                      onChange={(e) => setNewRSSSource({ ...newRSSSource, name: e.target.value })}
                      placeholder="e.g., TechCrunch"
                      className="mt-1 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">RSS Feed URL</Label>
                    <Input
                      value={newRSSSource.url}
                      onChange={(e) => setNewRSSSource({ ...newRSSSource, url: e.target.value })}
                      placeholder="https://example.com/rss"
                      className="mt-1 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Sector</Label>
                    <Select
                      value={newRSSSource.sector_id}
                      onValueChange={(value) => setNewRSSSource({ ...newRSSSource, sector_id: value })}
                    >
                      <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveRSSSource} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add RSS Source
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-slate-400">Existing RSS Sources</h4>
                {rssSources.length === 0 ? (
                  <p className="text-slate-500 text-sm p-4 text-center">No RSS sources added yet.</p>
                ) : (
                  rssSources.map((source) => {
                    const sector = sectors.find(s => s.id === source.sector_id);
                    return (
                      <div key={source.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Rss className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-sm">{source.name}</span>
                            <p className="text-xs text-slate-500 truncate max-w-xs">{source.url}</p>
                          </div>
                          {sector && (
                            <Badge variant="outline" className="text-xs border-slate-600">
                              {sector.name}
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => onDeleteRSSSource(source.id)}>
                          <Trash2 className="w-4 h-4" />
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
                  <Label className="text-slate-400 text-xs">Default Gist Instructions</Label>
                  <Textarea
                    value={localSettings?.default_gist_instructions || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, default_gist_instructions: e.target.value })}
                    placeholder="Instructions for AI when generating the summary gist..."
                    className="mt-1 bg-slate-900 border-slate-700 min-h-[100px]"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    These instructions guide the AI when creating the intelligence summary.
                  </p>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Default Critical Article Instructions</Label>
                  <Textarea
                    value={localSettings?.default_critical_instructions || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, default_critical_instructions: e.target.value })}
                    placeholder="Instructions for AI when selecting critical articles..."
                    className="mt-1 bg-slate-900 border-slate-700 min-h-[100px]"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    These instructions guide the AI when selecting critical articles.
                  </p>
                </div>
                <Button 
                  onClick={() => onUpdateSettings(localSettings)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
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