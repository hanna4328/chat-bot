import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const API_KEY = process.env.GENERATIVE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('Set GENERATIVE_API_KEY or VITE_GEMINI_API_KEY in your environment before running this script.');
    process.exit(1);
  }
  console.log('API key present:', !!API_KEY);
  // Do NOT print the key itself to avoid leaking secrets in logs

  const genAI = new GoogleGenerativeAI(API_KEY);

  try {
    if (typeof genAI.listModels === 'function') {
      const res = await genAI.listModels();
      console.log('listModels result:');
      console.dir(res, { depth: 4 });
    } else if (genAI.models && typeof genAI.models.list === 'function') {
      const res = await genAI.models.list();
      console.log('models.list result:');
      console.dir(res, { depth: 4 });
    } else {
      console.error('This SDK version does not expose a listModels method.');
    }
  } catch (err) {
    // Provide detailed diagnostics to help identify whether this is an auth or network issue
    console.error('Error listing models:');
    if (err && err.response) {
      try {
        // Some errors include a response body with details
        console.error('HTTP status:', err.response.status);
        console.error('HTTP body:', err.response.data ?? err.response.body ?? '<no body>');
      } catch (e) {
        // ignore
      }
    }
    console.error(err?.message ?? String(err));
    if (err?.stack) console.error(err.stack);
  }
}

main();
