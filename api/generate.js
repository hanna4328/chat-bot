export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};

    // Validate input
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Read API key securely from Vercel environment
    const API_KEY = process.env.GENERATIVE_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Server missing API key" });
    }

    // Call Gemini API (stable v1 endpoint)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Forward Gemini response to frontend
    return res.status(200).json(data);
  } catch (error) {
    console.error("Gemini serverless error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
