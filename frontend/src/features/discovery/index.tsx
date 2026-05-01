import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../store/index';
import { NYC_VENUES } from '../../data/venues';
import { enrichCuratedVenues } from '../../lib/places';
import { VenueCard } from '../../components/venue/VenueCard';
import { VenueMap } from './components/VenueMap';
import { TonightsRec } from '../tonights-pick/index';
import { LibraryPage } from '../library/index';
import { ProfilePage } from '../profile/index';
import { GroupsPage } from '../groups/index';
import { Sparkles, MapPin, Music, X, ChevronDown, Check, Users } from 'lucide-react';
import type { Venue } from '@venuematch/shared';

// ── Genre filter ──────────────────────────────────────────────────────────────

const GENRE_GROUPS = [
  { id: 'all',          label: 'All genres',      keywords: [] as string[] },
  { id: 'electronic',   label: 'Electronic',       keywords: ['house', 'techno', 'disco', 'electronic', 'ambient', 'bass', 'minimal', 'industrial', 'rave', 'noise'] },
  { id: 'hiphop',       label: 'Hip-Hop & R&B',   keywords: ['hip-hop', 'rap', 'r&b', 'soul', 'funk', 'pop'] },
  { id: 'jazz',         label: 'Jazz',             keywords: ['jazz', 'blues', 'afrobeat', 'world'] },
  { id: 'indie',        label: 'Indie & Rock',     keywords: ['indie', 'rock', 'punk', 'folk', 'acoustic', 'indie dance', 'americana', 'country', 'classic rock'] },
  { id: 'global',       label: 'Global',           keywords: ['reggae', 'dancehall', 'afrobeats', 'soca', 'latin', 'reggaeton', 'amapiano', 'afropop'] },
  { id: 'experimental', label: 'Experimental',     keywords: ['experimental', 'classical', 'avant-garde'] },
];

interface GenreDropdownProps {
  value: string;
  onChange: (id: string) => void;
}

