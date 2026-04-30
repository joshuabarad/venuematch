import { useState, useEffect } from 'react';
import { useStore } from '../store/index.js';
import { NYC_VENUES, NEIGHBORHOODS, NIGHT_TYPES } from '../data/venues.js';
import { SectionHeader, Divider, Pill } from '../components/ui/index.jsx';
import { ArtistSearch } from '../components/onboarding/ArtistSearch.jsx';
import { VenueSearch } from '../components/onboarding/VenueSearch.jsx';
import { enrichCuratedVenues } from '../lib/places.js';
import { buildUserVector } from '../lib/vectorRec.js';
import { VECTOR_DIMS } from '../data/venueProfiles.js';
import { Music, MapPin, RotateCcw, ChevronRight, Pencil, X, Check } from 'lucide-react';

const DIM_LABELS = {
  music_curation: 'Music quality',
  energy:         'Energy',
  dance:          'Dance',
  late_night:     'Late night',
  underground:    'Underground',
  electronic:     'Electronic',
  rnb_hiphop:     'R&B / Hip-hop',
  jazz_world:     'Jazz & world',
  live_music:     'Live music',
  queer:          'Queer spaces',
  intimate:       'Intimate',
  outdoor:        'Outdoor',
  exclusive:      'Upscale',
  chill:          'Chill vibes',
  diverse:        'Diverse crowd',
  local:          'Neighborhood',
};

const DIM_COLORS = [
  '#534AB7','#0F6E56','#993C1D','#854F0B','#1A5C8A',
  '#6B21A8','#B45309','#047857','#7C3AED','#DC2626',
  '#0369A1','#065F46','#92400E','#1D4ED8','#9D174D','#374151',
];

const NIGHTS = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Other'];
const TRAVEL = [
  { id: 'neighborhood', label: 'My neighborhood only', sub: 'Within 15 min walk' },
  { id: 'borough',      label: 'Anywhere in my borough', sub: 'Subway ride is fine' },
  { id: 'city',         label: 'Anywhere in NYC', sub: 'I go wherever the music is' },
];

// ── Edit drawer ──────────────────────────────────────────────────────────────

