import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

/**
 * 🔐 IMPORTANT
 * Backend should ONLY read a backend key.
 * Do NOT fall back to VITE_* variables here.
 */
const API_KEY = process.env.GENERATIVE_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ GENERATIVE_API_KEY is not set on the server");
}

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());

/**
 * POST /api/generate
 */
app.post("/api/generate", async (req, res) => {
  const {
    prompt,
    temperature = 0.7,
    maxOutputTokens = 512
  } = req.body || {};

  if (!API_KEY) {
    return res.status(500).json({ error: "Server missing API key" });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  /**
   * ✅ Use a CURRENT, VALID model
   * gemini-pro is deprecated on v1beta
   */
  const model = "gemini-1.5-flash";

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${API_KEY}`;

    /**
     * ✅ Correct Gemini request body
     */
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    };

    const response = await axios.post(url, body, {
      timeout: 60000
    });

    return res.status(200).json(response.data);
  } catch (err) {
    console.error(
      "❌ Gemini proxy error:",
      err?.response?.data || err.message
    );

    if (err.response) {
      return res
        .status(err.response.status)
        .json(err.response.data);
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Health check (optional but helpful)
 */
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
