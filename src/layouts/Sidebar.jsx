import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Network,
  Cpu,
  BarChart3,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';
import RetailMindLogo from '../assets/retailmind-mark.svg';

const NAV_ITEMS = [
  { path: '/overview', label: 'Executive Overview', icon: LayoutDashboard },
  { path: '/demand', label: 'Demand Intelligence', icon: TrendingUp },
  { path: '/risks', label: 'Risk & Alerts', icon: AlertTriangle, hasPill: true, pillKey: 'risks' },
  { path: '/inventory', label: 'Inventory Network', icon: Network },
  { path: '/decisions', label: 'AI Decision Centre', icon: Cpu, hasPill: true, pillKey: 'pendingDecisions' },
  { path: '/performance', label: 'Impact & Performance', icon: BarChart3 },
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
            <img className="brand-icon" src={RetailMindLogo} alt="RetailMind" />
            <div className="brand-info">
              <div className="brand-title">
                RetailMind <span className="ai-badge">AI</span>
              </div>
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

        {/* Navigation Items (Consolidated into exactly 6 primary modules) */}
        <nav className="sidebar-nav-container">
          <div className="nav-section-title">Operational Navigation</div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <Icon className="nav-icon" size={18} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>

                {item.pillKey === 'pendingDecisions' && pendingRecommendationsCount > 0 && (
                  <span className="nav-pill-counter" title={`${pendingRecommendationsCount} pending AI decisions`}>
                    {pendingRecommendationsCount}
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
            <Settings className="nav-icon" size={18} />
            <span>Settings</span>
          </button>

          <button
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'none' }}
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="nav-icon" size={18} />
            <span>Help & Docs</span>
          </button>

          {/* User Profile */}
          <div className="user-profile-widget">
            <div className="user-avatar">SR</div>
            <div className="user-details">
              <span className="user-name">S. Ramanathan</span>
              <span className="user-role">Head of Retail Operations</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Control Tower Engine Settings"
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
              <option value="supervised">Human-in-the-Loop (Manager Approval Required)</option>
              <option value="autonomous-low">Autonomous for Low-Risk Actions (&lt; ₹1,000 transfer)</option>
              <option value="full">Full Autonomous Multi-Agent Execution</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              Currently set to Supervised. High and Critical impact recommendations await human confirmation.
            </span>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Demand Forecasting Model Selection
            </label>
            <select style={{ width: '100%' }} defaultValue="statistical">
              <option value="statistical">Lightweight Statistical Baseline (SDOWF - Seasonal Day-of-Week + Festival)</option>
              <option value="hgb">HistGradientBoosting Precision ML Engine</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              Pluggable dual-mode: Fast statistical baseline minimizes inference overhead with sub-15ms response.
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
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Primary Regional Cross-Dock Hub
            </label>
            <select style={{ width: '100%' }} defaultValue="erode">
              <option value="erode">Erode Central Cross-Dock Warehouse (NH-544)</option>
              <option value="salem">Salem Junction Depot</option>
              <option value="coimbatore">Coimbatore Central Logistics Depot</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="RetailMind AI - Architecture & User Guide"
        footer={
          <button className="btn btn-secondary" onClick={() => setIsHelpOpen(false)}>
            Close
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', lineHeight: 1.6 }}>
          <p>
            <strong>RetailMind AI Control Tower</strong> provides autonomous decision intelligence for retail networks across Tamil Nadu. It bridges predictive demand forecasting with deterministic optimization and multi-agent coordination.
          </p>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Consolidated Control Tower Modules:</h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <li><strong>Executive Overview:</strong> High-level store health, urgent operational alerts, and network demand.</li>
              <li><strong>Demand Intelligence:</strong> Quantile forecasting (P10/P50/P90), seasonal drivers, and Hidden Demand recovery.</li>
              <li><strong>Risk & Alerts:</strong> Stockout radar, overstock buffers, and Promotion Guardian safety guards.</li>
              <li><strong>Inventory Network:</strong> Live multi-store SVG topology, cross-dock route optimization, and transfers.</li>
              <li><strong>AI Decision Centre:</strong> Autonomous recommendations, approval queue, Ripple Simulator, and dynamic replanning.</li>
              <li><strong>Impact & Performance:</strong> Realized financial savings, benchmark audits, and SLA tracking.</li>
            </ul>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Core Philosophy: <em>"Don't just predict what will happen. Prescribe and orchestrate what the retail enterprise must do next."</em>
          </p>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
