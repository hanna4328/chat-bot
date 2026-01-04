# ONWARD backend (proxy)

This is a minimal Express proxy that forwards generate requests to the Google Generative Language API.

Setup

1. Install dependencies (from project root):

```bash
npm install
```

2. Set your API key in the environment (do NOT commit this key):

Windows (cmd):

```bat
set GENERATIVE_API_KEY=your_api_key_here
npm run server
```

PowerShell (session):

```powershell
$env:GENERATIVE_API_KEY='your_api_key_here'; npm run server
```

3. The server listens on port 4000 by default. The React app will call `/api/generate` on the same origin when you run the frontend locally and the dev server proxies to the backend, or you can run the backend separately and update the frontend to point to `http://localhost:4000/api/generate`.

Request shape (POST /api/generate)

```json
{ "prompt": "your prompt text", "modelId": "models/gemma-3-1b-it" }
```

Response

The server forwards the raw response from the Generative API. The frontend attempts to extract text from common response shapes.

Security

Do not expose your API key in the frontend. Use this server or serverless functions for production.
