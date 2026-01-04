import axios from 'axios';

async function main() {
  const key = process.env.GENERATIVE_API_KEY;
  if (!key) {
    console.error('Set GENERATIVE_API_KEY in the environment before running this script.');
    process.exit(1);
  }

  const model = process.argv[2] || 'gemma-3-1b-it';
  const prompt = process.argv.slice(3).join(' ') || 'Quick local test';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generate?key=${encodeURIComponent(key)}`;
  const body = {
    prompt: { text: prompt },
    temperature: 0.3,
    maxOutputTokens: 512,
  };

  console.log('Calling:', url.replace(/key=[^&]+/, 'key=<REDACTED>'));
  try {
    const res = await axios.post(url, body, { timeout: 20000 });
    console.log('Status:', res.status);
    console.dir(res.data, { depth: 3 });
  } catch (err) {
    console.error('Request failed:');
    if (err.response) {
      console.error('HTTP', err.response.status);
      console.dir(err.response.data, { depth: 5 });
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
}

main();
