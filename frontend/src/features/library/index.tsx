import { useState } from 'react';
import { useStore } from '../../store/index';
import { NYC_VENUES } from '../../data/venues';
import { VenueCard } from '../../components/venue/VenueCard';
import { SectionHeader } from '../../components/ui/index';
import { BookMarked, CheckCircle2, Compass } from 'lucide-react';
import type { Venue } from '@venuematch/shared';

const TABS = [
  { id: 'saved', label: 'Saved', icon: BookMarked },
  { id: 'visited', label: 'Visited', icon: CheckCircle2 },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface LibraryPageProps {
  onViewVenue: (venue: Venue) => void;
}

export function LibraryPage({ onViewVenue }: LibraryPageProps) {
  const { savedVenues, venueRatings } = useStore();
  const [tab, setTab] = useState<TabId>('saved');

  const savedIds = Object.entries(savedVenues)
    .filter(([, s]) => s === 'want_to_visit')
    .map(([id]) => id);
  const visitedIds = Object.keys(venueRatings);
  const savedList = NYC_VENUES.filter((v) => savedIds.includes(v.id));
  const visitedList = NYC_VENUES.filter((v) => visitedIds.includes(v.id));
  const current = tab === 'saved' ? savedList : visitedList;

  return (
    <div className="flex flex-col min-h-0 max-w-2xl mx-auto w-full">
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <SectionHeader label="Your collection" title="Library" />
        <div className="flex gap-1 glass rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-brand-purple text-white' : 'text-soft hover:text-white'
              }`}
            >
              <t.icon size={14} />
              {t.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-white/20' : 'bg-white/5'
                }`}
              >
                {t.id === 'saved' ? savedList.length : visitedList.length}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {current.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
              <Compass size={24} className="text-muted" />
            </div>
            <p className="font-medium text-soft mb-1">
              {tab === 'saved' ? 'No saved venues yet' : 'No visits logged yet'}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              {tab === 'saved'
                ? 'Tap the heart on any venue to save it for later.'
                : "Rate venues you've visited to improve your recommendations."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {current.map((v) => (
              <VenueCard key={v.id} venue={v} onClick={() => onViewVenue(v)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
