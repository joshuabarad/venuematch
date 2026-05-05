/**
 * New 4-step onboarding (v2.0)
 *
 * Step 0 — Signup           (name capture / auth confirmation)
 * Step 1 — Top Genres       (9 tiles, pick ≤3)
 * Step 2 — Neighborhoods    (chip multi-select, ≤3)
 * Step 3 — This vs That     (3 head-to-head venue rounds)
 * Step 4 — Ideal Night      (chips + free text → Claude infers VenueVector)
 */

import { useState } from 'react';
import { useStore } from '../../store/index';
import { supabase, isSupabaseEnabled } from '../../lib/supabase';
import { inferUserVector } from '../../lib/claude';
import { Button, ProgressBar } from '../../components/ui/index';
import { NYC_VENUES, NEIGHBORHOODS } from '../../data/venues';
import { Music2, MapPin, Sparkles, Zap } from 'lucide-react';
import type { Venue, VenueVector } from '@venuematch/shared';

// ── Genre definitions ────────────────────────────────────────────────────────

const GENRES = [
  { id: 'electronic', label: 'Electronic', emoji: '🎛️' },
  { id: 'hip-hop',    label: 'Hip-Hop',    emoji: '🎤' },
  { id: 'rock',       label: 'Rock',       emoji: '🎸' },
  { id: 'oldies',     label: 'Oldies',     emoji: '🎶' },
  { id: 'indie',      label: 'Indie',      emoji: '🌿' },
  { id: 'pop',        label: 'Pop',        emoji: '✨' },
  { id: 'sing-alongs',label: 'Sing-Alongs',emoji: '🎙️' },
  { id: 'jazz',       label: 'Jazz',       emoji: '🎺' },
  { id: 'chill',      label: 'Chill',      emoji: '🛋️' },
];

// ── Ideal Night chips ────────────────────────────────────────────────────────

const IDEAL_NIGHT_CHIPS = [
  'Late night',
  'Good music',
  'Cocktails',
  'Meet people',
  'Dance',
  'Low key',
  'Artsy crowd',
  'NYC underground',
  'Rooftop',
  'Live music',
  'Queer-friendly',
  'Date night',
];

// ── Helper to pick seed venues for head-to-head ──────────────────────────────

