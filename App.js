import React, { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    let storedSession = localStorage.getItem("sessionId");

    if (!storedSession) {
      storedSession = Date.now().toString();
      localStorage.setItem("sessionId", storedSession);
    }

    setSessionId(storedSession);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: input,
        }),
      });

      const data = await response.json();

      const botMessage = {
        role: "assistant",
        content: data.reply || "Something went wrong.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Server error." },
      ]);
    }

    setInput("");
  };

  const newChat = () => {
    const newSession = Date.now().toString();
    localStorage.setItem("sessionId", newSession);
    setSessionId(newSession);
    setMessages([]);
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="header">
          <h2>AI Support Assistant</h2>
          <button className="new-chat" onClick={newChat}>
            New Chat
          </button>
        </div>

        <div className="chat-box">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === "user" ? "user" : "assistant"}`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>

        <div className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
