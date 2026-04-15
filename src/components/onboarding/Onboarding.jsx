import { useState } from 'react';
import { useStore } from '../../store/index.js';
import { Button, Pill, ProgressBar, SectionHeader, RatingSlider } from '../ui/index.jsx';
import { VenueCardSelectable } from '../venue/VenueCard.jsx';
import { ArtistSearch } from './ArtistSearch.jsx';
import { NYC_VENUES, NEIGHBORHOODS, NIGHT_TYPES } from '../../data/venues.js';
import { ChevronRight, Music, MapPin } from 'lucide-react';

const NIGHTS = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Other'];
const TRAVEL = [
  { id: 'neighborhood', label: 'My neighborhood only', sub: 'Within 15 min walk' },
  { id: 'borough', label: 'Anywhere in my borough', sub: 'Subway ride is fine' },
  { id: 'city', label: 'Anywhere in NYC', sub: 'I go wherever the music is' },
];

export function Onboarding() {
  const { onboardingStep, setOnboardingStep, completeOnboarding } = useStore();
  function goNext(n) { setOnboardingStep(n ?? onboardingStep + 1); }
  function goBack() { setOnboardingStep(onboardingStep - 1); }
  const steps = [
    <StepSignup key="signup" onNext={() => goNext(1)} />,
    <StepPreferences key="prefs" onNext={() => goNext(2)} onBack={goBack} />,
    <StepSeedVenues key="venues" onNext={() => goNext(3)} onBack={goBack} />,
    <StepSeedArtists key="artists" onNext={() => goNext(4)} onBack={goBack} />,
    <StepRateVenues key="rate" onNext={completeOnboarding} onBack={goBack} />,
  ];
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="px-5 pt-12 pb-3 flex-shrink-0">
        <ProgressBar step={onboardingStep} total={5} />
      </div>
      <div className="flex-1 overflow-y-auto overscroll-none">
        {steps[onboardingStep]}
      </div>
    </div>
  );
}

function StepSignup({ onNext }) {
  const { setUser } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    setUser({ name: name.trim(), email: email.trim(), id: Date.now().toString() });
    onNext();
  }
  return (
    <div className="px-5 pt-6 pb-16 space-y-8 max-w-md mx-auto">
      <div className="text-center space-y-4 pt-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-purple flex items-center justify-center shadow-xl shadow-purple-900/40">
          <Music size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">VenueMatch</h1>
          <p className="text-soft mt-2">NYC nightlife, matched to your vibe</p>
        </div>
        <div className="flex justify-center gap-4 text-xs text-muted">
          <span>🎭 25 venues</span><span>·</span><span>🤖 AI recs</span><span>·</span><span>🗽 NYC only</span>
        </div>
      </div>
      <div className="space-y-3">
        <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
          className="w-full glass rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-muted" />
        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full glass rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-muted" />
      </div>
      <Button onClick={handleSubmit} disabled={!name || !email} className="w-full" size="lg">
        Build my taste graph <ChevronRight size={16} className="inline ml-1" />
      </Button>
      <p className="text-center text-xs text-muted">No social feed. No ads. Just your next great night out.</p>
    </div>
  );
}

