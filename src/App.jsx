import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css";

function App() {
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Reverting to your specific model ID
  const [modelId] = useState("models/gemma-3-1b-it");

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // --- Confetti Logic (Unchanged) ---
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.className = "bg-confetti";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const colors = ["#6d28d9", "#a78bfa", "#ffffff"];
    let particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speed;
        p.tilt += 0.01;
        if (p.y > canvas.height) p.y = -20;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, p.tilt, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(update);
    };
    update();
    return () => {
      window.removeEventListener("resize", resize);
      document.body.removeChild(canvas);
    };
  }, []);

  // --- Onboarding (Unchanged) ---
  useEffect(() => {
    if (!showChat || chatHistory.length > 0) return;
    setChatHistory([{
      role: "model",
      text: `A new year doesn’t ask for perfection. Just honesty.\nWhat’s one promise you quietly made to yourself?`,
      important: false,
    }]);
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [showChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const askAI = async () => {
  if (!question.trim() || loading) return;

  setLoading(true);
  setError("");
  
  const currentQuestion = question;
  const userMsg = { role: "user", text: currentQuestion };
  const updatedHistory = [...chatHistory, userMsg];
  
  setChatHistory(updatedHistory);
  setQuestion("");

  try {
    // Construct the transcript for memory
    const historyContext = updatedHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join("\n");
    const fullPrompt = `You are a friendly and helpful ONWARD chatbot. Be encouraging and concise.\n\nConversation History:\n${historyContext}\n\nAssistant:`;

    // Talk to YOUR Vercel Proxy, not Google directly
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt }),
    });

    const data = await resp.json();

    if (data.error) throw new Error(data.error);

    const importantMatch = /win|celebrat|onward|congrat|proud/i;
    setChatHistory(prev => [...prev, { 
      role: 'model', 
      text: data.text, 
      important: importantMatch.test(data.text) 
    }]);
  } catch (err) {
    console.error(err);
    setError("Connection lost. Check if GENERATIVE_API_KEY is set in Vercel.");
  } finally {
    setLoading(false);
  }
};
  if (!showChat) {
    return (
      <div className="welcome-container">
        <h1>ONWARD</h1>
        <p>“I’m here to remind you of what you promised yourself.”</p>
        <button className="start-btn" onClick={() => setShowChat(true)}>Start Your Resolution</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="chat-history">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`message ${msg.role === "user" ? "user-message" : "ai-message"} ${msg.important ? "important" : ""}`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="message ai-message">
            <div className="typing-indicator"><span></span><span></span><span></span></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {error && <div className="error-message" style={{color: 'red', textAlign: 'center'}}>{error}</div>}

      <div className="input-area">
        <textarea
          rows="1"
          placeholder="Share a promise..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          ref={inputRef}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), askAI())}
        />
        {/* CENTERED BUTTON LOGIC */}
        <button className="send-circle-btn" onClick={askAI} disabled={loading}>
          {loading ? "..." : <span className="arrow-icon">➤</span>}
        </button>
      </div>
    </div>
  );
}

export default App;