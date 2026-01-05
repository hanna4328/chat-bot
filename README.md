# ONWARD 🚀
**"I’m here to remind you of what you promised yourself."**

A modern, responsive AI chat application built to help users track and reflect on their personal resolutions. Featuring a floating card UI for desktop and a keyboard-optimized interface for mobile.

---

## ✨ Features
* **Gemini 3 Integration:** Powered by Google's latest `gemini-3-flash-preview` model via Vercel Serverless functions.
* **Dynamic Viewport Handling:** Optimized for mobile keyboards using `100dvh` and visual viewport scrolling.
* **Responsive UI:** Elegant floating card layout on desktop; immersive full-screen experience on mobile.
* **Interactive Confetti:** Custom canvas-based background animation for a celebratory feel.
* **Smart History:** Remembers the context of the conversation for personalized encouragement.

## 🛠️ Tech Stack
* **Frontend:** React 18, Vite
* **Backend:** Vercel Serverless Functions (Node.js)
* **AI Engine:** Google Generative AI (Gemini API)
* **Styling:** CSS3 (Flexbox, Media Queries, Dynamic Viewport)

## 🏗️ Project Components

| Component | Description |
| :--- | :--- |
| `App.jsx` | Main logic handler, chat state management, and confetti canvas. |
| `api/generate.js` | Secure Vercel Proxy that communicates with the Gemini API. |
| `App.css` | Responsible for the "Floating Card" desktop look and mobile responsiveness. |
| `.env` | Stores the `GENERATIVE_API_KEY` (Not tracked in Git). |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone [https://github.com/your-username/college-companion.git](https://github.com/your-username/college-companion.git)
cd college-companion
```

### 2. Install dependencies
```bash

npm install
```
### 3. Set up Environment Variables
Create a .env file in the root directory:

```.env

GENERATIVE_API_KEY=your_actual_api_key_here
```

### 4. Run Locally
Use the Vercel CLI to test serverless functions locally (this is required for the API to work):

```bash

vercel dev
```

### 🌍 Deployment

- This project is optimized for Vercel.

- Push your code to your GitHub repository.

- Connect your repo to a new project in the Vercel Dashboard.

- Add Environment Variables: Under Settings > Environment Variables, add GENERATIVE_API_KEY with your Google Gemini API key.

- Deploy: Vercel will automatically build and deploy your site.

### 📝 License

Distributed under the MIT License. See LICENSE for more information.
