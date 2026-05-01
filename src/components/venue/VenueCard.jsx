import { Heart, MapPin, Music } from 'lucide-react';
import { MatchBadge } from '../ui/index';
import { useStore } from '../../store/index.js';

export function VenueCard({ venue, showMatch = true, onClick, compact = false }) {
  const { savedVenues, saveVenue, unsaveVenue, getMatchScore } = useStore();
  const saved = savedVenues[venue.id];
  const match = getMatchScore(venue);

  function handleSave(e) {
    e.stopPropagation();
    if (saved) unsaveVenue(venue.id);
    else saveVenue(venue.id, 'want_to_visit');
  }

  if (compact) return (
    <div onClick={onClick}
      className="glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/8 transition-all active:scale-98">
      {venue.photo ? (
        <img src={venue.photo} alt={venue.name} className="w-10 h-10 rounded-xl flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${venue.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)` }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{venue.name}</p>
        <p className="text-xs text-muted truncate">{venue.neighborhood}</p>
      </div>
      {showMatch && <MatchBadge score={match} />}
    </div>
  );

  return (
    <div onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.99] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10">

      {/* Hero photo — taller, match badge floated on image */}
      <div className="h-44 relative overflow-hidden">
        {venue.photo ? (
          <>
            <img src={venue.photo} alt={venue.name}
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(145deg, ${venue.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)` }} />
        )}

        {/* Match badge — top left on the photo */}
        {showMatch && (
          <div className="absolute top-3 left-3">
            <MatchBadge score={match} />
          </div>
        )}

        {/* Save button */}
        <button onClick={handleSave}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90 hover:bg-black/60">
          <Heart size={13} className={saved ? 'fill-red-400 text-red-400' : 'text-white/70'} />
        </button>

        {/* Venue name + neighborhood pinned to bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <h3 className="font-bold text-base text-white leading-tight">{venue.name}</h3>
          <div className="flex items-center gap-1 text-white/60 text-xs mt-0.5">
            <MapPin size={9} />
            <span>{venue.neighborhood}</span>
          </div>
        </div>
      </div>

      {/* Body — leaner, just description + genre tags */}
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-soft text-xs leading-relaxed line-clamp-2">{venue.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {venue.vibe_tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-muted">{tag}</span>
          ))}
          <span className="ml-auto flex items-center gap-1 text-xs text-muted">
            <Music size={9} />
            {venue.music_genres.slice(0, 2).join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
}

export function VenueCardSelectable({ venue, selected, onToggle }) {
  return (
    <div onClick={onToggle}
      className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.98] border
        ${selected
          ? 'border-brand-purple bg-brand-purple/10'
          : 'glass border-transparent hover:border-white/15'}`}>
      <div className="flex items-center gap-3">
        {venue.photo ? (
          <img src={venue.photo} alt={venue.name} className="w-10 h-10 rounded-xl flex-shrink-0 object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${venue.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)` }}>
            {selected && <span className="text-white text-sm font-bold">✓</span>}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${selected ? 'text-white' : 'text-soft'}`}>{venue.name}</p>
          <p className="text-xs text-muted truncate">{venue.neighborhood} · {venue.music_genres.slice(0, 2).join(', ')}</p>
        </div>
      </div>
    </div>
  );
}
