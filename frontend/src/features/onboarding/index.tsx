import { useState, useEffect } from 'react';
import { useStore } from '../../store/index';
import { supabase, isSupabaseEnabled } from '../../lib/supabase';
import { Button, Pill, ProgressBar, SectionHeader, RatingSlider } from '../../components/ui/index';
import { ArtistSearch } from './components/ArtistSearch';
import { VenueSearch } from './components/VenueSearch';
import { enrichCuratedVenues } from '../../lib/places';
import { NYC_VENUES, NEIGHBORHOODS, NIGHT_TYPES } from '../../data/venues';
import { ChevronRight, MapPin, Music } from 'lucide-react';
import type { Venue, UserPreferences, CustomSeedVenue } from '@venuematch/shared';

const NIGHTS = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Other'];

const PURPOSE_VENUE_WEIGHTS: Record<string, Partial<Record<keyof Venue, number>>> = {
  dancing:          { dance_score: 2, energy_score: 1 },
  live_music:       { music_score: 2 },
  low_key:          { energy_score: -1, music_score: 1 },
  discover_artists: { music_score: 2 },
  date_night:       { demo_score: 2, energy_score: -0.5 },
  group_outing:     { energy_score: 2, dance_score: 1 },
};

const PURPOSE_GENRE_KEYWORDS: Record<string, string[]> = {
  dancing:          ['house', 'techno', 'electronic', 'disco', 'dance', 'rave'],
  live_music:       ['jazz', 'rock', 'indie', 'soul', 'experimental', 'live'],
  low_key:          ['ambient', 'jazz', 'indie', 'folk', 'soul', 'acoustic'],
  date_night:       ['r&b', 'soul', 'jazz', 'pop', 'dream pop'],
  discover_artists: ['experimental', 'electronic', 'indie', 'afropop', 'afrobeats'],
  group_outing:     ['hip-hop', 'rap', 'pop', 'reggaeton', 'latin', 'afropop'],
};

function rankVenuesByPrefs(venues: Venue[], prefs: UserPreferences): Venue[] {
  if (!prefs?.purposes?.length && !prefs?.neighborhoods?.length) return venues;
  return [...venues].sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    if (prefs.neighborhoods?.length) {
      if (prefs.neighborhoods.includes(a.neighborhood)) scoreA += 3;
      if (prefs.neighborhoods.includes(b.neighborhood)) scoreB += 3;
    }
    for (const purpose of (prefs.purposes || [])) {
      const weights = PURPOSE_VENUE_WEIGHTS[purpose] || {};
      for (const [key, w] of Object.entries(weights)) {
        scoreA += ((a[key as keyof Venue] as number) || 0) * (w ?? 0);
        scoreB += ((b[key as keyof Venue] as number) || 0) * (w ?? 0);
      }
    }
    return scoreB - scoreA;
  });
}

function rankArtistsByPrefs<T extends { genres: string[] }>(artists: T[], prefs: UserPreferences): T[] {
  if (!prefs?.purposes?.length) return artists;
  const keywords = prefs.purposes.flatMap((p) => PURPOSE_GENRE_KEYWORDS[p] || []);
  if (!keywords.length) return artists;
  return [...artists].sort((a, b) => {
    const scoreA = (a.genres || []).filter((g) => keywords.some((k) => g.toLowerCase().includes(k))).length;
    const scoreB = (b.genres || []).filter((g) => keywords.some((k) => g.toLowerCase().includes(k))).length;
    return scoreB - scoreA;
  });
}

const TRAVEL = [
  { id: 'neighborhood', label: 'My neighborhood only', sub: 'Within 15 min walk' },
  { id: 'borough', label: 'Anywhere in my borough', sub: 'Subway ride is fine' },
  { id: 'city', label: 'Anywhere in NYC', sub: 'I go wherever the music is' },
];

// ── Onboarding shell ──────────────────────────────────────────────────────────

export function Onboarding() {
  const { onboardingStep, setOnboardingStep, completeOnboarding } = useStore();
  function goNext(n?: number) { setOnboardingStep(n ?? onboardingStep + 1); }
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
      <div className="flex-1 overflow-y-auto overscroll-none">{steps[onboardingStep]}</div>
    </div>
  );
}

