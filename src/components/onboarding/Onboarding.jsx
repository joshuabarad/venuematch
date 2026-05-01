import { useState, useEffect } from 'react';
import { useStore } from '../../store/index.js';
import { Button, Pill, ProgressBar, SectionHeader, LabeledSlider, GenreMultiSelect, ProductionPicker } from '../ui/index';
import { VenueCardSelectable } from '../venue/VenueCard.jsx';
import { ArtistSearch } from './ArtistSearch.jsx';
import { VenueSearch } from './VenueSearch.jsx';
import { enrichCuratedVenues } from '../../lib/places.js';
import { NYC_VENUES, NEIGHBORHOODS, NIGHT_TYPES } from '../../data/venues.js';
import { ChevronRight, Music, MapPin } from 'lucide-react';

const NIGHTS = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Other'];

// Maps user purposes → venue score weights
const PURPOSE_VENUE_WEIGHTS = {
  dancing:          { dance_score: 2,   energy_score: 1 },
  live_music:       { music_score: 2 },
  low_key:          { energy_score: -1, music_score: 1 },
  discover_artists: { music_score: 2 },
  date_night:       { demo_score: 2,    energy_score: -0.5 },
  group_outing:     { energy_score: 2,  dance_score: 1 },
};

// Maps user purposes → genre keywords for artist ranking
const PURPOSE_GENRE_KEYWORDS = {
  dancing:          ['house', 'techno', 'electronic', 'disco', 'dance', 'rave'],
  live_music:       ['jazz', 'rock', 'indie', 'soul', 'experimental', 'live'],
  low_key:          ['ambient', 'jazz', 'indie', 'folk', 'soul', 'acoustic'],
  date_night:       ['r&b', 'soul', 'jazz', 'pop', 'dream pop'],
  discover_artists: ['experimental', 'electronic', 'indie', 'afropop', 'afrobeats'],
  group_outing:     ['hip-hop', 'rap', 'pop', 'reggaeton', 'latin', 'afropop'],
};

function rankVenuesByPrefs(venues, prefs) {
  if (!prefs?.purposes?.length && !prefs?.neighborhoods?.length) return venues;
  return [...venues].sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    // Neighborhood boost
    if (prefs.neighborhoods?.length) {
      if (prefs.neighborhoods.includes(a.neighborhood)) scoreA += 3;
      if (prefs.neighborhoods.includes(b.neighborhood)) scoreB += 3;
    }
    // Purpose alignment
    for (const purpose of (prefs.purposes || [])) {
      const weights = PURPOSE_VENUE_WEIGHTS[purpose] || {};
      for (const [key, w] of Object.entries(weights)) {
        scoreA += (a[key] || 0) * w;
        scoreB += (b[key] || 0) * w;
      }
    }
    return scoreB - scoreA;
  });
}

