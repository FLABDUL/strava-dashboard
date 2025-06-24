// backend/utils/tokenStore.js
import fs from 'fs/promises';

const TOKEN_FILE = './token.json';

export async function saveToken(data) {
  await fs.writeFile(TOKEN_FILE, JSON.stringify(data));
}

export async function getToken() {
  const raw = await fs.readFile(TOKEN_FILE);
  return JSON.parse(raw);
}
