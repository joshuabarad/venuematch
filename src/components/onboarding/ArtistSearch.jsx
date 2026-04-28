import { useState, useEffect, useRef } from 'react';
import { searchArtists } from '../../lib/spotify.js';
import { SEED_ARTISTS } from '../../data/venues.js';
import { Music, Search, X, Loader, Plus, Check } from 'lucide-react';

// Module-level cache — fetched once per page load
let enrichedSeedCache = null;
let enrichPromise = null;

async function enrichSeedArtists() {
  if (enrichedSeedCache) return enrichedSeedCache;
  if (enrichPromise) return enrichPromise;
  enrichPromise = Promise.all(
    SEED_ARTISTS.map(async (artist) => {
      try {
        const results = await searchArtists(artist.name);
        const match = results.find(r => r.name.toLowerCase() === artist.name.toLowerCase()) || results[0];
        if (match) {
          return { ...artist, image: match.image || null, genres: match.genres?.length ? match.genres : artist.genres };
        }
      } catch { /* fall through */ }
      return artist;
    })
  ).then(results => {
    enrichedSeedCache = results;
    return results;
  });
  return enrichPromise;
}

function fuzzyScore(query, name) {
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase().trim();
  if (!q) return 0;
  if (n === q) return 1;
  if (n.startsWith(q) || q.startsWith(n)) return 0.9;
  if (n.includes(q) || q.includes(n)) return 0.8;

  const qTokens = q.split(/\s+/);
  const nTokens = n.split(/\s+/);

  // Acronym match: "ELO" → "Electric Light Orchestra"
  if (qTokens.length === 1 && q.length >= 2) {
    const acronym = nTokens.map(t => t[0]).join('');
    if (acronym === q) return 0.85;
  }

  // Token prefix match: each query token must start a name token
  const matched = qTokens.filter(qt => nTokens.some(nt => nt.startsWith(qt) || qt.startsWith(nt)));
  if (matched.length === qTokens.length) return 0.75;
  if (matched.length > 0) return 0.3 + (matched.length / qTokens.length) * 0.25;

  return 0;
}

