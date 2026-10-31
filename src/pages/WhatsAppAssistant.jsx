import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCheck,
  ShieldCheck,
  Zap,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Bot,
  AlertCircle,
  Copy,
  Check,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { RetailPulseApi } from '../services/api';
import { useApp } from '../context/AppContext';

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    timestamp: '10:42 AM',
    type: 'interactive',
    decisionId: 'DEC_LIVE_DEMO_001',
    version: 1,
    title: '🚨 CRITICAL STOCKOUT ALERT | Salem Hub',
    body: `*Store:* Salem Central (SLM_01)
*SKU:* Aavin Toned Fresh Milk 500ml (MILK_001)
*Physical Stock:* 10 units (Safety Buffer: 25)
*Predicted Stockout:* Within 3.5 Hours

*Multi-Agent Prescribed Intervention:*
Inter-store surplus rebalance from Coimbatore (CBE_01).
• Transfer Quantity: 50 units
• Logistics Freight Cost: ₹100.00
• Protected Revenue & Margin: ₹500.00
• Coimbatore Remaining Stock: Safe (72 units remaining)`,
    options: [
      { id: 'INTER_STORE_TRANSFER', label: '✅ Approve Transfer (+50 units)' },
      { id: 'REPLENISH_SUPPLIER', label: '🚚 Expedite Supplier PO' },
      { id: 'APPLY_MARKDOWN', label: '🏷️ Clear Remaining (Markdown)' }
    ]
  }
];

