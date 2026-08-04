import React, { useState, useEffect } from 'react';
import api from '../api';
import './DashboardOverview.css';
import { 
  Users, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  Briefcase, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function DashboardOverview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    setError('');
    api.get('/admin/analytics/overview')
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setError('Could not fetch real-time executive dashboard metrics');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const cards = data?.summaryCards || {};

  const summaryConfig = [
    { title: 'Total Registered Users', val: cards.totalUsers, icon: <Users size={20} />, color: '#38BDF8', tab: 'users' },
    { title: 'Total Clients', val: cards.totalClients, icon: <Users size={20} />, color: '#60A5FA', tab: 'users' },
    { title: 'Total Service Providers', val: cards.totalProviders, icon: <Wrench size={20} />, color: '#10B981', tab: 'users' },
    { title: 'Administrators', val: cards.totalAdmins, icon: <UserCheck size={20} />, color: '#A78BFA', tab: 'admins' },
    { title: 'Verified Providers', val: cards.verifiedProviders, icon: <ShieldCheck size={20} />, color: '#34D399', tab: 'approvals' },
    { title: 'Pending Verifications', val: cards.pendingVerifications, icon: <Clock size={20} />, color: '#FBBF24', tab: 'approvals' },
    { title: 'Active Users Today', val: cards.activeUsersToday, icon: <TrendingUp size={20} />, color: '#38BDF8', tab: 'users' },
    { title: 'Suspended Users', val: cards.suspendedUsers, icon: <UserX size={20} />, color: '#F87171', tab: 'users' },
    { title: 'Blocked Users', val: cards.blockedUsers, icon: <UserX size={20} />, color: '#EF4444', tab: 'users' },
    { title: 'Completed Bookings', val: cards.totalCompletedBookings, icon: <CheckCircle2 size={20} />, color: '#10B981', tab: 'bookings' },
    { title: 'Pending Bookings', val: cards.totalPendingBookings, icon: <Calendar size={20} />, color: '#F59E0B', tab: 'bookings' },
    { title: 'Total Safety Reports', val: cards.totalReports, icon: <AlertTriangle size={20} />, color: '#F87171', tab: 'reports' },
    { title: 'Pending Reports', val: cards.pendingReports, icon: <AlertTriangle size={20} />, color: '#EF4444', tab: 'reports' },
    { title: 'Resolved Reports', val: cards.resolvedReports, icon: <CheckCircle2 size={20} />, color: '#34D399', tab: 'reports' }
  ];

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Executive Control Center</h1>
            <p>Real-time system telemetry and platform operational statistics.</p>
          </div>
          <button className="refresh-btn" onClick={loadData} disabled={loading}>
            {loading ? '↻ Syncing Live Telemetry…' : '↻ Refresh Backend Metrics'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* 14 Summary Cards Grid */}
      <div className="summary-cards-grid">
        {summaryConfig.map((c, i) => (
          <div key={i} className="glass-card stat-card" onClick={() => onNavigate && onNavigate(c.tab)}>
            <div className="stat-top">
              <span className="stat-icon" style={{ background: `${c.color}22`, color: c.color }}>
                {c.icon}
              </span>
              <ArrowUpRight size={16} color="#64748B" className="arrow-hover" />
            </div>
            <div className="stat-value">
              {loading ? <span className="stat-skeleton" /> : (c.val ?? 0)}
            </div>
            <div className="stat-title">{c.title}</div>
          </div>
        ))}
      </div>

      {/* Visual Data Breakdown Row */}
      <div className="dashboard-charts-row">
        {/* Regional Activity */}
        <div className="glass-card flex-1">
          <h3 className="section-title"><MapPin size={18} color="#38BDF8" /> Most Active Regions</h3>
          <div className="region-list">
            {loading ? (
              <div className="loading-placeholder">Loading regions...</div>
            ) : data?.regionalBreakdown?.length === 0 ? (
              <div className="empty-placeholder">No regional data recorded.</div>
            ) : (
              data?.regionalBreakdown?.map((reg, idx) => (
                <div key={idx} className="region-bar-item">
                  <div className="region-name-row">
                    <span>{reg._id || 'Unspecified'}</span>
                    <span className="region-count">{reg.count} Users</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${Math.min(100, (reg.count / (cards.totalUsers || 1)) * 100)}%`,
                        background: '#38BDF8'
                      }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Rated Providers */}
        <div className="glass-card flex-1">
          <h3 className="section-title"><Award size={18} color="#C5A059" /> Top Rated Artisans</h3>
          <div className="top-providers-list">
            {loading ? (
              <div className="loading-placeholder">Loading top providers...</div>
            ) : data?.topProviders?.length === 0 ? (
              <div className="empty-placeholder">No rated providers found.</div>
            ) : (
              data?.topProviders?.map((p, idx) => (
                <div key={p._id} className="top-provider-row">
                  <div className="provider-rank">#{idx + 1}</div>
                  <div className="provider-meta">
                    <span className="p-name">{p.firstName} {p.lastName}</span>
                    <span className="p-category">{p.providerDetails?.jobTitle || 'Artisan'} • {p.email}</span>
                  </div>
                  <div className="p-rating">
                    ★ {p.ratings?.averageRating || '5.0'}
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>({p.ratings?.totalReviews || 0})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="dashboard-activity-grid">
        {/* Recent Registrations */}
        <div className="glass-card">
          <h3 className="section-title"><Users size={16} color="#60A5FA" /> Recent Registrations</h3>
          <div className="activity-list">
            {data?.recentActivity?.registrations?.map(u => (
              <div key={u._id} className="act-item">
                <div className="act-avatar">{u.firstName?.[0]}</div>
                <div className="act-details">
                  <span className="act-title">{u.firstName} {u.lastName}</span>
                  <span className="act-sub">{u.email} • {u.roles?.join(', ')}</span>
                </div>
                <span className="act-time">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Provider Applications */}
        <div className="glass-card">
          <h3 className="section-title"><ShieldCheck size={16} color="#FBBF24" /> Pending Applications</h3>
          <div className="activity-list">
            {data?.recentActivity?.verifications?.map(u => (
              <div key={u._id} className="act-item" onClick={() => onNavigate && onNavigate('approvals')}>
                <div className="act-avatar" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24' }}>
                  {u.firstName?.[0]}
                </div>
                <div className="act-details">
                  <span className="act-title">{u.firstName} {u.lastName}</span>
                  <span className="act-sub">{u.providerDetails?.jobTitle || 'Provider Application'}</span>
                </div>
                <span className="act-badge-pending">Review</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incident Reports */}
        <div className="glass-card">
          <h3 className="section-title"><AlertTriangle size={16} color="#EF4444" /> Recent Safety Reports</h3>
          <div className="activity-list">
            {data?.recentActivity?.reports?.map(r => (
              <div key={r._id} className="act-item" onClick={() => onNavigate && onNavigate('reports')}>
                <div className="act-avatar" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>!</div>
                <div className="act-details">
                  <span className="act-title">{r.reason}</span>
                  <span className="act-sub">By: {r.reporterId?.firstName || 'User'}</span>
                </div>
                <span className={`act-badge-${r.status}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
