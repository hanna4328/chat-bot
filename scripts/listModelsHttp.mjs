import axios from 'axios';
import fs from 'fs';
import path from 'path';

function loadApiKey() {
  // Look for env var first
  const envKey = process.env.GENERATIVE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;

  // Fallback: read .env from project root
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...rest] = trimmed.split('=');
      const v = rest.join('=').trim();
      if (k === 'GENERATIVE_API_KEY' || k === 'VITE_GEMINI_API_KEY') return v;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function main() {
  const key = loadApiKey();
  console.log('API key present:', !!key);
  if (!key) {
    console.error('No API key found in env or .env. Set GENERATIVE_API_KEY or VITE_GEMINI_API_KEY.');
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
  console.log('Requesting models from:', url.replace(/key=[^&]+/, 'key=<REDACTED>'));

  try {
    const res = await axios.get(url, { timeout: 15000 });
    console.log('HTTP', res.status);
    console.dir(res.data, { depth: 4 });

    // Try to extract model IDs for convenience
    const models = res.data?.models || res.data?.data || res.data || [];
    if (Array.isArray(models) && models.length) {
      console.log('\nFound models:');
      for (const m of models) {
        const id = m.name || m.id || m.model || (typeof m === 'string' ? m : JSON.stringify(m).slice(0, 80));
        const desc = m.description || m.displayName || '';
        console.log('-', id, desc ? `(${desc})` : '');
      }
    } else {
      console.log('No models array found in response. See full output above.');
    }
  } catch (err) {
    console.error('Request failed:');
    if (err.response) {
      console.error('HTTP status:', err.response.status);
      console.error('Response body:');
      console.dir(err.response.data, { depth: 4 });
    } else {
      console.error(err.message || String(err));
    }
    process.exit(1);
  }
}

main();