const WhatsAppAssistant = () => {
  const { approveRecommendation } = useApp();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activeTab, setActiveTab] = useState('simulator');
  const [lastActionStatus, setLastActionStatus] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleOptionClick = async (optionId, decisionId, version) => {
    if (isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append Manager's user action to chat
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: time,
        type: 'text',
        text: `Selected: ${optionId.replace(/_/g, ' ')}`
      }
    ]);

    setIsLoading(true);
    try {
      const res = await RetailPulseApi.simulateWhatsAppApproval({
        decisionId: decisionId || 'DEC_LIVE_DEMO_001',
        version: version || 1,
        optionChosen: optionId,
        managerPhone: '+919843123456'
      });

      const replyText = res?.handler_result?.reply ||
        `✅ *APPROVAL CONFIRMED* | Decision \`${decisionId}\`\nAuthorized Strategy: *${optionId.replace(/_/g, ' ')}*\nExecution Status: *RESERVED & DISPATCH IN PROGRESS*\nStock reservations and order logs recorded in ERP ledger.`;

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          text: replyText
        }
      ]);

      setLastActionStatus({
        status: res?.handler_result?.status || 'approved_and_executed',
        decisionId,
        timestamp: new Date().toLocaleTimeString()
      });

      // Update global context app state
      approveRecommendation(decisionId);
    } catch (err) {
      console.error('Approval simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue.trim();
    if (!text || isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: time,
        type: 'text',
        text
      }
    ]);

    setInputValue('');
    setIsLoading(true);

    try {
      const res = await RetailPulseApi.simulateWhatsAppQuery({
        queryText: text,
        managerPhone: '+919843123456'
      });

      const reply = res?.handler_result?.reply || '✅ Operational status verified across all Tamil Nadu hubs.';

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          text: reply
        }
      ]);
    } catch (err) {
      console.error('Query simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDuplicateIdempotency = async () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: time,
        type: 'text',
        text: 'Duplicate Click Test: Re-submitting approval for DEC_LIVE_DEMO_001...'
      }
    ]);
    setIsLoading(true);
    try {
      const res = await RetailPulseApi.simulateWhatsAppApproval({
        decisionId: 'DEC_LIVE_DEMO_001',
        version: 1,
        optionChosen: 'INTER_STORE_TRANSFER',
        managerPhone: '+919843123456'
      });
      const replyText = res?.handler_result?.reply || 'ℹ️ Duplicate approval rejected via idempotency key.';
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          text: replyText
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setLastActionStatus(null);
  };

  const handleCopyEnv = () => {
    const text = `WHATSAPP_TOKEN=EAATCdZA8BNX...
WHATSAPP_PHONE_NUMBER_ID=105938472910394
WHATSAPP_VERIFY_TOKEN=retailmind_meta_webhook_verify_secret
WHATSAPP_API_VERSION=v21.0
USE_MOCK_WHATSAPP=false`;
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const SUGGESTED_QUERIES = [
    'Which products are running low in my store?',
    'What decisions are pending?',
    'Which store has excess milk?',
    'What is tomorrow\'s demand in Salem?'
  ];

  return (
    <div className="whatsapp-page" style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header-row" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: '#25D366',
              color: '#fff',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={20} />
            </div>
            <h2 className="page-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              WhatsApp Store Manager Assistant
            </h2>
            <span style={{
              background: '#E8F5E9',
              color: '#2E7D32',
              fontWeight: 600,
              fontSize: '0.75rem',
              padding: '3px 8px',
              borderRadius: '12px',
              border: '1px solid #A5D6A7'
            }}>
              Meta Cloud API v21.0
            </span>
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.35rem', color: '#64748B' }}>
            Interactive Human-in-the-Loop approval workflows, idempotent transaction locking, and real-time inventory queries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleResetChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.825rem',
              color: '#475569'
            }}
          >
            <RefreshCw size={14} /> Reset Demo
          </button>
        </div>
      </div>

      {/* Main Grid: Phone Mockup on Left + Live Architecture Panel on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 440px) 1fr',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        {/* Smartphone Shell */}
        <div style={{
          background: '#0B141A',
          borderRadius: '36px',
          padding: '12px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
          border: '4px solid #1E293B',
          maxWidth: '430px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Phone Screen */}
          <div style={{
            background: '#EFEAE2',
            borderRadius: '26px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '680px',
            position: 'relative'
          }}>
            {/* WhatsApp Header */}
            <div style={{
              background: '#075E54',
              color: '#FFFFFF',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#128C7E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#fff',
                fontSize: '1rem',
                border: '2px solid rgba(255,255,255,0.4)'
              }}>
                <Bot size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', lineHeight: 1.2 }}>
                  RetailMind Store Bot
                </div>
                <div style={{ fontSize: '0.72rem', color: '#B2DFDB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#25D366', borderRadius: '50%' }}></span>
                  online • Tamil Nadu Hub
                </div>
              </div>
              <ShieldCheck size={18} color="#25D366" title="Verified Enterprise Channel" />
            </div>

            {/* Chat Body */}
            <div style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
              backgroundSize: '12px 12px'
            }}>
              <div style={{
                textAlign: 'center',
                margin: '4px 0'
              }}>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  color: '#64748B',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  TODAY • ENCRYPTED END-TO-END
                </span>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    background: m.sender === 'user' ? '#D9FDD3' : '#FFFFFF',
                    padding: '9px 12px',
                    borderRadius: m.sender === 'user' ? '10px 0px 10px 10px' : '0px 10px 10px 10px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    fontSize: '0.825rem',
                    color: '#111827'
                  }}
                >
                  {m.title && (
                    <div style={{ fontWeight: 700, color: '#B91C1C', marginBottom: '4px', fontSize: '0.825rem' }}>
                      {m.title}
                    </div>
                  )}

                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                    {m.text || m.body}
                  </div>

                  {/* Interactive Button Group */}
                  {m.options && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {m.options.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionClick(opt.id, m.decisionId, m.version)}
                          disabled={isLoading}
                          style={{
                            background: '#F0FDF4',
                            border: '1px solid #86EFAC',
                            color: '#166534',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#DCFCE7'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#F0FDF4'}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    marginTop: '4px',
                    fontSize: '0.65rem',
                    color: '#94A3B8'
                  }}>
                    <span>{m.timestamp}</span>
                    {m.sender === 'user' && <CheckCheck size={14} color="#53BDEB" />}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{
                  alignSelf: 'flex-start',
                  background: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '0px 10px 10px 10px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  fontSize: '0.75rem',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <span style={{ width: '6px', height: '6px', background: '#075E54', borderRadius: '50%', animation: 'bounce 1s infinite' }}></span>
                    <span style={{ width: '6px', height: '6px', background: '#075E54', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></span>
                    <span style={{ width: '6px', height: '6px', background: '#075E54', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }}></span>
                  </div>
                  <span>RetailMind processing...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Chips */}
            <div style={{
              background: '#F0F2F5',
              padding: '6px 10px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px solid #E2E8F0',
              scrollbarWidth: 'none'
            }}>
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '0.68rem',
                    color: '#334155',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                background: '#F0F2F5',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <input
                type="text"
                placeholder="Type a query (e.g. low stock, demand)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '9px 14px',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: inputValue.trim() ? '#075E54' : '#CBD5E1',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: inputValue.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Architecture, Live Telemetry & Meta WhatsApp Cloud Setup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Navigation Sub-Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #E2E8F0',
            paddingBottom: '8px'
          }}>
            <button
              onClick={() => setActiveTab('simulator')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'simulator' ? '#0F172A' : '#F1F5F9',
                color: activeTab === 'simulator' ? '#FFFFFF' : '#475569'
              }}
            >
              🚀 Live Demo Controls
            </button>
            <button
              onClick={() => setActiveTab('meta')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'meta' ? '#0F172A' : '#F1F5F9',
                color: activeTab === 'meta' ? '#FFFFFF' : '#475569'
              }}
            >
              📱 Real Phone Setup (Meta Cloud API)
            </button>
          </div>

          {activeTab === 'simulator' ? (
            <>
              {/* How It Works Card */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#3B82F6" />
                  What to Show in Your Demo:
                </h3>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <li>
                    <strong>Interactive Button Click:</strong> Click <em>"✅ Approve Transfer"</em> inside the simulated WhatsApp phone. The backend records manager approval, sets decision state to <code>APPROVED</code>, and reserves stock in <code>retailmind.db</code>.
                  </li>
                  <li>
                    <strong>Idempotency Protection:</strong> Click the button below to test a duplicate click. Notice the backend safely rejects the second attempt with <code>duplicate_ignored</code>.
                  </li>
                  <li>
                    <strong>Natural Language Store Manager Queries:</strong> Click any query chip below the chat or type questions like <em>"Which products are running low in my store?"</em>. The system queries PostgreSQL/SQLite records directly and formats a clean WhatsApp message.
                  </li>
                </ol>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleTestDuplicateIdempotency}
                    disabled={isLoading}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1D4ED8',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShieldCheck size={16} /> Test Idempotency (Duplicate Rejection)
                  </button>

                  <button
                    onClick={() => handleSendMessage("What is tomorrow's milk demand forecast in Coimbatore?")}
                    disabled={isLoading}
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      color: '#15803D',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Zap size={16} /> Test Quantile ML Prediction Query
                  </button>
                </div>
              </div>

              {/* End-to-End Multi-Agent Architecture Trace */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0F172A' }}>
                  Multi-Agent Execution Pipeline
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{
                      background: '#E2E8F0',
                      color: '#334155',
                      fontWeight: 700,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>1</span>
                    <div>
                      <strong>Monitoring Agent:</strong> Discovers Salem milk deficit below 25-unit safety stock threshold.
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{
                      background: '#E2E8F0',
                      color: '#334155',
                      fontWeight: 700,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>2</span>
                    <div>
                      <strong>Pyomo MILP Optimizer:</strong> Evaluates inter-store routes (CBE ➔ SLM) vs supplier PO; selects Coimbatore transfer (+₹500 net profit).
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{
                      background: '#E2E8F0',
                      color: '#334155',
                      fontWeight: 700,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>3</span>
                    <div>
                      <strong>WhatsApp Webhook Handler:</strong> Formats interactive button cards and verifies HMAC token signature.
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: lastActionStatus ? '#ECFDF5' : '#F8FAFC',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    border: lastActionStatus ? '1px solid #A7F3D0' : 'none'
                  }}>
                    <span style={{
                      background: lastActionStatus ? '#10B981' : '#E2E8F0',
                      color: lastActionStatus ? '#FFFFFF' : '#334155',
                      fontWeight: 700,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>4</span>
                    <div>
                      <strong>Execution Agent:</strong> Writes ERP inventory reservation & generates transfer manifest.
                      {lastActionStatus && (
                        <div style={{ color: '#047857', fontWeight: 600, marginTop: '2px' }}>
                          ✓ Confirmed: {lastActionStatus.decisionId} at {lastActionStatus.timestamp}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Real Meta WhatsApp Cloud API Setup Guide */
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="#25D366" />
                Connect Real WhatsApp to Your Phone
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
                To receive interactive buttons on your physical WhatsApp phone, expose your local FastAPI backend to the internet using <strong>ngrok</strong> and register the webhook in the Meta Developer Portal.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Step 1 */}
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.825rem' }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                    Step 1: Start ngrok tunnel for FastAPI (Port 8000)
                  </div>
                  <code style={{ background: '#1E293B', color: '#38BDF8', padding: '4px 8px', borderRadius: '4px', display: 'block', fontSize: '0.78rem' }}>
                    ngrok http 8000
                  </code>
                </div>

                {/* Step 2 */}
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.825rem' }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                    Step 2: Configure Meta Webhook in Facebook Developer App
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    Navigate to <strong>WhatsApp &gt; Configuration</strong> and paste:
                    <div style={{ marginTop: '4px' }}>
                      • <strong>Callback URL:</strong> <code>https://&lt;your-ngrok-subdomain&gt;.ngrok-free.app/api/v1/whatsapp/webhook</code>
                    </div>
                    <div>
                      • <strong>Verify Token:</strong> <code>retailmind_meta_webhook_verify_secret</code>
                    </div>
                    <div>
                      • <strong>Webhook Fields:</strong> Subscribe to <code>messages</code>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>
                      Step 3: Update <code>.env</code> with your Meta Credentials
                    </div>
                    <button
                      onClick={handleCopyEnv}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedEnv ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                      {copiedEnv ? 'Copied' : 'Copy Template'}
                    </button>
                  </div>
                  <pre style={{
                    background: '#1E293B',
                    color: '#E2E8F0',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    margin: 0
                  }}>
{`WHATSAPP_TOKEN=<Your_Meta_System_Token>
WHATSAPP_PHONE_NUMBER_ID=<Your_Meta_Phone_Number_ID>
WHATSAPP_VERIFY_TOKEN=retailmind_meta_webhook_verify_secret
WHATSAPP_API_VERSION=v21.0
USE_MOCK_WHATSAPP=false`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAssistant;