function rankArtistsByPrefs(artists, prefs) {
  if (!prefs?.purposes?.length) return artists;
  const keywords = prefs.purposes.flatMap(p => PURPOSE_GENRE_KEYWORDS[p] || []);
  if (!keywords.length) return artists;
  return [...artists].sort((a, b) => {
    const scoreA = (a.genres || []).filter(g => keywords.some(k => g.toLowerCase().includes(k))).length;
    const scoreB = (b.genres || []).filter(g => keywords.some(k => g.toLowerCase().includes(k))).length;
    return scoreB - scoreA;
  });
}
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
    <div className="h-dvh flex flex-col">
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
  const { seedVenues, toggleSeedVenue, customSeedVenues, toggleCustomSeedVenue, prefs } = useStore();
  const [query, setQuery] = useState('');
  const [curatedVenues, setCuratedVenues] = useState(() => rankVenuesByPrefs(NYC_VENUES, prefs));
  const totalSelected = seedVenues.length + customSeedVenues.length;
  const isSearching = query.length >= 2;

  useEffect(() => {
    enrichCuratedVenues(NYC_VENUES).then(enriched => setCuratedVenues(rankVenuesByPrefs(enriched, prefs)));
  }, []);

  return (
    <div className="px-5 pt-2 pb-32 max-w-md mx-auto">
      <SectionHeader label="Step 2 of 4" title="Your favorite spots" subtitle="Search any NYC venue or pick from our curated list." />

      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-muted">{isSearching ? '' : `${curatedVenues.length} venues`}</span>
        <span className={`text-xs font-semibold ${totalSelected === 5 ? 'text-brand-purple' : 'text-muted'}`}>
          {totalSelected}/5 selected
        </span>
      </div>

      {/* Google Places search — controls visibility of curated list */}
      <VenueSearch
        query={query}
        onQueryChange={setQuery}
        selected={customSeedVenues}
        onToggle={toggleCustomSeedVenue}
        maxSelected={5 - seedVenues.length}
      />

      {/* Curated list — hidden while search is active */}
      {!isSearching && (
        <>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-muted">suggested spots</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <div className="flex flex-col divide-y divide-white/5">
            {curatedVenues.map(v => {
              const isSelected = seedVenues.includes(v.id);
              const disabled = !isSelected && totalSelected >= 5;
              return (
                <button key={v.id} onClick={() => toggleSeedVenue(v.id)} disabled={disabled}
                  className={`flex items-center gap-3 py-2.5 w-full text-left transition-all rounded-xl disabled:opacity-30
                    ${isSelected ? 'bg-brand-purple/10' : 'hover:bg-white/5'}`}>
                  <div className="relative flex-shrink-0">
                    {v.photo ? (
                      <img src={v.photo} alt={v.name} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${v.img_color} 0%, #1a1a2e 100%)` }}>
                        <MapPin size={14} className="text-white/70" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-purple flex items-center justify-center ring-2 ring-[#0a0a0f]">
                        <ChevronRight size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-soft'}`}>{v.name}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">{v.neighborhood} · {v.music_genres.slice(0, 2).join(', ')}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all
                    ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-white/20'}`}>
                    {isSelected && <ChevronRight size={8} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={onBack} variant="secondary" className="flex-shrink-0">Back</Button>
          <Button onClick={onNext} disabled={totalSelected === 0} className="flex-1">
            {totalSelected === 0 ? 'Pick at least 1' : `Continue (${totalSelected} selected)`} <ChevronRight size={16} className="inline ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepSeedArtists({ onNext, onBack }) {
  const { seedArtists, toggleSeedArtist, prefs } = useStore();
  return (
    <div className="px-5 pt-2 pb-32 max-w-md mx-auto">
      <SectionHeader label="Step 3 of 4" title="Your sound" subtitle="Pick 5 artists whose music defines your ideal night." />
      <ArtistSearch selected={seedArtists} onToggle={toggleSeedArtist} maxSelected={5} prefs={prefs} rankFn={rankArtistsByPrefs} />
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
      <div className="glass rounded-2xl p-5 space-y-6">
        <LabeledSlider label="Vibe" emoji="✨"
          value={rating.vibe ?? 3} onChange={v => setVenueRating(venue.id, 'vibe', v)}
          stops={['Cocktail lounge', 'Dive bar', 'Sports / rooftop', 'Dance spot', 'Club']} />
        <LabeledSlider label="Crowdedness" emoji="👥"
          value={rating.crowdedness ?? 3} onChange={v => setVenueRating(venue.id, 'crowdedness', v)}
          stops={['Ghost town', 'Few heads', 'Just right', 'Social', 'I have to go']} />
        <LabeledSlider label="Music" emoji="🎵"
          value={rating.music ?? 3} onChange={v => setVenueRating(venue.id, 'music', v)}
          stops={['What music?', 'Background noise', 'Needed this', "Bumpin'", 'Focal point']} />
        <GenreMultiSelect label="Genres" emoji="🎧"
          value={rating.genres ?? []} onChange={v => setVenueRating(venue.id, 'genres', v)} />
        <ProductionPicker label="Production type" emoji="🎛️"
          value={rating.production ?? null} onChange={v => setVenueRating(venue.id, 'production', v)} />
        <LabeledSlider label="Price" emoji="💸"
          value={rating.price ?? 2} onChange={v => setVenueRating(venue.id, 'price', v)}
          stops={['What a steal', 'Normal', 'Break the bank']} min={1} />
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
