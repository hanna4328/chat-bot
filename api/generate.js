export default async function handler(req, res) {
  const apiKey = process.env.GENERATIVE_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing in Vercel" });

  const { prompt } = req.body;

  try {
    // 2026 Stable Model: gemini-2.5-flash
    // Using the /v1/ endpoint which is the production standard now
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      // This will tell us if it's a key issue or a model issue
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text: aiText });

  } catch (error) {
    return res.status(500).json({ error: "Network Error: Could not reach Google." });
  }
}