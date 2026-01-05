export default async function handler(req, res) {
  const apiKey = process.env.GENERATIVE_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server Error: API Key is missing." });
  }

  const { prompt } = req.body;

  try {
    // We call the v1 endpoint directly instead of v1beta
    // This is the most stable production endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

    if (data.error) {
      return res.status(response.status).json({ error: data.error.message });
    }

    // Extracting the text from the standard Google response shape
    const aiText = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ text: aiText });
  } catch (error) {
    console.error("Fetch Error:", error.message);
    return res.status(500).json({ error: "Failed to communicate with Gemini API" });
  }
}