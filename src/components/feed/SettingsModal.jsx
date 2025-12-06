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
import { X, Plus, ChevronUp, ChevronDown, Mail } from 'lucide-react';
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
  onUpdateRSSSource,
  onReorderSectors,
  initialTab = 'appearance'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingSector, setEditingSector] = useState(null);
  const [newSector, setNewSector] = useState({ name: '', keywords: [], subsectors: [] });
  const [newKeyword, setNewKeyword] = useState('');
  const [newSubsector, setNewSubsector] = useState('');
  const [newSubsubsector, setNewSubsubsector] = useState({ subsectorIdx: null, value: '' });
  const [newRSSSource, setNewRSSSource] = useState({ name: '', url: '', sector_id: '', subsector: '', subsubsector: '' });
  const [localSettings, setLocalSettings] = useState(settings);
  const [selectedSectorForRSS, setSelectedSectorForRSS] = useState(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const handleAddSubsector = (isEditing) => {
    if (!newSubsector.trim()) return;
    const target = isEditing ? editingSector : newSector;
    const setter = isEditing ? setEditingSector : setNewSector;
    setter({
      ...target,
      subsectors: [...(target.subsectors || []), { name: newSubsector.trim(), subsubsectors: [] }]
    });
    setNewSubsector('');
  };

  const handleRemoveSubsector = (index, isEditing) => {
    const target = isEditing ? editingSector : newSector;
    const setter = isEditing ? setEditingSector : setNewSector;
    setter({
      ...target,
      subsectors: target.subsectors.filter((_, i) => i !== index)
    });
  };

  const handleAddSubsubsector = (subsectorIdx, isEditing) => {
    if (!newSubsubsector.value.trim() || newSubsubsector.subsectorIdx !== subsectorIdx) return;
    const target = isEditing ? editingSector : newSector;
    const setter = isEditing ? setEditingSector : setNewSector;
    const newSubsectors = [...(target.subsectors || [])];
    newSubsectors[subsectorIdx] = {
      ...newSubsectors[subsectorIdx],
      subsubsectors: [...(newSubsectors[subsectorIdx].subsubsectors || []), newSubsubsector.value.trim()]
    };
    setter({ ...target, subsectors: newSubsectors });
    setNewSubsubsector({ subsectorIdx: null, value: '' });
  };

  const handleRemoveSubsubsector = (subsectorIdx, subsubIdx, isEditing) => {
    const target = isEditing ? editingSector : newSector;
    const setter = isEditing ? setEditingSector : setNewSector;
    const newSubsectors = [...(target.subsectors || [])];
    newSubsectors[subsectorIdx] = {
      ...newSubsectors[subsectorIdx],
      subsubsectors: newSubsectors[subsectorIdx].subsubsectors.filter((_, i) => i !== subsubIdx)
    };
    setter({ ...target, subsectors: newSubsectors });
  };

  const handleSaveSector = async () => {
    if (editingSector) {
      await onSaveSector(editingSector);
      setEditingSector(null);
    } else if (newSector.name) {
      await onSaveSector(newSector);
      setNewSector({ name: '', keywords: [], subsectors: [] });
    }
  };

  const handleSaveRSSSource = async () => {
    if (newRSSSource.name && newRSSSource.url && newRSSSource.sector_id) {
      await onSaveRSSSource(newRSSSource);
      setNewRSSSource({ name: '', url: '', sector_id: '', subsector: '', subsubsector: '' });
      setSelectedSectorForRSS(null);
    }
  };

  const handleRSSCategoryChange = async (sourceId, newSectorId) => {
    await onUpdateRSSSource(sourceId, { sector_id: newSectorId, subsector: '', subsubsector: '' });
  };

  const [editingRSS, setEditingRSS] = useState(null);

  const handleMoveUp = (index) => {
    if (index === 0) return;
    onReorderSectors(index, index - 1);
  };

  const handleMoveDown = (index) => {
    if (index === sectors.length - 1) return;
    onReorderSectors(index, index + 1);
  };

  const currentTarget = editingSector || newSector;

  const isDark = settings?.theme === 'dark';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl max-h-[85vh] overflow-hidden rounded", isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-gray-200 text-gray-900")}>
        <DialogHeader>
          <DialogTitle className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className={cn("grid grid-cols-6 rounded", isDark ? "bg-neutral-800/50" : "bg-gray-100")}>
            <TabsTrigger value="general" className={cn("rounded text-xs", isDark ? "data-[state=active]:bg-neutral-700" : "data-[state=active]:bg-white")}>General</TabsTrigger>
            <TabsTrigger value="appearance" className={cn("rounded text-xs", isDark ? "data-[state=active]:bg-neutral-700" : "data-[state=active]:bg-white")}>Appearance</TabsTrigger>
            <TabsTrigger value="sectors" className={cn("rounded text-xs", isDark ? "data-[state=active]:bg-neutral-700" : "data-[state=active]:bg-white")}>Sectors</TabsTrigger>
            <TabsTrigger value="rss" className={cn("rounded text-xs", isDark ? "data-[state=active]:bg-neutral-700" : "data-[state=active]:bg-white")}>RSS Sources</TabsTrigger>
            <TabsTrigger value="ai" className={cn("rounded text-xs", isDark ? "data-[state=active]:bg-neutral-700" : "data-[state=active]:bg-white")}>AI Settings</TabsTrigger>
            <TabsTrigger value="export" className={cn("rounded text-xs", isDark ? "data-[state=active]:bg-neutral-700" : "data-[state=active]:bg-white")}>Export</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 overflow-y-auto max-h-[55vh] pr-2 custom-scrollbar">
            <TabsContent value="general" className="space-y-4 mt-0">
              <div className={cn("p-4 rounded space-y-4", isDark ? "bg-neutral-800/50" : "bg-gray-50")}>
                <h4 className={cn("font-medium text-xs", isDark ? "text-neutral-300" : "text-gray-700")}>Keyword Filters</h4>
                <p className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-500")}>Control how articles with specific keywords are displayed</p>
                
                <div>
                  <Label className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>Show More (prioritize articles with these keywords)</Label>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newKeyword.trim()) {
                        e.preventDefault();
                        setLocalSettings({
                          ...localSettings,
                          keywords_show_more: [...(localSettings?.keywords_show_more || []), newKeyword.trim()]
                        });
                        setNewKeyword('');
                      }
                    }}
                    placeholder="Press Enter to add keyword"
                    className={cn("mt-1 rounded", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-300")}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(localSettings?.keywords_show_more || []).map((kw, idx) => (
                      <Badge key={idx} className={cn("rounded", isDark ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")}>
                        {kw}
                        <button onClick={() => setLocalSettings({
                          ...localSettings,
                          keywords_show_more: localSettings.keywords_show_more.filter((_, i) => i !== idx)
                        })} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>Show Less (de-prioritize articles with these keywords)</Label>
                  <Input
                    placeholder="Press Enter to add keyword"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        e.preventDefault();
                        setLocalSettings({
                          ...localSettings,
                          keywords_show_less: [...(localSettings?.keywords_show_less || []), e.target.value.trim()]
                        });
                        e.target.value = '';
                      }
                    }}
                    className={cn("mt-1 rounded", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-300")}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(localSettings?.keywords_show_less || []).map((kw, idx) => (
                      <Badge key={idx} className={cn("rounded", isDark ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800")}>
                        {kw}
                        <button onClick={() => setLocalSettings({
                          ...localSettings,
                          keywords_show_less: localSettings.keywords_show_less.filter((_, i) => i !== idx)
                        })} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>Hide (completely hide articles with these keywords)</Label>
                  <Input
                    placeholder="Press Enter to add keyword"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        e.preventDefault();
                        setLocalSettings({
                          ...localSettings,
                          keywords_hide: [...(localSettings?.keywords_hide || []), e.target.value.trim()]
                        });
                        e.target.value = '';
                      }
                    }}
                    className={cn("mt-1 rounded", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-300")}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(localSettings?.keywords_hide || []).map((kw, idx) => (
                      <Badge key={idx} className={cn("rounded", isDark ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800")}>
                        {kw}
                        <button onClick={() => setLocalSettings({
                          ...localSettings,
                          keywords_hide: localSettings.keywords_hide.filter((_, i) => i !== idx)
                        })} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => onUpdateSettings(localSettings)}
                  size="sm"
                  className={cn("rounded text-xs", isDark ? "bg-neutral-700 hover:bg-neutral-600" : "bg-gray-800 hover:bg-gray-700 text-white")}
                >
                  Save General Settings
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div className={cn("flex items-center justify-between p-4 rounded", isDark ? "bg-neutral-800/50" : "bg-gray-50")}>
                  <div>
                    <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>Theme</p>
                    <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-400" : "text-gray-500")}>Toggle dark/light mode</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs", localSettings?.theme === 'light' ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-neutral-500" : "text-gray-400"))}>Light</span>
                    <Switch
                      checked={localSettings?.theme === 'dark'}
                      onCheckedChange={(checked) => {
                        const newSettings = { ...localSettings, theme: checked ? 'dark' : 'light' };
                        setLocalSettings(newSettings);
                        onUpdateSettings(newSettings);
                      }}
                      className="data-[state=unchecked]:bg-gray-300"
                    />
                    <span className={cn("text-xs", localSettings?.theme === 'dark' ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-neutral-500" : "text-gray-400"))}>Dark</span>
                  </div>
                </div>

                <div className={cn("flex items-center justify-between p-4 rounded", isDark ? "bg-neutral-800/50" : "bg-gray-50")}>
                  <div>
                    <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>Auto-reload Gist</p>
                    <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-400" : "text-gray-500")}>Automatically generate gist on sector change</p>
                  </div>
                  <Switch
                    checked={localSettings?.auto_reload_gist || false}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...localSettings, auto_reload_gist: checked };
                      setLocalSettings(newSettings);
                      onUpdateSettings(newSettings);
                    }}
                    className="data-[state=unchecked]:bg-gray-300"
                  />
                </div>

                <div className={cn("flex items-center justify-between p-4 rounded", isDark ? "bg-neutral-800/50" : "bg-gray-50")}>
                  <div>
                    <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>Auto-reload Critical Articles</p>
                    <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-400" : "text-gray-500")}>Automatically generate critical articles on sector change</p>
                  </div>
                  <Switch
                    checked={localSettings?.auto_reload_critical || false}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...localSettings, auto_reload_critical: checked };
                      setLocalSettings(newSettings);
                      onUpdateSettings(newSettings);
                    }}
                    className="data-[state=unchecked]:bg-gray-300"
                  />
                </div>

                <div className={cn("flex items-center justify-between p-4 rounded", isDark ? "bg-neutral-800/50" : "bg-gray-50")}>
                  <div>
                    <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>Cache AI Content</p>
                    <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-400" : "text-gray-500")}>Save AI-generated content for quick access</p>
                  </div>
                  <Switch
                    checked={localSettings?.cache_ai_content !== false}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...localSettings, cache_ai_content: checked };
                      setLocalSettings(newSettings);
                      onUpdateSettings(newSettings);
                    }}
                    className="data-[state=unchecked]:bg-gray-300"
                  />
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
                    value={currentTarget.name}
                    onChange={(e) => editingSector 
                      ? setEditingSector({ ...editingSector, name: e.target.value })
                      : setNewSector({ ...newSector, name: e.target.value })
                    }
                    placeholder="e.g., Advanced Materials"
                    className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white"
                  />
                </div>
                
                {/* Subsectors */}
                <div>
                  <Label className="text-neutral-400 text-xs">Subsectors</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newSubsector}
                      onChange={(e) => setNewSubsector(e.target.value)}
                      placeholder="Add subsector"
                      className="bg-neutral-900 border-neutral-700 rounded text-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubsector(!!editingSector))}
                    />
                    <Button size="sm" onClick={() => handleAddSubsector(!!editingSector)} className="bg-neutral-700 hover:bg-neutral-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {(currentTarget.subsectors || []).map((sub, idx) => (
                      <div key={idx} className="p-2 bg-neutral-800 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white">{sub.name}</span>
                          <button onClick={() => handleRemoveSubsector(idx, !!editingSector)} className="text-red-400 hover:text-red-300">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Sub-subsectors */}
                        <div className="mt-2 ml-3">
                          <div className="flex gap-2">
                            <Input
                              value={newSubsubsector.subsectorIdx === idx ? newSubsubsector.value : ''}
                              onChange={(e) => setNewSubsubsector({ subsectorIdx: idx, value: e.target.value })}
                              placeholder="Add sub-subsector"
                              className="bg-neutral-900 border-neutral-700 rounded text-white text-xs h-7"
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubsubsector(idx, !!editingSector))}
                            />
                            <Button size="sm" className="h-7 bg-neutral-700 hover:bg-neutral-600" onClick={() => handleAddSubsubsector(idx, !!editingSector)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(sub.subsubsectors || []).map((subsub, ssIdx) => (
                              <Badge key={ssIdx} variant="secondary" className="bg-neutral-700 text-neutral-300 rounded text-xs">
                                {subsub}
                                <button onClick={() => handleRemoveSubsubsector(idx, ssIdx, !!editingSector)} className="ml-1">
                                  <X className="w-2 h-2" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-neutral-400 text-xs">Keywords (for critical articles)</Label>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Press Enter to add keyword"
                    className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(currentTarget.keywords || []).map((kw, idx) => (
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
                {sectors.map((sector, index) => (
                  <div key={sector.id} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded gap-2">
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
                          disabled={index === sectors.length - 1}
                          className={cn("p-0.5", index === sectors.length - 1 ? "text-neutral-700" : "text-neutral-500 hover:text-white")}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <span className="text-sm text-white">{sector.name}</span>
                        {sector.subsectors?.length > 0 && (
                          <span className="text-xs text-neutral-500 ml-2">
                            ({sector.subsectors.length} subsectors)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingSector(sector)} className="text-xs h-7 text-neutral-300">
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
                      placeholder="e.g., Reuters"
                      className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs">RSS Feed URL</Label>
                    <Input
                      value={newRSSSource.url}
                      onChange={(e) => setNewRSSSource({ ...newRSSSource, url: e.target.value })}
                      placeholder="https://example.com/rss"
                      className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs">Sector</Label>
                    <Select
                      value={newRSSSource.sector_id}
                      onValueChange={(value) => {
                        setNewRSSSource({ ...newRSSSource, sector_id: value, subsector: '', subsubsector: '' });
                        setSelectedSectorForRSS(sectors.find(s => s.id === value));
                      }}
                    >
                      <SelectTrigger className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white">
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id} className="text-white focus:bg-neutral-700 focus:text-white">
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedSectorForRSS?.subsectors?.length > 0 && (
                    <div>
                      <Label className="text-neutral-400 text-xs">Subsector (optional)</Label>
                      <Select
                        value={newRSSSource.subsector}
                        onValueChange={(value) => setNewRSSSource({ ...newRSSSource, subsector: value, subsubsector: '' })}
                      >
                        <SelectTrigger className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white">
                          <SelectValue placeholder="Select subsector" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                          <SelectItem value={null} className="text-white focus:bg-neutral-700 focus:text-white">None</SelectItem>
                          {selectedSectorForRSS.subsectors.map((sub, idx) => (
                            <SelectItem key={idx} value={sub.name} className="text-white focus:bg-neutral-700 focus:text-white">
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {newRSSSource.subsector && selectedSectorForRSS?.subsectors?.find(s => s.name === newRSSSource.subsector)?.subsubsectors?.length > 0 && (
                    <div>
                      <Label className="text-neutral-400 text-xs">Sub-subsector (optional)</Label>
                      <Select
                        value={newRSSSource.subsubsector}
                        onValueChange={(value) => setNewRSSSource({ ...newRSSSource, subsubsector: value })}
                      >
                        <SelectTrigger className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white">
                          <SelectValue placeholder="Select sub-subsector" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                          <SelectItem value={null} className="text-white focus:bg-neutral-700 focus:text-white">None</SelectItem>
                          {selectedSectorForRSS.subsectors.find(s => s.name === newRSSSource.subsector).subsubsectors.map((subsub, idx) => (
                            <SelectItem key={idx} value={subsub} className="text-white focus:bg-neutral-700 focus:text-white">
                              {subsub}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                    const isEditing = editingRSS?.id === source.id;
                    return (
                      <div key={source.id} className="p-3 bg-neutral-800/30 rounded space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white">{source.name}</span>
                            <p className="text-xs text-neutral-500 truncate">{source.url}</p>
                            {!isEditing && (source.subsector || source.subsubsector) && (
                              <p className="text-xs text-neutral-600 mt-0.5">
                                {sector?.name}{source.subsector ? ` → ${source.subsector}` : ''}{source.subsubsector ? ` → ${source.subsubsector}` : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingRSS(isEditing ? null : source)}>
                              {isEditing ? 'Cancel' : 'Edit'}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 text-xs h-7" onClick={() => onDeleteRSSSource(source.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                        {isEditing && (
                          <div className="space-y-2 pt-2 border-t border-neutral-700">
                            <Select
                              value={editingRSS.sector_id}
                              onValueChange={(value) => setEditingRSS({ ...editingRSS, sector_id: value, subsector: '', subsubsector: '' })}
                            >
                              <SelectTrigger className="bg-neutral-900 border-neutral-700 rounded text-white text-xs">
                                <SelectValue>{sectors.find(s => s.id === editingRSS.sector_id)?.name || 'Select sector'}</SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                                {sectors.map((s) => (
                                  <SelectItem key={s.id} value={s.id} className="text-xs text-white focus:bg-neutral-700 focus:text-white">
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {sectors.find(s => s.id === editingRSS.sector_id)?.subsectors?.length > 0 && (
                              <Select
                                value={editingRSS.subsector || ''}
                                onValueChange={(value) => setEditingRSS({ ...editingRSS, subsector: value, subsubsector: '' })}
                              >
                                <SelectTrigger className="bg-neutral-900 border-neutral-700 rounded text-white text-xs">
                                  <SelectValue placeholder="Select subsector" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                                  <SelectItem value={null} className="text-xs text-white focus:bg-neutral-700 focus:text-white">None</SelectItem>
                                  {sectors.find(s => s.id === editingRSS.sector_id).subsectors.map((sub, idx) => (
                                    <SelectItem key={idx} value={sub.name} className="text-xs text-white focus:bg-neutral-700 focus:text-white">
                                      {sub.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {editingRSS.subsector && sectors.find(s => s.id === editingRSS.sector_id)?.subsectors?.find(s => s.name === editingRSS.subsector)?.subsubsectors?.length > 0 && (
                              <Select
                                value={editingRSS.subsubsector || ''}
                                onValueChange={(value) => setEditingRSS({ ...editingRSS, subsubsector: value })}
                              >
                                <SelectTrigger className="bg-neutral-900 border-neutral-700 rounded text-white text-xs">
                                  <SelectValue placeholder="Select sub-subsector" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                                  <SelectItem value={null} className="text-xs text-white focus:bg-neutral-700 focus:text-white">None</SelectItem>
                                  {sectors.find(s => s.id === editingRSS.sector_id).subsectors.find(s => s.name === editingRSS.subsector).subsubsectors.map((subsub, idx) => (
                                    <SelectItem key={idx} value={subsub} className="text-xs text-white focus:bg-neutral-700 focus:text-white">
                                      {subsub}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Button 
                              size="sm" 
                              onClick={() => {
                                onUpdateRSSSource(source.id, { 
                                  sector_id: editingRSS.sector_id, 
                                  subsector: editingRSS.subsector || '', 
                                  subsubsector: editingRSS.subsubsector || '' 
                                });
                                setEditingRSS(null);
                              }}
                              className="bg-neutral-700 hover:bg-neutral-600 text-xs"
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="p-4 bg-neutral-800/50 rounded space-y-4">
                  <h4 className="font-medium text-xs text-neutral-300">API Configuration</h4>
                  <div>
                    <Label className="text-neutral-400 text-xs">AI Provider</Label>
                    <Select
                      value={localSettings?.api_provider || 'default'}
                      onValueChange={(value) => setLocalSettings({ ...localSettings, api_provider: value })}
                    >
                      <SelectTrigger className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                        <SelectItem value="default" className="text-white focus:bg-neutral-700 focus:text-white">Default (Built-in)</SelectItem>
                        <SelectItem value="openai" className="text-white focus:bg-neutral-700 focus:text-white">OpenAI</SelectItem>
                        <SelectItem value="gemini" className="text-white focus:bg-neutral-700 focus:text-white">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {localSettings?.api_provider && localSettings.api_provider !== 'default' && (
                    <div>
                      <Label className="text-neutral-400 text-xs">API Key</Label>
                      <Input
                        type="password"
                        value={localSettings?.custom_api_key || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, custom_api_key: e.target.value })}
                        placeholder={`Enter your ${localSettings.api_provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
                        className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Your API key is stored securely and used only for generating summaries.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-neutral-400 text-xs">Default Gist Instructions</Label>
                  <Textarea
                    value={localSettings?.default_gist_instructions || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, default_gist_instructions: e.target.value })}
                    placeholder="Instructions for AI when generating the summary..."
                    className="mt-1 bg-neutral-900 border-neutral-700 min-h-[80px] rounded text-white"
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
                    className="mt-1 bg-neutral-900 border-neutral-700 min-h-[80px] rounded text-white"
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
            
            <TabsContent value="export" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="p-4 bg-neutral-800/50 rounded space-y-4">
                  <h4 className="font-medium text-xs text-neutral-300">Export Format</h4>
                  <div>
                    <Label className="text-neutral-400 text-xs">Default Format</Label>
                    <Select
                      value={localSettings?.export_format || 'csv'}
                      onValueChange={(value) => setLocalSettings({ ...localSettings, export_format: value })}
                    >
                      <SelectTrigger className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700 rounded">
                        <SelectItem value="csv" className="text-white focus:bg-neutral-700 focus:text-white">CSV</SelectItem>
                        <SelectItem value="excel" className="text-white focus:bg-neutral-700 focus:text-white">Excel</SelectItem>
                        <SelectItem value="email" className="text-white focus:bg-neutral-700 focus:text-white">Email Attachment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {localSettings?.export_format === 'email' && (
                    <div>
                      <Label className="text-neutral-400 text-xs">Email Address</Label>
                      <Input
                        type="email"
                        value={localSettings?.export_email || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, export_email: e.target.value })}
                        placeholder="your@email.com"
                        className="mt-1 bg-neutral-900 border-neutral-700 rounded text-white"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Export will be sent to this email address
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-neutral-800/50 rounded space-y-4">
                  <h4 className="font-medium text-xs text-neutral-300">Export Columns</h4>
                  <p className="text-xs text-neutral-400">Select which columns to include in exports</p>
                  <div className="space-y-2">
                    {[
                      { value: 'title', label: 'Title' },
                      { value: 'link', label: 'Link' },
                      { value: 'source', label: 'Source' },
                      { value: 'sector', label: 'Sector' },
                      { value: 'subsector', label: 'Subsector' },
                      { value: 'date', label: 'Date' },
                      { value: 'description', label: 'Description' },
                      { value: 'collections', label: 'Collections' }
                    ].map((col) => (
                      <div key={col.value} className="flex items-center justify-between p-2 bg-neutral-800/30 rounded">
                        <span className="text-sm text-white">{col.label}</span>
                        <Switch
                          checked={(localSettings?.export_columns || ['title', 'link', 'source', 'sector', 'date', 'description']).includes(col.value)}
                          onCheckedChange={(checked) => {
                            const currentColumns = localSettings?.export_columns || ['title', 'link', 'source', 'sector', 'date', 'description'];
                            const newColumns = checked
                              ? [...currentColumns, col.value]
                              : currentColumns.filter(c => c !== col.value);
                            setLocalSettings({ ...localSettings, export_columns: newColumns });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => onUpdateSettings(localSettings)}
                  size="sm"
                  className="bg-neutral-700 hover:bg-neutral-600 rounded text-xs"
                >
                  Save Export Settings
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}