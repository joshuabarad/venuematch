import { useState, useMemo } from 'react';
import { useStore } from '../store/index.js';
import { NYC_VENUES } from '../data/venues.js';
import { VenueCard } from '../components/venue/VenueCard.jsx';
import { TonightsRec } from '../components/recommendation/TonightsRec.jsx';
import { SectionHeader } from '../components/ui/index.jsx';
import { Search, X } from 'lucide-react';

const GENRE_FILTERS = ['All', 'house', 'techno', 'hip-hop', 'jazz', 'indie', 'r&b', 'reggae'];

export function HomePage({ onViewVenue }) {
  const { user, getMatchScore } = useStore();
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [showSearch, setShowSearch] = useState(false);

  const sorted = useMemo(() => {
    let venues = [...NYC_VENUES];
    if (genreFilter !== 'All') {
      venues = venues.filter(v => v.music_genres.some(g => g.includes(genreFilter)));
    }
    if (query) {
      const q = query.toLowerCase();
      venues = venues.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.neighborhood.toLowerCase().includes(q) ||
        v.music_genres.some(g => g.includes(q)) ||
        v.vibe_tags.some(t => t.includes(q))
      );
    }
    return venues.sort((a, b) => getMatchScore(b) - getMatchScore(a));
  }, [query, genreFilter, getMatchScore]);

  const topMatch = sorted[0];
  const restVenues = sorted.slice(1);

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-widest font-semibold">Good {getGreeting()}</p>
            <h1 className="text-2xl font-bold mt-0.5">{user?.name?.split(' ')[0] || 'Hey'} 👋</h1>
          </div>
          <button onClick={() => setShowSearch(!showSearch)}
            className="w-9 h-9 rounded-full glass flex items-center justify-center">
            {showSearch ? <X size={16} /> : <Search size={16} />}
          </button>
        </div>

        {showSearch && (
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-3.5 text-muted" />
            <input type="text" placeholder="Search venues, genres, neighborhoods…"
              value={query} onChange={e => setQuery(e.target.value)} autoFocus
              className="w-full glass rounded-xl pl-9 pr-4 py-3 text-sm outline-none placeholder:text-muted" />
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {GENRE_FILTERS.map(g => (
            <button key={g} onClick={() => setGenreFilter(g)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${genreFilter === g ? 'bg-brand-purple text-white' : 'glass text-soft hover:text-white'}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-6">
        {!query && genreFilter === 'All' && (
          <div className="glass rounded-2xl p-5">
            <TonightsRec onViewVenue={onViewVenue} />
          </div>
        )}

        {topMatch && !query && genreFilter === 'All' && (
          <div>
            <SectionHeader label="Top match for you" title="Your best fit tonight" />
            <VenueCard venue={topMatch} onClick={() => onViewVenue(topMatch)} />
          </div>
        )}

        <div>
          {query || genreFilter !== 'All' ? (
            <SectionHeader title={`${sorted.length} venue${sorted.length !== 1 ? 's' : ''}`}
              subtitle={query ? `Results for "${query}"` : `${genreFilter} venues`} />
          ) : (
            <SectionHeader label="Discover" title="Matched to your taste" />
          )}
          <div className="grid grid-cols-1 gap-3">
            {(query || genreFilter !== 'All' ? sorted : restVenues).map(v => (
              <VenueCard key={v.id} venue={v} onClick={() => onViewVenue(v)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
