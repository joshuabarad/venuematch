import { useState } from 'react';
import { useStore } from './store/index.js';
import { Onboarding } from './components/onboarding/Onboarding.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LibraryPage } from './pages/LibraryPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { VenueDetail } from './components/venue/VenueDetail.jsx';
import { BottomNav } from './components/ui/BottomNav.jsx';

export default function App() {
  const { onboardingComplete } = useStore();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedVenue, setSelectedVenue] = useState(null);

  if (!onboardingComplete) return <Onboarding />;

  if (selectedVenue) return (
    <div className="max-w-md mx-auto">
      <VenueDetail venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col relative">
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'home'    && <HomePage    onViewVenue={setSelectedVenue} />}
        {activeTab === 'library' && <LibraryPage onViewVenue={setSelectedVenue} />}
        {activeTab === 'profile' && <ProfilePage />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}