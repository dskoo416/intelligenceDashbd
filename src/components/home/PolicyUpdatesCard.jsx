import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, ExternalLink, Settings } from 'lucide-react';
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
  { id: 'whitehouse', name: 'White House', types: ['fact sheet', 'executive order', 'proclamation', 'statement'] }
];

const DEFAULT_KEYWORDS = [
  'tariff', 'duties', 'section 301', 'section 232', 'safeguard',
  'export control', 'entity list', 'sanctions',
  'anti-dumping', 'countervailing',
  'battery', 'EV', 'refinery', 'steel', 'aluminum', 'graphite', 'lithium', 'rare earths'
];

export default function PolicyUpdatesCard({ theme }) {
  const isDark = theme === 'dark';
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    applyFilters(updates);
  }, [enabledAgencies, customKeywords, updates]);

  const applyFilters = (data) => {
    const filtered = data.filter(update => {
      if (!enabledAgencies.includes(update.agency)) return false;
      
      const text = (update.title + ' ' + (update.summary || '')).toLowerCase();
      return customKeywords.some(keyword => text.includes(keyword.toLowerCase()));
    });
    setFilteredUpdates(filtered);
  };

  const fetchUpdates = async () => {
    setIsLoading(true);
    
    try {
      const allUpdates = [];
      
      // Simulate Federal Register API
      const federalRegisterQuery = `tariff OR export control OR anti-dumping OR battery OR steel OR aluminum`;
      
      // Simulate fetching (in real implementation, this would call actual APIs)
      const mockUpdates = [
        {
          agency: 'ustr',
          title: 'USTR Announces Section 301 Investigation on Digital Services Taxes',
          link: 'https://ustr.gov/example1',
          date: new Date().toISOString(),
          summary: 'New tariff investigation announced on digital services taxes.',
          type: 'press release'
        },
        {
          agency: 'commerce',
          title: 'Commerce Proposes Rule on Export Controls for Advanced Computing Items',
          link: 'https://commerce.gov/example2',
          date: new Date(Date.now() - 86400000).toISOString(),
          summary: 'Proposed rule to strengthen export controls on advanced computing.',
          type: 'proposed rule'
        },
        {
          agency: 'bis',
          title: 'BIS Adds Entities to Entity List for Activities Contrary to U.S. National Security',
          link: 'https://bis.gov/example3',
          date: new Date(Date.now() - 172800000).toISOString(),
          summary: 'New entities added to the entity list.',
          type: 'notice'
        },
        {
          agency: 'treasury',
          title: 'Treasury Announces New Sanctions on Foreign Financial Institutions',
          link: 'https://treasury.gov/example4',
          date: new Date(Date.now() - 259200000).toISOString(),
          summary: 'Sanctions imposed on institutions supporting sanctioned entities.',
          type: 'notice'
        },
        {
          agency: 'whitehouse',
          title: 'Executive Order on Securing the United States\' Leadership in Battery Technology',
          link: 'https://whitehouse.gov/example5',
          date: new Date(Date.now() - 345600000).toISOString(),
          summary: 'New executive order to boost domestic battery manufacturing.',
          type: 'executive order'
        },
        {
          agency: 'commerce',
          title: 'Final Determination on Anti-Dumping Duties for Steel Products',
          link: 'https://commerce.gov/example6',
          date: new Date(Date.now() - 432000000).toISOString(),
          summary: 'Commerce issues final anti-dumping duties on imported steel.',
          type: 'rule'
        }
      ];
      
      allUpdates.push(...mockUpdates);
      
      setUpdates(allUpdates);
      localStorage.setItem('policy_updates', JSON.stringify(allUpdates));
      applyFilters(allUpdates);
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
    <div className={cn("h-full flex flex-col rounded", isDark ? "bg-[#131313] border border-[#1F1F1F] shadow-sm" : "bg-white border border-gray-300 shadow-sm")}>
      <div className={cn("flex items-center justify-between px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>POLICY UPDATES</h3>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchUpdates}
            disabled={isLoading}
            className={cn("h-4 w-4 p-0", isDark ? "hover:bg-[#1F1F1F]" : "hover:bg-gray-100")}
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                <Settings className={cn("w-2.5 h-2.5", isDark ? "text-neutral-600" : "text-gray-500")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-96", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
              <PolicySettingsContent 
                isDark={isDark}
                enabledAgencies={enabledAgencies}
                customKeywords={customKeywords}
                onSave={handleSaveSettings}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Loading policy updates...
        </div>
      ) : filteredUpdates.length === 0 ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Click refresh to load policy updates
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {filteredUpdates.map((update, idx) => (
            <a
              key={idx}
              href={update.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("block border p-1.5 transition-all", isDark ? "bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#2A2A2A]" : "bg-gray-50 border-gray-300 hover:border-gray-400")}
            >
              <div className="flex items-start justify-between gap-1">
                <h4 className={cn("text-[9px] font-medium line-clamp-2 leading-[1.2]", isDark ? "text-neutral-400" : "text-gray-900")}>
                  {update.title}
                </h4>
                <ExternalLink className={cn("w-2 h-2 flex-shrink-0 mt-0.5", isDark ? "text-neutral-700" : "text-gray-400")} />
              </div>
              <div className={cn("text-[8px] mt-0.5", isDark ? "text-neutral-700" : "text-gray-500")}>
                <span className={cn(isDark ? "text-blue-500" : "text-blue-600")}>{AGENCIES.find(a => a.id === update.agency)?.name}</span>
                <span className="mx-1">•</span>
                <span>{format(new Date(update.date), 'MMM d')}</span>
                {update.type && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{update.type}</span>
                  </>
                )}
              </div>
              {update.summary && (
                <p className={cn("text-[8px] mt-0.5 line-clamp-1 leading-[1.2]", isDark ? "text-neutral-600" : "text-gray-600")}>
                  {update.summary}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function PolicySettingsContent({ isDark, enabledAgencies, customKeywords, onSave }) {
  const [localAgencies, setLocalAgencies] = useState(enabledAgencies);
  const [localKeywords, setLocalKeywords] = useState(customKeywords.join(', '));

  const handleToggleAgency = (agencyId) => {
    if (localAgencies.includes(agencyId)) {
      setLocalAgencies(localAgencies.filter(id => id !== agencyId));
    } else {
      setLocalAgencies([...localAgencies, agencyId]);
    }
  };

  const handleSave = () => {
    const keywords = localKeywords.split(',').map(k => k.trim()).filter(Boolean);
    onSave(localAgencies, keywords);
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className={cn("font-medium text-xs mb-2", isDark ? "text-white" : "text-gray-900")}>Filter by Agencies</h4>
        <div className="space-y-1.5">
          {AGENCIES.map((agency) => (
            <div key={agency.id} className="flex items-center gap-2">
              <Checkbox
                id={agency.id}
                checked={localAgencies.includes(agency.id)}
                onCheckedChange={() => handleToggleAgency(agency.id)}
              />
              <Label htmlFor={agency.id} className={cn("text-xs cursor-pointer", isDark ? "text-neutral-300" : "text-gray-700")}>
                {agency.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <Label className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>
          Filter Keywords (comma-separated)
        </Label>
        <Input
          value={localKeywords}
          onChange={(e) => setLocalKeywords(e.target.value)}
          placeholder="tariff, export control, sanctions..."
          className={cn("mt-1 h-7 text-xs", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
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