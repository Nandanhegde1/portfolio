// Cached Spotify access token (refreshed via Refresh Token flow).
let cache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (cache.token && Date.now() < cache.expiresAt) return cache.token;

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) return null;

  const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${SPOTIFY_REFRESH_TOKEN}`,
  });

  if (!response.ok) return null;

  const data = await response.json();
  // Subtract 60s from expiry to avoid edge-case races.
  cache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

async function getNowPlaying() {
  const token = await getAccessToken();
  if (!token) return { isPlaying: false, mock: true };

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204 || !response.ok) return { isPlaying: false };

    const data = await response.json();
    return {
      isPlaying: data.is_playing,
      title: data.item?.name,
      artist: data.item?.artists?.map((a) => a.name).join(', '),
      album: data.item?.album?.name,
      albumArt: data.item?.album?.images?.[0]?.url,
      progress: data.progress_ms,
      duration: data.item?.duration_ms,
      url: data.item?.external_urls?.spotify,
    };
  } catch {
    return { isPlaying: false };
  }
}

module.exports = { getNowPlaying };
