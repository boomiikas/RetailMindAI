import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import NotificationPanel from '../components/common/NotificationPanel';
import FloatingAssistant from '../components/common/FloatingAssistant';

const DashboardLayout = () => {
  return (
    <div className="app-container">
      {/* 6-Module Consolidated Navigation Sidebar */}
      <Sidebar />

      {/* Main Execution Area */}
      <div className="app-main-layout">
        <TopNavbar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Slide-over Notifications Drawer */}
      <NotificationPanel />

      {/* Persistent floating Copilot */}
      <FloatingAssistant />
    </div>
  );
};

export default DashboardLayout;
