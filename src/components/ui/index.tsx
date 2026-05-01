import type { ReactNode } from 'react';

// ── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ children, onClick, variant = 'primary', className = '', disabled = false, size = 'md' }: ButtonProps) {
  const base = 'rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };
  const variants = {
    primary: 'bg-brand-purple text-white hover:bg-purple-600 shadow-lg shadow-purple-900/30',
    secondary: 'glass text-white hover:bg-white/10',
    ghost: 'text-soft hover:text-white hover:bg-white/5',
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
}

// ── Pill ─────────────────────────────────────────────────────────────────────

interface PillProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Pill({ children, active, onClick }: PillProps) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${active ? 'bg-brand-purple text-white' : 'glass text-soft hover:text-white'}`}>
      {children}
    </button>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-brand-purple' : i === step ? 'bg-brand-purple/50' : 'bg-white/10'}`} />
      ))}
    </div>
  );
}

// ── MatchBadge ────────────────────────────────────────────────────────────────

export function MatchBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'text-emerald-400 bg-emerald-400/10' : score >= 70 ? 'text-brand-purple bg-brand-purple/20' : 'text-soft bg-white/5';
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>{score}% match</span>;
}

// ── RatingSlider (legacy — kept for backward compat with existing JS files) ──

interface RatingSliderProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
}

export function RatingSlider({ label, value, onChange, emoji }: RatingSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-soft">{emoji} {label}</span>
        <span className="text-sm font-semibold text-brand-purple">{value}/5</span>
      </div>
      <input type="range" min="1" max="5" step="0.5" value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

// ── LabeledSlider ─────────────────────────────────────────────────────────────

interface LabeledSliderProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  stops: string[];
  min?: number;
}

export function LabeledSlider({ label, emoji, value, onChange, stops, min = 1 }: LabeledSliderProps) {
  const idx = Math.round(value) - min;
  const current = stops[idx] ?? '';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-soft">{emoji} {label}</span>
        <span className="text-xs font-semibold text-brand-purple truncate max-w-[140px] text-right">{current}</span>
      </div>
      <input
        type="range" min={min} max={min + stops.length - 1} step={1} value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted/50 leading-tight">
        <span>{stops[0]}</span>
        <span>{stops[stops.length - 1]}</span>
      </div>
    </div>
  );
}

// ── GenreMultiSelect ──────────────────────────────────────────────────────────

export type Genre = 'country' | 'electronic' | 'jazz' | 'oldies' | 'hip-hop' | 'chill' | 'pop' | 'latin' | 'rock';

const GENRE_OPTIONS: Genre[] = ['country', 'electronic', 'jazz', 'oldies', 'hip-hop', 'chill', 'pop', 'latin', 'rock'];

interface GenreMultiSelectProps {
  label: string;
  emoji: string;
  value: Genre[];
  onChange: (v: Genre[]) => void;
}

export function GenreMultiSelect({ label, emoji, value, onChange }: GenreMultiSelectProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-soft">{emoji} {label}</span>
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {GENRE_OPTIONS.map(g => {
          const active = value.includes(g);
          return (
            <button key={g}
              onClick={() => onChange(active ? value.filter(x => x !== g) : [...value, g])}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 active:scale-95
                ${active ? 'bg-brand-purple text-white' : 'glass text-soft hover:text-white'}`}>
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── ProductionPicker ──────────────────────────────────────────────────────────

export type ProductionType = 'live' | 'speakers' | 'dj';

interface ProductionOption {
  id: ProductionType;
  label: string;
  emoji: string;
}

const PRODUCTION_OPTIONS: ProductionOption[] = [
  { id: 'live',     label: 'Live music', emoji: '🎸' },
  { id: 'speakers', label: 'Speakers',   emoji: '🔊' },
  { id: 'dj',       label: 'DJ',         emoji: '🎛️' },
];

interface ProductionPickerProps {
  label: string;
  emoji: string;
  value: ProductionType | null;
  onChange: (v: ProductionType | null) => void;
}

export function ProductionPicker({ label, emoji, value, onChange }: ProductionPickerProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-soft">{emoji} {label}</span>
      <div className="flex gap-2">
        {PRODUCTION_OPTIONS.map(o => {
          const active = value === o.id;
          return (
            <button key={o.id}
              onClick={() => onChange(active ? null : o.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 active:scale-95
                ${active ? 'bg-brand-purple/20 border border-brand-purple/40 text-white' : 'glass text-soft hover:text-white'}`}>
              <span className="text-sm">{o.emoji}</span>
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── VenueRating — typed shape for the 6-dim fingerprint ──────────────────────

export interface VenueRating {
  vibe: number;        // 1–5
  crowdedness: number; // 1–5
  music: number;       // 1–5
  genres: Genre[];
  production: ProductionType | null;
  price: number;       // 1–3
}

export const DEFAULT_VENUE_RATING: VenueRating = {
  vibe: 3,
  crowdedness: 3,
  music: 3,
  genres: [],
  production: null,
  price: 2,
};

// ── Misc ──────────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <div className={`${sizes[size]} border-2 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin`} />;
}

interface SectionHeaderProps {
  label?: string;
  title?: string;
  subtitle?: string;
}

export function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="space-y-1 mb-6">
      {label && <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>}
      {title && <h2 className="text-2xl font-semibold">{title}</h2>}
      {subtitle && <p className="text-soft text-sm leading-relaxed">{subtitle}</p>}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-white/5 my-4" />;
}
