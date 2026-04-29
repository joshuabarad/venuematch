import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/index.js';
import { NYC_VENUES } from '../data/venues.js';
import { enrichCuratedVenues } from '../lib/places.js';
import { VenueCard } from '../components/venue/VenueCard.jsx';
import { VenueMap } from '../components/venue/VenueMap.jsx';
import { TonightsRec } from '../components/recommendation/TonightsRec.jsx';
import { Sparkles, MapPin, Music, X } from 'lucide-react';

const GENRE_FILTERS = ['All', 'house', 'techno', 'hip-hop', 'jazz', 'indie', 'r&b', 'disco', 'electronic', 'reggae', 'experimental'];

export function HomePage({ onViewVenue }) {
  const { user, getMatchScore } = useStore();
  const [genreFilter, setGenreFilter] = useState('All');
  const [showRec, setShowRec] = useState(false);
  const [venues, setVenues] = useState(NYC_VENUES);
  const [activeVenue, setActiveVenue] = useState(null);

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

      {/* Top header bar — full width */}
      <div className="flex-shrink-0 flex items-center gap-6 px-8 pt-6 pb-4 border-b border-white/5">
        <div className="flex-shrink-0">
          <p className="text-xs text-muted uppercase tracking-widest font-semibold">Good {getGreeting()}</p>
          <h1 className="text-xl font-bold leading-tight">{user?.name?.split(' ')[0] || 'Discover'}</h1>
        </div>

        {/* Genre filters — flex-1 center */}
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {GENRE_FILTERS.map(g => (
            <button key={g} onClick={() => setGenreFilter(g)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all
                ${genreFilter === g ? 'bg-brand-purple text-white' : 'glass text-soft hover:text-white'}`}>
              {g}
            </button>
          ))}
        </div>

        {/* Right: count + tonight's pick */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <span className="text-xs text-muted">{filtered.length} venues</span>
          <button
            onClick={() => setShowRec(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-purple/20 border border-brand-purple/40 text-brand-purple text-xs font-semibold hover:bg-brand-purple/30 transition-all"
          >
            <Sparkles size={12} />
            Tonight's pick
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0">

        {/* Map — 65% */}
        <div className="relative" style={{ flex: '0 0 65%' }}>
          <VenueMap
            venues={filtered}
            activeVenueId={activeVenue?.id}
            onMarkerClick={setActiveVenue}
          />

          {/* Pin tap card */}
          {activeVenue && (
            <div className="absolute bottom-5 left-5 right-5 z-[500]">
              <div
                className="glass-strong rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all"
                onClick={() => { onViewVenue(activeVenue); setActiveVenue(null); }}
              >
                {activeVenue.photo ? (
                  <img src={activeVenue.photo} alt={activeVenue.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${activeVenue.img_color} 0%, #1a1a2e 100%)` }}>
                    <Music size={18} className="text-white/60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">{activeVenue.name}</p>
                  <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="flex-shrink-0" />
                    {activeVenue.neighborhood}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {activeVenue.music_genres.slice(0, 3).join(' · ')}
                  </p>
                </div>
                <span className="text-sm text-brand-purple font-medium flex-shrink-0">View →</span>
              </div>
            </div>
          )}
        </div>

        {/* Venue list — 35% */}
        <div className="flex-1 overflow-y-auto border-l border-white/5 pb-20">
          <div className="p-5 space-y-3">
            {filtered.map(v => (
              <VenueCard key={v.id} venue={v} onClick={() => onViewVenue(v)} />
            ))}
          </div>
        </div>
      </div>

      {/* Tonight's pick — centered modal, z-index above Leaflet */}
      {showRec && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRec(false)}
          />
          <div className="relative w-full max-w-lg bg-[#0d0d18] rounded-3xl border border-white/10 px-8 py-8 max-h-[85dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-brand-purple">
                <Sparkles size={16} />
                <span className="text-base font-semibold">Tonight's pick</span>
              </div>
              <button onClick={() => setShowRec(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-white transition-all">
                <X size={14} />
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
