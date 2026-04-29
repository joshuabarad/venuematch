import { useState } from 'react';
import { useStore } from './store/index.js';
import { Onboarding } from './components/onboarding/Onboarding.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { VenueDetail } from './components/venue/VenueDetail.jsx';

export default function App() {
  const { onboardingComplete } = useStore();
  const [selectedVenue, setSelectedVenue] = useState(null);

  if (!onboardingComplete) return <Onboarding />;

  if (selectedVenue) return (
    <div className="max-w-2xl mx-auto">
      <VenueDetail venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
    </div>
  );

  return <HomePage onViewVenue={setSelectedVenue} />;
}
