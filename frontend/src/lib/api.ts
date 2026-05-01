import { supabase } from './supabase';
import type { Venue, VenueRating, SaveStatus, DailyRec, Group } from '@venuematch/shared';

const BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const FUNCTIONS_URL = BASE ? `${BASE}/functions/v1` : '';

interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<ApiResponse<T>> {
  if (!FUNCTIONS_URL) return { data: null, error: { code: 'NO_API', message: 'Supabase not configured' } };

  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token ?? '';

  const res = await fetch(`${FUNCTIONS_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  });

  return res.json() as Promise<ApiResponse<T>>;
}

export const api = {
  venues: {
    list: (genre?: string) =>
      apiFetch<Venue[]>(`/venues${genre && genre !== 'all' ? `?genre=${genre}` : ''}`),
  },

  users: {
    me: () => apiFetch<Record<string, unknown>>('/users'),
    update: (body: Record<string, unknown>) =>
      apiFetch<Record<string, unknown>>('/users', { method: 'PATCH', body: JSON.stringify(body) }),
    completeOnboarding: (body: Record<string, unknown>) =>
      apiFetch<Record<string, unknown>>('/users/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  ratings: {
    list: () => apiFetch<Array<{ venue_id: string; music_score: number; energy_score: number; dance_score: number; demo_score: number }>>('/ratings'),
    upsert: (venueId: string, rating: VenueRating) =>
      apiFetch<VenueRating>(`/ratings/${venueId}`, { method: 'PUT', body: JSON.stringify(rating) }),
  },

  saved: {
    list: () => apiFetch<Array<{ venue_id: string; status: SaveStatus }>>('/saved'),
    upsert: (venueId: string, status: SaveStatus) =>
      apiFetch<{ venue_id: string; status: SaveStatus }>(`/saved/${venueId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    remove: (venueId: string) =>
      apiFetch<null>(`/saved/${venueId}`, { method: 'DELETE' }),
  },

  recommendations: {
    tonight: (prompt: string) =>
      apiFetch<DailyRec>(`/recommendations?prompt=${encodeURIComponent(prompt)}`),
    feedback: (action: string, venueId: string, matchScore: number) =>
      apiFetch<null>('/recommendations/feedback', {
        method: 'POST',
        body: JSON.stringify({ action, venueId, matchScore }),
      }),
  },

  rejections: {
    create: (venueId: string, genres: string[], vibe_tags: string[]) =>
      apiFetch<null>(`/rejections/${venueId}`, {
        method: 'POST',
        body: JSON.stringify({ genres, vibe_tags }),
      }),
    list: () => apiFetch<Array<{ venue_id: string; genres: string[]; vibe_tags: string[]; rejected_at: string }>>('/rejections'),
  },

  groups: {
    list: () => apiFetch<Group[]>('/groups'),
    create: (name: string) =>
      apiFetch<Group>('/groups', { method: 'POST', body: JSON.stringify({ name }) }),
    join: (code: string) =>
      apiFetch<Group>('/groups/join', { method: 'POST', body: JSON.stringify({ code }) }),
    delete: (groupId: string) =>
      apiFetch<null>(`/groups/${groupId}`, { method: 'DELETE' }),
  },
};
