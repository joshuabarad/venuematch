import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/index.js';
import { NYC_VENUES } from '../data/venues.js';
import { enrichCuratedVenues } from '../lib/places.js';
import { VenueCard } from '../components/venue/VenueCard.jsx';
import { VenueMap } from '../components/venue/VenueMap.jsx';
import { TonightsRec } from '../components/recommendation/TonightsRec.jsx';
import { Sparkles, MapPin, Music, X, Map, List } from 'lucide-react';

const GENRE_FILTERS = ['All', 'house', 'techno', 'hip-hop', 'jazz', 'indie', 'r&b', 'disco', 'electronic', 'reggae', 'experimental'];

export function HomePage({ onViewVenue }) {
  const { user, getMatchScore } = useStore();
  const [genreFilter, setGenreFilter] = useState('All');
  const [showRec, setShowRec] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [venues, setVenues] = useState(NYC_VENUES);
  const [activeVenue, setActiveVenue] = useState(null); // tapped map pin

  useEffect(() => {
    enrichCuratedVenues(NYC_VENUES).then(enriched => setVenues(enriched));
  }, []);

  const filtered = useMemo(() => {
    let list = [...venues];
    if (genreFilter !== 'All') {
      list = list.filter(v => v.music_genres.some(g => g.toLowerCase().includes(genreFilter)));
    }
    return list.sort((a, b) => getMatchScore(b) - getMatchScore(a));
  }, [venues, genreFilter, getMatchScore]);

  return (
    <div className="h-dvh flex flex-col">

      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted uppercase tracking-widest font-semibold">Good {getGreeting()}</p>
            <h1 className="text-2xl font-bold mt-0.5">{user?.name?.split(' ')[0] || 'Discover'}</h1>
          </div>
          <button
            onClick={() => setShowRec(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-brand-purple/20 border border-brand-purple/40 text-brand-purple text-xs font-semibold hover:bg-brand-purple/30 transition-all"
          >
            <Sparkles size={12} />
            Tonight's pick
          </button>
        </div>

        {/* Genre filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {GENRE_FILTERS.map(g => (
            <button key={g} onClick={() => setGenreFilter(g)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all
                ${genreFilter === g ? 'bg-brand-purple text-white' : 'glass text-soft hover:text-white'}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Map / List toggle */}
      <div className="px-5 flex items-center justify-between mb-2 flex-shrink-0">
        <p className="text-xs text-muted">{filtered.length} venues</p>
        <button
          onClick={() => { setShowMap(m => !m); setActiveVenue(null); }}
          className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs text-soft hover:text-white transition-all"
        >
          {showMap ? <List size={12} /> : <Map size={12} />}
          {showMap ? 'List only' : 'Show map'}
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div className="flex-shrink-0 mx-5 mb-3 rounded-2xl overflow-hidden border border-white/8 relative" style={{ height: 240 }}>
          <VenueMap
            venues={filtered}
            activeVenueId={activeVenue?.id}
            onMarkerClick={setActiveVenue}
          />

          {/* Pin tap card — slides up from bottom of map */}
          {activeVenue && (
            <div className="absolute bottom-0 left-0 right-0 p-2.5 z-[1000]">
              <div
                className="glass-strong rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => { onViewVenue(activeVenue); setActiveVenue(null); }}
              >
                {activeVenue.photo ? (
                  <img src={activeVenue.photo} alt={activeVenue.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${activeVenue.img_color} 0%, #1a1a2e 100%)` }}>
                    <Music size={16} className="text-white/60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{activeVenue.name}</p>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <MapPin size={9} className="flex-shrink-0" />
                    {activeVenue.neighborhood}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {activeVenue.music_genres.slice(0, 2).join(' · ')}
                  </p>
                </div>
                <div className="text-xs text-brand-purple font-medium flex-shrink-0">View →</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Venue list */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(v => (
            <VenueCard key={v.id} venue={v} onClick={() => onViewVenue(v)} />
          ))}
        </div>
      </div>

      {/* Tonight's pick — bottom sheet */}
      {showRec && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRec(false)}
          />
          <div className="relative w-full max-w-md mx-auto bg-[#0d0d18] rounded-t-3xl border-t border-white/8 px-5 pt-4 pb-10 max-h-[85dvh] overflow-y-auto">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-brand-purple">
                <Sparkles size={15} />
                <span className="text-sm font-semibold">Tonight's pick</span>
              </div>
              <button onClick={() => setShowRec(false)} className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted">
                <X size={13} />
              </button>
            </div>
            <TonightsRec onViewVenue={(v) => { setShowRec(false); onViewVenue(v); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
