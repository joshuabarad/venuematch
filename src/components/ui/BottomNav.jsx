import { Compass, BookMarked, User } from 'lucide-react';

const TABS = [
  { id: 'home',    label: 'Discover', icon: Compass },
  { id: 'library', label: 'Library',  icon: BookMarked },
  { id: 'profile', label: 'Profile',  icon: User },
];

export function BottomNav({ active, onChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-xl border-t border-white/5" />
      <div className="relative flex items-center justify-around px-2 pb-2 pt-1">
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)}
              className="flex flex-col items-center gap-1 py-2 px-6 rounded-xl transition-all">
              <tab.icon size={22}
                className={isActive ? 'text-brand-purple' : 'text-muted'}
                strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-brand-purple' : 'text-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}