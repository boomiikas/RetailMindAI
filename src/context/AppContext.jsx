import React, { createContext, useContext, useState, useEffect } from 'react';
import { RetailPulseApi } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Global filter state
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState('Last 14 Days');
  const [searchQuery, setSearchQuery] = useState('');

  // Stores loaded from database
  const [stores, setStores] = useState([
    { id: 'all', code: 'ALL', name: 'All Stores (Tamil Nadu Network)', city: 'Tamil Nadu' },
    { id: 'SLM_01', code: 'SLM_01', name: 'Salem Fairlands Central', city: 'Salem' },
    { id: 'CBE_01', code: 'CBE_01', name: 'Coimbatore RS Puram Hub', city: 'Coimbatore' },
    { id: 'CHN_01', code: 'CHN_01', name: 'Chennai Anna Nagar Hypermarket', city: 'Chennai' },
    { id: 'MDU_01', code: 'MDU_01', name: 'Madurai KK Nagar Depot', city: 'Madurai' },
    { id: 'TRY_01', code: 'TRY_01', name: 'Trichy Thillai Nagar Center', city: 'Trichy' },
  ]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Recommendations dynamic state
  const [recommendations, setRecommendations] = useState([]);

  // Audit history state
  const [decisionHistory, setDecisionHistory] = useState([]);

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initial load from backend database
  useEffect(() => {
    let isMounted = true;

    // Load Stores from database
    RetailPulseApi.getStores().then((loadedStores) => {
      if (isMounted && loadedStores && loadedStores.length > 0) {
        setStores(loadedStores);
      }
    });

    // Load Recommendations from database
    RetailPulseApi.getRecommendations({ store: 'all' }).then((recs) => {
      if (isMounted && recs) {
        setRecommendations(recs);
      }
    });

    // Load Decision History from database
    RetailPulseApi.getDecisionHistory().then((history) => {
      if (isMounted && history) {
        setDecisionHistory(history);
      }
    });

    // Load Active Notifications from alerts
    RetailPulseApi.getRisks({ store: 'all' }).then((risks) => {
      if (isMounted && risks) {
        const notifs = risks.slice(0, 5).map((r) => ({
          id: `NOTIF-${r.id}`,
          title: `Alert: ${r.category}`,
          message: `${r.product} at ${r.store} has active risk: ${r.reason}`,
          timestamp: 'Just now',
          type: r.severity === 'critical' ? 'danger' : 'warning',
          read: false,
          link: '/risks',
        }));
        setNotifications(notifs);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Unread notification count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Active pending recommendations count
  const pendingRecommendationsCount = recommendations.filter(r => r.status === 'Pending').length;

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  // Action: Approve Recommendation (Real backend execution)
  const approveRecommendation = async (recId) => {
    const targetRec = recommendations.find(r => r.id === recId);
    if (!targetRec) return;

    // Update state immediately
    setRecommendations(prev =>
      prev.map(r => (r.id === recId ? { ...r, status: 'Approved' } : r))
    );

    // Call real backend execution endpoint
    try {
      await RetailPulseApi.approveRecommendation(recId);
    } catch (e) {
      console.warn('Real approval backend sync:', e);
    }

    // Append to Decision Audit History
    const newAuditEntry = {
      id: recId.startsWith('DEC') ? recId : `DEC-${recId}`,
      date: new Date().toISOString().split('T')[0],
      store: targetRec.store,
      product: targetRec.sku,
      recommendedAction: targetRec.action,
      approvedAction: `Approved: ${targetRec.action} (${targetRec.quantity})`,
      actualResult: 'In progress: Physical transfer reservation committed in database.',
      status: 'Approved',
      details: {
        problem: targetRec.reasoning || 'Operational recommendation executed.',
        signalsConsidered: ['Inventory buffer threshold', 'Demand elasticity algorithm', 'Transit lead time'],
        forecast: 'Full mitigation of stockout risk within projected delivery window',
        chosenAction: `${targetRec.action} - ${targetRec.quantity}`,
        rationale: targetRec.reasoning || 'Autonomous AI decision approval.',
        outcomeMetrics: 'Pending real-time arrival scan.',
      },
    };

    setDecisionHistory(prev => [newAuditEntry, ...prev]);

    // Push notification
    const newNotif = {
      id: 'NOTIF-' + Date.now(),
      title: `Action Approved: ${targetRec.action}`,
      message: `${targetRec.sku} at ${targetRec.store} (${targetRec.quantity}) scheduled for dispatch.`,
      timestamp: 'Just now',
      type: 'recommendation',
      read: false,
      link: '/decisions?tab=history',
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Action: Reject Recommendation
  const rejectRecommendation = async (recId, reasonText = 'Overridden by store manager discretion') => {
    const targetRec = recommendations.find(r => r.id === recId);
    if (!targetRec) return;

    setRecommendations(prev =>
      prev.map(r => (r.id === recId ? { ...r, status: 'Rejected', rejectionReason: reasonText } : r))
    );

    try {
      await RetailPulseApi.rejectRecommendation(recId, reasonText);
    } catch (e) {
      console.warn('Real rejection backend sync:', e);
    }

    const newAuditEntry = {
      id: recId.startsWith('DEC') ? recId : `DEC-${recId}`,
      date: new Date().toISOString().split('T')[0],
      store: targetRec.store,
      product: targetRec.sku,
      recommendedAction: targetRec.action,
      approvedAction: `Rejected: ${reasonText}`,
      actualResult: 'Manual override: baseline risk monitored.',
      status: 'Rejected',
      details: {
        problem: targetRec.reasoning || 'Recommendation overridden.',
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
        stores,
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
