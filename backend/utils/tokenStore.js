import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: { rejectUnauthorized: false },
});

export async function saveTokens(tokens) {
  // upsert into tokens table
  const query = `
    INSERT INTO tokens (id, access_token, refresh_token, expires_at)
    VALUES (1, $1, $2, $3)
    ON CONFLICT (id)
    DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_at = EXCLUDED.expires_at
  `;
  await pool.query(query, [
    tokens.access_token,
    tokens.refresh_token,
    tokens.expires_at,
  ]);
}

export async function getTokens() {
  const result = await pool.query('SELECT * FROM tokens WHERE id = 1');
  return result.rows[0];
}

export async function getValidToken() {
  const token = await getTokens();
  if (!token) throw new Error("No token found");

  const now = Math.floor(Date.now() / 1000);
  if (token.expires_at > now) {
    return token.access_token;
  }

  // refresh logic
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }),
  });

  const refreshed = await response.json();
  await saveTokens(refreshed);
  return refreshed.access_token;
}
