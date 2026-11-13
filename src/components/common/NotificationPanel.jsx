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
          <div className="notification-heading">
            <Bell size={18} color="var(--color-primary)" />
            <span>Notifications</span>
          </div>
          <div className="notification-header-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={markAllNotificationsAsRead}
              title="Mark all as read"
              style={{ fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}
            >
              <CheckCheck size={14} />
              Mark all read
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
              <button
                key={item.id}
                type="button"
                className={`notification-item ${!item.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(item)}
              >
                <div className="notification-icon">
                  {getNotifIcon(item.type)}
                </div>
                <div className="notification-copy">
                  <div className="notification-item-heading">
                    <span className="notification-title">
                      {item.title}
                    </span>
                    <span className="notification-time">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="notification-message">
                    {item.message}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
