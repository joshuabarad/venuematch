import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/index';
import { NYC_VENUES } from '../../data/venues';
import { getTonightsRec } from '../../lib/claude';
import { api } from '../../lib/api';
import { isSupabaseEnabled } from '../../lib/supabase';
import { searchTracks } from '../../lib/spotify';
import { getTrackPreviewUrl } from '../../lib/itunes';
import { audioPreview } from '../../lib/audio';
import { MatchBadge } from '../../components/ui/index';
import { MapPin, Music, Heart, RefreshCw, ChevronRight, ThumbsDown, Check, Search, X, Volume2 } from 'lucide-react';
import type { Venue, SpotifyTrack } from '@venuematch/shared';

// ── Song Search ──────────────────────────────────────────────────────────────

interface SongSearchProps {
  value: SpotifyTrack | null;
  onChange: (track: SpotifyTrack | null) => void;
}

function SongSearch({ value, onChange }: SongSearchProps) {
  const [query, setQuery] = useState(value?.name ? `${value.name} — ${value.artist}` : '');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => { audioPreview.stop(); }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (!q) { onChange(null); setResults([]); setOpen(false); return; }
    setOpen(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchTracks(q);
      setResults(res);
      setSearching(false);
    }, 350);
  }

  function handleSelect(track: SpotifyTrack) {
    audioPreview.stop();
    setHoveredId(null);
    onChange(track);
    setQuery(`${track.name} — ${track.artist}`);
    setOpen(false);
    setResults([]);
  }

  function handleClear() {
    audioPreview.stop();
    onChange(null);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleTrackHoverEnter(track: SpotifyTrack) {
    setHoveredId(track.id);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(async () => {
      const url = track.preview_url ?? await getTrackPreviewUrl(track.name, track.artist);
      if (url) audioPreview.play(url);
    }, 400);
  }

  function handleTrackHoverLeave() {
    setHoveredId(null);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    audioPreview.stop();
  }

  if (value?.name && !open) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-soft">🎵 Song on repeat?</p>
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          {value.imageLg ? (
            <img src={value.imageLg} alt={value.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-lg" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
              <Music size={16} className="text-muted" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{value.name}</p>
            <p className="text-xs text-muted truncate">{value.artist}</p>
          </div>
          <button onClick={handleClear} className="text-muted hover:text-white transition-colors p-1 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2 relative">
      <p className="text-sm text-soft">🎵 Song on repeat?</p>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-3.5 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search a song or artist…"
          value={query}
          onChange={handleInput}
          onFocus={() => { if (results.length) setOpen(true); }}
          className="w-full glass rounded-xl pl-9 pr-8 py-3 text-sm outline-none placeholder:text-muted"
        />
        {(query || searching) && (
          <button onClick={handleClear} className="absolute right-3 top-3.5 text-muted hover:text-white">
            <X size={13} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#13131f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelect(track)}
              onMouseEnter={() => handleTrackHoverEnter(track)}
              onMouseLeave={handleTrackHoverLeave}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
            >
              {track.image ? (
                <img src={track.image} alt={track.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                  <Music size={12} className="text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{track.name}</p>
                <p className="text-xs text-muted truncate">{track.artist}</p>
              </div>
              {hoveredId === track.id && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="inline-block w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              )}
              {hoveredId === track.id && <Volume2 size={12} className="text-emerald-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
      {open && searching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#13131f] border border-white/10 rounded-2xl px-4 py-3 text-xs text-muted z-50">
          Searching Spotify…
        </div>
      )}
      {!value && (
        <p className="text-xs text-muted/60 italic">Hover a result to preview · click to select</p>
      )}
    </div>
  );
}

// ── Question sets (rotate daily) ─────────────────────────────────────────────

const QUESTIONS = [
  { q1: 'More dancing or more chilling?', opts1: ['Dancing hard', 'Chill vibes'], q2: 'Big crowd or intimate?', opts2: ['Big crowd', 'Intimate'] },
  { q1: "What's the energy tonight?", opts1: ['High energy', 'Mellow'], q2: 'Familiar or somewhere new?', opts2: ['My usual', 'Discover something'] },
  { q1: 'Solo mission or group night?', opts1: ['Solo / small group', 'Big group'], q2: 'How late are you staying?', opts2: ['Out early', 'All night long'] },
  { q1: 'Mood for the night?', opts1: ['Electronic / dance', 'Live music'], q2: 'Borough preference?', opts2: ['Brooklyn', 'Manhattan'] },
];

// ── Main Component ────────────────────────────────────────────────────────────

interface TonightsRecProps {
  onViewVenue: (venue: Venue) => void;
  allVenues?: Venue[];
}

type Phase = 'questions' | 'loading' | 'result';
type FeedbackAction = 'saved' | 'not_tonight';

export function TonightsRec({ onViewVenue, allVenues }: TonightsRecProps) {
  const venues = allVenues?.length ? allVenues : NYC_VENUES;
  const {
    user, getVibeVector, savedVenues, saveVenue,
    tonightsRec, setTonightsRec, lastRecDate,
    updateTonightAnswers, rejectVenue, prefs, rejectedVenues,
  } = useStore();

  const [phase, setPhase] = useState<Phase>('questions');
  const [qSet] = useState(QUESTIONS[new Date().getDay() % QUESTIONS.length]);
  const [a1, setA1] = useState<string | null>(null);
  const [a2, setA2] = useState<string | null>(null);
  const [song, setSong] = useState<SpotifyTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackAction | null>(null);

  const recVenue = tonightsRec ? venues.find((v) => v.id === tonightsRec.venueId) : null;

  useEffect(() => {
    if (lastRecDate === new Date().toDateString() && tonightsRec) setPhase('result');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGetRec() {
    if (!a1 || !a2) return;
    setPhase('loading');
    setError(null);
    const answers = {
      q1: `${qSet.q1}: ${a1}`,
      q2: `${qSet.q2}: ${a2}`,
      currentSong: song ? `${song.name} by ${song.artist}` : '',
    };
    updateTonightAnswers(answers);
    try {
      const rec = await getTonightsRec({
        vibeVector: getVibeVector(),
        answers,
        venues,
        savedVenueIds: Object.keys(savedVenues),
        prefs,
        rejectedVenues,
      });
      setTonightsRec(rec);
      setPhase('result');
    } catch {
      setError("Couldn't generate a rec right now.");
      setPhase('questions');
    }
  }

  async function handleFeedback(action: FeedbackAction) {
    setFeedback(action);
    if (action === 'saved' && recVenue) {
      saveVenue(recVenue.id, 'want_to_visit'); // optimistic
      if (isSupabaseEnabled) await api.saved.upsert(recVenue.id, 'want_to_visit');
    }
    if (action === 'not_tonight' && recVenue) {
      rejectVenue(recVenue); // optimistic
      if (isSupabaseEnabled) await api.rejections.create(recVenue.id, recVenue.music_genres, recVenue.vibe_tags);
    }
    if (tonightsRec && isSupabaseEnabled) {
      await api.recommendations.feedback(action, tonightsRec.venueId, tonightsRec.matchScore);
    }
  }

  if (phase === 'questions')
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Tonight's pick</p>
          <h2 className="text-xl font-semibold">What are you feeling?</h2>
        </div>
        {error && <p className="text-red-400 text-sm glass rounded-xl px-4 py-3">{error}</p>}
        <div className="space-y-2">
          <p className="text-sm text-soft">{qSet.q1}</p>
          <div className="grid grid-cols-2 gap-2">
            {qSet.opts1.map((opt) => (
              <button key={opt} onClick={() => setA1(opt)}
                className={`py-3 px-3 rounded-xl text-sm font-medium transition-all active:scale-95 border ${a1 === opt ? 'border-brand-purple bg-brand-purple/15 text-white' : 'glass border-transparent text-soft'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-soft">{qSet.q2}</p>
          <div className="grid grid-cols-2 gap-2">
            {qSet.opts2.map((opt) => (
              <button key={opt} onClick={() => setA2(opt)}
                className={`py-3 px-3 rounded-xl text-sm font-medium transition-all active:scale-95 border ${a2 === opt ? 'border-brand-purple bg-brand-purple/15 text-white' : 'glass border-transparent text-soft'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <SongSearch value={song} onChange={setSong} />
        <button onClick={handleGetRec} disabled={!a1 || !a2}
          className="w-full py-3.5 rounded-2xl bg-brand-purple text-white font-medium text-sm hover:bg-purple-600 active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-purple-900/30">
          Get tonight's pick ✨
        </button>
      </div>
    );

  if (phase === 'loading')
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-14 h-14 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
        <p className="font-medium text-sm">Matching your vibe to NYC…</p>
      </div>
    );

  if (phase === 'result' && recVenue)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Tonight's pick</p>
            <h2 className="text-lg font-semibold mt-0.5">Your match for tonight</h2>
          </div>
          <button onClick={() => { setPhase('questions'); setA1(null); setA2(null); setSong(null); setFeedback(null); }}
            className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden border border-brand-purple/25">
          <div className="h-32 relative overflow-hidden"
            style={!recVenue.photo ? { background: `linear-gradient(135deg, ${recVenue.img_color} 0px, #0d0d20 100%)` } : {}}>
            {recVenue.photo && <img src={recVenue.photo} alt={recVenue.name} className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <h3 className="text-xl font-bold">{recVenue.name}</h3>
                <div className="flex items-center gap-1 text-white/60 text-xs">
                  <MapPin size={10} /><span>{recVenue.neighborhood}</span>
                </div>
              </div>
              <MatchBadge score={tonightsRec?.matchScore || 85} />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-soft italic leading-relaxed">"{tonightsRec?.reason}"</p>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><Music size={10} />{recVenue.music_genres.slice(0, 2).join(', ')}</span>
            </div>
            {!feedback ? (
              <div className="flex gap-2 pt-1">
                <button onClick={() => handleFeedback('not_tonight')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl glass text-xs text-soft">
                  <ThumbsDown size={13} /> Not tonight
                </button>
                <button onClick={() => handleFeedback('saved')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl glass text-xs text-soft">
                  <Heart size={13} className={savedVenues[recVenue.id] ? 'fill-red-400 text-red-400' : ''} />
                  {savedVenues[recVenue.id] ? 'Saved' : 'Save it'}
                </button>
                <button onClick={() => onViewVenue(recVenue)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-purple/80 hover:bg-brand-purple text-xs">
                  Details <ChevronRight size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl glass text-xs text-soft">
                <Check size={13} className="text-emerald-400" />
                {feedback === 'saved' ? 'Saved to your library' : "Got it — we'll tune your next rec"}
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-muted">Refreshes daily · Tap ↺ for a new pick</p>
      </div>
    );

  return null;
}
