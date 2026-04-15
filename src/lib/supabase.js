import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export async function syncUserProfile(user, vibeVector) {
  if (!supabase) return;
  await supabase.from('users').upsert({
    id: user.id, email: user.email, name: user.name,
    vibe_vector: vibeVector, updated_at: new Date().toISOString(),
  });
}

export async function saveRatingToDB(userId, venueId, rating) {
  if (!supabase) return;
  await supabase.from('user_venue_ratings').upsert({
    user_id: userId, venue_id: venueId,
    music_score: rating.music, energy_score: rating.energy,
    dance_score: rating.dance, demo_score: rating.demo,
    updated_at: new Date().toISOString(),
  });
}

export async function saveDailyRecFeedback(userId, venueId, action, matchScore) {
  if (!supabase) return;
  await supabase.from('daily_recs').insert({
    user_id: userId, venue_id: venueId,
    rec_date: new Date().toISOString().split('T')[0],
    match_score: matchScore, user_action: action,
  });
}