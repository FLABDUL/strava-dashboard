// utils/tokenStore.js

import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL, // ensure this is set in Railway
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Save or update the token in the Postgres database
 */
export async function saveToken({ access_token, refresh_token, expires_at }) {
  await pool.query(
    `
    INSERT INTO tokens (id, access_token, refresh_token, expires_at)
    VALUES (1, $1, $2, $3)
    ON CONFLICT (id)
    DO UPDATE SET access_token = $1, refresh_token = $2, expires_at = $3
  `,
    [access_token, refresh_token, expires_at]
  );
}

/**
 * Retrieve the current token from the Postgres database
 */
export async function getValidToken() {
  const result = await pool.query(`SELECT * FROM tokens WHERE id = 1`);
  return result.rows[0];
}