function pickHeadToHeadVenues(
  neighborhoods: string[],
  round: number,
  previousWinner?: Venue,
): [Venue, Venue] {
  const pool =
    neighborhoods.length > 0
      ? NYC_VENUES.filter((v) => neighborhoods.includes(v.neighborhood))
      : NYC_VENUES;

  const safePool = pool.length >= 2 ? pool : NYC_VENUES;

  if (round === 0 || !previousWinner) {
    // First round: two random venues
    const shuffled = [...safePool].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  // Subsequent rounds: previous winner vs a contrastive venue
  const winner = previousWinner;
  const others = safePool.filter((v) => v.id !== winner.id);
  const contrast = [...others].sort(
    (a, b) =>
      Math.abs(b.energy_score - winner.energy_score) -
      Math.abs(a.energy_score - winner.energy_score),
  );
  const opponent = contrast[round % contrast.length] ?? others[0];
  return [winner, opponent];
}

// ── Onboarding shell ─────────────────────────────────────────────────────────

export function Onboarding() {
  const { onboardingStep, setOnboardingStep, completeOnboarding } = useStore();

  function goNext(n?: number) {
    setOnboardingStep(n ?? onboardingStep + 1);
  }
  function goBack() {
    setOnboardingStep(Math.max(0, onboardingStep - 1));
  }

  const steps = [
    <StepSignup key="signup" onNext={() => goNext(1)} />,
    <StepGenres key="genres" onNext={() => goNext(2)} onBack={goBack} />,
    <StepNeighborhoods key="neighborhoods" onNext={() => goNext(3)} onBack={goBack} />,
    <StepHeadToHead key="headtohead" onNext={() => goNext(4)} onBack={goBack} />,
    <StepIdealNight key="idealnight" onNext={completeOnboarding} onBack={goBack} />,
  ];

  return (
    <div className="h-dvh flex flex-col">
      <div className="px-5 pt-12 pb-3 flex-shrink-0">
        <ProgressBar step={onboardingStep} total={steps.length} />
      </div>
      <div className="flex-1 overflow-y-auto overscroll-none">
        {steps[Math.min(onboardingStep, steps.length - 1)]}
      </div>
    </div>
  );
}

// ── Step 0: Signup ───────────────────────────────────────────────────────────

function StepSignup({ onNext }: { onNext: () => void }) {
  const { setUser, user } = useStore();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      if (isSupabaseEnabled && supabase) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          setUser({ id: authUser.id, name: name.trim(), email: authUser.email ?? email });
          await supabase.from('users').upsert({
            id: authUser.id,
            name: name.trim(),
            email: authUser.email ?? email,
          });
          onNext();
          return;
        }
      }
      setUser({ id: `local_${Date.now()}`, name: name.trim(), email });
      onNext();
    } catch (err) {
      setError('Something went wrong. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="text-3xl font-bold text-white mb-2">Welcome to VenueMatch</div>
        <p className="text-soft text-sm">
          NYC nightlife, matched to your taste. Let's build your profile — takes 2 minutes.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-soft uppercase tracking-wider mb-1 block">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-brand-purple"
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
          />
        </div>
        {!isSupabaseEnabled && (
          <div>
            <label className="text-xs text-soft uppercase tracking-wider mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-brand-purple"
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            />
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!name.trim() || loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Saving…' : 'Get Started →'}
      </Button>
    </div>
  );
}

// ── Step 1: Top Genres ───────────────────────────────────────────────────────

function StepGenres({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { updatePrefs } = useStore();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev,
    );
  }

  function handleNext() {
    updatePrefs({ purposes: selected });
    onNext();
  }

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Music2 size={20} className="text-brand-purple" />
          <span className="text-xs text-soft uppercase tracking-wider">Step 1 of 4</span>
        </div>
        <h2 className="text-2xl font-bold text-white">What music moves you?</h2>
        <p className="text-soft text-sm mt-1">Pick up to 3 genres</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {GENRES.map(({ id, label, emoji }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-4 h-24 text-sm font-medium transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-brand-purple text-white shadow-lg shadow-purple-900/40'
                  : 'glass text-soft hover:text-white'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1" disabled={selected.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Neighborhood Preference ─────────────────────────────────────────

function StepNeighborhoods({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { updatePrefs } = useStore();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(n: string) {
    setSelected((prev) =>
      prev.includes(n)
        ? prev.filter((x) => x !== n)
        : prev.length < 3
        ? [...prev, n]
        : prev,
    );
  }

  function handleNext() {
    updatePrefs({ neighborhoods: selected });
    onNext();
  }

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={20} className="text-brand-purple" />
          <span className="text-xs text-soft uppercase tracking-wider">Step 2 of 4</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Where do you like to go?</h2>
        <p className="text-soft text-sm mt-1">
          Pick up to 3 neighborhoods — or skip to see all of NYC
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {NEIGHBORHOODS.map((n) => {
          const active = selected.includes(n);
          return (
            <button
              key={n}
              onClick={() => toggle(n)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-brand-purple text-white'
                  : 'glass text-soft hover:text-white'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          {selected.length === 0 ? 'Skip (show all)' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: This vs That ─────────────────────────────────────────────────────

function StepHeadToHead({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { prefs, toggleSeedVenue } = useStore();
  const [round, setRound] = useState(0);
  const [currentWinner, setCurrentWinner] = useState<Venue | undefined>(undefined);
  const [pair, setPair] = useState<[Venue, Venue]>(() =>
    pickHeadToHeadVenues(prefs.neighborhoods, 0),
  );

  const totalRounds = 3;

  function pick(venue: Venue) {
    if (round + 1 >= totalRounds) {
      toggleSeedVenue(venue.id);
      onNext();
      return;
    }
    const nextRound = round + 1;
    const nextPair = pickHeadToHeadVenues(prefs.neighborhoods, nextRound, venue);
    setCurrentWinner(venue);
    setPair(nextPair);
    setRound(nextRound);
  }

  const [venueA, venueB] = pair;

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap size={20} className="text-brand-purple" />
          <span className="text-xs text-soft uppercase tracking-wider">Step 3 of 4</span>
        </div>
        <h2 className="text-2xl font-bold text-white">This or that?</h2>
        <p className="text-soft text-sm mt-1">
          Round {round + 1} of {totalRounds} — pick the one that calls to you more
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < round
                ? 'bg-brand-purple'
                : i === round
                ? 'bg-brand-purple/50'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {[venueA, venueB].map((v) => (
          <button
            key={v.id}
            onClick={() => pick(v)}
            className="glass rounded-2xl p-5 text-left hover:border-brand-purple/50 border border-white/5 transition-all duration-200 active:scale-[0.98]"
          >
            <div
              className="w-full h-20 rounded-xl mb-3"
              style={{
                background: `linear-gradient(135deg, ${v.img_color}cc 0%, ${v.img_color} 100%)`,
              }}
            />
            <div className="font-bold text-white text-lg">{v.name}</div>
            <div className="text-soft text-sm mb-2">{v.neighborhood}</div>
            <div className="flex flex-wrap gap-1">
              {v.vibe_tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs glass px-2 py-0.5 rounded-full text-soft">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-soft text-xs mt-2 line-clamp-2">{v.description}</p>
          </button>
        ))}
      </div>

      <Button variant="ghost" onClick={onBack} className="text-center text-sm">
        ← Back
      </Button>
    </div>
  );
}

// ── Step 4: Ideal Night ──────────────────────────────────────────────────────

function StepIdealNight({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { prefs, seedVenues, setUserVectors, user } = useStore();
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleChip(chip: string) {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
    );
  }

  async function handleFinish() {
    setLoading(true);
    setError('');

    try {
      const winningVenue =
        seedVenues.length > 0
          ? (NYC_VENUES.find((v) => v.id === seedVenues[seedVenues.length - 1]) ?? null)
          : null;

      // genres stored from Step 1 in prefs.purposes
      const genres = (prefs.purposes ?? []).filter((p) =>
        GENRES.some((g) => g.id === p),
      );

      const vectors: VenueVector = await inferUserVector({
        selectedGenres: genres,
        neighborhoods: prefs.neighborhoods ?? [],
        winningVenue,
        idealNightChips: selectedChips,
        freeText: freeText.trim() || undefined,
      });

      setUserVectors(vectors);

      if (isSupabaseEnabled && supabase && user) {
        await supabase
          .from('users')
          .update({
            vectors,
            preferred_neighborhoods: prefs.neighborhoods ?? [],
            prefs,
          })
          .eq('id', user.id);
      }

      onNext();
    } catch (err) {
      console.error('inferUserVector failed:', err);
      setError('Could not build your full profile — you can always update it later.');
      const fallback: VenueVector = {
        genres: (prefs.purposes ?? []).slice(0, 3),
        vibe: [0.5, 0.5, 0.5, 0.5],
        cost: 2,
      };
      setUserVectors(fallback);
      setTimeout(onNext, 1500);
    } finally {
      setLoading(false);
    }
  }

  const canFinish =
    !loading && (selectedChips.length > 0 || freeText.trim().length > 0);

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-brand-purple" />
          <span className="text-xs text-soft uppercase tracking-wider">Step 4 of 4</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Describe your ideal night</h2>
        <p className="text-soft text-sm mt-1">
          This helps us calibrate your recommendations with AI
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {IDEAL_NIGHT_CHIPS.map((chip) => {
          const active = selectedChips.includes(chip);
          return (
            <button
              key={chip}
              onClick={() => toggleChip(chip)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-brand-purple text-white'
                  : 'glass text-soft hover:text-white'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-xs text-soft uppercase tracking-wider mb-1 block">
          In your own words (optional)
        </label>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder={`e.g. "I love late-night techno, dark rooms, and getting lost in the music"`}
          rows={3}
          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-purple resize-none"
        />
      </div>

      {error && (
        <div className="text-amber-400 text-sm glass rounded-xl px-4 py-2">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack} className="flex-1" disabled={loading}>
          Back
        </Button>
        <Button onClick={handleFinish} className="flex-1" disabled={!canFinish}>
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Building profile…
            </span>
          ) : (
            'Find my venues →'
          )}
        </Button>
      </div>
    </div>
  );
}
