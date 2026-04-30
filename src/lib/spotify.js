const SEARCH_URL = 'https://api.spotify.com/v1/search';
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
      `${SEARCH_URL}?q=${encodeURIComponent(query)}&type=artist&limit=10&market=US`,
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
