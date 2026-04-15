export function Button({children,onClick,variant='primary',className='',disabled=false,size='md'}) {
  const base='rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes={sm:'px-4 py-2 text-sm',md:'px-6 py-3 text-base',lg:'px-8 py-4 text-lg'};
  const variants={primary:'bg-brand-purple text-white hover:bg-purple-600 shadow-lg shadow-purple-900/30',secondary:'glass text-white hover:bg-white/10',ghost:'text-soft hover:text-white hover:bg-white/5'};
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
}
export function Pill({children,active,onClick}) {
  return <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${active?'bg-brand-purple text-white':'glass text-soft hover:text-white'}`}>{children}</button>;
}
export function ProgressBar({step,total}) {
  return <div className="flex gap-1.5">{Array.from({length:total}).map((_,i) => <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i<step?'bg-brand-purple':i===step?'bg-brand-purple/50':'bg-white/10'}`} />)}</div>;
}
export function MatchBadge({score}) {
  const color=score>=85?'text-emerald-400 bg-emerald-400/10':score>=70?'text-brand-purple bg-brand-purple/20':'text-soft bg-white/5';
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>{score}% match</span>;
}
export function RatingSlider({label,value,onChange,emoji}) {
  return (<div className="space-y-2"><div className="flex justify-between items-center"><span className="text-sm text-soft">{emoji} {label}</span><span className="text-sm font-semibold text-brand-purple">{value}/5</span></div><input type="range" min="1" max="5" step="0.5" value={value} onChange={e => onChange(parseFloat(e.target.value))} /></div>);
}
export function Spinner({size='md'}) {
  const sizes={sm:'w-4 h-4',md:'w-8 h-8',lg:'w-12 h-12'};
  return <div className={`${sizes[size]} border-2 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin`} />;
}
export function SectionHeader({label,title,subtitle}) {
  return (<div className="space-y-1 mb-6">{label&&<p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>}{title&&<h2 className="text-2xl font-semibold">{title}</h2>}{subtitle&&<p className="text-soft text-sm leading-relaxed">{subtitle}</p>}</div>);
}
export function Divider() { return <div className="border-t border-white/5 my-4" />; }
