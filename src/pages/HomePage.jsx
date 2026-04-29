import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/index.js';
import { NYC_VENUES } from '../data/venues.js';
import { enrichCuratedVenues } from '../lib/places.js';
import { VenueCard } from '../components/venue/VenueCard.jsx';
import { VenueMap } from '../components/venue/VenueMap.jsx';
import { TonightsRec } from '../components/recommendation/TonightsRec.jsx';
import { LibraryPage } from './LibraryPage.jsx';
import { ProfilePage } from './ProfilePage.jsx';
import { Sparkles, MapPin, Music, X, ChevronDown } from 'lucide-react';

const GENRE_FILTERS = ['All', 'house', 'techno', 'hip-hop', 'jazz', 'indie', 'r&b', 'disco', 'electronic', 'reggae', 'experimental'];

export function HomePage({ onViewVenue }) {
  const { user, getMatchScore } = useStore();
  const [activeTab, setActiveTab] = useState('discover');
  const [genreFilter, setGenreFilter] = useState('All');
  const [showRec, setShowRec] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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

      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-white/5">

        {/* Row 1: name · genre filters · tonight's pick */}
        <div className="flex items-center gap-6 px-8 pt-6 pb-3">

          {/* User name — click to open profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex-shrink-0 text-left group"
          >
            <p className="text-xs text-muted uppercase tracking-widest font-semibold">Good {getGreeting()}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <h1 className="text-xl font-bold leading-tight group-hover:text-brand-purple transition-colors">
                {user?.name?.split(' ')[0] || 'Discover'}
              </h1>
              <ChevronDown size={14} className="text-muted group-hover:text-brand-purple transition-colors mt-0.5" />
            </div>
          </button>

          {/* Genre filters — only in Discover */}
          {activeTab === 'discover' && (
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
              {GENRE_FILTERS.map(g => (
                <button key={g} onClick={() => setGenreFilter(g)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all
                    ${genreFilter === g ? 'bg-brand-purple text-white' : 'glass text-soft hover:text-white'}`}>
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Spacer when not in discover */}
          {activeTab !== 'discover' && <div className="flex-1" />}

          {/* Tonight's pick — only in Discover */}
          {activeTab === 'discover' && (
            <button
              onClick={() => setShowRec(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-purple/20 border border-brand-purple/40 text-brand-purple text-xs font-semibold hover:bg-brand-purple/30 transition-all"
            >
              <Sparkles size={12} />
              Tonight's pick
            </button>
          )}
        </div>

        {/* Row 2: tab switcher */}
        <div className="flex items-center gap-1 px-8 pb-3">
          {[
            { id: 'discover', label: 'Discover' },
            { id: 'library',  label: 'Library'  },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all
                ${activeTab === t.id
                  ? 'bg-brand-purple text-white'
                  : 'text-muted hover:text-soft'}`}
            >
              {t.label}
            </button>
          ))}
          {activeTab === 'discover' && (
            <span className="ml-auto text-xs text-muted">{filtered.length} venues</span>
          )}
        </div>
      </div>

      {/* ── Discover: map + list ── */}
      {activeTab === 'discover' && (
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
          <div className="flex-1 overflow-y-auto border-l border-white/5 pb-6">
            <div className="p-5 space-y-3">
              {filtered.map(v => (
                <VenueCard key={v.id} venue={v} onClick={() => onViewVenue(v)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Library ── */}
      {activeTab === 'library' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <LibraryPage onViewVenue={onViewVenue} />
        </div>
      )}

      {/* ── Tonight's pick modal ── */}
      {showRec && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRec(false)} />
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

      {/* ── Profile modal ── */}
      {showProfile && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
          <div className="relative w-full max-w-lg bg-[#0d0d18] rounded-3xl border border-white/10 max-h-[85dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <span className="text-base font-semibold">Profile</span>
              <button onClick={() => setShowProfile(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>
            <ProfilePage />
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
