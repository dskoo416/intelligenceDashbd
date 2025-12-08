import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function UpcomingMacroCalendar({ theme }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = theme === 'dark';

  const fetchCalendar = async () => {
    setIsLoading(true);
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const url = 'https://www.forexfactory.com/calendar?week=dec7.2025&permalink=true&impacts=3,2,1,0&event_types=1,2,3,4,5,7,8,9,10,11&currencies=1,2,3,4,5,6,7,8,9';
      const response = await fetch(corsProxy + encodeURIComponent(url));
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('tr.calendar__row');
      const parsedEvents = [];
      
      let currentDate = '';
      
      rows.forEach(row => {
        const dateCell = row.querySelector('.calendar__date');
        if (dateCell && dateCell.textContent.trim()) {
          currentDate = dateCell.textContent.trim();
        }
        
        const timeCell = row.querySelector('.calendar__time');
        const currencyCell = row.querySelector('.calendar__currency');
        const impactCell = row.querySelector('.calendar__impact');
        const eventCell = row.querySelector('.calendar__event');
        const forecastCell = row.querySelector('.calendar__forecast');
        const previousCell = row.querySelector('.calendar__previous');
        const actualCell = row.querySelector('.calendar__actual');
        
        if (timeCell && eventCell) {
          parsedEvents.push({
            date: currentDate || 'TBD',
            time: timeCell.textContent.trim() || 'TBD',
            currency: currencyCell ? currencyCell.textContent.trim() : '',
            impact: impactCell ? impactCell.className : '',
            event: eventCell.textContent.trim(),
            forecast: forecastCell ? forecastCell.textContent.trim() : '',
            previous: previousCell ? previousCell.textContent.trim() : '',
            actual: actualCell ? actualCell.textContent.trim() : ''
          });
        }
      });
      
      setEvents(parsedEvents.slice(0, 20));
    } catch (error) {
      console.error('Error fetching calendar:', error);
      setEvents([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const getImpactColor = (impact) => {
    if (impact.includes('high')) return '#CC4444';
    if (impact.includes('medium')) return '#D9A441';
    if (impact.includes('low')) return '#888888';
    return '#555555';
  };

  return (
    <div className={cn("h-full flex flex-col rounded", isDark ? "bg-[#131313] border border-[#1F1F1F] shadow-sm" : "bg-white border border-gray-300 shadow-sm")}>
      <div className={cn("px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <div className="flex items-center justify-between">
          <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>UPCOMING MACRO CALENDAR</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchCalendar}
            disabled={isLoading}
            className={cn("h-4 w-4 p-0", isDark ? "hover:bg-[#1F1F1F]" : "hover:bg-gray-100")}
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Loading calendar...
        </div>
      ) : events.length === 0 ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          No events available
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className={cn("flex items-center text-[8px] font-semibold uppercase tracking-wider px-2 py-1", isDark ? "bg-[#1C1C1C] text-neutral-600" : "bg-gray-200 text-gray-700")}>
            <div className="w-12">DATE</div>
            <div className="w-10">TIME</div>
            <div className="w-8">CUR</div>
            <div className="w-4">I</div>
            <div className="flex-1 min-w-0">EVENT</div>
            <div className="w-16 text-right">FCST</div>
            <div className="w-16 text-right">PREV</div>
            <div className="w-16 text-right">ACT</div>
          </div>
          <div className={cn("px-2 py-0", isDark ? "bg-[#0A0A0A]" : "bg-white")}>
            {events.map((event, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center py-[3px] text-[9px]",
                  idx < events.length - 1 && "border-b border-[#1F1F1F]"
                )}
              >
                <div className={cn("w-12 font-mono truncate", isDark ? "text-neutral-700" : "text-gray-500")}>{event.date}</div>
                <div className={cn("w-10 font-mono", isDark ? "text-neutral-600" : "text-gray-600")}>{event.time}</div>
                <div className={cn("w-8 font-mono font-semibold", isDark ? "text-neutral-500" : "text-gray-700")}>{event.currency}</div>
                <div className="w-4 flex items-center">
                  <div className="w-2 h-2" style={{ backgroundColor: getImpactColor(event.impact) }}></div>
                </div>
                <div className={cn("flex-1 min-w-0 truncate font-medium", isDark ? "text-neutral-500" : "text-gray-700")}>{event.event}</div>
                <div className={cn("w-16 text-right font-mono tabular-nums", isDark ? "text-neutral-600" : "text-gray-600")}>{event.forecast || '-'}</div>
                <div className={cn("w-16 text-right font-mono tabular-nums", isDark ? "text-neutral-600" : "text-gray-600")}>{event.previous || '-'}</div>
                <div className={cn("w-16 text-right font-mono tabular-nums font-semibold", isDark ? "text-neutral-400" : "text-gray-800")}>{event.actual || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}