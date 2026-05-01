import { useStore } from '../../store/index';
import { NYC_VENUES } from '../../data/venues';
import { SectionHeader, Divider } from '../../components/ui/index';
import { RotateCcw } from 'lucide-react';

export function ProfilePage() {
  const { user, seedVenues, seedArtists, venueRatings, getVibeVector } = useStore();
  const vibe = getVibeVector();
  const ratedCount = Object.keys(venueRatings).length;
  const seededVenueNames = NYC_VENUES.filter((v) => seedVenues.includes(v.id)).map((v) => v.name);

  const dims = [
    { key: 'music' as const, label: 'Music taste', emoji: '🎵', color: '#534AB7' },
    { key: 'energy' as const, label: 'Energy level', emoji: '⚡', color: '#0F6E56' },
    { key: 'dance' as const, label: 'Danceability', emoji: '🕺', color: '#993C1D' },
    { key: 'demo' as const, label: 'Crowd match', emoji: '👥', color: '#854F0B' },
  ];

  function handleReset() {
    if (window.confirm('Reset your profile and start over?')) {
      localStorage.removeItem('venuematch-store');
      window.location.reload();
    }
  }

  return (
    <div className="flex flex-col min-h-0 max-w-2xl mx-auto w-full">
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <SectionHeader label="Your taste" title="Profile" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-5">
        {/* User card */}
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-brand-purple">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name || 'Nightlifer'}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            <p className="text-xs text-muted mt-0.5">
              {ratedCount} venue{ratedCount !== 1 ? 's' : ''} rated · NYC
            </p>
          </div>
        </div>

        {/* Vibe profile */}
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
            Your vibe profile
          </p>
          <div className="space-y-4">
            {dims.map((d) => {
              const val = vibe[d.key] || 3;
              const pct = ((val - 1) / 4) * 100;
              return (
                <div key={d.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-soft">
                      {d.emoji} {d.label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: d.color }}>
                      {val.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: pct + '%', background: d.color }}
                    />
                  </div>
                </div>
              );
            })}
            {ratedCount === 0 && (
              <p className="text-xs text-muted italic mt-2">
                Rate venues to sharpen your vibe profile.
              </p>
            )}
          </div>
        </div>

        {/* Seed venues */}
        {seededVenueNames.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
              Seed venues
            </p>
            <div className="flex flex-wrap gap-2">
              {seededVenueNames.map((n) => (
                <span
                  key={n}
                  className="text-xs px-3 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Seed artists */}
        {seedArtists.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
              Seed artists
            </p>
            <div className="flex flex-wrap gap-2">
              {seedArtists.map((n) => (
                <span
                  key={n}
                  className="text-xs px-3 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        <Divider />
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl glass text-muted hover:text-soft text-sm"
        >
          <RotateCcw size={14} /> Reset profile
        </button>
      </div>
    </div>
  );
}
