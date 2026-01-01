import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, ExternalLink, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AGENCIES = [
  { id: 'ustr', name: 'USTR', rssUrl: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml' },
  { id: 'whitehouse', name: 'White House', rssUrl: 'https://www.whitehouse.gov/feed/' },
  { id: 'treasury', name: 'Treasury', rssUrl: 'https://home.treasury.gov/rss/press-releases' },
  { id: 'bis', name: 'BIS', rssUrl: 'https://www.bis.doc.gov/index.php/documents/rss-feeds/113-bis-press-releases/file' },
  { id: 'doe', name: 'DOE', rssUrl: 'https://www.energy.gov/rss/news.xml' },
  { id: 'sec', name: 'SEC', rssUrl: 'https://www.sec.gov/rss/news/press-release.xml' },
  { id: 'ferc', name: 'FERC', rssUrl: 'https://www.ferc.gov/news-events/news/rss.xml' }
];

// Keyword groups aligned to policy intelligence requirements
const KEYWORD_GROUPS = {
  trade: [
    'export control', 'sanctions', 'subsidy', 'tariff', 'tax credit',
    'industrial policy', 'critical minerals', 'supply chain', 
    'national security', 'CFIUS', 'trade remedy', 'anti-dumping',
    'countervailing duty', 'section 301', 'section 232'
  ],
  energy: [
    'battery', 'energy storage', 'EV', 'clean energy', 'grid',
    'IRA', 'Inflation Reduction Act', 'manufacturing credit', 
    'clean hydrogen', 'renewable', 'solar', 'wind'
  ],
  geopolitics: [
    'China policy', 'de-risking', 'decoupling', 'Korea-US', 
    'KORUS', 'MOTIE', 'strategic industry'
  ]
};

const DEFAULT_KEYWORDS = [
  ...KEYWORD_GROUPS.trade,
  ...KEYWORD_GROUPS.energy,
  ...KEYWORD_GROUPS.geopolitics
];

export default function PolicyUpdatesCard({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const contentRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || {};
  const enabledAgencies = settings?.policy_agencies || AGENCIES.map(a => a.id);
  const customKeywords = settings?.policy_keywords || DEFAULT_KEYWORDS;

  useEffect(() => {
    const cached = localStorage.getItem('policy_updates');
    const lastUpdate = localStorage.getItem('policy_updates_timestamp');
    if (cached) {
      const data = JSON.parse(cached);
      setUpdates(data);
      applyFilters(data);
    }
    if (lastUpdate) {
      setLastUpdated(new Date(lastUpdate));
    }
  }, []);



  useEffect(() => {
    applyFilters(updates);
  }, [enabledAgencies, customKeywords, updates]);

  const applyFilters = (data) => {
    // Apply AND logic: must match selected agency AND at least one keyword
    const filtered = data.filter(update => {
      // Agency filter (AND requirement)
      if (!enabledAgencies.includes(update.agency)) return false;
      
      // Keyword filter (AND requirement - must match at least one)
      const text = (update.title + ' ' + (update.description || '')).toLowerCase();
      const hasKeywordMatch = customKeywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      return hasKeywordMatch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setFilteredUpdates(filtered);
  };

  const parseRSS = async (url) => {
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(corsProxy + encodeURIComponent(url), {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) return [];
      
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      
      const items = xml.querySelectorAll('item, entry');
      const articles = [];
      
      items.forEach((item) => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || 
                     item.querySelector('link')?.getAttribute('href') || '';
        const description = item.querySelector('description, summary')?.textContent?.replace(/<[^>]*>/g, '') || '';
        const pubDate = item.querySelector('pubDate, published, updated')?.textContent || null;
        
        // Only include if we have a valid title and link
        if (title && link && link.startsWith('http')) {
          articles.push({ title, link, description, pubDate });
        }
      });
      
      return articles;
    } catch (error) {
      console.error('RSS parse error:', url, error);
      return [];
    }
  };

  const fetchUpdates = async () => {
    setIsLoading(true);

    try {
      const allUpdates = [];
      const enabledAgencyConfigs = AGENCIES.filter(a => enabledAgencies.includes(a.id));
      
      // Fetch from each enabled agency's RSS feed
      for (const agency of enabledAgencyConfigs) {
        const articles = await parseRSS(agency.rssUrl);
        
        articles.forEach(article => {
          allUpdates.push({
            agency: agency.id,
            title: article.title,
            link: article.link,
            date: article.pubDate ? new Date(article.pubDate).toISOString().split('T')[0] : null,
            description: article.description,
            source: agency.name
          });
        });
      }

      // Filter to last 60 days only
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 60);
      
      const recentUpdates = allUpdates.filter(u => {
        if (!u.date) return false;
        return new Date(u.date) >= cutoffDate;
      });

      // Sort by date descending
      recentUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));

      setUpdates(recentUpdates);
      localStorage.setItem('policy_updates', JSON.stringify(recentUpdates));
      localStorage.setItem('policy_updates_timestamp', new Date().toISOString());
      setLastUpdated(new Date());
      applyFilters(recentUpdates);
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
    
    queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    setSettingsOpen(false);
  };

  return (
    <div className={cn("h-full flex flex-col border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("px-3 py-2 border-b", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#262629]" : "border-gray-300")}>
        <div className="flex items-center justify-between">
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
        {lastUpdated && (
          <div className={cn("text-[9px] mt-1", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-700" : "text-gray-500")}>
            Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
          </div>
        )}
      </div>

      {filteredUpdates.length === 0 && !isLoading ? (
        <div className={cn("flex-1 flex flex-col items-center justify-center text-[10px] px-4 text-center", 
          isPastel ? "text-[#7B7E9C]" :
          isDark ? "text-neutral-600" : "text-gray-500")}>
          <div className="mb-2">No new policy actions in scope</div>
          <div className="text-[8px]">
            {updates.length === 0 ? 'Click refresh to load' : 'Adjust filters or refresh'}
          </div>
        </div>
      ) : (
        <div ref={contentRef} className={cn("flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar", 
          isPastel ? "bg-[#32354C]" :
          isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
          {filteredUpdates.map((update, idx) => (
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
                {update.title}
              </h4>
              <div className={cn("text-[9px] mt-0.5", 
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-700" : "text-gray-500")}>
                <span className={cn("font-medium",
                  isPastel ? "text-[#6B9B9B]" :
                  isDark ? "text-blue-400" : "text-blue-600")}>
                  {update.source || AGENCIES.find(a => a.id === update.agency)?.name}
                </span>
                {update.date && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{format(new Date(update.date), 'MMM d, yyyy')}</span>
                  </>
                )}
              </div>
            </a>
          ))}
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
          isDark ? "text-white" : "text-gray-900")}>Agencies (AND filter)</h4>
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
          Keywords (AND filter - must match at least one)
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