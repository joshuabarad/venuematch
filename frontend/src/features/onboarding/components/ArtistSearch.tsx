import { useState, useEffect, useRef } from 'react';
import { searchArtists, getArtistTopTrack } from '../../../lib/spotify';
import { audioPreview } from '../../../lib/audio';
import { SEED_ARTISTS } from '../../../data/venues';
import type { SeedArtist } from '../../../data/venues';
import { Music, Search, X, Loader, Plus, Check, Volume2 } from 'lucide-react';
import type { UserPreferences } from '@venuematch/shared';

let enrichedSeedCache: SeedArtist[] | null = null;
let enrichPromise: Promise<SeedArtist[]> | null = null;

async function enrichSeedArtists(): Promise<SeedArtist[]> {
  if (enrichedSeedCache) return enrichedSeedCache;
  if (enrichPromise) return enrichPromise;
  enrichPromise = Promise.all(
    SEED_ARTISTS.map(async (artist) => {
      try {
        const results = await searchArtists(artist.name);
        const match = results.find((r) => r.name.toLowerCase() === artist.name.toLowerCase()) || results[0];
        if (match) {
          return { ...artist, image: match.image ?? null, genres: match.genres.length ? match.genres : artist.genres, spotifyId: match.id };
        }
      } catch { /* fall through */ }
      return artist;
    })
  ).then((results) => { enrichedSeedCache = results; return results; });
  return enrichPromise;
}

function fuzzyScore(query: string, name: string): number {
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase().trim();
  if (!q) return 0;
  if (n === q) return 1;
  if (n.startsWith(q) || q.startsWith(n)) return 0.9;
  if (n.includes(q) || q.includes(n)) return 0.8;
  const qTokens = q.split(/\s+/);
  const nTokens = n.split(/\s+/);
  if (qTokens.length === 1 && q.length >= 2) {
    const acronym = nTokens.map((t) => t[0]).join('');
    if (acronym === q) return 0.85;
  }
  const matched = qTokens.filter((qt) => nTokens.some((nt) => nt.startsWith(qt) || qt.startsWith(nt)));
  if (matched.length === qTokens.length) return 0.75;
  if (matched.length > 0) return 0.3 + (matched.length / qTokens.length) * 0.25;
  return 0;
}

interface DisplayArtist extends SeedArtist {
  source: 'spotify' | 'seed' | 'custom';
  _score?: number;
  spotifyId?: string;
}

interface ArtistCardProps {
  artist: DisplayArtist;
  isSelected: boolean;
  disabled: boolean;
  isJustAdded: boolean;
  onToggle: (artist: DisplayArtist) => void;
}

