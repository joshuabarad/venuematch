import { useStore } from '../../store/index.js';
import { Button, MatchBadge, RatingSlider, Divider } from '../ui/index.jsx';
import { MapPin, Music, Clock, Heart, ArrowLeft } from 'lucide-react';
import { buildUserVector, cosineSimilarity } from '../../lib/vectorRec.js';
import { VENUE_PROFILES, VECTOR_DIMS } from '../../data/venueProfiles.js';

const DIM_LABELS = {
  music_curation: 'Music quality', energy: 'Energy', dance: 'Dance',
  late_night: 'Late night', underground: 'Underground', electronic: 'Electronic',
  rnb_hiphop: 'R&B / Hip-hop', jazz_world: 'Jazz & world', live_music: 'Live music',
  queer: 'Queer space', intimate: 'Intimate', outdoor: 'Outdoor',
  exclusive: 'Upscale', chill: 'Chill vibes', diverse: 'Diverse crowd', local: 'Neighborhood',
};

function WhyYouMatch({ venue, userVec }) {
  const profile = VENUE_PROFILES[venue.id];
  if (!profile || !userVec) return null;

  // Find top 3 dimensions where both user and venue are strong (product of both scores)
  const dims = VECTOR_DIMS.map((key, i) => ({
    key,
    label: DIM_LABELS[key],
    user: userVec[i],
    venue: profile.vec[i],
    joint: userVec[i] * profile.vec[i],
  })).sort((a, b) => b.joint - a.joint).slice(0, 3);

  return (
    <div>
      <p className="text-xs text-muted mb-3 uppercase tracking-widest font-semibold">Why you match</p>
      <div className="space-y-3">
        {dims.map(d => (
          <div key={d.key}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-soft">{d.label}</span>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="text-brand-purple font-medium">You {Math.round(d.user * 100)}%</span>
                <span>·</span>
                <span>Venue {Math.round(d.venue * 100)}%</span>
              </div>
            </div>
            <div className="flex gap-1 h-1.5">
              <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-brand-purple/70"
                  style={{ width: `${d.user * 100}%` }} />
              </div>
              <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-brand-teal/60"
                  style={{ width: `${d.venue * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted/60">
        <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-full bg-brand-purple/70 inline-block" /> You</span>
        <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-full bg-brand-teal/60 inline-block" /> Venue</span>
      </div>
    </div>
  );
}

export function VenueDetail({ venue, onClose }) {
  const { savedVenues, saveVenue, unsaveVenue, venueRatings, setVenueRating, getMatchScore, seedArtists, seedArtistGenres, seedVenues } = useStore();
  const saved = savedVenues[venue.id];
  const rating = venueRatings[venue.id] || { music: 3, energy: 3, dance: 3, demo: 3 };
  const match = getMatchScore(venue);
  const userVec = buildUserVector(seedArtists, seedArtistGenres, seedVenues);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero */}
      <div className="relative h-56 flex-shrink-0 overflow-hidden"
        style={!venue.photo ? { background: `linear-gradient(135deg, ${venue.img_color} 0%, #0a0a0f 100%)` } : {}}>
        {venue.photo && (
          <img src={venue.photo} alt={venue.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/20 to-transparent" />

        <button onClick={onClose}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>

        <button onClick={() => saved ? unsaveVenue(venue.id) : saveVenue(venue.id, 'want_to_visit')}
          className="absolute top-12 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Heart size={16} className={saved ? 'fill-red-400 text-red-400' : ''} />
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">{venue.name}</h1>
              <div className="flex items-center gap-1 text-white/60 text-sm mt-0.5">
                <MapPin size={12} />
                <span>{venue.neighborhood} · {venue.address}</span>
              </div>
            </div>
            <MatchBadge score={match} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-16 space-y-6 pt-5">
        {/* Vibe tags */}
        <div className="flex flex-wrap gap-2">
          {venue.vibe_tags.map(t => (
            <span key={t} className="text-xs px-3 py-1 rounded-full glass text-soft">{t}</span>
          ))}
        </div>

        {/* Description */}
        <p className="text-soft text-sm leading-relaxed">{venue.description}</p>

        {/* Why you match */}
        <WhyYouMatch venue={venue} userVec={userVec} />

        <Divider />

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