export function ArtistSearch({ selected, onToggle, maxSelected = 5, prefs, rankFn }) {
  const [query, setQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [seedArtists, setSeedArtists] = useState(() =>
    rankFn && prefs ? rankFn(enrichedSeedCache || SEED_ARTISTS, prefs) : (enrichedSeedCache || SEED_ARTISTS)
  );
  const [customArtists, setCustomArtists] = useState([]);
  const [justAdded, setJustAdded] = useState(null);
  const debounce = useRef(null);

  // Enrich seed artists with Spotify images/genres on first mount
  useEffect(() => {
    const apply = (artists) => rankFn && prefs ? rankFn(artists, prefs) : artists;
    if (enrichedSeedCache) { setSeedArtists(apply(enrichedSeedCache)); return; }
    enrichSeedArtists().then(enriched => setSeedArtists(apply(enriched)));
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setSpotifyResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchArtists(query);
      setSpotifyResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [query]);

  const spotifyNames = new Set(spotifyResults.map(a => a.name.toLowerCase()));
  const customNames = new Set(customArtists.map(a => a.name.toLowerCase()));

  // Fuzzy-ranked seed artists — only high-confidence matches
  const fuzzySeeds = query
    ? seedArtists
        .map(a => ({ ...a, _score: Math.max(fuzzyScore(query, a.name), ...a.genres.map(g => fuzzyScore(query, g) * 0.6)) }))
        .filter(a => a._score >= 0.65 && !spotifyNames.has(a.name.toLowerCase()) && !customNames.has(a.name.toLowerCase()))
        .sort((a, b) => b._score - a._score)
        .map(a => ({ ...a, source: 'seed' }))
    : seedArtists
        .filter(a => !customNames.has(a.name.toLowerCase()))
        .map(a => ({ ...a, source: 'seed' }));

  // Custom artist cards always appear first when not searching
  const selectedCustom = customArtists.filter(a => selected.includes(a.name));

  const displayList = query
    ? [
        ...spotifyResults.map(a => ({ ...a, source: 'spotify' })),
        ...fuzzySeeds,
        // Show custom artists that match the query too
        ...customArtists
          .filter(a => a.name.toLowerCase().includes(query.toLowerCase()) && !spotifyNames.has(a.name.toLowerCase()))
          .map(a => ({ ...a, source: 'custom' })),
      ]
    : [
        ...selectedCustom.map(a => ({ ...a, source: 'custom' })),
        ...fuzzySeeds,
      ];

  const exactMatch = displayList.some(a => a.name.toLowerCase() === query.toLowerCase());
  const bestScore = query
    ? Math.max(0, ...seedArtists.map(a => fuzzyScore(query, a.name)), ...spotifyResults.map(() => 1))
    : 0;
  const showCustomAdd =
    query.length >= 2 &&
    !searching &&
    !exactMatch &&
    !selected.includes(query) &&
    !customNames.has(query.toLowerCase()) &&
    selected.length < maxSelected &&
    bestScore < 0.75;

  function handleCustomAdd() {
    const name = query.trim();
    if (!name) return;
    const artist = { id: `custom-${name}`, name, genres: [], source: 'custom' };
    setCustomArtists(prev => [...prev.filter(a => a.name.toLowerCase() !== name.toLowerCase()), artist]);
    onToggle(name, []);
    setQuery('');
    setJustAdded(name);
    setTimeout(() => setJustAdded(null), 2000);
  }

  function handleToggle(artist) {
    if (!selected.includes(artist.name) && selected.length >= maxSelected) return;
    if (artist.source === 'custom' && selected.includes(artist.name)) {
      // Deselecting a custom artist removes it from the persistent card list
      setCustomArtists(prev => prev.filter(a => a.name !== artist.name));
    }
    onToggle(artist.name, artist.genres || []);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3.5 text-muted" />
        {searching
          ? <Loader size={14} className="absolute right-3 top-3.5 text-muted animate-spin" />
          : query && <button onClick={() => setQuery('')} className="absolute right-3 top-3.5 text-muted hover:text-soft"><X size={14} /></button>
        }
        <input type="text" placeholder="Search any artist or genre…"
          value={query} onChange={e => setQuery(e.target.value)}
          className="w-full glass rounded-xl pl-9 pr-8 py-3 text-sm outline-none placeholder:text-muted" />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted">
          {query
            ? spotifyResults.length > 0
              ? `${spotifyResults.length} from Spotify · ${fuzzySeeds.length} suggestions`
              : displayList.length > 0
                ? `${displayList.length} best matches`
                : 'No matches found'
            : `${displayList.length} suggestions`}
        </span>
        <span className={`text-xs font-semibold ${selected.length === maxSelected ? 'text-brand-purple' : 'text-muted'}`}>
          {selected.length}/{maxSelected} selected
        </span>
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {displayList.map(a => {
          const isSelected = selected.includes(a.name);
          const isCustom = a.source === 'custom';
          const isJustAdded = justAdded === a.name;
          const disabled = !isSelected && selected.length >= maxSelected;
          return (
            <button key={a.id || a.name} onClick={() => handleToggle(a)} disabled={disabled}
              className={`flex items-center gap-3 px-3 py-2.5 w-full text-left transition-all rounded-xl disabled:opacity-30
                ${isSelected ? 'bg-brand-purple/10' : 'hover:bg-white/5'}
                ${isJustAdded ? 'animate-pulse' : ''}`}>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {a.image ? (
                  <img src={a.image} alt={a.name} className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center
                    ${isSelected ? 'bg-brand-purple/30' : 'bg-white/8'}`}>
                    <Music size={14} className="text-brand-purple" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-purple flex items-center justify-center ring-2 ring-[#0a0a0f]">
                    <Check size={8} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Name + genres */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-soft'}`}>{a.name}</p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {isCustom
                    ? <span className="italic">custom artist</span>
                    : (a.genres || []).slice(0, 2).join(' · ') || 'artist'}
                </p>
              </div>

              {/* Selection ring */}
              <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all
                ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-white/20'}`}>
                {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {showCustomAdd && (
        <button
          onClick={handleCustomAdd}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-brand-purple/40 transition-all"
        >
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
