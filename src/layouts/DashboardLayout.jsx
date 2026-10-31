import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import NotificationPanel from '../components/common/NotificationPanel';

const DashboardLayout = () => {
  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Execution Area */}
      <div className="app-main-layout">
        <TopNavbar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Slide-over Notifications */}
      <NotificationPanel />
    </div>
  );
};

export default DashboardLayout;
