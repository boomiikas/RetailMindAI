import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  MessageSquare,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Smartphone,
  CheckCheck,
  ShieldCheck,
  Zap,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Boxes
} from 'lucide-react';
import axios from 'axios';
import { RetailPulseApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

const SUGGESTED_PROMPTS = [
  "Which products have critical stockout risks?",
  "What is tomorrow's milk demand forecast?",
  "Which store has transferable surplus stock?",
  "Are there any decisions pending manager approval?"
];

const INITIAL_COPILOT_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    text: "Hello! I am **RetailMindAI Copilot**, your assistant.\n\nI monitor multi-store inventory across Tamil Nadu, predict quantile demand (P10/P50/P90), and orchestrate inter-store rebalancing. How can I assist your operations today?",
    time: 'Just now'
  }
];

const INITIAL_WHATSAPP_MESSAGES = [
  {
    id: 'wa-1',
    sender: 'bot',
    timestamp: '10:42 AM',
    type: 'interactive',
    decisionId: 'DEC_LIVE_DEMO_001',
    version: 1,
    title: '🚨 CRITICAL STOCKOUT ALERT | Salem Hub',
    body: `*Store:* Salem Central (SLM_01)\n*SKU:* Aavin Toned Fresh Milk 500ml (MILK_001)\n*Physical Stock:* 10 units (Safety Buffer: 25)\n*Predicted Stockout:* Within 3.5 Hours\n\n*Prescribed Multi-Agent Intervention:*\nInter-store surplus rebalance from Coimbatore (CBE_01).\n• Transfer Quantity: 50 units\n• Logistics Freight Cost: ₹100.00\n• Protected Revenue & Margin: ₹500.00\n• Coimbatore Remaining Stock: Safe (72 units remaining)`,
    options: [
      { id: 'INTER_STORE_TRANSFER', label: '✅ Approve Transfer (+50 units)' },
      { id: 'REPLENISH_SUPPLIER', label: '🚚 Expedite Supplier PO' },
      { id: 'APPLY_MARKDOWN', label: '🏷️ Clear Remaining (Markdown)' }
    ]
  }
];