function GenreDropdown({ value, onChange }: GenreDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = GENRE_GROUPS.find((g) => g.id === value) || GENRE_GROUPS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${value !== 'all' ? 'bg-brand-purple text-white border-brand-purple' : 'glass text-soft border-white/10 hover:text-white'}`}>
        {current.label}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-[#13131f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {GENRE_GROUPS.map((g) => (
            <button key={g.id} onClick={() => { onChange(g.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all hover:bg-white/5 ${g.id === value ? 'text-white' : 'text-soft'}`}>
              {g.label}
              {g.id === value && <Check size={13} className="text-brand-purple" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Group dropdown ────────────────────────────────────────────────────────────

interface GroupDropdownProps {
  groups: Array<{ id: string; name: string; members: unknown[] }>;
  value: string | null;
  onChange: (id: string | null) => void;
}

function GroupDropdown({ groups, value, onChange }: GroupDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = value ? groups.find((g) => g.id === value) : null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${value ? 'bg-brand-purple text-white border-brand-purple' : 'glass text-soft border-white/10 hover:text-white'}`}>
        <Users size={12} />
        {current ? current.name : 'Solo'}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-[#13131f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <button onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all hover:bg-white/5 ${!value ? 'text-white' : 'text-soft'}`}>
            Solo {!value && <Check size={13} className="text-brand-purple" />}
          </button>
          {groups.length > 0 && <div className="border-t border-white/5" />}
          {groups.map((g) => (
            <button key={g.id} onClick={() => { onChange(g.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all hover:bg-white/5 ${g.id === value ? 'text-white' : 'text-soft'}`}>
              <span className="truncate">{g.name}</span>
              <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <span className="text-xs text-muted">{(g.members as unknown[]).length}p</span>
                {g.id === value && <Check size={13} className="text-brand-purple" />}
              </span>
            </button>
          ))}
          {groups.length === 0 && <p className="px-4 py-3 text-xs text-muted">No groups yet — create one in Groups.</p>}
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// ── HomePage ──────────────────────────────────────────────────────────────────

interface HomePageProps {
  onViewVenue: (venue: Venue) => void;
}

type ActiveTab = 'discover' | 'library' | 'groups';

export function HomePage({ onViewVenue }: HomePageProps) {
  const { user, getMatchScore, groups, activeGroupId, setActiveGroup } = useStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [genreFilter, setGenreFilter] = useState('all');
  const [showRec, setShowRec] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [venues, setVenues] = useState<Venue[]>(NYC_VENUES);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    enrichCuratedVenues(NYC_VENUES).then((enriched) => setVenues(enriched));
  }, []);

  const filtered = useMemo(() => {
    let list = [...venues];
    if (genreFilter !== 'all') {
      const keywords = GENRE_GROUPS.find((g) => g.id === genreFilter)?.keywords || [];
      list = list.filter((v) => v.music_genres.some((g) => keywords.some((k) => g.toLowerCase().includes(k))));
    }
    return list.sort((a, b) => getMatchScore(b) - getMatchScore(a));
  }, [venues, genreFilter, getMatchScore]);

  const displayList = useMemo(() => {
    if (!activeVenue) return filtered;
    return [activeVenue, ...filtered.filter((v) => v.id !== activeVenue.id)];
  }, [filtered, activeVenue]);

  return (
    <div className="h-dvh flex flex-col">
      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-white/5 relative z-[1000]">
        <div className="flex items-center gap-6 px-8 pt-6 pb-3">
          <button onClick={() => setShowProfile(true)} className="flex-shrink-0 text-left group">
            <p className="text-xs text-muted uppercase tracking-widest font-semibold">Good {getGreeting()}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <h1 className="text-xl font-bold leading-tight group-hover:text-brand-purple transition-colors">
                {user?.name?.split(' ')[0] || 'Discover'}
              </h1>
              <ChevronDown size={14} className="text-muted group-hover:text-brand-purple transition-colors mt-0.5" />
            </div>
          </button>
          {activeTab === 'discover' && <GenreDropdown value={genreFilter} onChange={setGenreFilter} />}
          {activeTab === 'discover' && <GroupDropdown groups={groups} value={activeGroupId} onChange={setActiveGroup} />}
          <div className="flex-1" />
          {activeTab === 'discover' && (
            <button onClick={() => setShowRec(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-purple/20 border border-brand-purple/40 text-brand-purple text-xs font-semibold hover:bg-brand-purple/30 transition-all">
              <Sparkles size={12} /> Tonight's pick
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 px-8 pb-3">
          {(['discover', 'library', 'groups'] as ActiveTab[]).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-brand-purple text-white' : 'text-muted hover:text-soft'}`}>
              {t}
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
          <div className="relative" style={{ flex: '0 0 65%' }}>
            <VenueMap venues={filtered} activeVenueId={activeVenue?.id}
              onMarkerClick={(v) => { setActiveVenue(v); if (v) listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            {activeVenue && (
              <div className="absolute bottom-5 left-5 right-5 z-[500]">
                <div className="glass-strong rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all"
                  onClick={() => { onViewVenue(activeVenue); setActiveVenue(null); }}>
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
                      <MapPin size={10} className="flex-shrink-0" />{activeVenue.neighborhood}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">{activeVenue.music_genres.slice(0, 3).join(' · ')}</p>
                  </div>
                  <span className="text-sm text-brand-purple font-medium flex-shrink-0">View →</span>
                </div>
              </div>
            )}
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto border-l border-white/5 pb-6">
            <div className="p-5 space-y-3">
              {displayList.map((v) => <VenueCard key={v.id} venue={v} onClick={() => onViewVenue(v)} />)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <LibraryPage onViewVenue={onViewVenue} />
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <GroupsPage onViewVenue={onViewVenue} />
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
              <button onClick={() => setShowRec(false)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-white transition-all">
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
          <div className="relative w-full max-w-lg bg-[#0d0d18] rounded-3xl border border-white/10 max-h-[85dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <span className="text-base font-semibold">Profile</span>
              <button onClick={() => setShowProfile(false)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-white transition-all">
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
