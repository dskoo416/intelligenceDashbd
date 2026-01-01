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
  'battery', 'EV', 'electric vehicle', 'refinery', 'steel', 'aluminum', 
  'graphite', 'lithium', 'rare earths', 'semiconductor', 'chips',
  'solar', 'wind', 'renewable', 'critical minerals', 'supply chain',
  'trade agreement', 'USMCA', 'dumping', 'subsidy', 'reciprocal',
  'China', 'tariff exclusion', 'tariff suspension', 'duty rate',
  'IRA', 'Inflation Reduction Act', 'CHIPS Act', 'ITC', 'DOC'
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
      const prompt = `Browse ALL of these official US government websites and find the MOST RECENT trade/industrial policy announcements from EACH agency.

TASK SUMMARY
Build a JSON object with 40-60 updates total, distributed across ALL agencies listed below:
- agency
- title
- link
- date
- summary
- type

CRITICAL: You MUST fetch from ALL agencies below, not just a few. Aim for 5-8 recent items per agency.

SITES TO SCRAPE (VISIT ALL)
You must visit and scrape ALL of these sites:
1. https://ustr.gov/about-us/policy-offices/press-office (USTR - get latest 8 items)
2. https://www.whitehouse.gov/briefings-statements/ (White House - get latest 8 items)
3. https://home.treasury.gov/news/press-releases (Treasury - get latest 8 items)
4. https://www.commerce.gov/news (Commerce - get latest 8 items)
5. https://www.bis.gov/press-room (BIS - get latest 8 items)
6. https://www.energy.gov/newsroom (DOE - get latest 8 items)
7. https://www.sec.gov/news/pressreleases (SEC - get latest 5 items)
8. https://www.ferc.gov/news-events/news (FERC - get latest 5 items)

TIMEFRAME: Last 60 days (prioritize last 30 days)

TOPICS TO INCLUDE
Include articles matching ANY of these:
- Tariffs, Section 301, Section 232, reciprocal tariffs
- Export controls, Entity List, foreign direct product rule
- Sanctions, trade restrictions, embargoes
- Anti-dumping or countervailing duties, unfair trade
- Batteries, EVs, electric vehicles, automotive
- Semiconductors, chips, CHIPS Act
- Steel, aluminum, metals, critical minerals, rare earths
- Solar, wind, renewable energy, IRA (Inflation Reduction Act)
- Supply chain, reshoring, nearshoring
- Trade agreements, USMCA, trade negotiations
- China trade policy, decoupling, national security

AGENCY IDS AND DOMAINS
Every article must use one of these agency ids and matching domains:
- "ustr"       => pages on ustr.gov
- "whitehouse" => pages on whitehouse.gov
- "treasury"   => pages on home.treasury.gov
- "commerce"   => pages on commerce.gov
- "bis"        => pages on bis.doc.gov or bis.gov
- "doe"        => pages on energy.gov
- "sec"        => pages on sec.gov
- "ferc"       => pages on ferc.gov

CRITICAL LINK LOGIC (THIS FIXES THE BUG)
You must follow these rules for the "link" field:

1) You MUST get each link by following a real article link on the official site.
2) When the article page loads, copy the URL EXACTLY as it appears in the browser address bar.
3) Do NOT guess, invent, or construct URLs by hand.
4) Do NOT shorten the URL.
5) Do NOT insert "..." anywhere in the URL.
6) Do NOT remove any path segments or query strings.
7) The URL must start with "https://" and contain the correct domain for the agency.

HARD 404 CHECK
For every link you want to return:
1) Take the exact URL you plan to use in "link".
2) Open that exact URL again in a fresh request.
3) If you see 404, "Not Found", "Page Not Found", a generic error page, or anything that is clearly not the article:
   - Do NOT include that URL.
   - Either:
     a) Find the correct working article URL for the same article and use that instead, OR
     b) Skip this article completely and choose a different one.
4) Only include links that you personally verified as working article pages.

If there is any conflict between speed and correctness, prefer CORRECT working links over speed.

FIELD RULES
For each update:

- "agency":
  One of "ustr", "whitehouse", "treasury", "commerce", "bis", "doe".

- "title":
  Exact article title copied from the page.

- "link":
  Exact working article URL from the browser address bar, after passing the hard 404 check.

- "date":
  The article's own date shown on the page, formatted as "YYYY-MM-DD".

- "summary":
  One clear sentence in your own words that explains the main announcement.

- "type":
  Exactly one of:
  "tariff"
  "export_control"
  "sanction"
  "rule"
  "notice"
  "fact_sheet"

DISTRIBUTION REQUIREMENT
- You MUST include items from ALL 8 agencies listed above
- Aim for 5-8 items per major agency (USTR, White House, Treasury, Commerce, BIS, DOE)
- Aim for 3-5 items per smaller agency (SEC, FERC)
- Total target: 40-60 updates across all agencies

FILTERING
- Only include articles from the last 60 days (prioritize last 30 days)
- Every article must match at least one of the target topics
- If uncertain about relevance but it's trade/industrial policy related, include it
- Sort by date descending (newest first)

OUTPUT FORMAT
Return ONLY this JSON structure, with no markdown and no extra text:

{
  "updates": [
    {
      "agency": "ustr",
      "title": "exact title from page",
      "link": "exact working article URL that does NOT 404",
      "date": "YYYY-MM-DD",
      "summary": "one sentence summary",
      "type": "tariff|export_control|sanction|rule|notice|fact_sheet"
    }
  ]
}

Do not add any other fields.
Do not wrap the JSON in backticks in your actual response.`;

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
    
    queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    setSettingsOpen(false);
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