import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/index.js';
import { NYC_VENUES } from '../data/venues.js';
import { enrichCuratedVenues } from '../lib/places.js';
import { VenueCard } from '../components/venue/VenueCard.jsx';
import { VenueMap } from '../components/venue/VenueMap.jsx';
import { TonightsRec } from '../components/recommendation/TonightsRec.jsx';
import { LibraryPage } from './LibraryPage.jsx';
import { ProfilePage } from './ProfilePage.jsx';
import { GroupsPage } from './GroupsPage.jsx';
import { FlarePage } from './FlarePage';
import { Sparkles, MapPin, Music, X, ChevronDown, Check, Users, Flame } from 'lucide-react';

// Broad genre groups → which venue music_genre strings they match
const GENRE_GROUPS = [
  { id: 'all',        label: 'All genres',      keywords: [] },
  { id: 'electronic', label: 'Electronic',       keywords: ['house', 'techno', 'disco', 'electronic', 'ambient', 'bass', 'minimal', 'industrial', 'rave', 'noise'] },
  { id: 'hiphop',     label: 'Hip-Hop & R&B',   keywords: ['hip-hop', 'rap', 'r&b', 'soul', 'funk', 'pop'] },
  { id: 'jazz',       label: 'Jazz',             keywords: ['jazz', 'blues', 'afrobeat', 'world'] },
  { id: 'indie',      label: 'Indie & Rock',     keywords: ['indie', 'rock', 'punk', 'folk', 'acoustic', 'indie dance', 'americana', 'country', 'classic rock'] },
  { id: 'global',     label: 'Global',           keywords: ['reggae', 'dancehall', 'afrobeats', 'soca', 'latin', 'reggaeton', 'amapiano', 'afropop'] },
  { id: 'experimental', label: 'Experimental',   keywords: ['experimental', 'classical', 'avant-garde'] },
];

function GenreDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = GENRE_GROUPS.find(g => g.id === value) || GENRE_GROUPS[0];

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border
          ${value !== 'all'
            ? 'bg-brand-purple text-white border-brand-purple'
            : 'glass text-soft border-white/10 hover:text-white'}`}
      >
        {current.label}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-[var(--bg-popup)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {GENRE_GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => { onChange(g.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all hover:bg-white/5
                ${g.id === value ? 'text-white' : 'text-soft'}`}
            >
              {g.label}
              {g.id === value && <Check size={13} className="text-brand-purple" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupDropdown({ groups, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = value ? groups.find(g => g.id === value) : null;

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border
          ${value
            ? 'bg-brand-purple text-white border-brand-purple'
            : 'glass text-soft border-white/10 hover:text-white'}`}
      >
        <Users size={12} />
        {current ? current.name : 'Solo'}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-[var(--bg-popup)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all hover:bg-white/5 ${!value ? 'text-white' : 'text-soft'}`}
          >
            Solo {!value && <Check size={13} className="text-brand-purple" />}
          </button>
          {groups.length > 0 && <div className="border-t border-white/5" />}
          {groups.map(g => (
            <button key={g.id}
              onClick={() => { onChange(g.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all hover:bg-white/5 ${g.id === value ? 'text-white' : 'text-soft'}`}
            >
              <span className="truncate">{g.name}</span>
              <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <span className="text-xs text-muted">{g.members.length}p</span>
                {g.id === value && <Check size={13} className="text-brand-purple" />}
              </span>
            </button>
          ))}
          {groups.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted">No groups yet — create one in Groups.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function HomePage({ onViewVenue }) {
  const { user, getMatchScore, groups, activeGroupId, setActiveGroup, theme } = useStore();
  const [activeTab, setActiveTab] = useState('discover');
  const [genreFilter, setGenreFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState([]); // array of selected neighborhoods
  const [showRec, setShowRec] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [venues, setVenues] = useState(NYC_VENUES);
  const [activeVenue, setActiveVenue] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    enrichCuratedVenues(NYC_VENUES).then(enriched => setVenues(enriched));
  }, []);

  const neighborhoods = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const v of venues) {
      if (!seen.has(v.neighborhood)) { seen.add(v.neighborhood); result.push(v.neighborhood); }
    }
    return result.sort();
  }, [venues]);

  const filtered = useMemo(() => {
    let list = [...venues];
    // Genre filter only applies when no neighborhoods selected — neighborhood mode
    // shows all venue types within the area rather than double-filtering
    if (genreFilter !== 'all' && neighborhoodFilter.length === 0) {
      const keywords = GENRE_GROUPS.find(g => g.id === genreFilter)?.keywords || [];
      list = list.filter(v => v.music_genres.some(g => keywords.some(k => g.toLowerCase().includes(k))));
    }
    if (neighborhoodFilter.length > 0) {
      list = list.filter(v => neighborhoodFilter.includes(v.neighborhood));
    }
    return list.sort((a, b) => getMatchScore(b) - getMatchScore(a));
  }, [venues, genreFilter, neighborhoodFilter, getMatchScore]);

  const scores = useMemo(
    () => Object.fromEntries(venues.map(v => [v.id, getMatchScore(v)])),
    [venues, getMatchScore]
  );

  const displayList = useMemo(() => {
    if (!activeVenue) return filtered;
    return [activeVenue, ...filtered.filter(v => v.id !== activeVenue.id)];
  }, [filtered, activeVenue]);

  return (
    <div className="h-dvh flex flex-col">

      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-white/5 relative z-[1000]">

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

          {/* Genre dropdown — only in Discover */}
          {activeTab === 'discover' && (
            <GenreDropdown value={genreFilter} onChange={setGenreFilter} />
          )}

          {/* Group context dropdown — only in Discover */}
          {activeTab === 'discover' && (
            <GroupDropdown groups={groups} value={activeGroupId} onChange={setActiveGroup} />
          )}

          <div className="flex-1" />

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
            { id: 'groups',   label: 'Groups'   },
            { id: 'flare',    label: 'Flare'    },
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
            <span className="ml-auto text-xs text-muted flex items-center gap-1">
              {activeTab === 'flare' && <Flame size={12} className="text-orange-400" />}
              {neighborhoodFilter.length > 0
                ? `${filtered.length} in ${neighborhoodFilter.length === 1 ? neighborhoodFilter[0] : `${neighborhoodFilter.length} areas`}`
                : `${filtered.length} venues`}
            </span>
          )}
        </div>

        {/* Row 3: neighborhood filter pills — Discover only */}
        {activeTab === 'discover' && (
          <div className="flex items-center gap-2 px-8 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setNeighborhoodFilter([])}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border
                ${neighborhoodFilter.length === 0
                  ? 'bg-white/10 text-white border-white/20'
                  : 'text-muted border-white/8 hover:text-soft'}`}
            >
              All areas
            </button>
            {neighborhoods.map(n => {
              const active = neighborhoodFilter.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => setNeighborhoodFilter(f =>
                    active ? f.filter(x => x !== n) : [...f, n]
                  )}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border
                    ${active
                      ? 'bg-brand-teal/20 text-brand-teal border-brand-teal/40'
                      : 'text-muted border-white/8 hover:text-soft'}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Discover: map + list ── */}
      {activeTab === 'discover' && (
        <div className="flex flex-1 min-h-0">

          {/* Map — 65% */}
          <div className="relative" style={{ flex: '0 0 65%' }}>
            <VenueMap
              venues={filtered}
              scores={scores}
              theme={theme}
              activeVenueId={activeVenue?.id}
              onMarkerClick={(v) => { setActiveVenue(v); if (v) listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
          <div ref={listRef} className="flex-1 overflow-y-auto border-l border-white/5 pb-6">
            <div className="p-5 space-y-3">
              {displayList.map(v => (
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

      {/* ── Groups ── */}
      {activeTab === 'groups' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <GroupsPage onViewVenue={onViewVenue} />
        </div>
      )}

      {/* ── Flare ── */}
      {activeTab === 'flare' && (
        <div className="flex-1 overflow-auto">
          <FlarePage />
        </div>
      )}

      {/* ── Tonight's pick modal ── */}
      {showRec && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRec(false)} />
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-3xl border border-white/10 px-8 py-8 max-h-[85dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-brand-purple">
                <Sparkles size={16} />
                <span className="text-base font-semibold">Tonight's pick</span>
              </div>
              <button onClick={() => setShowRec(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>
            <TonightsRec allVenues={venues} onViewVenue={(v) => { setShowRec(false); onViewVenue(v); }} />
          </div>
        </div>
      )}

      {/* ── Profile modal ── */}
      {showProfile && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-3xl border border-white/10 max-h-[85dvh] overflow-y-auto shadow-2xl">
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
