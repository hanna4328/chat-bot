import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css";

function App() {
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");  // Default to a supported Gemini model discovered in your account
    const [modelId, setModelId] = useState("models/gemma-3-1b-it");
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
    // Local cooldown configuration
    // We remove persistent blocking cooldown; instead we detect rapid re-sends (< typingThreshold)
    // and show a short advisory wait (2s) when the user tries to send too quickly.
    const [cooldownMs, setCooldownMs] = useState(0);
    const [cooldownLeft, setCooldownLeft] = useState(0);
    const typingThreshold = 3000; // if user tries to send within 3s of previous send, show short wait
  const lastRequestTime = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Run one-time confetti on first visit when chat opens
  useEffect(() => {
    if (!showChat) return;
    // if we already have chat history, don't show onboarding/confetti
    if (chatHistory.length > 0) return;

    // initial onboarding message (no API call)
    const onboarding = {
      role: "model",
      text: `A new year doesn’t ask for perfection. Just honesty.\nWhat’s one promise you quietly made to yourself?`,
      important: false,
    };
    setChatHistory((prev) => [...prev, onboarding]);

  // focus input on open
  setTimeout(() => inputRef.current?.focus?.(), 120);

    // show subtle confetti once per user (stored in localStorage)
    try {
      const key = "onward_confetti_shown";
      if (!localStorage.getItem(key)) {
        runConfettiOnce();
        localStorage.setItem(key, "1");
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [showChat]);

  // Simple confetti implementation (lightweight, runs a short burst)
  function runConfettiOnce() {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#6d28d9", "#a78bfa", "#ffffff"];

    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = 9999;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const particles = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        r: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 0.5,
        speed: 2 + Math.random() * 4,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, p.tilt, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function update() {
      const now = Date.now();
      particles.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.y * 0.01) * 1.5;
        p.tilt += 0.02;
        if (p.y > canvas.height + 50) {
          p.y = -10 - Math.random() * canvas.height * 0.2;
          p.x = Math.random() * canvas.width;
        }
      });
      draw();
      if (now < end) requestAnimationFrame(update);
      else {
        // cleanup
        window.removeEventListener("resize", resize);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    }
    requestAnimationFrame(update);
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // UI countdown for cooldown left (updates while cooldown is active)
  useEffect(() => {
    let timer = null;
    // Only run countdown when there's an active cooldown duration
    if (lastRequestTime.current && cooldownMs > 0) {
      timer = setInterval(() => {
        const elapsed = Date.now() - lastRequestTime.current;
        const left = Math.max(0, cooldownMs - elapsed);
        setCooldownLeft(Math.ceil(left / 1000));
        if (left <= 0) {
          clearInterval(timer);
          setCooldownLeft(0);
        }
      }, 250);
    }
    return () => clearInterval(timer);
  }, [cooldownMs]);

 const askAI = async () => {
  if (!question.trim()) return;

  // If the user tries to send again too quickly (typingThreshold), show a short advisory wait (2s)
  if (lastRequestTime.current) {
    const timeSinceLastRequest = Date.now() - lastRequestTime.current;
    if (timeSinceLastRequest < typingThreshold) {
      const advisoryMs = 2000;
      setError(`Please wait ${Math.ceil(advisoryMs / 1000)} seconds before trying again`);
      setCooldownMs(advisoryMs);
      lastRequestTime.current = Date.now();
      return;
    }
    if (cooldownMs > 0) {
      const timeSince = Date.now() - lastRequestTime.current;
      if (timeSince < cooldownMs) {
        setError(
          `Please wait ${Math.ceil((cooldownMs - timeSince) / 1000)} seconds before trying again`
        );
        return;
      }
    }
  }

  setLoading(true);
  setError("");

  const userMessage = { role: "user", text: question };
  setChatHistory((prev) => [...prev, userMessage]);
  setQuestion("");

  try {
    const context =
      "You are a friendly and helpful ONWARD chatbot. Be encouraging, reflective, and concise.";
    const prompt = `${context}\n\nUser question: ${question}`;

    // 🔒 SECURE SERVERLESS CALL (ONLY CHANGE)
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`Server error ${resp.status}: ${errBody}`);
    }

    const data = await resp.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I’m here with you.";

    const importantMatch = /win|celebrat|onward|small win|congrat|glad|proud/i;
    const isImportant = importantMatch.test(String(text));

    const aiMessage = { role: "model", text, important: isImportant };
    setChatHistory((prev) => [...prev, aiMessage]);

    lastRequestTime.current = Date.now();
  } catch (error) {
    console.error("Error asking AI:", error);
    setError("An error occurred. Please try again.");
    setChatHistory((prev) => prev.slice(0, -1));
  }

  setLoading(false);
};

  return (
    <div className="app-container">
      <div className="header">ONWARD</div>
      {loading && (
        <div className="progress-bar" aria-hidden>
          <div className="progress" />
        </div>
      )}
  <div className="chat-history" role="log" aria-live="polite">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === "user" ? "user-message" : "ai-message"} ${message.important ? "important" : ""}`}
          >
            {message.text}
          </div>
        ))}
        {loading && (
          <div className="message ai-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="input-area">
        <textarea
          rows="1"
          placeholder="Share a promise or ask for a little push..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          ref={inputRef}
          aria-label="Message input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              askAI();
            }
          }}
        />
        <button onClick={askAI} disabled={loading || cooldownLeft > 0} aria-label="Send message">
          {loading ? "..." : "➤"}
        </button>
      </div>
      {cooldownLeft > 0 && (
        <div style={{ padding: "6px 12px", color: "#b91c1c" }}>
          Please wait {cooldownLeft} second{cooldownLeft > 1 ? "s" : ""} before sending another message.
        </div>
      )}
    </div>
  );
}

export default App;