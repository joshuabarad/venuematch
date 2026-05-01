import { Heart, MapPin, Music, Zap } from 'lucide-react';
import { MatchBadge } from '../ui/index';
import { useStore } from '../../store/index';
import type { Venue } from '@venuematch/shared';

interface VenueCardProps {
  venue: Venue;
  showMatch?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function VenueCard({ venue, showMatch = true, onClick, compact = false }: VenueCardProps) {
  const { savedVenues, saveVenue, unsaveVenue, getMatchScore } = useStore();
  const saved = savedVenues[venue.id];
  const match = getMatchScore(venue);

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (saved) unsaveVenue(venue.id);
    else saveVenue(venue.id, 'want_to_visit');
  }

  if (compact)
    return (
      <div
        onClick={onClick}
        className="glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/8 transition-all active:scale-98"
      >
        {venue.photo ? (
          <img
            src={venue.photo}
            alt={venue.name}
            className="w-10 h-10 rounded-xl flex-shrink-0 object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${venue.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)`,
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{venue.name}</p>
          <p className="text-xs text-muted truncate">{venue.neighborhood}</p>
        </div>
        {showMatch && <MatchBadge score={match} />}
      </div>
    );

  return (
    <div
      onClick={onClick}
      className="glass rounded-2xl overflow-hidden cursor-pointer hover:bg-white/8 transition-all duration-200 active:scale-[0.99]"
    >
      <div className="h-36 relative flex items-end p-4 overflow-hidden">
        {venue.photo ? (
          <>
            <img
              src={venue.photo}
              alt={venue.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${venue.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)`,
            }}
          />
        )}
        <div className="relative flex gap-1.5 flex-wrap">
          {venue.vibe_tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-white/80 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
          {venue.isOpenNow === true && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/80 text-white backdrop-blur-sm font-medium">
              Open tonight
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90 hover:bg-black/60"
        >
          <Heart size={14} className={saved ? 'fill-red-400 text-red-400' : 'text-white/70'} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base">{venue.name}</h3>
            <div className="flex items-center gap-1 text-muted text-xs mt-0.5">
              <MapPin size={10} />
              <span>{venue.neighborhood}</span>
            </div>
          </div>
          {showMatch && <MatchBadge score={match} />}
        </div>
        <p className="text-soft text-xs leading-relaxed line-clamp-2">{venue.description}</p>
        <div className="flex gap-3 pt-1">
          <div className="flex items-center gap-1 text-xs text-muted">
            <Music size={10} />
            <span>{venue.music_genres.slice(0, 2).join(', ')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted">
            <Zap size={10} />
            <span>{venue.energy_score.toFixed(1)} energy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VenueCardSelectableProps {
  venue: Venue;
  selected: boolean;
  onToggle: () => void;
}

export function VenueCardSelectable({ venue, selected, onToggle }: VenueCardSelectableProps) {
  return (
    <div
      onClick={onToggle}
      className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.98] border ${
        selected ? 'border-brand-purple bg-brand-purple/10' : 'glass border-transparent hover:border-white/15'
      }`}
    >
      <div className="flex items-center gap-3">
        {venue.photo ? (
          <img
            src={venue.photo}
            alt={venue.name}
            className="w-10 h-10 rounded-xl flex-shrink-0 object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${venue.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)`,
            }}
          >
            {selected && <span className="text-white text-sm font-bold">✓</span>}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${selected ? 'text-white' : 'text-soft'}`}>
            {venue.name}
          </p>
          <p className="text-xs text-muted truncate">
            {venue.neighborhood} · {venue.music_genres.slice(0, 2).join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
}
