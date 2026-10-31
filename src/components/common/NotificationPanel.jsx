import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, Bell, AlertTriangle, Lightbulb, CloudRain, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NotificationPanel = () => {
  const navigate = useNavigate();
  const {
    notifications,
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    markAllNotificationsAsRead,
    markNotificationAsRead
  } = useApp();

  const getNotifIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle size={16} color="var(--color-danger)" />;
      case 'recommendation':
        return <Lightbulb size={16} color="var(--color-primary)" />;
      case 'weather':
        return <CloudRain size={16} color="var(--color-purple)" />;
      case 'guardian':
        return <ShieldCheck size={16} color="var(--color-warning)" />;
      default:
        return <Bell size={16} color="var(--color-text-secondary)" />;
    }
  };

  const handleNotificationClick = (item) => {
    markNotificationAsRead(item.id);
    if (item.link) {
      setIsNotificationDrawerOpen(false);
      navigate(item.link);
    }
  };

  return (
    <>
      {isNotificationDrawerOpen && (
        <div
          className="mobile-backdrop open"
          style={{ zIndex: 104 }}
          onClick={() => setIsNotificationDrawerOpen(false)}
        />
      )}

      <div className={`notification-drawer ${isNotificationDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="var(--color-primary)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
              Notifications
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={markAllNotificationsAsRead}
              title="Mark all as read"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              <CheckCheck size={14} />
              Read all
            </button>
            <button
              className="modal-close-btn"
              onClick={() => setIsNotificationDrawerOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="drawer-content">
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-secondary)' }}>
              <p>No notifications at this time.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`notification-item ${!item.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ paddingTop: '2px' }}>
                  {getNotifIcon(item.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {item.timestamp}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
