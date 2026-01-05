export default async function handler(req, res) {
  // Try to find the key in any possible environment variable slot
  const apiKey = process.env.GENERATIVE_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: No API Key found in Environment Variables!");
    return res.status(500).json({ error: "API Key is missing on the server." });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided." });
  }

  try {
    // We are using the Gemini 3 model you confirmed was available
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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
      console.error("Google API says:", data.error.message);
      return res.status(500).json({ error: data.error.message });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text: aiText });

  } catch (error) {
    console.error("Proxy Crash:", error.message);
    return res.status(500).json({ error: "Server crashed during API call." });
  }
}