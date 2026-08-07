import { loadToken, saveToken } from "./utils/tokenStore.js";

export async function getTokenFromDB() {
  return loadToken();
}

export async function saveTokensToDB({ access_token, refresh_token, expires_at }) {
  const existing = loadToken() || {};
  saveToken({ ...existing, access_token, refresh_token, expires_at });
}
