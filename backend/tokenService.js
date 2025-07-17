import pool from "./db.js";

export async function getTokenFromDB() {
  const res = await pool.query("SELECT * FROM tokens ORDER BY id DESC LIMIT 1");
  return res.rows[0];
}

export async function saveTokensToDB({ access_token, refresh_token, expires_at }) {
  const existing = await pool.query("SELECT id FROM tokens LIMIT 1");

  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO tokens (access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3)`,
      [access_token, refresh_token, expires_at]
    );
  } else {
    await pool.query(
      `UPDATE tokens SET access_token = $1, refresh_token = $2, expires_at = $3 WHERE id = $4`,
      [access_token, refresh_token, expires_at, existing.rows[0].id]
    );
  }
}
