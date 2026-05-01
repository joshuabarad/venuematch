import { useState, useEffect } from 'react';
import { useStore } from './store/index.js';
import { Onboarding } from './components/onboarding/Onboarding.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { VenueDetail } from './components/venue/VenueDetail';

export default function App() {
  const { onboardingComplete, theme } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);
  const [selectedVenue, setSelectedVenue] = useState(null);

  if (!onboardingComplete) return <Onboarding />;

  if (selectedVenue) return (
    <div className="max-w-2xl mx-auto">
      <VenueDetail venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
    </div>
  );

  return <HomePage onViewVenue={setSelectedVenue} />;
}
