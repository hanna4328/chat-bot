import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = process.env.GENERATIVE_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server Error: API Key is missing." });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // FIX: Using the exact string 'gemini-1.5-flash' without the 'models/' prefix
  // This is the most compatible name for the v1beta API
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const { prompt } = req.body;
    
    // We use generateContent as it is the standard method
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Internal API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}