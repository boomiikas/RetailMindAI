import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowUpRight, Bot, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import axios from 'axios';
import { useApp } from '../../context/AppContext';

const SUGGESTED_PROMPTS = [
  'Show critical stock risks',
  'Forecast tomorrow milk demand',
  'Find stock to transfer'
];

const INITIAL_MESSAGES = [{
  id: 1,
  role: 'assistant',
  text: "Hi, I'm Copilot. What can I help with today?",
  time: 'Just now'
}];

const renderInlineMarkdown = (text, keyPrefix) => text
  .split(/(\*\*[^*]+\*\*)/g)
  .filter(Boolean)
  .map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong className="chatbot-message-strong" key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>
    : <React.Fragment key={`${keyPrefix}-${index}`}>{part.replace(/\*\*/g, '')}</React.Fragment>);

const renderMessage = (text) => text.split(/\n{2,}/).map((block, blockIndex) => {
  const lines = block.split('\n');
  const containsList = lines.some((line) => /^\s*(?:[-*•]|\d+\.)\s+/.test(line));
  if (containsList) {
    return (
      <div className="chatbot-message-list" key={`block-${blockIndex}`}>
        {lines.map((line, lineIndex) => {
          const match = line.match(/^\s*(?:([-*•])|(\d+)\.)\s+(.+)$/);
          if (match) {
            return (
              <div className="chatbot-message-list-item" key={`line-${lineIndex}`}>
                <span className="chatbot-message-list-marker">{match[2] ? `${match[2]}.` : '•'}</span>
                <span>{renderInlineMarkdown(match[3], `list-${blockIndex}-${lineIndex}`)}</span>
              </div>
            );
          }
          return line.trim() ? (
            <p className="chatbot-message-paragraph" key={`line-${lineIndex}`}>
              {renderInlineMarkdown(line.replace(/^\s*#{1,3}\s*/, ''), `text-${blockIndex}-${lineIndex}`)}
            </p>
          ) : null;
        })}
      </div>
    );
  }

  return (
    <p className="chatbot-message-paragraph" key={`block-${blockIndex}`}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={`line-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {renderInlineMarkdown(line, `text-${blockIndex}-${lineIndex}`)}
        </React.Fragment>
      ))}
    </p>
  );
});

const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);
  const { selectedStore, pendingRecommendationsCount } = useApp();

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const sendMessage = async (prompt) => {
    const query = (prompt || input).trim();
    if (!query || isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { id: Date.now(), role: 'user', text: query, time };
    const history = messages.slice(-4).map(({ role, text }) => ({ role, content: text }));
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await axios.post('/api/v1/chat', {
        message: query,
        store_id: selectedStore || 'all',
        history
      });
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.reply,
        isOffTopic: !data.is_domain_relevant,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Copilot is unable to reach the service right now. Please try again shortly.',
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="retail-chatbot-root">
      {!isOpen && (
        <button className="chatbot-floating-btn" onClick={() => setIsOpen(true)} title="Open Copilot">
          <div className="chatbot-btn-inner">
            <div style={{ position: 'relative' }}>
              <Bot size={22} className="chatbot-icon" />
              {pendingRecommendationsCount > 0 && <span className="chatbot-pending-dot" />}
            </div>
            <span className="chatbot-trigger-label">Copilot</span>
          </div>
        </button>
      )}

      {isOpen && (
        <section className="chatbot-panel" aria-label="Copilot">
          <header className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar"><Bot size={20} /></div>
              <div><div className="chatbot-title"><span>Copilot</span></div></div>
            </div>
            <div className="chatbot-actions">
              <button className="chatbot-icon-btn" onClick={() => setMessages(INITIAL_MESSAGES)} title="Clear conversation" aria-label="Clear conversation">
                <RotateCcw size={15} />
              </button>
              <button className="chatbot-icon-btn" onClick={() => setIsOpen(false)} title="Close Copilot" aria-label="Close Copilot">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="chatbot-messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-msg-wrapper ${message.role === 'user' ? 'user-align' : 'bot-align'}`}>
                {message.role === 'assistant' && (
                  <div className={`chatbot-msg-avatar ${message.isOffTopic || message.isError ? 'offtopic-avatar' : ''}`}>
                    {message.isOffTopic || message.isError ? <AlertCircle size={14} /> : <Bot size={14} />}
                  </div>
                )}
                <div className={`chatbot-msg-bubble ${message.role === 'user' ? 'user-bubble' : message.isOffTopic || message.isError ? 'offtopic-bubble' : 'bot-bubble'}`}>
                  <div className="chatbot-message-content">
                    {message.role === 'assistant' ? renderMessage(message.text) : message.text}
                  </div>
                  <span className="chatbot-msg-time">{message.time}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-msg-wrapper bot-align">
                <div className="chatbot-msg-avatar"><Bot size={14} /></div>
                <div className="chatbot-msg-bubble bot-bubble typing-bubble">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && (
            <div className="chatbot-quick-prompts">
              <span className="quick-prompts-label"><Sparkles size={13} /> Try asking</span>
              <div className="quick-prompts-row">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button key={prompt} className="quick-prompt-btn" onClick={() => sendMessage(prompt)} disabled={isLoading}>
                    <span>{prompt}</span><ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="chatbot-input-bar" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input
              type="text"
              className="chatbot-input-field"
              placeholder="Ask about inventory, forecasts, or risks..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
            />
            <button className="chatbot-send-btn" type="submit" aria-label="Send message" disabled={isLoading || !input.trim()}>
              <Send size={15} />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default FloatingAssistant;
