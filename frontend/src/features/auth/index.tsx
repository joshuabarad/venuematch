import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Music, Chrome } from 'lucide-react';
import { Button } from '../../components/ui/index';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit() {
    if (!supabase) return;
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) throw error;
        setEmailSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange in useAuth handles the redirect
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (emailSent) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center px-8 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center">
          <Music size={24} className="text-brand-purple" />
        </div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-sm text-soft leading-relaxed">
          We sent a confirmation link to <span className="text-white">{email}</span>. Click it to activate your account.
        </p>
        <button onClick={() => setEmailSent(false)} className="text-xs text-muted hover:text-soft underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 max-w-sm mx-auto w-full">
      {/* Logo */}
      <div className="text-center mb-8 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-purple flex items-center justify-center shadow-xl shadow-purple-900/40">
          <Music size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VenueMatch</h1>
          <p className="text-soft text-sm mt-1">NYC nightlife, matched to your vibe</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 glass rounded-xl p-1 w-full mb-6">
        {(['signup', 'signin'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-brand-purple text-white' : 'text-soft hover:text-white'}`}>
            {m === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        ))}
      </div>

      <div className="w-full space-y-3">
        {mode === 'signup' && (
          <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full glass rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-muted" />
        )}
        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full glass rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-muted" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full glass rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-muted" />

        {error && <p className="text-red-400 text-xs px-1">{error}</p>}

        <Button onClick={handleSubmit} disabled={loading || !email || !password} className="w-full" size="lg">
          {loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </Button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-muted">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        <button onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl glass text-sm font-medium hover:bg-white/10 transition-all">
          <Chrome size={16} className="text-soft" />
          Continue with Google
        </button>
      </div>

      <p className="text-center text-xs text-muted mt-6 leading-relaxed">
        No social feed. No ads. Just your next great night out.
      </p>
    </div>
  );
}
