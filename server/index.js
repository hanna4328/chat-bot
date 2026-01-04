import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// ✅ Backend key ONLY
const API_KEY = process.env.GENERATIVE_API_KEY;

if (!API_KEY) {
  console.error("❌ GENERATIVE_API_KEY missing");
}

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

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

  // ✅ CORRECT model name format
  const model = "gemini-1.0-pro";

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${API_KEY}`;

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

    const response = await axios.post(url, body, { timeout: 60000 });
    return res.status(200).json(response.data);
  } catch (err) {
    console.error("❌ Gemini proxy error:", err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
