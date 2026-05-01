import { useState } from 'react';
import { useStore } from './store/index';
import { useAuth } from './hooks/useAuth';
import { useServerSync } from './hooks/useServerSync';
import { isSupabaseEnabled } from './lib/supabase';
import { AuthPage } from './features/auth/index';
import { Onboarding } from './features/onboarding/index';
import { HomePage } from './features/discovery/index';
import { VenueDetail } from './features/venue-detail/index';
import type { Venue } from '@venuematch/shared';

export default function App() {
  const { session, loading } = useAuth();
  const { onboardingComplete } = useStore();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // Hydrate Zustand from server when a session exists
  useServerSync(session?.user ?? null);

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  // Supabase configured but no session → show auth page
  if (isSupabaseEnabled && !session) return <AuthPage />;

  // Auth passed (or Supabase not configured) → onboarding gate
  if (!onboardingComplete) return <Onboarding />;

  // Venue detail overlay
  if (selectedVenue)
    return (
      <div className="max-w-2xl mx-auto">
        <VenueDetail venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
      </div>
    );

  return <HomePage onViewVenue={setSelectedVenue} />;
}
