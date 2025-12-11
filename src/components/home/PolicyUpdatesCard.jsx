import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, ExternalLink, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AGENCIES = [
  { id: 'ustr', name: 'USTR', types: ['press releases', 'notices', 'fact sheets'] },
  { id: 'commerce', name: 'Commerce', types: ['rule', 'proposed rule', 'notice'] },
  { id: 'bis', name: 'BIS', types: ['rule', 'notice'] },
  { id: 'treasury', name: 'Treasury', types: ['rule', 'notice'] },
  { id: 'doe', name: 'DOE', types: ['rule', 'notice'] },
  { id: 'whitehouse', name: 'White House', types: ['fact sheet', 'executive order', 'proclamation', 'statement'] },
  { id: 'sec', name: 'SEC', types: ['rule', 'notice'] },
  { id: 'ferc', name: 'FERC', types: ['order', 'notice'] }
];

const DEFAULT_KEYWORDS = [
  'tariff', 'duties', 'section 301', 'section 232', 'safeguard',
  'export control', 'entity list', 'sanctions',
  'anti-dumping', 'countervailing',
  'battery', 'EV', 'refinery', 'steel', 'aluminum', 'graphite', 'lithium', 'rare earths'
];

export default function PolicyUpdatesCard({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const contentRef = React.useRef(null);

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || {};
  const enabledAgencies = settings?.policy_agencies || AGENCIES.map(a => a.id);
  const customKeywords = settings?.policy_keywords || DEFAULT_KEYWORDS;

  useEffect(() => {
    const cached = localStorage.getItem('policy_updates');
    if (cached) {
      const data = JSON.parse(cached);
      setUpdates(data);
      applyFilters(data);
    }
  }, []);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (!contentRef.current) return;
      const containerHeight = contentRef.current.clientHeight;
      const itemHeight = 70;
      const items = Math.floor(containerHeight / itemHeight);
      setItemsPerPage(Math.max(1, items));
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  useEffect(() => {
    applyFilters(updates);
    setCurrentPage(0);
  }, [enabledAgencies, customKeywords, updates]);

  const isDataStale = () => {
    if (updates.length === 0) return false;
    const oldestDate = new Date(Math.min(...updates.map(u => new Date(u.date).getTime())));
    const daysDiff = (new Date() - oldestDate) / (1000 * 60 * 60 * 24);
    return daysDiff > 30;
  };

  const applyFilters = (data) => {
    const filtered = data.filter(update => {
      if (!enabledAgencies.includes(update.agency)) return false;
      
      const text = (update.title + ' ' + (update.summary || '')).toLowerCase();
      return customKeywords.some(keyword => text.includes(keyword.toLowerCase()));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setFilteredUpdates(filtered);
  };

  const fetchUpdates = async () => {
    setIsLoading(true);
    
    try {
      const prompt = `You are a policy research assistant finding REAL policy updates from official US government websites.

CRITICAL - URL VERIFICATION:
1. You MUST browse and verify each URL returns a valid page (not 404, not "page not found")
2. If a URL returns 404 or error, DO NOT include it in results
3. Only include URLs you have ACTUALLY visited and confirmed work
4. Copy EXACT URLs from the working pages

Search these official sites:
   - whitehouse.gov
   - ustr.gov  
   - treasury.gov
   - commerce.gov
   - bis.doc.gov
   - energy.gov

For EACH item:
   - Visit the webpage and verify it loads successfully
   - If page returns 404 or error, skip it completely
   - Copy EXACT URL that works
   - Copy EXACT publication date from the page
   - Copy EXACT title from the page

Find policy measures from last 60 days about:
   - Tariffs, Section 301, Section 232
   - Export controls, entity list additions
   - Sanctions, trade restrictions
   - Anti-dumping, countervailing duties
   - Industries: batteries, EVs, steel, aluminum, lithium, rare earths

JSON structure:
   - agency: "whitehouse", "ustr", "commerce", "bis", "treasury", "doe", "sec", "ferc"
   - title: exact title
   - link: verified working URL (must return 200, not 404)
   - date: YYYY-MM-DD from page
   - summary: 1-sentence description
   - type: "tariff", "export_control", "sanction", "rule", "notice", "fact_sheet"

Return only items with VERIFIED working URLs (no 404s). Quality over quantity.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            updates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agency: { type: 'string' },
                  title: { type: 'string' },
                  link: { type: 'string' },
                  date: { type: 'string' },
                  summary: { type: 'string' },
                  type: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const allUpdates = (result.updates || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setUpdates(allUpdates);
      localStorage.setItem('policy_updates', JSON.stringify(allUpdates));
      applyFilters(allUpdates);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error fetching policy updates:', error);
    }
    
    setIsLoading(false);
  };

  const handleSaveSettings = async (newAgencies, newKeywords) => {
    const updatedSettings = {
      ...settings,
      policy_agencies: newAgencies,
      policy_keywords: newKeywords
    };
    
    if (settings.id) {
      await base44.entities.AppSettings.update(settings.id, updatedSettings);
    } else {
      await base44.entities.AppSettings.create(updatedSettings);
    }
  };

  return (
    <div className={cn("h-full flex flex-col border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("flex items-center justify-between px-3 py-2 border-b", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#262629]" : "border-gray-300")}>
        <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          POLICY UPDATES {filteredUpdates.length > 0 && `(${filteredUpdates.length})`}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchUpdates}
            disabled={isLoading}
            className="h-4 w-4 p-0"
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                <Settings className={cn("w-2.5 h-2.5", 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-600" : "text-gray-500")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-96 border", 
              isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
              isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")} align="end">
              <PolicySettingsContent 
                isDark={isDark}
                isPastel={isPastel}
                enabledAgencies={enabledAgencies}
                customKeywords={customKeywords}
                onSave={handleSaveSettings}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {filteredUpdates.length === 0 && !isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", 
          isPastel ? "text-[#7B7E9C]" :
          isDark ? "text-neutral-600" : "text-gray-500")}>
          Click refresh to load policy updates
        </div>
      ) : (
        <div className={cn("flex-1 p-2 space-y-1 overflow-y-auto", 
          isPastel ? "bg-[#32354C]" :
          isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
          {filteredUpdates.map((update, idx) => {
              return (
                <a
                  key={idx}
                  href={update.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("block border p-2 transition-all", 
                    isPastel ? "bg-[#42456C] border-[#4A4D6C] hover:bg-[#4A4D7C] hover:border-[#5A5D8C]" :
                    isDark ? "bg-[#0A0A0A] border-[#1F1F1F] hover:bg-[#17181b] hover:border-[#2A2A2A]" : "bg-gray-50 border-gray-300 hover:border-gray-400")}
                >
                  <h4 className={cn("text-[10px] font-medium line-clamp-2 leading-[1.3]", 
                    isPastel ? "text-[#E8E9F0]" :
                    isDark ? "text-neutral-400" : "text-gray-900")}>
                    <span className={cn("font-bold mr-1",
                      isPastel ? "text-[#9B8B6B]" :
                      isDark ? "text-orange-500" : "text-orange-600")}>{idx + 1}.</span>{update.title}
                  </h4>
                  <div className={cn("text-[9px] mt-0.5", 
                    isPastel ? "text-[#9B9EBC]" :
                    isDark ? "text-neutral-700" : "text-gray-500")}>
                    <span className={cn(
                      isPastel ? "text-[#6B9B9B]" :
                      isDark ? "text-blue-500" : "text-blue-600")}>{AGENCIES.find(a => a.id === update.agency)?.name}</span>
                    {update.date && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{format(new Date(update.date), 'MMM d, yyyy')}</span>
                      </>
                    )}
                    {update.type && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{update.type}</span>
                      </>
                    )}
                  </div>
                  {update.summary && (
                    <p className={cn("text-[9px] mt-0.5 line-clamp-1 leading-[1.2]", 
                      isPastel ? "text-[#7B7E9C]" :
                      isDark ? "text-neutral-600" : "text-gray-600")}>
                      {update.summary}
                    </p>
                  )}
                </a>
              );
            })}
        </div>
      )}
    </div>
  );
}

function PolicySettingsContent({ isDark, isPastel, enabledAgencies, customKeywords, onSave }) {
  const [localAgencies, setLocalAgencies] = useState(enabledAgencies);
  const [localKeywords, setLocalKeywords] = useState(customKeywords);
  const [inputValue, setInputValue] = useState('');

  const handleToggleAgency = (agencyId) => {
    if (localAgencies.includes(agencyId)) {
      setLocalAgencies(localAgencies.filter(id => id !== agencyId));
    } else {
      setLocalAgencies([...localAgencies, agencyId]);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !localKeywords.includes(trimmed)) {
      setLocalKeywords([...localKeywords, trimmed]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRemoveKeyword = (idx) => {
    setLocalKeywords(localKeywords.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave(localAgencies, localKeywords);
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className={cn("font-medium text-xs mb-2", 
          isPastel ? "text-[#E8E9F0]" :
          isDark ? "text-white" : "text-gray-900")}>Filter by Agencies</h4>
        <div className="space-y-1.5">
          {AGENCIES.map((agency) => (
            <div key={agency.id} className="flex items-center gap-2">
              <Checkbox
                id={agency.id}
                checked={localAgencies.includes(agency.id)}
                onCheckedChange={() => handleToggleAgency(agency.id)}
              />
              <Label htmlFor={agency.id} className={cn("text-xs cursor-pointer", 
                isPastel ? "text-[#D0D2E0]" :
                isDark ? "text-neutral-300" : "text-gray-700")}>
                {agency.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <Label className={cn("text-xs mb-1 block", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-400" : "text-gray-600")}>
          Filter Keywords
        </Label>
        <div className="flex flex-wrap gap-1 mb-2">
          {localKeywords.map((keyword, idx) => (
            <span 
              key={idx} 
              className={cn(
                "text-[10px] px-2 py-0.5 border inline-flex items-center gap-1 transition-colors",
                isPastel
                  ? "bg-[#2B2D42] border-[#4A4D6C] text-[#D0D2E0] hover:border-[#9B8B6B]"
                  : isDark 
                  ? "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-600" 
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400"
              )}
            >
              {keyword}
              <button 
                onClick={() => handleRemoveKeyword(idx)}
                className={cn("hover:text-red-500 transition-colors", 
                  isPastel ? "text-[#9B9EBC]" :
                  isDark ? "text-neutral-500" : "text-gray-500")}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type keyword and press Enter..."
          className={cn("h-7 text-xs", 
            isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-[#E8E9F0] placeholder:text-[#7B7E9C]" :
            isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
        />
      </div>

      <Button 
        size="sm" 
        onClick={handleSave}
        className="w-full text-xs"
      >
        Save Settings
      </Button>
    </div>
  );
}