function ArtistCard({ artist, isSelected, disabled, isJustAdded, onToggle }: ArtistCardProps) {
  const [hovering, setHovering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCustom = artist.source === 'custom';

  function handleMouseEnter() {
    setHovering(true);
    hoverTimer.current = setTimeout(async () => {
      const spotifyId = artist.id?.startsWith('custom-') ? null : (artist.spotifyId || artist.id);
      const track = await getArtistTopTrack(spotifyId ?? null, artist.name);
      if (track?.preview_url) { audioPreview.play(track.preview_url); setPlaying(true); }
    }, 500);
  }

  function handleMouseLeave() {
    setHovering(false);
    setPlaying(false);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    audioPreview.stop();
  }

  return (
    <button onClick={() => onToggle(artist)} disabled={disabled}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      className={`flex items-center gap-3 px-3 py-2.5 w-full text-left transition-all rounded-xl disabled:opacity-30 ${isSelected ? 'bg-brand-purple/10' : hovering ? 'bg-white/8' : ''} ${isJustAdded ? 'animate-pulse' : ''}`}>
      <div className="relative flex-shrink-0">
        {artist.image ? (
          <img src={artist.image} alt={artist.name} className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isSelected ? 'bg-brand-purple/30' : 'bg-white/8'}`}>
            <Music size={14} className="text-brand-purple" />
          </div>
        )}
        {isSelected && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-purple flex items-center justify-center ring-2 ring-[#0a0a0f]">
            <Check size={8} className="text-white" strokeWidth={3} />
          </div>
        )}
        {playing && !isSelected && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-[#0a0a0f]">
            <Volume2 size={8} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-soft'}`}>{artist.name}</p>
        <p className="text-xs text-muted mt-0.5 truncate">
          {isCustom ? <span className="italic">custom artist</span>
            : playing
              ? <span className="text-emerald-400 flex items-center gap-1">
                  {[0, 150, 300].map((d) => <span key={d} className="inline-block w-1 h-3 bg-emerald-400 rounded-sm animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  playing preview
                </span>
              : (artist.genres || []).slice(0, 2).join(' · ') || 'artist'}
        </p>
      </div>
      <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-white/20'}`}>
        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

interface ArtistSearchProps {
  selected: string[];
  onToggle: (name: string, genres?: string[]) => void;
  maxSelected?: number;
  prefs?: UserPreferences;
  rankFn?: (artists: SeedArtist[], prefs: UserPreferences) => SeedArtist[];
}

export function ArtistSearch({ selected, onToggle, maxSelected = 5, prefs, rankFn }: ArtistSearchProps) {
  const [query, setQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<DisplayArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [seedArtists, setSeedArtists] = useState<SeedArtist[]>(() =>
    rankFn && prefs ? rankFn(enrichedSeedCache || SEED_ARTISTS, prefs) : (enrichedSeedCache || SEED_ARTISTS)
  );
  const [customArtists, setCustomArtists] = useState<DisplayArtist[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const apply = (artists: SeedArtist[]) => rankFn && prefs ? rankFn(artists, prefs) : artists;
    if (enrichedSeedCache) { setSeedArtists(apply(enrichedSeedCache)); return; }
    enrichSeedArtists().then((enriched) => setSeedArtists(apply(enriched)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setSpotifyResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchArtists(query);
      setSpotifyResults(results.map((a) => ({ ...a, energy: 3, dance: 3, source: 'spotify' as const })));
      setSearching(false);
    }, 400);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query]);

  useEffect(() => () => audioPreview.stop(), []);

  const spotifyNames = new Set(spotifyResults.map((a) => a.name.toLowerCase()));
  const customNames = new Set(customArtists.map((a) => a.name.toLowerCase()));

  const fuzzySeeds: DisplayArtist[] = query
    ? seedArtists
        .map((a) => ({ ...a, source: 'seed' as const, _score: Math.max(fuzzyScore(query, a.name), ...a.genres.map((g) => fuzzyScore(query, g) * 0.6)) }))
        .filter((a) => (a._score ?? 0) >= 0.65 && !spotifyNames.has(a.name.toLowerCase()) && !customNames.has(a.name.toLowerCase()))
        .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
    : seedArtists.filter((a) => !customNames.has(a.name.toLowerCase())).map((a) => ({ ...a, source: 'seed' as const }));

  const selectedCustom = customArtists.filter((a) => selected.includes(a.name));

  const displayList: DisplayArtist[] = query
    ? [
        ...spotifyResults,
        ...fuzzySeeds,
        ...customArtists
          .filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) && !spotifyNames.has(a.name.toLowerCase()))
      ]
    : [...selectedCustom, ...fuzzySeeds];

  const exactMatch = displayList.some((a) => a.name.toLowerCase() === query.toLowerCase());
  const bestScore = query
    ? Math.max(0, ...seedArtists.map((a) => fuzzyScore(query, a.name)), ...spotifyResults.map(() => 1))
    : 0;
  const showCustomAdd = query.length >= 2 && !searching && !exactMatch
    && !selected.includes(query) && !customNames.has(query.toLowerCase())
    && selected.length < maxSelected && bestScore < 0.75;

  function handleCustomAdd() {
    const name = query.trim();
    if (!name) return;
    const artist: DisplayArtist = { id: `custom-${name}`, name, genres: [], energy: 3, dance: 3, source: 'custom' };
    setCustomArtists((prev) => [...prev.filter((a) => a.name.toLowerCase() !== name.toLowerCase()), artist]);
    onToggle(name, []);
    setQuery('');
    setJustAdded(name);
    setTimeout(() => setJustAdded(null), 2000);
  }

  function handleToggle(artist: DisplayArtist) {
    audioPreview.stop();
    if (!selected.includes(artist.name) && selected.length >= maxSelected) return;
    if (artist.source === 'custom' && selected.includes(artist.name)) {
      setCustomArtists((prev) => prev.filter((a) => a.name !== artist.name));
    }
    onToggle(artist.name, artist.genres || []);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3.5 text-muted" />
        {searching
          ? <Loader size={14} className="absolute right-3 top-3.5 text-muted animate-spin" />
          : query && <button onClick={() => setQuery('')} className="absolute right-3 top-3.5 text-muted hover:text-soft"><X size={14} /></button>}
        <input type="text" placeholder="Search any artist or genre…" value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full glass rounded-xl pl-9 pr-8 py-3 text-sm outline-none placeholder:text-muted" />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted">
          {query
            ? spotifyResults.length > 0
              ? `${spotifyResults.length} from Spotify · ${fuzzySeeds.length} suggestions`
              : displayList.length > 0 ? `${displayList.length} best matches` : 'No matches found'
            : `${displayList.length} suggestions`}
        </span>
        <span className={`text-xs font-semibold ${selected.length === maxSelected ? 'text-brand-purple' : 'text-muted'}`}>
          {selected.length}/{maxSelected} selected
        </span>
      </div>
      <p className="text-xs text-muted/60 italic">Hover an artist to preview their top track</p>
      <div className="flex flex-col divide-y divide-white/5">
        {displayList.map((a) => (
          <ArtistCard key={a.id || a.name} artist={a}
            isSelected={selected.includes(a.name)}
            disabled={!selected.includes(a.name) && selected.length >= maxSelected}
            isJustAdded={justAdded === a.name}
            onToggle={handleToggle} />
        ))}
      </div>
      {showCustomAdd && (
        <button onClick={handleCustomAdd}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-brand-purple/40 transition-all">
          <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Plus size={14} className="text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-soft truncate">Add <span className="text-white font-medium">"{query}"</span></p>
            <p className="text-xs text-muted mt-0.5">Not found above — save as custom artist</p>
          </div>
        </button>
      )}
    </div>
  );
}
