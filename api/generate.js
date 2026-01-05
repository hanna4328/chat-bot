import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Try to pull the key (check both common naming conventions)
  const apiKey = process.env.GENERATIVE_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server Error: API Key is missing from environment variables." });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash which is standard and stable
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const { prompt } = req.body;
    
    // Explicitly calling the generateContent method
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}