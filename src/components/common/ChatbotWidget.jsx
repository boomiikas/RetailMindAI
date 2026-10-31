import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, Send, X, RotateCcw, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { useApp } from '../../context/AppContext';

const SUGGESTED_PROMPTS = [
  "Which products have critical stockout risks?",
  "What is tomorrow's milk demand forecast?",
  "Which store has transferable surplus stock?",
  "Are there any decisions pending manager approval?"
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    text: "Hello! I am **RetailMind AI Copilot**, your real-time decision intelligence assistant.\n\nI monitor multi-store inventory, predict quantile demand (P10/P50/P90), and evaluate supply-chain interventions across Tamil Nadu. How can I assist your operations today?",
    time: 'Just now'
  }
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { selectedStore } = useApp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend Chatbot endpoint
      const response = await axios.post('/api/v1/chat', {
        message: query,
        store_id: selectedStore || 'all',
        history: messages.slice(-4).map((m) => ({ role: m.role, content: m.text }))
      });

      const data = response.data;
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.reply,
        isOffTopic: !data.is_domain_relevant,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: "⚠️ Unable to reach RetailMind AI backend. Please verify that FastAPI is running on port 8000.",
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="retail-chatbot-root">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="chatbot-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Open RetailMind AI Copilot"
        >
          <div className="chatbot-btn-inner">
            <Bot size={22} className="chatbot-icon" />
            <span className="chatbot-badge-live">Live</span>
          </div>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="chatbot-panel animate-fade-in">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <Bot size={18} />
              </div>
              <div>
                <div className="chatbot-title">
                  RetailMind Copilot <span className="chatbot-groq-pill">Groq LPU</span>
                </div>
                <div className="chatbot-subtitle">
                  <span className="live-dot" />
                  Real-time Decision Intelligence
                </div>
              </div>
            </div>
            <div className="chatbot-actions">
              <button
                className="chatbot-icon-btn"
                onClick={handleResetChat}
                title="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="chatbot-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chatbot-messages-container">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chatbot-msg-wrapper ${m.role === 'user' ? 'user-align' : 'bot-align'}`}
              >
                {m.role === 'assistant' && (
                  <div className={`chatbot-msg-avatar ${m.isOffTopic ? 'offtopic-avatar' : ''}`}>
                    {m.isOffTopic ? <AlertCircle size={14} /> : <Sparkles size={14} />}
                  </div>
                )}
                <div
                  className={`chatbot-msg-bubble ${
                    m.role === 'user'
                      ? 'user-bubble'
                      : m.isOffTopic
                      ? 'offtopic-bubble'
                      : 'bot-bubble'
                  }`}
                >
                  <div className="chatbot-msg-text">
                    {m.text.split('\n').map((line, idx) => (
                      <p key={idx} style={{ margin: '3px 0' }}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <span className="chatbot-msg-time">{m.time}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-msg-wrapper bot-align">
                <div className="chatbot-msg-avatar">
                  <Sparkles size={14} />
                </div>
                <div className="chatbot-msg-bubble bot-bubble typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="chatbot-chips-scroll">
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                className="chatbot-chip"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            className="chatbot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Ask about inventory, demand, or transfers..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
