import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_RECOMMENDATIONS,
  INITIAL_NOTIFICATIONS,
  DECISION_HISTORY_AUDIT,
  STORES
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Global filter state
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState('Last 14 Days');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Recommendations dynamic state (Approve / Reject / Pending)
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);

  // Audit history state
  const [decisionHistory, setDecisionHistory] = useState(DECISION_HISTORY_AUDIT);

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Unread notification count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Active pending recommendations count
  const pendingRecommendationsCount = recommendations.filter(r => r.status === 'Pending').length;

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n));
  };

  // Action: Approve Recommendation
  const approveRecommendation = (recId) => {
    const targetRec = recommendations.find(r => r.id === recId);
    if (!targetRec) return;

    setRecommendations(prev =>
      prev.map(r => r.id === recId ? { ...r, status: 'Approved' } : r)
    );

    // Automatically append to Decision Audit History
    const newAuditEntry = {
      id: 'DEC-' + Math.floor(8100 + Math.random() * 900),
      date: new Date().toISOString().split('T')[0],
      store: targetRec.store,
      product: targetRec.sku,
      recommendedAction: targetRec.action,
      approvedAction: `Approved: ${targetRec.action} (${targetRec.quantity})`,
      actualResult: 'In progress: Logistics routing queued. Estimated outcome 98% positive.',
      status: 'Approved',
      details: {
        problem: targetRec.reasoning ? targetRec.reasoning[0] : 'Operational recommendation executed.',
        signalsConsidered: ['Inventory buffer threshold', 'Demand elasticity algorithm', 'Transit lead time'],
        forecast: 'Full mitigation of stockout risk within projected delivery window',
        chosenAction: `${targetRec.action} - ${targetRec.quantity}`,
        rationale: targetRec.reasoning ? targetRec.reasoning.join(' ') : 'Autonomous AI decision approval.',
        outcomeMetrics: 'Pending real-time arrival scan.',
      },
    };

    setDecisionHistory(prev => [newAuditEntry, ...prev]);

    // Push notification
    const newNotif = {
      id: 'NOTIF-' + Date.now(),
      title: `Action Approved: ${targetRec.action}`,
      message: `${targetRec.sku} at ${targetRec.store} (${targetRec.quantity}) has been scheduled for dispatch.`,
      timestamp: 'Just now',
      type: 'recommendation',
      read: false,
      link: '/decision-history',
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Action: Reject Recommendation
  const rejectRecommendation = (recId, reasonText = 'Overridden by store manager discretion') => {
    const targetRec = recommendations.find(r => r.id === recId);
    if (!targetRec) return;

    setRecommendations(prev =>
      prev.map(r => r.id === recId ? { ...r, status: 'Rejected', rejectionReason: reasonText } : r)
    );

    const newAuditEntry = {
      id: 'DEC-' + Math.floor(8100 + Math.random() * 900),
      date: new Date().toISOString().split('T')[0],
      store: targetRec.store,
      product: targetRec.sku,
      recommendedAction: targetRec.action,
      approvedAction: `Rejected: ${reasonText}`,
      actualResult: 'Manual override: baseline risk monitored.',
      status: 'Rejected',
      details: {
        problem: targetRec.reasoning ? targetRec.reasoning[0] : 'Recommendation overridden.',
        signalsConsidered: ['Store manager override feedback'],
        forecast: 'Unmitigated risk warning persisted in dashboard',
        chosenAction: `Rejected: ${reasonText}`,
        rationale: reasonText,
        outcomeMetrics: 'Manual watch mode activated.',
      },
    };

    setDecisionHistory(prev => [newAuditEntry, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        selectedStore,
        setSelectedStore,
        stores: STORES,
        dateRange,
        setDateRange,
        searchQuery,
        setSearchQuery,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsAsRead,
        markNotificationAsRead,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        recommendations,
        pendingRecommendationsCount,
        approveRecommendation,
        rejectRecommendation,
        decisionHistory,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export const useAppContext = useApp;
