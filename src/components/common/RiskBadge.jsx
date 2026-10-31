import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const RiskBadge = ({ severity = 'medium', label }) => {
  const normSeverity = severity.toLowerCase();

  let badgeClass = 'badge-warning';
  let Icon = AlertTriangle;

  if (normSeverity === 'critical' || normSeverity === 'danger' || normSeverity === 'high') {
    badgeClass = 'badge-danger';
    Icon = AlertCircle;
  } else if (normSeverity === 'medium' || normSeverity === 'moderate') {
    badgeClass = 'badge-warning';
    Icon = AlertTriangle;
  } else if (normSeverity === 'low' || normSeverity === 'safe') {
    badgeClass = 'badge-success';
    Icon = CheckCircle;
  } else if (normSeverity === 'info') {
    badgeClass = 'badge-primary';
    Icon = Info;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <Icon size={12} />
      <span>{label || severity.toUpperCase()}</span>
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase();

  let badgeClass = 'badge-neutral';
  if (norm === 'approved' || norm === 'success' || norm === 'optimal') {
    badgeClass = 'badge-success';
  } else if (norm === 'pending' || norm === 'in transit' || norm === 'optimization ready') {
    badgeClass = 'badge-primary';
  } else if (norm === 'rejected' || norm === 'critical risk' || norm === 'danger') {
    badgeClass = 'badge-danger';
  } else if (norm === 'warning' || norm === 'recommended') {
    badgeClass = 'badge-warning';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};

export default RiskBadge;
