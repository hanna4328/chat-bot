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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generate?key=${encodeURIComponent(key)}`;

    const body = {
      prompt: { text: prompt },
      temperature,
      maxOutputTokens,
    };

    const response = await axios.post(url, body, { timeout: 20000 });

    // Forward the provider response directly for the frontend to parse
    return res.status(200).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { message: err.message };

    // Propagate Retry-After when rate-limited
    if (err.response?.status === 429 && err.response.headers?.["retry-after"]) {
      res.setHeader("Retry-After", err.response.headers["retry-after"]);
    }

    return res.status(status).json({ error: data });
  }
}
