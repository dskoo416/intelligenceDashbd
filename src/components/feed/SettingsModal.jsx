import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  sectors, 
  rssSources,
  collections,
  onUpdateSettings,
  onSaveSector,
  onDeleteSector,
  onSaveRSSSource,
  onDeleteRSSSource,
  onUpdateRSSSource,
  onReorderSectors,
  onSaveCollection,
  onDeleteCollection,
  onReorderCollections,
  initialTab = 'general'
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [editingSector, setEditingSector] = useState(null);
  const [newSector, setNewSector] = useState({ name: '', keywords: [], subsectors: [] });
  const [newKeyword, setNewKeyword] = useState('');
  const [newSubsector, setNewSubsector] = useState('');
  const [newSubsubsector, setNewSubsubsector] = useState({ subsectorIdx: null, value: '' });
  const [newRSSSource, setNewRSSSource] = useState({ name: '', url: '', sector_id: '', subsector: '', subsubsector: '' });
  const [localSettings, setLocalSettings] = useState(settings);
  const [selectedSectorForRSS, setSelectedSectorForRSS] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollection, setNewCollection] = useState({ name: '' });
  const [bulkRSSText, setBulkRSSText] = useState('');
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkSuccess, setBulkSuccess] = useState(null);
  const [editingRSS, setEditingRSS] = useState(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen && !activeTab) {
      setActiveTab('general');
    }
  }, [isOpen]);

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
      const isDuplicate = rssSources.some(s => s.url === newRSSSource.url);
      if (isDuplicate) {
        setBulkErrors(['This RSS URL is already added.']);
        setTimeout(() => setBulkErrors([]), 3000);
        return;
      }
      
      await onSaveRSSSource(newRSSSource);
      setNewRSSSource({ name: '', url: '', sector_id: '', subsector: '', subsubsector: '' });
      setSelectedSectorForRSS(null);
    }
  };

  const handleBulkAddRSS = async () => {
    const lines = bulkRSSText.split('\n').filter(line => line.trim());
    const errors = [];
    const validSources = [];
    const processedLineIndices = [];
    const existingUrls = rssSources.map(s => s.url);
    const newUrls = new Set();

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().startsWith('source name,')) {
        processedLineIndices.push(index);
        return;
      }
      
      if (!trimmedLine) {
        processedLineIndices.push(index);
        return;
      }

      const parts = trimmedLine.split(',').map(p => p.trim());
      const [sourceName, rssUrl, sectorName, subsectorName, subSubsectorName] = parts;

      if (!sourceName || !rssUrl || !sectorName) {
        errors.push(`Line ${index + 1}: Missing required fields (name, url, or sector) - "${trimmedLine}"`);
        return;
      }

      if (existingUrls.includes(rssUrl) || newUrls.has(rssUrl)) {
        errors.push(`Line ${index + 1}: Duplicate URL already exists - "${rssUrl}"`);
        processedLineIndices.push(index);
        return;
      }

      const sector = sectors.find(s => s.name.toLowerCase() === sectorName.toLowerCase());
      if (!sector) {
        errors.push(`Line ${index + 1}: Sector "${sectorName}" not found - "${trimmedLine}"`);
        return;
      }

      newUrls.add(rssUrl);
      validSources.push({
        name: sourceName,
        url: rssUrl,
        sector_id: sector.id,
        subsector: subsectorName || '',
        subsubsector: subSubsectorName || ''
      });
      processedLineIndices.push(index);
    });

    for (const source of validSources) {
      await onSaveRSSSource(source);
    }

    setBulkSuccess(`${validSources.length} sources added, ${errors.length} lines skipped.`);
    setBulkErrors(errors);

    if (errors.length === 0) {
      setBulkRSSText('');
    } else {
      const remainingLines = lines.filter((_, index) => !processedLineIndices.includes(index));
      setBulkRSSText(remainingLines.join('\n'));
    }

    setTimeout(() => {
      setBulkSuccess(null);
    }, 5000);
  };

  const removeDuplicateRSS = async () => {
    const urlMap = new Map();
    const duplicates = [];

    rssSources.forEach(source => {
      if (urlMap.has(source.url)) {
        duplicates.push(source.id);
      } else {
        urlMap.set(source.url, source.id);
      }
    });

    for (const id of duplicates) {
      await onDeleteRSSSource(id);
    }

    if (duplicates.length > 0) {
      setBulkSuccess(`Removed ${duplicates.length} duplicate RSS sources.`);
      setTimeout(() => setBulkSuccess(null), 3000);
    } else {
      setBulkSuccess('No duplicates found.');
      setTimeout(() => setBulkSuccess(null), 3000);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    onReorderSectors(index, index - 1);
  };

  const handleMoveDown = (index) => {
    if (index === sectors.length - 1) return;
    onReorderSectors(index, index + 1);
  };

  const currentTarget = editingSector || newSector;
  const isDark = settings?.theme === 'dark' || !settings?.theme;

  const isPastel = settings?.theme === 'pastel';

  const SegmentedControl = ({ options, value, onChange }) => (
    <div className={cn("flex border",
      isPastel ? "border-[#4A4D6C]" : "border-neutral-700")}>
      {options.map((opt, idx) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 px-3 py-1 text-[10px] uppercase tracking-wide transition-colors",
            value === opt.value
              ? (isPastel ? "bg-[#42456C] text-white border-r border-[#4A4D6C]" : "bg-[#1E1E1E] text-white border-r border-neutral-600")
              : (isPastel ? "bg-[#2B2D42] text-[#9B9EBC] hover:text-white" : "bg-[#0D0D0D] text-neutral-500 hover:text-neutral-300"),
            idx < options.length - 1 && value !== opt.value && (isPastel ? "border-r border-[#4A4D6C]" : "border-r border-neutral-700")
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const SettingRow = ({ label, children, divider = true }) => (
    <>
      <div className="flex items-center justify-between py-2">
        <span className={cn("text-[11px] uppercase tracking-wide",
          isPastel ? "text-[#D0D2E0]" :
          isDark ? "text-neutral-300" : "text-gray-700")}>{label}</span>
        {children}
      </div>
      {divider && <div className={cn("border-b",
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-neutral-800" : "border-gray-200")} />}
    </>
  );

  const SectionHeader = ({ children, extra }) => (
    <div className="flex items-center gap-2 mb-3 mt-4">
      <div className={cn("h-[1px] w-1",
        isPastel ? "bg-[#9B8B6B]" : "bg-orange-500")} />
      <h3 className={cn("text-[10px] font-bold uppercase tracking-widest",
        isPastel ? "text-[#A5A8C0]" :
        isDark ? "text-neutral-400" : "text-gray-600")}>{children}</h3>
      <div className={cn("h-[1px] flex-1",
        isPastel ? "border-t border-[#4A4D6C]" :
        isDark ? "bg-neutral-800" : "bg-gray-200")} />
      {extra}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-hidden p-0",
        isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
        isDark ? "bg-[#0A0A0A] border-neutral-800 text-white" : "bg-white border-gray-300 text-gray-900")}>
        <div className={cn("border-b px-4 py-3",
          isPastel ? "border-[#4A4D6C]" :
          isDark ? "border-neutral-800" : "border-gray-300")}>
          <h2 className={cn("text-[11px] font-bold uppercase tracking-widest",
            isPastel ? "text-[#A5A8C0]" :
            isDark ? "text-neutral-300" : "text-gray-700")}>SYSTEM SETTINGS</h2>
        </div>
        
        {/* Tabs */}
        <div className={cn("border-b px-4",
          isPastel ? "border-[#4A4D6C]" :
          isDark ? "border-neutral-800" : "border-gray-300")}>
          <div className="flex gap-6">
            {[
              { id: 'general', label: 'GENERAL' },
              { id: 'levels', label: 'LEVELS' },
              { id: 'collections', label: 'COLLECTIONS' },
              { id: 'rss', label: 'RSS SOURCES' },
              { id: 'ai', label: 'AI CONFIG' },
              { id: 'export', label: 'EXPORT' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-2 text-[10px] uppercase tracking-widest font-medium transition-colors relative",
                  activeTab === tab.id
                    ? (isPastel ? "text-white" : isDark ? "text-white" : "text-gray-900")
                    : (isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" : isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className={cn("absolute bottom-0 left-0 right-0 h-[2px]",
                    isPastel ? "bg-[#9B8B6B]" : "bg-orange-500")} />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-4 pb-4 custom-scrollbar">
          {activeTab === 'general' && (
            <div>
              <SectionHeader>APPEARANCE</SectionHeader>
              <SettingRow label="THEME">
                <SegmentedControl
                  options={[
                    { value: 'light', label: 'LIGHT' },
                    { value: 'dark', label: 'DARK' },
                    { value: 'pastel', label: 'PASTEL' }
                  ]}
                  value={localSettings?.theme || 'dark'}
                  onChange={(value) => {
                    const newSettings = { ...localSettings, theme: value };
                    setLocalSettings(newSettings);
                    onUpdateSettings(newSettings);
                    window.location.reload();
                  }}
                />
              </SettingRow>



              <SectionHeader>AUTO-REFRESH</SectionHeader>
              <SettingRow label="AUTO-RELOAD GIST">
                <Checkbox
                  checked={localSettings?.auto_reload_gist || false}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...localSettings, auto_reload_gist: checked };
                    setLocalSettings(newSettings);
                    onUpdateSettings(newSettings);
                  }}
                />
              </SettingRow>

              <SettingRow label="AUTO-RELOAD FEATURED">
                <Checkbox
                  checked={localSettings?.auto_reload_critical || false}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...localSettings, auto_reload_critical: checked };
                    setLocalSettings(newSettings);
                    onUpdateSettings(newSettings);
                  }}
                />
              </SettingRow>

              <SettingRow label="AUTO-RELOAD NEWS">
                <Checkbox
                  checked={localSettings?.auto_reload_news || false}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...localSettings, auto_reload_news: checked };
                    setLocalSettings(newSettings);
                    onUpdateSettings(newSettings);
                  }}
                />
              </SettingRow>

              <SettingRow label="CACHE AI CONTENT" divider={false}>
                <Checkbox
                  checked={localSettings?.cache_ai_content !== false}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...localSettings, cache_ai_content: checked };
                    setLocalSettings(newSettings);
                    onUpdateSettings(newSettings);
                  }}
                />
              </SettingRow>

              <SectionHeader>CLOCK DISPLAY</SectionHeader>
              <SettingRow label="DISPLAY MODE">
                <SegmentedControl
                  options={[
                    { value: 'none', label: 'NONE' },
                    { value: 'single', label: 'SINGLE' },
                    { value: 'dual', label: 'DUAL' }
                  ]}
                  value={localSettings?.clock_display || 'dual'}
                  onChange={(value) => {
                    const newSettings = { ...localSettings, clock_display: value };
                    setLocalSettings(newSettings);
                    onUpdateSettings(newSettings);
                  }}
                />
              </SettingRow>

              {localSettings?.clock_display !== 'none' && (
                <SettingRow label={localSettings?.clock_display === 'dual' ? 'PRIMARY TIME ZONE' : 'TIME ZONE'}>
                  <select
                    value={localSettings?.clock_timezone_1 || 'America/New_York'}
                    onChange={(e) => {
                      const newSettings = { ...localSettings, clock_timezone_1: e.target.value };
                      setLocalSettings(newSettings);
                      onUpdateSettings(newSettings);
                    }}
                    className={cn("text-[10px] px-2 py-1 uppercase border",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  >
                    <option value="America/New_York">EST (NEW YORK)</option>
                    <option value="America/Chicago">CST (CHICAGO)</option>
                    <option value="America/Denver">MST (DENVER)</option>
                    <option value="America/Los_Angeles">PST (LOS ANGELES)</option>
                    <option value="America/Anchorage">AKST (ANCHORAGE)</option>
                    <option value="Pacific/Honolulu">HST (HONOLULU)</option>
                    <option value="Europe/London">GMT (LONDON)</option>
                    <option value="Asia/Seoul">KST (SEOUL)</option>
                    <option value="Asia/Tokyo">JST (TOKYO)</option>
                    <option value="Asia/Shanghai">CST (SHANGHAI)</option>
                  </select>
                </SettingRow>
              )}

              {localSettings?.clock_display === 'dual' && (
                <SettingRow label="SECONDARY TIME ZONE" divider={false}>
                  <select
                    value={localSettings?.clock_timezone_2 || 'Asia/Seoul'}
                    onChange={(e) => {
                      const newSettings = { ...localSettings, clock_timezone_2: e.target.value };
                      setLocalSettings(newSettings);
                      onUpdateSettings(newSettings);
                    }}
                    className={cn("text-[10px] px-2 py-1 uppercase border",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  >
                    <option value="America/New_York">EST (NEW YORK)</option>
                    <option value="America/Chicago">CST (CHICAGO)</option>
                    <option value="America/Denver">MST (DENVER)</option>
                    <option value="America/Los_Angeles">PST (LOS ANGELES)</option>
                    <option value="America/Anchorage">AKST (ANCHORAGE)</option>
                    <option value="Pacific/Honolulu">HST (HONOLULU)</option>
                    <option value="Europe/London">GMT (LONDON)</option>
                    <option value="Asia/Seoul">KST (SEOUL)</option>
                    <option value="Asia/Tokyo">JST (TOKYO)</option>
                    <option value="Asia/Shanghai">CST (SHANGHAI)</option>
                  </select>
                </SettingRow>
              )}
            </div>
          )}

          {activeTab === 'levels' && (
            <div>
              <SectionHeader>{editingSector ? 'EDIT LEVEL' : 'ADD NEW LEVEL'}</SectionHeader>
              <div className="space-y-3 mb-4">
                <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" :
                    "text-neutral-500")}>NAME</Label>
                  <Input
                    value={currentTarget.name}
                    onChange={(e) => editingSector 
                      ? setEditingSector({ ...editingSector, name: e.target.value })
                      : setNewSector({ ...newSector, name: e.target.value })
                    }
                    placeholder="e.g., Advanced Materials"
                    className={cn("mt-1 text-[11px] h-7",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      isDark ? "bg-[#0D0D0D] border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900")}
                  />
                </div>

                <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" :
                    "text-neutral-500")}>PARENT LEVEL</Label>
                  <select
                    value={currentTarget.parent_id || ''}
                    onChange={(e) => editingSector
                      ? setEditingSector({ ...editingSector, parent_id: e.target.value || null })
                      : setNewSector({ ...newSector, parent_id: e.target.value || null })
                    }
                    className={cn("mt-1 w-full text-[11px] px-2 py-1 border",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                      isDark ? "bg-[#0D0D0D] border-neutral-700 text-white" : "bg-white border-gray-300")}
                  >
                    <option value="">TOP LEVEL</option>
                    {sectors.filter(s => !editingSector || s.id !== editingSector.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" :
                    "text-neutral-500")}>KEYWORDS</Label>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Press Enter to add"
                    className={cn("mt-1 text-[11px] h-7",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      isDark ? "bg-[#0D0D0D] border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900")}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(currentTarget.keywords || []).map((kw, idx) => (
                      <Badge key={idx} className={cn("text-[9px]",
                        isPastel ? "bg-[#9B8B6B] text-white" :
                        isDark ? "bg-neutral-800 text-neutral-300" : "bg-gray-200 text-gray-800")}>
                        {kw}
                        <button onClick={() => handleRemoveKeyword(idx, !!editingSector)} className="ml-1">
                          <X className="w-2 h-2" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSector} size="sm" className={cn("text-white text-[10px] h-7",
                    isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" : "bg-orange-600 hover:bg-orange-700")}>
                    {editingSector ? 'UPDATE' : 'ADD'} LEVEL
                  </Button>
                  {editingSector && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingSector(null)} className="text-[10px] h-7">
                      CANCEL
                    </Button>
                  )}
                </div>
              </div>

              <SectionHeader>EXISTING LEVELS</SectionHeader>
              <div className="space-y-1">
                {sectors.map((sector, index) => {
                  const parent = sectors.find(s => s.id === sector.parent_id);
                  const indentClass = sector.parent_id ? (parent?.parent_id ? "ml-12" : "ml-6") : "";
                  const canIndent = index > 0 && !sector.parent_id;
                  const prevSector = index > 0 ? sectors[index - 1] : null;

                  return (
                    <div key={sector.id} className={cn("flex items-center justify-between py-2 border-b",
                      isPastel ? "border-[#4A4D6C]" : "border-neutral-800")}>
                      <div className={cn("flex items-center gap-2", indentClass)}>
                        <div className="flex flex-col gap-0">
                          <button 
                            onClick={() => handleMoveUp(index)} 
                            disabled={index === 0}
                            className={cn("p-0.5", 
                              index === 0 ? (isPastel ? "text-[#4A4D6C]" : "text-neutral-800") : 
                              (isPastel ? "text-[#7B7E9C] hover:text-white" : "text-neutral-600 hover:text-white"))}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              if (canIndent && prevSector) {
                                onSaveSector({ ...sector, parent_id: prevSector.id });
                              }
                            }}
                            disabled={!canIndent}
                            className={cn("p-0.5", 
                              !canIndent ? (isPastel ? "text-[#4A4D6C]" : "text-neutral-800") : 
                              (isPastel ? "text-[#7B7E9C] hover:text-white" : "text-neutral-600 hover:text-white"))}
                            title="Indent to become sub-level"
                          >
                            <span className="text-xs font-bold">›</span>
                          </button>
                          <button 
                            onClick={() => handleMoveDown(index)} 
                            disabled={index === sectors.length - 1}
                            className={cn("p-0.5", 
                              index === sectors.length - 1 ? (isPastel ? "text-[#4A4D6C]" : "text-neutral-800") : 
                              (isPastel ? "text-[#7B7E9C] hover:text-white" : "text-neutral-600 hover:text-white"))}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <span className={cn("text-[11px]",
                          isPastel ? "text-[#E8E9F0]" : "text-white")}>{sector.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingSector(sector)} className={cn("text-[10px] h-6",
                          isPastel ? "text-[#9B9EBC]" : "text-neutral-400")}>
                          EDIT
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 text-[10px] h-6" onClick={() => onDeleteSector(sector.id)}>
                          DELETE
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'collections' && (
            <div>
              <SectionHeader>{editingCollection ? 'EDIT COLLECTION' : 'ADD NEW COLLECTION'}</SectionHeader>
              <div className="space-y-3 mb-4">
                <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" : "text-neutral-500")}>NAME</Label>
                  <Input
                    value={editingCollection ? editingCollection.name : newCollection.name}
                    onChange={(e) => editingCollection 
                      ? setEditingCollection({ ...editingCollection, name: e.target.value })
                      : setNewCollection({ name: e.target.value })
                    }
                    placeholder="e.g., Important Articles"
                    className={cn("mt-1 text-[11px] h-7",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (editingCollection) {
                        onSaveCollection(editingCollection);
                        setEditingCollection(null);
                      } else if (newCollection.name) {
                        onSaveCollection(newCollection);
                        setNewCollection({ name: '' });
                      }
                    }} 
                    size="sm" 
                    className={cn("text-white text-[10px] h-7",
                      isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" : "bg-orange-600 hover:bg-orange-700")}
                  >
                    {editingCollection ? 'UPDATE' : 'ADD'} COLLECTION
                  </Button>
                  {editingCollection && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingCollection(null)} className="text-[10px] h-7">
                      CANCEL
                    </Button>
                  )}
                </div>
              </div>

              <SectionHeader>EXISTING COLLECTIONS</SectionHeader>
              <div className="space-y-1">
                {collections?.length === 0 ? (
                  <p className={cn("text-[10px] py-4 text-center",
                    isPastel ? "text-[#7B7E9C]" : "text-neutral-600")}>NO COLLECTIONS CREATED YET</p>
                ) : (
                  collections?.map((collection, index) => (
                    <div key={collection.id} className={cn("flex items-center justify-between py-2 border-b",
                      isPastel ? "border-[#4A4D6C]" : "border-neutral-800")}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button 
                            onClick={() => onReorderCollections(index, Math.max(0, index - 1))} 
                            disabled={index === 0}
                            className={cn("p-0.5", 
                              index === 0 ? (isPastel ? "text-[#4A4D6C]" : "text-neutral-800") : 
                              (isPastel ? "text-[#7B7E9C] hover:text-white" : "text-neutral-600 hover:text-white"))}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => onReorderCollections(index, Math.min(collections.length - 1, index + 1))} 
                            disabled={index === collections.length - 1}
                            className={cn("p-0.5", 
                              index === collections.length - 1 ? (isPastel ? "text-[#4A4D6C]" : "text-neutral-800") : 
                              (isPastel ? "text-[#7B7E9C] hover:text-white" : "text-neutral-600 hover:text-white"))}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <span className={cn("text-[11px]",
                          isPastel ? "text-[#E8E9F0]" : "text-white")}>{collection.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingCollection(collection)} className={cn("text-[10px] h-6",
                          isPastel ? "text-[#9B9EBC]" : "text-neutral-400")}>
                          EDIT
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 text-[10px] h-6" onClick={() => onDeleteCollection(collection.id)}>
                          DELETE
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'rss' && (
            <div>
              <SectionHeader>ADD SINGLE RSS SOURCE</SectionHeader>
              <div className="space-y-2 mb-4">
                <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" : "text-neutral-500")}>SOURCE NAME</Label>
                  <Input
                    value={editingRSS ? editingRSS.name : newRSSSource.name}
                    onChange={(e) => editingRSS 
                      ? setEditingRSS({ ...editingRSS, name: e.target.value })
                      : setNewRSSSource({ ...newRSSSource, name: e.target.value })
                    }
                    placeholder="e.g., Reuters"
                    className={cn("mt-1 text-[11px] h-7",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  />
                  </div>
                  <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" : "text-neutral-500")}>RSS FEED URL</Label>
                  <Input
                    value={editingRSS ? editingRSS.url : newRSSSource.url}
                    onChange={(e) => editingRSS
                      ? setEditingRSS({ ...editingRSS, url: e.target.value })
                      : setNewRSSSource({ ...newRSSSource, url: e.target.value })
                    }
                    placeholder="https://example.com/rss"
                    className={cn("mt-1 text-[11px] h-7",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  />
                </div>
                <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" : "text-neutral-500")}>LEVEL 1</Label>
                  <select
                    value={editingRSS ? editingRSS.sector_id : newRSSSource.sector_id}
                    onChange={(e) => {
                      const sectorId = e.target.value;
                      if (editingRSS) {
                        setEditingRSS({ ...editingRSS, sector_id: sectorId });
                        setSelectedSectorForRSS(sectors.find(s => s.id === sectorId));
                      } else {
                        setNewRSSSource({ ...newRSSSource, sector_id: sectorId, subsector: '', subsubsector: '' });
                        setSelectedSectorForRSS(sectors.find(s => s.id === sectorId));
                      }
                    }}
                    className={cn("mt-1 w-full text-[11px] px-2 py-1 border",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  >
                    <option value="">SELECT LEVEL 1</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={async () => {
                      if (editingRSS) {
                        await onUpdateRSSSource(editingRSS.id, editingRSS);
                        setEditingRSS(null);
                      } else {
                        await handleSaveRSSSource();
                      }
                    }} 
                    size="sm" 
                    className={cn("text-white text-[10px] h-7",
                      isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" : "bg-orange-600 hover:bg-orange-700")}
                  >
                    {editingRSS ? 'UPDATE' : 'ADD'} RSS SOURCE
                  </Button>
                  {editingRSS && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingRSS(null)} 
                      className="text-[10px] h-7"
                    >
                      CANCEL
                    </Button>
                  )}
                </div>
              </div>

              <SectionHeader>BULK ADD RSS SOURCES</SectionHeader>
              <div className="space-y-2 mb-4">
                <p className={cn("text-[10px]",
                  isPastel ? "text-[#9B9EBC]" : "text-neutral-500")}>
                  Format: Source Name, RSS URL, Sector, Subsector (optional)
                </p>
                <Textarea
                  value={bulkRSSText}
                  onChange={(e) => setBulkRSSText(e.target.value)}
                  placeholder="Reuters Tech, https://example.com/rss, Technology, AI"
                  className={cn("min-h-[100px] font-mono text-[10px]",
                    isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                    "bg-[#0D0D0D] border-neutral-700 text-white")}
                />
                <Button onClick={handleBulkAddRSS} size="sm" className={cn("text-white text-[10px] h-7",
                  isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" : "bg-orange-600 hover:bg-orange-700")}>
                  ADD SOURCES IN BULK
                </Button>

                {bulkSuccess && (
                  <div className="p-2 bg-green-900/30 border border-green-700">
                    <p className="text-[10px] text-green-300">{bulkSuccess}</p>
                  </div>
                )}

                {bulkErrors.length > 0 && (
                  <div className="p-2 bg-red-900/30 border border-red-700 space-y-1">
                    <p className="text-[10px] font-medium text-red-300">ERRORS:</p>
                    {bulkErrors.slice(0, 3).map((error, idx) => (
                      <p key={idx} className="text-[9px] text-red-400">{error}</p>
                    ))}
                  </div>
                )}
              </div>

              <SectionHeader>EXISTING RSS SOURCES</SectionHeader>
              <div className="flex justify-between items-center mb-2 gap-3">
                <select
                  value={selectedSectorForRSS?.id || 'all'}
                  onChange={(e) => setSelectedSectorForRSS(e.target.value === 'all' ? null : sectors.find(s => s.id === e.target.value))}
                  className={cn("text-[9px] h-5 px-2 border",
                    isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                    "bg-[#0D0D0D] border-neutral-700 text-white")}
                >
                  <option value="all">ALL LEVELS</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Button 
                  onClick={removeDuplicateRSS} 
                  size="sm" 
                  variant="ghost"
                  className={cn("text-[9px] h-5 ml-auto",
                    isPastel ? "text-[#9B9EBC] hover:text-white" :
                    "text-neutral-500 hover:text-white")}
                >
                  REMOVE DUPLICATES
                </Button>
              </div>
              <div className="space-y-1">
                {rssSources.length === 0 ? (
                  <p className={cn("text-[10px] py-4 text-center",
                    isPastel ? "text-[#7B7E9C]" :
                    "text-neutral-600")}>NO RSS SOURCES ADDED YET</p>
                ) : (
                  rssSources
                    .filter(source => !selectedSectorForRSS || source.sector_id === selectedSectorForRSS.id)
                    .map((source) => {
                      const sector = sectors.find(s => s.id === source.sector_id);
                      return (
                        <div key={source.id} className={cn("py-2 border-b",
                          isPastel ? "border-[#4A4D6C]" :
                          "border-neutral-800")}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[11px]",
                                  isPastel ? "text-white" :
                                  isDark ? "text-white" : "text-gray-900")}>{source.name}</span>
                                {sector && (
                                  <span className={cn("text-[9px]",
                                    isPastel ? "text-[#9B8B6B]" :
                                    "text-orange-500")}>({sector.name})</span>
                                )}
                              </div>
                              <p className={cn("text-[9px] truncate",
                                isPastel ? "text-[#7B7E9C]" :
                                "text-neutral-600")}>{source.url}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingRSS(source)} className={cn("text-[10px] h-6",
                                isPastel ? "text-[#9B9EBC]" :
                                "text-neutral-400")}>
                                EDIT
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 text-[10px] h-6" onClick={() => onDeleteRSSSource(source.id)}>
                                DELETE
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              <SectionHeader>API CONFIGURATION</SectionHeader>
              <SettingRow label="AI PROVIDER">
                <SegmentedControl
                  options={[
                    { value: 'default', label: 'DEFAULT' },
                    { value: 'openai', label: 'OPENAI' },
                    { value: 'gemini', label: 'GEMINI' }
                  ]}
                  value={localSettings?.api_provider || 'default'}
                  onChange={(value) => setLocalSettings({ ...localSettings, api_provider: value })}
                />
              </SettingRow>
              
              {localSettings?.api_provider && localSettings.api_provider !== 'default' && (
                <div className="py-2">
                  <Label className="text-[10px] text-neutral-500 uppercase tracking-wider">API KEY</Label>
                  <Input
                    type="password"
                    value={localSettings?.custom_api_key || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, custom_api_key: e.target.value })}
                    placeholder="Enter your API key"
                    className={cn("mt-1 text-[11px] h-7",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  />
                </div>
              )}

              <SectionHeader>DEFAULT INSTRUCTIONS</SectionHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-neutral-500 uppercase tracking-wider">SUMMARY INSTRUCTIONS</Label>
                  <Textarea
                    value={localSettings?.default_gist_instructions || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, default_gist_instructions: e.target.value })}
                    placeholder="Instructions for AI..."
                    className={cn("mt-1 min-h-[60px] text-[10px]",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  />
                  </div>
                  <div>
                  <Label className={cn("text-[10px] uppercase tracking-wider",
                    isPastel ? "text-[#A5A8C0]" : "text-neutral-500")}>FEATURED ARTICLE INSTRUCTIONS</Label>
                  <Textarea
                    value={localSettings?.default_critical_instructions || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, default_critical_instructions: e.target.value })}
                    placeholder="Instructions for AI..."
                    className={cn("mt-1 min-h-[60px] text-[10px]",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  />
                </div>
                <Button 
                  onClick={() => onUpdateSettings(localSettings)}
                  size="sm"
                  className={cn("text-white text-[10px] h-7",
                    isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" : "bg-orange-600 hover:bg-orange-700")}
                >
                  SAVE AI SETTINGS
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div>
              <SectionHeader>EXPORT FORMAT</SectionHeader>
              <SettingRow label="DEFAULT FORMAT">
                <SegmentedControl
                  options={[
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'EXCEL' },
                    { value: 'email', label: 'EMAIL' }
                  ]}
                  value={localSettings?.export_format || 'csv'}
                  onChange={(value) => setLocalSettings({ ...localSettings, export_format: value })}
                />
              </SettingRow>
              
              {localSettings?.export_format === 'email' && (
                <div className="py-2">
                  <Label className="text-[10px] text-neutral-500 uppercase tracking-wider">EMAIL ADDRESS</Label>
                  <Input
                    type="email"
                    value={localSettings?.export_email || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, export_email: e.target.value })}
                    placeholder="your@email.com"
                    className={cn("mt-1 text-[11px] h-7",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white placeholder:text-[#7B7E9C]" :
                      "bg-[#0D0D0D] border-neutral-700 text-white")}
                  />
                </div>
              )}

              <SectionHeader>EXPORT COLUMNS</SectionHeader>
              {[
                { value: 'title', label: 'TITLE' },
                { value: 'link', label: 'LINK' },
                { value: 'source', label: 'SOURCE' },
                { value: 'sector', label: 'SECTOR' },
                { value: 'subsector', label: 'SUBSECTOR' },
                { value: 'date', label: 'DATE' },
                { value: 'description', label: 'DESCRIPTION' },
                { value: 'collections', label: 'COLLECTIONS' }
              ].map((col) => (
                <SettingRow key={col.value} label={col.label}>
                  <Checkbox
                    checked={(localSettings?.export_columns || ['title', 'link', 'source', 'sector', 'date', 'description']).includes(col.value)}
                    onCheckedChange={(checked) => {
                      const currentColumns = localSettings?.export_columns || ['title', 'link', 'source', 'sector', 'date', 'description'];
                      const newColumns = checked
                        ? [...currentColumns, col.value]
                        : currentColumns.filter(c => c !== col.value);
                      setLocalSettings({ ...localSettings, export_columns: newColumns });
                    }}
                  />
                </SettingRow>
              ))}

              <div className="mt-4">
                <Button 
                  onClick={() => onUpdateSettings(localSettings)}
                  size="sm"
                  className={cn("text-white text-[10px] h-7",
                    isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" : "bg-orange-600 hover:bg-orange-700")}
                >
                  SAVE EXPORT SETTINGS
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}