// ── Step 1: Signup ────────────────────────────────────────────────────────────
// When Supabase is configured the user already has an account (auth gate handled it),
// so this step only collects their display name and saves it to their profile.
// Without Supabase, it's a simple local name + email capture as before.

function StepSignup({ onNext }: { onNext: () => void }) {
  const { setUser } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill from Supabase session if available
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '');
        setName(user.user_metadata?.name ?? '');
      }
    });
  }, []);

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);

    if (supabase && isSupabaseEnabled) {
      // Update display name in Supabase Auth metadata
      await supabase.auth.updateUser({ data: { name: name.trim() } });
      const { data: { user } } = await supabase.auth.getUser();
      setUser({ id: user?.id ?? Date.now().toString(), email: user?.email ?? email, name: name.trim() });
    } else {
      if (!email.trim()) { setLoading(false); return; }
      setUser({ name: name.trim(), email: email.trim(), id: Date.now().toString() });
    }

    setLoading(false);
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
        <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full glass rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-muted" />
        {/* Only show email input when not using Supabase Auth */}
        {!isSupabaseEnabled && (
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full glass rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-muted" />
        )}
      </div>
      <Button onClick={handleSubmit} disabled={loading || !name || (!isSupabaseEnabled && !email)} className="w-full" size="lg">
        {loading ? 'Saving…' : 'Build my taste graph'} <ChevronRight size={16} className="inline ml-1" />
      </Button>
      <p className="text-center text-xs text-muted">No social feed. No ads. Just your next great night out.</p>
    </div>
  );
}

// ── Step 2: Preferences ───────────────────────────────────────────────────────

