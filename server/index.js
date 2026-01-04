import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const API_KEY = process.env.GENERATIVE_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Warning: GENERATIVE_API_KEY not set. The server will reject generate requests.');
}

app.use(cors());
// Capture raw request body (for debugging malformed JSON) and parse JSON normally
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf && buf.toString();
    } catch (e) {
      req.rawBody = undefined;
    }
  },
}));

app.post('/api/generate', async (req, res) => {
  // Debug: log incoming headers and a short preview of the raw body (won't log secrets)
  console.log('Incoming /api/generate', { headers: req.headers, rawBodyPreview: req.rawBody ? req.rawBody.slice(0, 1000) : undefined });

  const { prompt, modelId, temperature = 0.7, maxOutputTokens = 512 } = req.body || {};
  if (!API_KEY) return res.status(500).json({ error: 'Server missing API key' });
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!modelId) return res.status(400).json({ error: 'Missing modelId' });

  try {
    // Use the correct provider action suffix
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generate?key=${encodeURIComponent(API_KEY)}`;
    const body = {
      prompt: { text: prompt },
      temperature,
      maxOutputTokens,
    };

    const response = await axios.post(url, body, { timeout: 60000 });
    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Proxy generate error:', err?.response?.data ?? err.message ?? err);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ error: String(err) });
  }
});

// JSON parse error handler (graceful response + helpful logs)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON received', { rawBody: req.rawBody, headers: req.headers });
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
