export default async function handler(req, res) {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!id || !secret) {
    return res.status(500).json({ error: 'Spotify credentials not configured' });
  }

  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });

    const data = await r.json();

    if (data.error) {
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // Tell the browser not to cache — the client handles token lifetime itself
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach Spotify' });
  }
}
