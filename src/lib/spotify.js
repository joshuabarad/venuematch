const BASE = 'https://api.spotify.com/v1';
let _token = null;
let _expiry = 0;

async function getToken() {
  if (_token && Date.now() < _expiry) return _token;
  try {
    const r = await fetch('/api/spotify-token');
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.access_token) return null;
    _token = d.access_token;
    _expiry = Date.now() + (d.expires_in - 60) * 1000;
    return _token;
  } catch { return null; }
}

export async function searchArtists(query) {
  if (!query || query.length < 2) return [];
  const token = await getToken();
  if (!token) return [];
  try {
    const r = await fetch(
      `${BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=10&market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = await r.json();
    return (d.artists?.items || []).map(a => ({
      id: a.id,
      name: a.name,
      genres: a.genres?.slice(0, 3) || [],
      image: a.images?.[2]?.url || null,
      popularity: a.popularity,
    }));
  } catch { return []; }
}

// Cache top-track previews so repeated hovers don't re-fetch
const _trackCache = new Map();

export async function getArtistTopTrack(spotifyId) {
  if (!spotifyId) return null;
  if (_trackCache.has(spotifyId)) return _trackCache.get(spotifyId);

  const token = await getToken();
  if (!token) return null;
  try {
    const r = await fetch(
      `${BASE}/artists/${spotifyId}/top-tracks?market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = await r.json();
    // Find the first track that actually has a preview
    const track = (d.tracks || []).find(t => t.preview_url) || d.tracks?.[0] || null;
    const result = track
      ? {
          id: track.id,
          name: track.name,
          preview_url: track.preview_url || null,
          image: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null,
        }
      : null;
    _trackCache.set(spotifyId, result);
    return result;
  } catch { return null; }
}

export async function searchTracks(query) {
  if (!query || query.length < 2) return [];
  const token = await getToken();
  if (!token) return [];
  try {
    const r = await fetch(
      `${BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=8&market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = await r.json();
    return (d.tracks?.items || []).map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.[0]?.name || '',
      preview_url: t.preview_url || null,
      image: t.album?.images?.[2]?.url || t.album?.images?.[1]?.url || null,
      imageLg: t.album?.images?.[0]?.url || null,
    }));
  } catch { return []; }
}