function StepPreferences({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { prefs, updatePrefs } = useStore();
  const [nights, setNights] = useState<string[]>(prefs.nights || []);
  const [purposes, setPurposes] = useState<string[]>(prefs.purposes || []);
  const [travel, setTravel] = useState(prefs.travel_radius || 'borough');
  const [neighborhoods, setNeighborhoods] = useState<string[]>(prefs.neighborhoods || []);

  function toggle<T>(arr: T[], setArr: (v: T[]) => void, val: T) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }
  function handleNext() { updatePrefs({ nights, purposes, travel_radius: travel, neighborhoods }); onNext(); }

  return (
    <div className="px-5 pt-2 pb-28 space-y-7 max-w-md mx-auto">
      <SectionHeader label="Step 1 of 4" title="Your night out" subtitle="Tell us how you like to go out." />
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">Which nights do you go out?</p>
        <div className="flex flex-wrap gap-2">
          {NIGHTS.map((n) => <Pill key={n} active={nights.includes(n)} onClick={() => toggle(nights, setNights, n)}>{n}</Pill>)}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">What are you looking for? <span className="text-muted">(up to 3)</span></p>
        <div className="flex flex-wrap gap-2">
          {NIGHT_TYPES.map((t) => (
            <Pill key={t.id} active={purposes.includes(t.id)}
              onClick={() => purposes.includes(t.id) ? toggle(purposes, setPurposes, t.id) : purposes.length < 3 ? toggle(purposes, setPurposes, t.id) : undefined}>
              {t.label}
            </Pill>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">How far will you travel?</p>
        <div className="space-y-2">
          {TRAVEL.map((t) => (
            <button key={t.id} onClick={() => setTravel(t.id)}
              className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all border ${travel === t.id ? 'border-brand-purple bg-brand-purple/10' : 'glass border-transparent'}`}>
              <p className={`text-sm font-medium ${travel === t.id ? 'text-white' : 'text-soft'}`}>{t.label}</p>
              <p className="text-xs text-muted">{t.sub}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">Neighborhoods <span className="text-muted">(optional)</span></p>
        <div className="flex flex-wrap gap-2">
          {NEIGHBORHOODS.map((n) => <Pill key={n} active={neighborhoods.includes(n)} onClick={() => toggle(neighborhoods, setNeighborhoods, n)}>{n}</Pill>)}
        </div>
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

// ── Step 3: Seed Venues ───────────────────────────────────────────────────────

function StepSeedVenues({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { seedVenues, toggleSeedVenue, customSeedVenues, toggleCustomSeedVenue, prefs } = useStore();
  const [query, setQuery] = useState('');
  const [curatedVenues, setCuratedVenues] = useState<Venue[]>(() => rankVenuesByPrefs(NYC_VENUES, prefs));
  const totalSelected = seedVenues.length + customSeedVenues.length;
  const isSearching = query.length >= 2;

  useEffect(() => {
    enrichCuratedVenues(NYC_VENUES).then((enriched) => setCuratedVenues(rankVenuesByPrefs(enriched, prefs)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <VenueSearch query={query} onQueryChange={setQuery} selected={customSeedVenues}
        onToggle={toggleCustomSeedVenue} maxSelected={5 - seedVenues.length} />
      {!isSearching && (
        <>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-muted">suggested spots</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {curatedVenues.map((v) => {
              const isSelected = seedVenues.includes(v.id);
              const disabled = !isSelected && totalSelected >= 5;
              return (
                <button key={v.id} onClick={() => toggleSeedVenue(v.id)} disabled={disabled}
                  className={`flex items-center gap-3 py-2.5 w-full text-left transition-all rounded-xl disabled:opacity-30 ${isSelected ? 'bg-brand-purple/10' : 'hover:bg-white/5'}`}>
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
                  <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-white/20'}`}>
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
            {totalSelected === 0 ? 'Pick at least 1' : `Continue (${totalSelected} selected)`}
            <ChevronRight size={16} className="inline ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Seed Artists ──────────────────────────────────────────────────────

function StepSeedArtists({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { seedArtists, toggleSeedArtist, prefs } = useStore();
  return (
    <div className="px-5 pt-2 pb-32 max-w-md mx-auto">
      <SectionHeader label="Step 3 of 4" title="Your sound" subtitle="Pick 5 artists whose music defines your ideal night." />
      <ArtistSearch selected={seedArtists} onToggle={toggleSeedArtist} maxSelected={5}
        prefs={prefs} rankFn={rankArtistsByPrefs} />
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={onBack} variant="secondary" className="flex-shrink-0">Back</Button>
          <Button onClick={onNext} disabled={seedArtists.length === 0} className="flex-1">
            {seedArtists.length === 0 ? 'Pick at least 1' : `Continue (${seedArtists.length} selected)`}
            <ChevronRight size={16} className="inline ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 5: Rate Venues ───────────────────────────────────────────────────────

function StepRateVenues({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { seedVenues, venueRatings, setVenueRating } = useStore();
  const [idx, setIdx] = useState(0);
  const venues = NYC_VENUES.filter((v) => seedVenues.includes(v.id));
  const venue = venues[idx];
  const rating = venueRatings[venue?.id] || { music: 3, energy: 3, dance: 3, demo: 3 };

  if (!venue) { onNext(); return null; }

  function handleNext() { if (idx < venues.length - 1) setIdx((i) => i + 1); else onNext(); }
  function handleBack() { if (idx > 0) setIdx((i) => i - 1); else onBack(); }

  return (
    <div className="px-5 pt-2 pb-32 max-w-md mx-auto">
      <SectionHeader label={`Step 4 of 4 · Venue ${idx + 1} of ${venues.length}`}
        title={`Rate ${venue.name}`} subtitle="Your ratings calibrate the matching algorithm." />
      <div className="h-28 rounded-2xl mb-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${venue.img_color} 0%, #0a0a0f 100%)` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <p className="font-semibold">{venue.name}</p>
          <div className="flex items-center gap-1 text-white/60 text-xs mt-0.5">
            <MapPin size={10} /><span>{venue.neighborhood}</span>
          </div>
        </div>
      </div>
      <div className="glass rounded-2xl p-5 space-y-7">
        <RatingSlider label="Music & sound" emoji="🎵" value={rating.music} onChange={(v) => setVenueRating(venue.id, 'music', v)} />
        <RatingSlider label="Crowd energy" emoji="⚡" value={rating.energy} onChange={(v) => setVenueRating(venue.id, 'energy', v)} />
        <RatingSlider label="Danceability" emoji="🕺" value={rating.dance} onChange={(v) => setVenueRating(venue.id, 'dance', v)} />
        <RatingSlider label="Crowd match" emoji="👥" value={rating.demo} onChange={(v) => setVenueRating(venue.id, 'demo', v)} />
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
