const _artistCache = new Map();
const _trackCache = new Map();

export async function getArtistPreviewUrl(artistName) {
  if (!artistName) return null;
  const key = artistName.toLowerCase();
  if (_artistCache.has(key)) return _artistCache.get(key);
  try {
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&attribute=artistTerm&limit=5&country=US`
    );
    const d = await r.json();
    const track = (d.results || []).find(t => t.previewUrl) || null;
    const url = track?.previewUrl || null;
    _artistCache.set(key, url);
    return url;
  } catch { return null; }
}

export async function getTrackPreviewUrl(trackName, artistName) {
  const key = `${trackName}|${artistName}`.toLowerCase();
  if (_trackCache.has(key)) return _trackCache.get(key);
  try {
    const query = artistName ? `${trackName} ${artistName}` : trackName;
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&country=US`
    );
    const d = await r.json();
    const track = (d.results || []).find(t => t.previewUrl) || null;
    const url = track?.previewUrl || null;
    _trackCache.set(key, url);
    return url;
  } catch { return null; }
}
