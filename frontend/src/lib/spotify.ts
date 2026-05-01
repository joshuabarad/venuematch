import { getArtistPreviewUrl, getTrackPreviewUrl } from './itunes';
import type { SpotifyArtist, SpotifyTrack } from '@venuematch/shared';

const BASE = 'https://api.spotify.com/v1';
let _token: string | null = null;
let _expiry = 0;

interface SpotifyTokenResponse {
  access_token?: string;
  expires_in?: number;
}

async function getToken(): Promise<string | null> {
  if (_token && Date.now() < _expiry) return _token;
  try {
    const r = await fetch('/api/spotify-token');
    if (!r.ok) return null;
    const d = (await r.json()) as SpotifyTokenResponse;
    if (!d.access_token) return null;
    _token = d.access_token;
    _expiry = Date.now() + ((d.expires_in ?? 3600) - 60) * 1000;
    return _token;
  } catch {
    return null;
  }
}

export async function searchArtists(query: string): Promise<SpotifyArtist[]> {
  if (!query || query.length < 2) return [];
  const token = await getToken();
  if (!token) return [];
  try {
    const r = await fetch(
      `${BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=10&market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = (await r.json()) as {
      artists?: { items: Array<{ id: string; name: string; genres: string[]; images: Array<{ url: string }>; popularity: number }> };
    };
    return (d.artists?.items || []).map((a) => ({
      id: a.id,
      name: a.name,
      genres: a.genres?.slice(0, 3) ?? [],
      image: a.images?.[2]?.url ?? null,
      popularity: a.popularity,
    }));
  } catch {
    return [];
  }
}

const _trackCache = new Map<string, { preview_url: string } | null>();

export async function getArtistTopTrack(
  spotifyId: string | null,
  artistName: string
): Promise<{ preview_url: string } | null> {
  const cacheKey = spotifyId || artistName;
  if (_trackCache.has(cacheKey)) return _trackCache.get(cacheKey) ?? null;

  let trackName: string | null = null;
  if (spotifyId) {
    const token = await getToken();
    if (token) {
      try {
        const r = await fetch(`${BASE}/artists/${spotifyId}/top-tracks?market=US`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json()) as { tracks?: Array<{ name: string }> };
        const track = d.tracks?.[0] ?? null;
        if (track) trackName = track.name;
      } catch { /* fall through */ }
    }
  }

  const preview_url = await getArtistPreviewUrl(artistName || trackName || '');
  const result = preview_url ? { preview_url } : null;
  _trackCache.set(cacheKey, result);
  return result;
}

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  if (!query || query.length < 2) return [];
  const token = await getToken();
  if (!token) return [];
  try {
    const r = await fetch(
      `${BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=8&market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = (await r.json()) as {
      tracks?: {
        items: Array<{
          id: string;
          name: string;
          artists: Array<{ name: string }>;
          preview_url: string | null;
          album: { images: Array<{ url: string }> };
        }>;
      };
    };
    const items = d.tracks?.items || [];
    // Spotify removed preview_url in 2024 — fetch from iTunes in parallel
    const tracks = await Promise.all(
      items.map(async (t) => {
        const artistName = t.artists?.[0]?.name ?? '';
        const preview_url = t.preview_url ?? await getTrackPreviewUrl(t.name, artistName);
        return {
          id: t.id,
          name: t.name,
          artist: artistName,
          preview_url,
          image: t.album?.images?.[2]?.url ?? t.album?.images?.[1]?.url ?? null,
          imageLg: t.album?.images?.[0]?.url ?? null,
        };
      })
    );
    return tracks;
  } catch {
    return [];
  }
}
