import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  MapPin,
  Calendar,
  Bell,
  ChevronDown,
  Sparkles,
  User,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const ROUTE_TITLES = {
  '/': { title: 'Executive Overview', section: 'Decision Intelligence' },
  '/overview': { title: 'Executive Overview', section: 'Decision Intelligence' },
  '/demand': { title: 'Demand Intelligence', section: 'Forecasting & Signals' },
  '/risks': { title: 'Risk Centre', section: 'Vulnerability Radar' },
  '/network': { title: 'Inventory Network', section: 'Multi-Store Balancing' },
  '/decisions': { title: 'AI Decision Centre', section: 'Autonomous Recommendations' },
  '/simulator': { title: 'Decision Ripple Simulator', section: 'Consequence Modeling' },
  '/promotions': { title: 'Promotion Guardian', section: 'Operational Safety' },
  '/hidden-demand': { title: 'Hidden Demand Detector', section: 'Unmet Demand Analysis' },
  '/impact': { title: 'Impact & Performance', section: 'Business Value Audit' },
  '/history': { title: 'Decision History', section: 'Audit Log & Accountability' },
};

const TopNavbar = () => {
  const location = useLocation();
  const {
    selectedStore,
    setSelectedStore,
    stores,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    unreadNotificationsCount,
    setIsNotificationDrawerOpen,
    setIsMobileSidebarOpen,
  } = useApp();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const currentRouteMeta = ROUTE_TITLES[location.pathname] || {
    title: 'RetailPulse AI',
    section: 'Intelligence Suite',
  };

  return (
    <header className="top-navbar">
      {/* Left Area: Hamburger + Breadcrumb */}
      <div className="navbar-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileSidebarOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="breadcrumb-area">
          <div className="breadcrumb-trail">
            <span>RetailPulse</span>
            <span>/</span>
            <span>{currentRouteMeta.section}</span>
          </div>
          <h1 className="breadcrumb-page-title">{currentRouteMeta.title}</h1>
        </div>
      </div>

      {/* Center Area: Global Search */}
      <div className="navbar-center">
        <div className="global-search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search SKUs, stores, decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Area: Store Selector, Date Selector, Notifications, User */}
      <div className="navbar-right">
        {/* Store Selector */}
        <div className="filter-control" title="Filter by Store">
          <MapPin size={15} color="var(--color-primary)" />
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            aria-label="Select Store"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div className="filter-control" title="Select Date Range">
          <Calendar size={15} color="var(--color-text-secondary)" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Select Date Range"
          >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 14 Days">Last 14 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Quarter">This Quarter</option>
          </select>
        </div>

        {/* Notification Bell */}
        <button
          className="icon-action-btn"
          onClick={() => setIsNotificationDrawerOpen(prev => !prev)}
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadNotificationsCount > 0 && (
            <span className="notification-badge">{unreadNotificationsCount}</span>
          )}
        </button>

        {/* User Profile Mini Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setIsProfileDropdownOpen(prev => !prev)}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              SR
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>S. Ramanathan</span>
            <ChevronDown size={14} color="var(--color-text-secondary)" />
          </button>

          {isProfileDropdownOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                width: 220,
                zIndex: 60,
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>S. Ramanathan</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ramanathan@retailpulse.ai</div>
                <div className="badge badge-primary" style={{ marginTop: '0.35rem', fontSize: '0.65rem' }}>
                  <ShieldCheck size={11} /> Regional Ops Lead
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <User size={14} /> Profile & Store Access
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <Sparkles size={14} /> AI Decision Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
