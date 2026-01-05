import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Check every possible name you might have used in Vercel
  const apiKey = process.env.GENERATIVE_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // This is the error you are currently seeing
    return res.status(500).json({ error: "Server Error: API Key is missing from environment variables." });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return res.status(200).json({ text: response.text() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}