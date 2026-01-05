import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = process.env.GENERATIVE_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using 'gemini-1.5-flash-latest' is the safest way to target the model
    // without hitting a specific version that might be deprecated/not found.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const { prompt } = req.body;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("Empty response from AI");

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Vercel Proxy Error:", error.message);
    // This sends the actual Google error back to your browser console
    return res.status(500).json({ error: error.message });
  }
}