function StepPreferences({ onNext, onBack }) {
  const { prefs, updatePrefs } = useStore();
  const [nights, setNights] = useState(prefs.nights || []);
  const [purposes, setPurposes] = useState(prefs.purposes || []);
  const [travel, setTravel] = useState(prefs.travel_radius || 'borough');
  const [neighborhoods, setNeighborhoods] = useState(prefs.neighborhoods || []);
  function toggle(arr, setArr, val) { setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]); }
  function handleNext() { updatePrefs({ nights, purposes, travel_radius: travel, neighborhoods }); onNext(); }
  return (
    <div className="px-5 pt-2 pb-28 space-y-7 max-w-md mx-auto">
      <SectionHeader label="Step 1 of 4" title="Your night out" subtitle="Tell us how you like to go out." />
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">Which nights do you go out?</p>
        <div className="flex flex-wrap gap-2">{NIGHTS.map(n => <Pill key={n} active={nights.includes(n)} onClick={() => toggle(nights, setNights, n)}>{n}</Pill>)}</div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">What are you looking for? <span className="text-muted">(up to 3)</span></p>
        <div className="flex flex-wrap gap-2">{NIGHT_TYPES.map(t => <Pill key={t.id} active={purposes.includes(t.id)} onClick={() => purposes.includes(t.id) ? toggle(purposes, setPurposes, t.id) : purposes.length < 3 ? toggle(purposes, setPurposes, t.id) : null}>{t.label}</Pill>)}</div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">How far will you travel?</p>
        <div className="space-y-2">{TRAVEL.map(t => (
          <button key={t.id} onClick={() => setTravel(t.id)}
            className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all border ${travel === t.id ? 'border-brand-purple bg-brand-purple/10' : 'glass border-transparent'}`}>
            <p className={`text-sm font-medium ${travel === t.id ? 'text-white' : 'text-soft'}`}>{t.label}</p>
            <p className="text-xs text-muted">{t.sub}</p>
          </button>
        ))}</div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">Neighborhoods <span className="text-muted">(optional)</span></p>
        <div className="flex flex-wrap gap-2">{NEIGHBORHOODS.map(n => <Pill key={n} active={neighborhoods.includes(n)} onClick={() => toggle(neighborhoods, setNeighborhoods, n)}>{n}</Pill>)}</div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={onBack} variant="secondary" className="flex-shrink-0">Back</Button>
          <Button onClick={handleNext} className="flex-1">Continue <ChevronRight size={16} className="inline ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}

function StepSeedVenues({ onNext, onBack }) {
  const { seedVenues, toggleSeedVenue } = useStore();
  const [query, setQuery] = useState('');
  const filtered = NYC_VENUES.filter(v => !query ||
    v.name.toLowerCase().includes(query.toLowerCase()) ||
    v.neighborhood.toLowerCase().includes(query.toLowerCase()) ||
    v.music_genres.some(g => g.toLowerCase().includes(query.toLowerCase())));
  return (
    <div className="px-5 pt-2 pb-32 max-w-md mx-auto">
      <SectionHeader label="Step 2 of 4" title="Your favorite spots" subtitle="Pick up to 5 NYC venues you've loved. Seeds your taste graph." />
      <input type="text" placeholder="Search by name, neighborhood, genre…" value={query} onChange={e => setQuery(e.target.value)}
        className="w-full glass rounded-2xl px-5 py-3.5 text-sm outline-none placeholder:text-muted mb-4" />
      <div className="flex justify-end mb-3">
        <span className={`text-xs font-semibold ${seedVenues.length === 5 ? 'text-brand-purple' : 'text-muted'}`}>{seedVenues.length}/5 selected</span>
      </div>
      <div className="space-y-2">{filtered.map(v => <VenueCardSelectable key={v.id} venue={v} selected={seedVenues.includes(v.id)} onToggle={() => toggleSeedVenue(v.id)} />)}</div>
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={onBack} variant="secondary" className="flex-shrink-0">Back</Button>
          <Button onClick={onNext} disabled={seedVenues.length === 0} className="flex-1">
            {seedVenues.length === 0 ? 'Pick at least 1' : `Continue (${seedVenues.length} selected)`} <ChevronRight size={16} className="inline ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepSeedArtists({ onNext, onBack }) {
  const { seedArtists, toggleSeedArtist } = useStore();
  return (
    <div className="px-5 pt-2 pb-32 max-w-md mx-auto">
      <SectionHeader label="Step 3 of 4" title="Your sound" subtitle="Pick 5 artists whose music defines your ideal night." />
      <ArtistSearch selected={seedArtists} onToggle={toggleSeedArtist} maxSelected={5} />
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={onBack} variant="secondary" className="flex-shrink-0">Back</Button>
          <Button onClick={onNext} disabled={seedArtists.length === 0} className="flex-1">
            {seedArtists.length === 0 ? 'Pick at least 1' : `Continue (${seedArtists.length} selected)`} <ChevronRight size={16} className="inline ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepRateVenues({ onNext, onBack }) {
  const { seedVenues, venueRatings, setVenueRating } = useStore();
  const [idx, setIdx] = useState(0);
  const venues = NYC_VENUES.filter(v => seedVenues.includes(v.id));
  const venue = venues[idx];
  const rating = venueRatings[venue?.id] || { music: 3, energy: 3, dance: 3, demo: 3 };
  if (!venue) { onNext(); return null; }
  function handleNext() { if (idx < venues.length - 1) setIdx(i => i + 1); else onNext(); }
  function handleBack() { if (idx > 0) setIdx(i => i - 1); else onBack(); }
  return (
    <div className="px-5 pt-2 pb-32 max-w-md mx-auto">
      <SectionHeader label={`Step 4 of 4 · Venue ${idx + 1} of ${venues.length}`} title={`Rate ${venue.name}`} subtitle="Your ratings calibrate the matching algorithm." />
      <div className="h-28 rounded-2xl mb-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${venue.img_color} 0%, #0a0a0f 100%)` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <p className="font-semibold">{venue.name}</p>
          <div className="flex items-center gap-1 text-white/60 text-xs mt-0.5"><MapPin size={10} /><span>{venue.neighborhood}</span></div>
        </div>
      </div>
      <div className="glass rounded-2xl p-5 space-y-7">
        <RatingSlider label="Music & sound" emoji="🎵" value={rating.music} onChange={v => setVenueRating(venue.id, 'music', v)} />
        <RatingSlider label="Crowd energy" emoji="⚡" value={rating.energy} onChange={v => setVenueRating(venue.id, 'energy', v)} />
        <RatingSlider label="Danceability" emoji="🕺" value={rating.dance} onChange={v => setVenueRating(venue.id, 'dance', v)} />
        <RatingSlider label="Crowd match" emoji="👥" value={rating.demo} onChange={v => setVenueRating(venue.id, 'demo', v)} />
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={handleBack} variant="secondary" className="flex-shrink-0">Back</Button>
          <Button onClick={handleNext} className="flex-1">
            {idx < venues.length - 1 ? 'Next venue →' : 'Finish & build my graph ✨'}
          </Button>
        </div>
      </div>
    </div>
  );
}