function EditDrawer({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d1a] border-t border-white/10 rounded-t-3xl flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{subtitle}</p>
            <h2 className="text-lg font-semibold mt-0.5">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-white">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {children}
        </div>
        <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-brand-purple text-white font-medium text-sm hover:bg-purple-600 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check size={15} /> Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section editors ──────────────────────────────────────────────────────────

function NightsEditor() {
  const { prefs, updatePrefs } = useStore();
  const [nights, setNights]           = useState(prefs.nights || []);
  const [purposes, setPurposes]       = useState(prefs.purposes || []);
  const [travel, setTravel]           = useState(prefs.travel_radius || 'borough');
  const [neighborhoods, setNeighborhoods] = useState(prefs.neighborhoods || []);

  function toggle(arr, setArr, val) {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    setArr(next);
    updatePrefs({ nights: arr === nights ? next : nights, purposes: arr === purposes ? next : purposes, travel_radius: travel, neighborhoods: arr === neighborhoods ? next : neighborhoods });
  }
  function setAndSave(key, val) {
    setTravel(val);
    updatePrefs({ nights, purposes, travel_radius: val, neighborhoods });
  }

  return (
    <div className="space-y-7 pt-2">
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">Which nights do you go out?</p>
        <div className="flex flex-wrap gap-2">
          {NIGHTS.map(n => (
            <Pill key={n} active={nights.includes(n)} onClick={() => toggle(nights, setNights, n)}>{n}</Pill>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">What are you looking for? <span className="text-muted">(up to 3)</span></p>
        <div className="flex flex-wrap gap-2">
          {NIGHT_TYPES.map(t => (
            <Pill key={t.id} active={purposes.includes(t.id)}
              onClick={() => purposes.includes(t.id) ? toggle(purposes, setPurposes, t.id) : purposes.length < 3 ? toggle(purposes, setPurposes, t.id) : null}>
              {t.label}
            </Pill>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">How far will you travel?</p>
        <div className="space-y-2">
          {TRAVEL.map(t => (
            <button key={t.id} onClick={() => setAndSave('travel_radius', t.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${travel === t.id ? 'border-brand-purple bg-brand-purple/10' : 'glass border-transparent'}`}>
              <p className={`text-sm font-medium ${travel === t.id ? 'text-white' : 'text-soft'}`}>{t.label}</p>
              <p className="text-xs text-muted">{t.sub}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-soft">Preferred neighborhoods <span className="text-muted">(optional)</span></p>
        <div className="flex flex-wrap gap-2">
          {NEIGHBORHOODS.map(n => (
            <Pill key={n} active={neighborhoods.includes(n)} onClick={() => toggle(neighborhoods, setNeighborhoods, n)}>{n}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpotsEditor() {
  const { seedVenues, toggleSeedVenue, customSeedVenues, toggleCustomSeedVenue, prefs } = useStore();
  const [query, setQuery] = useState('');
  const [curatedVenues, setCuratedVenues] = useState(NYC_VENUES);
  const totalSelected = seedVenues.length + customSeedVenues.length;
  const isSearching = query.length >= 2;

  useEffect(() => {
    enrichCuratedVenues(NYC_VENUES).then(enriched => setCuratedVenues(enriched));
  }, []);

  return (
    <div className="pt-2 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted">Seed venues shape your recommendation vector</p>
        <span className={`text-xs font-semibold ${totalSelected === 5 ? 'text-brand-purple' : 'text-muted'}`}>{totalSelected}/5</span>
      </div>
      <VenueSearch
        query={query}
        onQueryChange={setQuery}
        selected={customSeedVenues}
        onToggle={toggleCustomSeedVenue}
        maxSelected={5 - seedVenues.length}
      />
      {!isSearching && (
        <div className="flex flex-col divide-y divide-white/5 pt-1">
          {curatedVenues.map(v => {
            const isSelected = seedVenues.includes(v.id);
            const disabled = !isSelected && totalSelected >= 5;
            return (
              <button key={v.id} onClick={() => toggleSeedVenue(v.id)} disabled={disabled}
                className={`flex items-center gap-3 py-2.5 w-full text-left transition-all rounded-xl disabled:opacity-30 ${isSelected ? 'bg-brand-purple/10' : 'hover:bg-white/5'}`}>
                <div className="relative flex-shrink-0">
                  {v.photo ? (
                    <img src={v.photo} alt={v.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${v.img_color} 0%, #1a1a2e 100%)` }}>
                      <MapPin size={12} className="text-white/70" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-purple flex items-center justify-center ring-2 ring-[#0a0a0f]">
                      <Check size={7} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-soft'}`}>{v.name}</p>
                  <p className="text-xs text-muted truncate">{v.neighborhood}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-white/20'}`}>
                  {isSelected && <Check size={9} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SoundEditor() {
  const { seedArtists, toggleSeedArtist, prefs } = useStore();
  return (
    <div className="pt-2 space-y-2">
      <p className="text-xs text-muted pb-1">Your artists directly update your recommendation vector</p>
      <ArtistSearch selected={seedArtists} onToggle={toggleSeedArtist} maxSelected={5} prefs={prefs} />
    </div>
  );
}

// ── Main profile page ────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, prefs, seedVenues, seedArtists, seedArtistGenres, customSeedVenues } = useStore();
  const [editSection, setEditSection] = useState(null); // 'nights' | 'spots' | 'sound'

  const userVec = buildUserVector(seedArtists, seedArtistGenres, seedVenues);

  // Top 5 dimensions by value for the profile visualisation
  const topDims = VECTOR_DIMS
    .map((key, i) => ({ key, label: DIM_LABELS[key], value: userVec[i], color: DIM_COLORS[i] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const seededVenueNames = NYC_VENUES.filter(v => seedVenues.includes(v.id)).map(v => v.name);
  const allSeedVenueNames = [...seededVenueNames, ...customSeedVenues.map(v => v.name)];

  function handleReset() {
    if (window.confirm('This will delete all your preferences and start over. Are you sure?')) {
      localStorage.removeItem('venuematch-store');
      window.location.reload();
    }
  }

  const nightsLabel = prefs.nights?.length
    ? prefs.nights.join(', ')
    : 'Not set';
  const purposesLabel = prefs.purposes?.length
    ? prefs.purposes.map(p => NIGHT_TYPES.find(t => t.id === p)?.label || p).join(', ')
    : 'Not set';

  return (
    <div className="flex flex-col min-h-0 max-w-2xl mx-auto w-full">
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <SectionHeader label="Your taste" title="Profile" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-4">
        {/* User card */}
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-brand-purple">{user?.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name || 'Nightlifer'}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        {/* Vibe fingerprint — top 5 dimensions from 16-dim vector */}
        {seedArtists.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Your vibe fingerprint</p>
            <div className="space-y-3.5">
              {topDims.map(d => (
                <div key={d.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-soft">{d.label}</span>
                    <span className="text-xs font-semibold text-muted">{Math.round(d.value * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.value * 100}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted/60 italic mt-4">Derived from your seed artists · updates instantly when you edit Your Sound</p>
          </div>
        )}

        {/* Preference sections */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted px-1">Preferences</p>

          {/* Nights out */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1">🗓 Going out nights</p>
                <p className="text-xs text-muted truncate">{nightsLabel}</p>
                {prefs.purposes?.length > 0 && (
                  <p className="text-xs text-muted/70 truncate mt-0.5">{purposesLabel}</p>
                )}
              </div>
              <button
                onClick={() => setEditSection('nights')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs text-soft hover:text-white flex-shrink-0"
              >
                <Pencil size={11} /> Edit
              </button>
            </div>
          </div>

          {/* Seed spots */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-2">📍 Your spots</p>
                {allSeedVenueNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {allSeedVenueNames.map(n => (
                      <span key={n} className="text-xs px-2.5 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal">{n}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No spots selected</p>
                )}
              </div>
              <button
                onClick={() => setEditSection('spots')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs text-soft hover:text-white flex-shrink-0"
              >
                <Pencil size={11} /> Edit
              </button>
            </div>
          </div>

          {/* Seed artists */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-2">🎵 Your sound</p>
                {seedArtists.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {seedArtists.map(n => (
                      <span key={n} className="text-xs px-2.5 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">{n}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No artists selected</p>
                )}
              </div>
              <button
                onClick={() => setEditSection('sound')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs text-soft hover:text-white flex-shrink-0"
              >
                <Pencil size={11} /> Edit
              </button>
            </div>
          </div>
        </div>

        <Divider />

        <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl glass text-muted hover:text-soft text-sm">
          <RotateCcw size={13} /> Reset entire profile
        </button>
      </div>

      {/* Edit drawers */}
      {editSection === 'nights' && (
        <EditDrawer title="Going out nights" subtitle="Update preferences" onClose={() => setEditSection(null)}>
          <NightsEditor />
        </EditDrawer>
      )}
      {editSection === 'spots' && (
        <EditDrawer title="Your spots" subtitle="Update seed venues" onClose={() => setEditSection(null)}>
          <SpotsEditor />
        </EditDrawer>
      )}
      {editSection === 'sound' && (
        <EditDrawer title="Your sound" subtitle="Update seed artists" onClose={() => setEditSection(null)}>
          <SoundEditor />
        </EditDrawer>
      )}
    </div>
  );
}