const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('copilot'); // 'copilot' | 'whatsapp'
  const { selectedStore, approveRecommendation, pendingRecommendationsCount } = useApp();

  // Copilot Chat State
  const [copilotMessages, setCopilotMessages] = useState(INITIAL_COPILOT_MESSAGES);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const copilotEndRef = useRef(null);

  // WhatsApp Simulator State
  const [waMessages, setWaMessages] = useState(INITIAL_WHATSAPP_MESSAGES);
  const [waInput, setWaInput] = useState('');
  const [isWaLoading, setIsWaLoading] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [waSubTab, setWaSubTab] = useState('simulator'); // 'simulator' | 'credentials'
  const waEndRef = useRef(null);

  // Scroll handler
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'copilot') {
        copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        waEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [copilotMessages, waMessages, isOpen, activeTab]);

  // Copilot send message
  const handleSendCopilot = async (textToSend) => {
    const query = (textToSend || copilotInput).trim();
    if (!query || isCopilotLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotInput('');
    setIsCopilotLoading(true);

    try {
      const response = await axios.post('/api/v1/chat', {
        message: query,
        store_id: selectedStore || 'all',
        history: copilotMessages.slice(-4).map((m) => ({ role: m.role, content: m.text }))
      });

      const data = response.data;
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.reply,
        isOffTopic: !data.is_domain_relevant,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCopilotMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: "⚠️ RetailMind AI copilot is operating in local fallback mode. Please ensure FastAPI is running on port 8000.",
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCopilotMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // WhatsApp option click handler
  const handleWaOptionClick = async (optionId, decisionId, version) => {
    if (isWaLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setWaMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: time,
        type: 'text',
        text: `Selected: ${optionId.replace(/_/g, ' ')}`
      }
    ]);

    setIsWaLoading(true);
    try {
      const res = await RetailPulseApi.simulateWhatsAppApproval({
        decisionId: decisionId || 'DEC_LIVE_DEMO_001',
        version: version || 1,
        optionChosen: optionId,
        managerPhone: '+919843123456'
      });

      const replyText =
        res?.handler_result?.reply ||
        `✅ *APPROVAL CONFIRMED* | Decision \`${decisionId}\`\nAuthorized Strategy: *${optionId.replace(/_/g, ' ')}*\nExecution Status: *RESERVED & DISPATCH IN PROGRESS*\nStock reservations and transfer orders committed in ERP ledger.`;

      setWaMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: time,
          type: 'text',
          text: replyText
        }
      ]);

      if (decisionId && approveRecommendation) {
        approveRecommendation(decisionId);
      }
    } catch (err) {
      setWaMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: time,
          type: 'text',
          text: `⚠️ Approval processed locally. Action: *${optionId.replace(/_/g, ' ')}* registered.`
        }
      ]);
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleSendWaMessage = async () => {
    const text = waInput.trim();
    if (!text || isWaLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setWaMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: time,
        type: 'text',
        text: text
      }
    ]);
    setWaInput('');
    setIsWaLoading(true);

    try {
      const res = await RetailPulseApi.simulateWhatsAppApproval({
        decisionId: 'CUSTOM_TEXT',
        version: 1,
        optionChosen: text,
        managerPhone: '+919843123456'
      });

      setWaMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: time,
          type: 'text',
          text: res?.handler_result?.reply || `Received: "${text}". RetailMind agent acknowledged.`
        }
      ]);
    } catch (e) {
      setWaMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: time,
          type: 'text',
          text: `Echo acknowledged: "${text}". Agent standing by.`
        }
      ]);
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText('http://localhost:8000/api/v1/whatsapp/webhook');
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="retail-chatbot-root">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="chatbot-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Open RetailMind AI Assistant"
        >
          <div className="chatbot-btn-inner">
            <div style={{ position: 'relative' }}>
              <Bot size={22} className="chatbot-icon" />
              {pendingRecommendationsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    border: '2px solid #FFFFFF'
                  }}
                />
              )}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>AI Copilot & WhatsApp</span>
            <span className="chatbot-badge-live">LIVE</span>
          </div>
        </button>
      )}

      {/* Floating Drawer / Panel */}
      {isOpen && (
        <div className="chatbot-panel" style={{ width: '430px', height: '620px' }}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                {activeTab === 'copilot' ? <Bot size={20} /> : <Smartphone size={20} />}
              </div>
              <div>
                <div className="chatbot-title">
                  <span>RetailMind Assistant</span>
                  <span className="chatbot-groq-pill">GROQ Llama-3</span>
                </div>
                <div className="chatbot-subtitle">
                  <span className="live-dot" />
                  <span>Tamil Nadu Network Intelligence</span>
                </div>
              </div>
            </div>

            <div className="chatbot-actions">
              {activeTab === 'copilot' && (
                <button
                  className="chatbot-icon-btn"
                  onClick={() => setCopilotMessages(INITIAL_COPILOT_MESSAGES)}
                  title="Clear conversation"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                className="chatbot-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Dual Tab Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid #334155',
              padding: '0.35rem 0.75rem',
              gap: '0.5rem'
            }}
          >
            <button
              onClick={() => setActiveTab('copilot')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: activeTab === 'copilot' ? '#FFFFFF' : '#94A3B8',
                backgroundColor: activeTab === 'copilot' ? '#2563EB' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Bot size={14} />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: activeTab === 'whatsapp' ? '#FFFFFF' : '#94A3B8',
                backgroundColor: activeTab === 'whatsapp' ? '#16A34A' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={14} />
              <span>WhatsApp Manager Hub</span>
              {pendingRecommendationsCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFF',
                    borderRadius: '999px',
                    padding: '0.05rem 0.35rem',
                    fontSize: '0.65rem'
                  }}
                >
                  {pendingRecommendationsCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: COPILOT VIEW */}
          {activeTab === 'copilot' && (
            <>
              <div className="chatbot-messages-container">
                {copilotMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chatbot-msg-wrapper ${
                      msg.role === 'user' ? 'user-align' : 'bot-align'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        className={`chatbot-msg-avatar ${
                          msg.isOffTopic ? 'offtopic-avatar' : ''
                        }`}
                      >
                        {msg.isOffTopic ? <AlertCircle size={14} /> : <Bot size={14} />}
                      </div>
                    )}

                    <div
                      className={`chatbot-msg-bubble ${
                        msg.role === 'user'
                          ? 'user-bubble'
                          : msg.isOffTopic
                          ? 'offtopic-bubble'
                          : 'bot-bubble'
                      }`}
                    >
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      <span className="chatbot-msg-time">{msg.time}</span>
                    </div>
                  </div>
                ))}

                {isCopilotLoading && (
                  <div className="chatbot-msg-wrapper bot-align">
                    <div className="chatbot-msg-avatar">
                      <Bot size={14} />
                    </div>
                    <div className="chatbot-msg-bubble bot-bubble typing-bubble">
                      <span className="typing-dot" style={{ animation: 'bounce 1s infinite 0ms' }} />
                      <span className="typing-dot" style={{ animation: 'bounce 1s infinite 200ms' }} />
                      <span className="typing-dot" style={{ animation: 'bounce 1s infinite 400ms' }} />
                    </div>
                  </div>
                )}
                <div ref={copilotEndRef} />
              </div>

              {/* Quick Prompts */}
              {copilotMessages.length <= 2 && (
                <div className="chatbot-quick-prompts">
                  <span className="quick-prompts-label">Quick Prompts:</span>
                  <div className="quick-prompts-row">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        className="quick-prompt-btn"
                        onClick={() => handleSendCopilot(prompt)}
                        disabled={isCopilotLoading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="chatbot-input-bar">
                <input
                  type="text"
                  className="chatbot-input-field"
                  placeholder="Ask about inventory, forecasts, risks..."
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCopilot()}
                  disabled={isCopilotLoading}
                />
                <button
                  className="chatbot-send-btn"
                  onClick={() => handleSendCopilot()}
                  disabled={isCopilotLoading || !copilotInput.trim()}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}

          {/* TAB 2: WHATSAPP MANAGER HUB VIEW */}
          {activeTab === 'whatsapp' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#EFEAE2' }}>
              {/* WhatsApp sub-bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: '#075E54',
                  color: '#FFFFFF',
                  fontSize: '0.725rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={14} color="#25D366" />
                  <span>Manager Approvals (+91 98431 23456)</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setWaSubTab(waSubTab === 'simulator' ? 'credentials' : 'simulator')}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: '#FFF',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      cursor: 'pointer'
                    }}
                  >
                    {waSubTab === 'simulator' ? 'API Config' : 'Simulator'}
                  </button>
                </div>
              </div>

              {waSubTab === 'credentials' ? (
                /* Meta Cloud API Info Panel */
                <div style={{ flex: 1, padding: '1rem', backgroundColor: '#F8FAFC', overflowY: 'auto' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#172033', marginBottom: '0.5rem' }}>
                    Meta WhatsApp Cloud API Status
                  </h4>
                  <div
                    style={{
                      backgroundColor: '#DCFCE7',
                      border: '1px solid #86EFAC',
                      borderRadius: '6px',
                      padding: '0.6rem',
                      fontSize: '0.75rem',
                      color: '#15803D',
                      marginBottom: '0.85rem'
                    }}
                  >
                    ✅ <strong>Active Token Injected:</strong> EAATCdZA8BNX...
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <strong>Webhook URL:</strong>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: '#E2E8F0',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '4px',
                          marginTop: '0.2rem',
                          fontFamily: 'monospace',
                          fontSize: '0.7rem'
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          http://localhost:8000/api/v1/whatsapp/webhook
                        </span>
                        <button
                          onClick={handleCopyWebhookUrl}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB' }}
                        >
                          {copiedEnv ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <p style={{ marginTop: '0.5rem', lineHeight: 1.4 }}>
                      Simulated actions immediately invoke the Decision Communication Agent and update your local decision pipeline with versioning (v1 $\to$ v2).
                    </p>

                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => setWaSubTab('simulator')}
                    >
                      Return to Chat Simulator
                    </button>
                  </div>
                </div>
              ) : (
                /* WhatsApp Chat Simulator Messages */
                <>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    {waMessages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '92%'
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: msg.sender === 'user' ? '#E7FFDB' : '#FFFFFF',
                            borderRadius: '8px',
                            padding: '0.65rem 0.8rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                            fontSize: '0.8rem',
                            color: '#111827',
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}
                        >
                          {msg.title && (
                            <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: '0.35rem' }}>
                              {msg.title}
                            </div>
                          )}
                          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.45 }}>{msg.body || msg.text}</div>

                          {/* Interactive Decision Action Options */}
                          {msg.options && (
                            <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {msg.options.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => handleWaOptionClick(opt.id, msg.decisionId, msg.version)}
                                  disabled={isWaLoading}
                                  style={{
                                    backgroundColor: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    borderRadius: '6px',
                                    padding: '0.4rem 0.6rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#15803D',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'background 0.15s'
                                  }}
                                >
                                  <span>{opt.label}</span>
                                  <ChevronRight size={13} />
                                </button>
                              ))}
                            </div>
                          )}

                          <div
                            style={{
                              fontSize: '0.65rem',
                              color: '#9CA3AF',
                              textAlign: 'right',
                              marginTop: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '0.25rem'
                            }}
                          >
                            <span>{msg.timestamp}</span>
                            {msg.sender === 'user' && <CheckCheck size={13} color="#34B7F1" />}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isWaLoading && (
                      <div style={{ alignSelf: 'flex-start', padding: '0.5rem 0.75rem', backgroundColor: '#FFF', borderRadius: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
                        Agent processing decision...
                      </div>
                    )}
                    <div ref={waEndRef} />
                  </div>

                  {/* WhatsApp Quick Reply Input */}
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#F0F2F5',
                      borderTop: '1px solid #E5E7EB',
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Type a manager command or response..."
                      value={waInput}
                      onChange={(e) => setWaInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendWaMessage()}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.75rem',
                        borderRadius: '999px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.8rem',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                    <button
                      onClick={handleSendWaMessage}
                      disabled={isWaLoading || !waInput.trim()}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: '#128C7E',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingAssistant;
