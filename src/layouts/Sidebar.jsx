import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Network,
  Cpu,
  GitFork,
  MessageSquare,
  ShieldAlert,
  Search,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  Sparkles,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/demand', label: 'Demand Intelligence', icon: TrendingUp },
  { path: '/risks', label: 'Risk Centre', icon: AlertTriangle, hasPill: true, pillKey: 'risks' },
  { path: '/network', label: 'Inventory Network', icon: Network },
  { path: '/decisions', label: 'AI Decision Centre', icon: Cpu, hasPill: true, pillKey: 'pendingDecisions' },
  { path: '/simulator', label: 'Decision Ripple Simulator', icon: GitFork, isSignature: true, badgeText: 'Sim' },
  { path: '/whatsapp', label: 'WhatsApp Assistant', icon: MessageSquare, isSignature: true, badgeText: 'Live' },
  { path: '/promotions', label: 'Promotion Guardian', icon: ShieldAlert },
  { path: '/hidden-demand', label: 'Hidden Demand Detector', icon: Search },
  { path: '/impact', label: 'Impact & Performance', icon: BarChart3 },
  { path: '/history', label: 'Decision History', icon: History },
];

const Sidebar = () => {
  const {
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    pendingRecommendationsCount
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`mobile-backdrop ${isMobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside className={`app-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <Sparkles size={20} />
            </div>
            <div className="brand-info">
              <div className="brand-title">
                RetailPulse <span className="ai-badge">AI</span>
              </div>
              <div className="brand-subtitle">Decision Intelligence</div>
            </div>
            {isMobileSidebarOpen && (
              <button
                className="modal-close-btn"
                style={{ marginLeft: 'auto', color: '#94A3B8' }}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav-container">
          <div className="nav-section-title">Operational Navigation</div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <Icon className="nav-icon" />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>

                {item.pillKey === 'pendingDecisions' && pendingRecommendationsCount > 0 && (
                  <span className="nav-pill-counter" title={`${pendingRecommendationsCount} pending AI decisions`}>
                    {pendingRecommendationsCount}
                  </span>
                )}
                {item.pillKey === 'risks' && (
                  <span className="nav-pill-counter" style={{ backgroundColor: 'var(--color-warning)' }} title="18 active risk alerts">
                    18
                  </span>
                )}
                {item.isSignature && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: item.badgeText === 'Live' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: item.badgeText === 'Live' ? '#16A34A' : '#38BDF8',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.badgeText || 'Sim'}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Sidebar */}
        <div className="sidebar-bottom">
          <button
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'none' }}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="nav-icon" />
            <span>Settings</span>
          </button>

          <button
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'none' }}
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="nav-icon" />
            <span>Help & Docs</span>
          </button>

          {/* User Profile */}
          <div className="user-profile-widget">
            <div className="user-avatar">SR</div>
            <div className="user-details">
              <span className="user-name">S. Ramanathan</span>
              <span className="user-role">Head of Retail Ops</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Platform & Autonomous Engine Settings"
        footer={
          <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>
            Save Configuration
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Autonomous Execution Mode
            </label>
            <select style={{ width: '100%' }} defaultValue="supervised">
              <option value="supervised">Human-in-the-loop (Manager Approval Required)</option>
              <option value="autonomous-low">Autonomous for Low-Risk Actions (&lt; ₹1,000 transfer)</option>
              <option value="full">Full Autonomous Decision Execution</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Currently set to Supervised. High and Critical impact recommendations await human approval.
            </span>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Minimum AI Confidence Threshold
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="range" min="70" max="99" defaultValue="85" style={{ flex: 1 }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>85%</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Actions with confidence below 85% are automatically escalated to manual inspection.
            </span>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Regional Hub Center
            </label>
            <select style={{ width: '100%' }} defaultValue="erode">
              <option value="erode">Erode Central Cross-Dock Warehouse (NH-544)</option>
              <option value="salem">Salem Junction Depot</option>
              <option value="chennai">Chennai Coastal Port Facility</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="RetailPulse AI - Documentation & Architecture"
        footer={
          <button className="btn btn-secondary" onClick={() => setIsHelpOpen(false)}>
            Close
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', lineHeight: 1.6 }}>
          <p>
            <strong>RetailPulse AI</strong> is an autonomous retail decision intelligence platform designed to transition supermarket networks from passive forecasting to high-conviction business decisioning.
          </p>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Key Capabilities:</h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <li><strong>Decision Ripple Simulator:</strong> Forecasts cascade effects (demand → stock → freight → margin → CSAT) before executing pricing or logistics moves.</li>
              <li><strong>Inventory Rescue Network:</strong> Solves stockouts by rerouting excess stock between stores within 4 hours.</li>
              <li><strong>Hidden Demand Detector:</strong> Surfaces unmet demand blinded by historic stockouts.</li>
              <li><strong>Promotion Guardian:</strong> Halts risky discounts that create backroom stockouts.</li>
            </ul>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Core Motto: <em>"Don't just predict what will happen. Decide what the business should do next."</em>
          </p>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
