import { useEffect } from 'react';
import { useStore } from '../../store/index.js';
import { Button, MatchBadge, RatingSlider, Divider } from '../ui/index.jsx';
import { MapPin, Music, Zap, Users, Heart, X, Clock, ArrowLeft } from 'lucide-react';

export function VenueDetail({ venue, onClose }) {
  const { savedVenues, saveVenue, unsaveVenue, venueRatings, setVenueRating, getMatchScore, trackVenueView } = useStore();

  useEffect(() => { trackVenueView(venue.id); }, [venue.id]);
  const saved = savedVenues[venue.id];
  const rating = venueRatings[venue.id] || { music: 3, energy: 3, dance: 3, demo: 3 };
  const match = getMatchScore(venue);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero */}
      <div className="relative h-52 flex-shrink-0 overflow-hidden"
        style={!venue.photo ? { background: `linear-gradient(135deg, ${venue.img_color} 0%, #0a0a0f 100%)` } : {}}>
        {venue.photo && (
          <img src={venue.photo} alt={venue.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/30 to-transparent" />

        <button onClick={onClose}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>

        <button onClick={() => saved ? unsaveVenue(venue.id) : saveVenue(venue.id, 'want_to_visit')}
          className="absolute top-12 right-4 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center">
          <Heart size={16} className={saved ? 'fill-red-400 text-red-400' : ''} />
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">{venue.name}</h1>
              <div className="flex items-center gap-1 text-white/70 text-sm mt-0.5">
                <MapPin size={12} />
                <span>{venue.neighborhood} · {venue.address}</span>
              </div>
            </div>
            <MatchBadge score={match} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-16 space-y-6 pt-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {venue.vibe_tags.map(t => (
            <span key={t} className="text-xs px-3 py-1 rounded-full glass text-soft">{t}</span>
          ))}
        </div>

        {/* Description */}
        <p className="text-soft text-sm leading-relaxed">{venue.description}</p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Music, label: 'Music', val: venue.music_score },
            { icon: Zap, label: 'Energy', val: venue.energy_score },
            { icon: '🕺', label: 'Danceability', val: venue.dance_score },
            { icon: Users, label: 'Crowd match', val: venue.demo_score },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="glass rounded-xl p-3 text-center">
              <p className="text-xs text-muted mb-1">{label}</p>
              <p className="text-lg font-semibold text-brand-purple">{val.toFixed(1)}</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {Array.from({length: 5}).map((_, i) => (
                  <div key={i} className={`h-1 w-4 rounded-full ${i < Math.round(val) ? 'bg-brand-purple' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Genres */}
        <div>
          <p className="text-xs text-muted mb-2 uppercase tracking-widest font-semibold">Music</p>
          <div className="flex flex-wrap gap-2">
            {venue.music_genres.map(g => (
              <span key={g} className="text-xs px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">{g}</span>
            ))}
          </div>
        </div>

        {/* Crowd */}
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted mb-1 uppercase tracking-widest font-semibold">Crowd</p>
          <p className="text-sm text-soft">{venue.crowd_desc}</p>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-2 text-soft text-sm">
          <Clock size={14} />
          <span>{venue.hours}</span>
        </div>

        <Divider />

        {/* Rate this venue */}
        <div>
          <p className="text-xs text-muted mb-4 uppercase tracking-widest font-semibold">Rate your experience</p>
          <div className="glass rounded-2xl p-5 space-y-5">
            <RatingSlider label="Music & sound" emoji="🎵" value={rating.music}
              onChange={v => setVenueRating(venue.id, 'music', v)} />
            <RatingSlider label="Crowd energy" emoji="⚡" value={rating.energy}
              onChange={v => setVenueRating(venue.id, 'energy', v)} />
            <RatingSlider label="Danceability" emoji="🕺" value={rating.dance}
              onChange={v => setVenueRating(venue.id, 'dance', v)} />
            <RatingSlider label="Crowd match" emoji="👥" value={rating.demo}
              onChange={v => setVenueRating(venue.id, 'demo', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}
