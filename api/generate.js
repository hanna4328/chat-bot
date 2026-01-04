import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, modelId = "models/gemma-3-1b-it", temperature = 0.3, maxOutputTokens = 512 } = req.body || {};

  if (!prompt) return res.status(400).json({ error: "Missing prompt in request body" });

  const key = process.env.GENERATIVE_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing GENERATIVE_API_KEY environment variable on the server" });

  try {
    // Normalize model ID: accept either "models/gemma-3-1b-it" or "gemma-3-1b-it"
    const normalizedModel = String(modelId || "").replace(/^models\//i, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizedModel)}:generate?key=${encodeURIComponent(key)}`;

    const body = {
      prompt: { text: prompt },
      temperature,
      maxOutputTokens,
    };

    // Helpful debug log (does not include secret)
    console.log('Proxy calling generative API', { model: normalizedModel, maxOutputTokens, temperature });

    // Debug-only mode: when ?debug=1 or header x-debug: true, return constructed request (no key, no external call)
    if (String(req.query?.debug) === '1' || String(req.headers?.['x-debug']) === 'true') {
      return res.status(200).json({ debug: { model: normalizedModel, url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizedModel)}:generate`, body } });
    }

    const response = await axios.post(url, body, { timeout: 20000 });

    // Forward the provider response directly for the frontend to parse
    return res.status(200).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { message: err.message };

    // Extra server-side logging to help diagnose provider errors (does not log the API key)
    try {
      console.error('Generative API error:', {
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
        message: err.message,
        stack: err.stack?.split('\n').slice(0,3),
      });
    } catch (logErr) {
      console.error('Error logging generative API failure', logErr?.message || logErr);
    }

    // Propagate Retry-After when rate-limited
    if (err.response?.status === 429 && err.response.headers?.["retry-after"]) {
      res.setHeader("Retry-After", err.response.headers["retry-after"]);
    }

    // Return provider error body (safe) to client for debugging
    return res.status(status).json({ error: data, _note: 'See server logs for more details' });
  }
}
