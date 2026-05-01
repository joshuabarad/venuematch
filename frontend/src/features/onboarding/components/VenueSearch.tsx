import { useState, useEffect, useRef } from 'react';
import { searchVenues } from '../../../lib/places';
import { MapPin, Search, X, Loader, Check, Building2 } from 'lucide-react';
import type { CustomSeedVenue } from '@venuematch/shared';

interface VenueSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  selected: CustomSeedVenue[];
  onToggle: (venue: CustomSeedVenue) => void;
  maxSelected?: number;
}

export function VenueSearch({ query, onQueryChange, selected, onToggle, maxSelected = 5 }: VenueSearchProps) {
  const [results, setResults] = useState<CustomSeedVenue[]>([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchVenues(query);
      setResults(r);
      setSearching(false);
    }, 400);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query]);

  const selectedIds = new Set(selected.map((v) => v.id));

  function handleToggle(venue: CustomSeedVenue) {
    if (!selectedIds.has(venue.id) && selected.length >= maxSelected) return;
    onToggle(venue);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3.5 text-muted" />
        {searching
          ? <Loader size={14} className="absolute right-3 top-3.5 text-muted animate-spin" />
          : query && (
            <button onClick={() => onQueryChange('')} className="absolute right-3 top-3.5 text-muted hover:text-soft">
              <X size={14} />
            </button>
          )}
        <input type="text" placeholder="Search any NYC venue…" value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full glass rounded-xl pl-9 pr-8 py-3 text-sm outline-none placeholder:text-muted" />
      </div>
      {query.length >= 2 && (
        <p className="text-xs text-muted">
          {searching ? 'Searching…' : results.length > 0 ? `${results.length} from Google Places` : 'No venues found'}
        </p>
      )}
      {results.length > 0 && (
        <div className="flex flex-col divide-y divide-white/5">
          {results.map((venue) => {
            const isSelected = selectedIds.has(venue.id);
            const disabled = !isSelected && selected.length >= maxSelected;
            return (
              <button key={venue.id} onClick={() => handleToggle(venue)} disabled={disabled}
                className={`flex items-center gap-3 py-2.5 w-full text-left transition-all rounded-xl disabled:opacity-30 ${isSelected ? 'bg-brand-purple/10' : 'hover:bg-white/5'}`}>
                <div className="relative flex-shrink-0">
                  {venue.photo ? (
                    <img src={venue.photo} alt={venue.name} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isSelected ? 'bg-brand-purple/30' : 'bg-white/8'}`}>
                      <Building2 size={14} className="text-brand-purple" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-purple flex items-center justify-center ring-2 ring-[#0a0a0f]">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-soft'}`}>{venue.name}</p>
                  <p className="text-xs text-muted mt-0.5 flex items-center gap-1 truncate">
                    <MapPin size={10} className="flex-shrink-0" />
                    {venue.neighborhood || venue.address}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-white/20'}`}>
                  {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
