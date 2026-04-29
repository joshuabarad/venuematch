import { useState, useEffect } from 'react';
import { useStore } from '../../store/index.js';
import { NYC_VENUES } from '../../data/venues.js';
import { getTonightsRec } from '../../lib/claude.js';
import { saveDailyRecFeedback } from '../../lib/supabase.js';
import { MatchBadge } from '../ui/index.jsx';
import { MapPin, Music, Zap, Heart, RefreshCw, ChevronRight, ThumbsDown, Check } from 'lucide-react';

const QUESTIONS = [
  { q1: 'More dancing or more chilling?', opts1: ['Dancing hard','Chill vibes'], q2: 'Big crowd or intimate?', opts2: ['Big crowd','Intimate'] },
  { q1: "What's the energy tonight?", opts1: ['High energy','Mellow'], q2: 'Familiar or somewhere new?', opts2: ['My usual','Discover something'] },
  { q1: 'Solo mission or group night?', opts1: ['Solo / small group','Big group'], q2: 'How late are you staying?', opts2: ['Out early','All night long'] },
  { q1: 'Mood for the night?', opts1: ['Electronic / dance','Live music'], q2: 'Borough preference?', opts2: ['Brooklyn','Manhattan'] },
];

export function TonightsRec({ onViewVenue, allVenues }) {
  const venues = allVenues?.length ? allVenues : NYC_VENUES;
  const { user, getVibeVector, savedVenues, saveVenue, tonightsRec, setTonightsRec, lastRecDate, updateTonightAnswers } = useStore();
  const [phase, setPhase] = useState('questions');
  const [qSet] = useState(QUESTIONS[new Date().getDay() % QUESTIONS.length]);
  const [a1, setA1] = useState(null);
  const [a2, setA2] = useState(null);
  const [song, setSong] = useState('');
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const recVenue = tonightsRec ? venues.find(v => v.id === tonightsRec.venueId) : null;
  useEffect(() => { if (lastRecDate === new Date().toDateString() && tonightsRec) setPhase('result'); }, []);
  async function handleGetRec() {
    if (!a1 || !a2) return;
    setPhase('loading'); setError(null);
    const answers = { q1: `${qSet.q1}: ${a1}`, q2: `${qSet.q2}: ${a2}`, currentSong: song };
    updateTonightAnswers(answers);
    try {
      const rec = await getTonightsRec({ vibeVector: getVibeVector(), answers, venues, savedVenueIds: Object.keys(savedVenues) });
      setTonightsRec(rec); setPhase('result');
    } catch { setError("Couldn't generate a rec right now."); setPhase('questions'); }
  }
  async function handleFeedback(action) {
    setFeedback(action);
    if (action === 'saved' && recVenue) saveVenue(recVenue.id, 'want_to_visit');
    if (user) await saveDailyRecFeedback(user.id, tonightsRec?.venueId, action, tonightsRec?.matchScore);
  }
  if (phase === 'questions') return (
    <div className="space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-muted">Tonight's pick</p><h2 className="text-xl font-semibold">What are you feeling?</h2></div>
      {error && <p className="text-red-400 text-sm glass rounded-xl px-4 py-3">{error}</p>}
      <div className="space-y-2"><p className="text-sm text-soft">{qSet.q1}</p><div className="grid grid-cols-2 gap-2">{qSet.opts1.map(opt => <button key={opt} onClick={() => setA1(opt)} className={`py-3 px-3 rounded-xl text-sm font-medium transition-all active:scale-95 border ${a1===opt?'border-brand-purple bg-brand-purple/15 text-white':'glass border-transparent text-soft'}`}>{opt}</button>)}</div></div>
      <div className="space-y-2"><p className="text-sm text-soft">{qSet.q2}</p><div className="grid grid-cols-2 gap-2">{qSet.opts2.map(opt => <button key={opt} onClick={() => setA2(opt)} className={`py-3 px-3 rounded-xl text-sm font-medium transition-all active:scale-95 border ${a2===opt?'border-brand-purple bg-brand-purple/15 text-white':'glass border-transparent text-soft'}`}>{opt}</button>)}</div></div>
      <div className="space-y-2"><p className="text-sm text-soft">🎵 Song on repeat?</p><input type="text" placeholder="Song or artist (optional)…" value={song} onChange={e => setSong(e.target.value)} className="w-full glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted" /></div>
      <button onClick={handleGetRec} disabled={!a1||!a2} className="w-full py-3.5 rounded-2xl bg-brand-purple text-white font-medium text-sm hover:bg-purple-600 active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-purple-900/30">Get tonight's pick ✨</button>
    </div>
  );
  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-15 h-15 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
      <p className="font-medium text-sm">Matching your vibe to NYC…...</p>
    </div>
  );
  if (phase === 'result' && recVenue) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-muted">Tonight's pick</p><h2 className="text-lg font-semibold mt-0.5">Your match for tonight</h2></div>
        <button onClick={() => { setPhase('questions'); setA1(null); setA2(null); setSong(''); setFeedback(null); }} className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted"><RefreshCw size={14} /></button>
      </div>
      <div className="rounded-2xl overflow-hidden border border-brand-purple/25">
        <div className="h-32 relative overflow-hidden" style={!recVenue.photo ? { background: `linear-gradient(135deg, ${recVenue.img_color} 0px, #0d0d20 100%)` } : {}}>
          {recVenue.photo && <img src={recVenue.photo} alt={recVenue.name} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div><h3 className="text-xl font-bold">{recVenue.name}</h3><div className="flex items-center gap-1 text-white/60 text-xs"><MapPin size={10} /><span>{recVenue.neighborhood}</span></div></div>
            <MatchBadge score={tonightsRec?.matchScore||85} />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-soft italic leading-relaxed">"{tonightsRec?.reason}"</p>
          <div className="flex gap-3 text-xs text-muted"><span className="flex items-center gap-1"><Music size={10}/>{recVenue.music_genres.slice(0,2).join(', ')}</span><span>·</span><span className="flex items-center gap-1"><Zap size={10}/>{recVenue.energy_score.toFixed(1)} energy</span></div>
          {!feedback?(<div className="flex gap-2 pt-1"><button onClick={() => handleFeedback('not_tonight')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl glass text-xs text-soft"><ThumbsDown size={13}/> Not tonight</button><button onClick={() => handleFeedback('saved')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl glass text-xs text-soft"><Heart size={13} className={savedVenues[recVenue.id]?'fill-red-400 text-red-400':''}/>{savedVenues[recVenue.id]?'Saved':'Save it'}</button><button onClick={() => onViewVenue(recVenue)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-purple/80 hover:bg-brand-purple text-xs">Details <ChevronRight size={13}/></button></div>):((<div className="flex items-center justify-center gap-2 py-2.5 rounded-xl glass text-xs text-soft"><Check size={13} className="text-emerald-400"/>{feedback==='saved'?'Saved to your library':'Got it — we\'ll tune your next rec'}</div>))}
        </div>
      </div>
      <p className="text-center text-xs text-muted">Refreshes daily �� Tap ↊ for a new pick</p>
    </div>
  );
  return null;
}
