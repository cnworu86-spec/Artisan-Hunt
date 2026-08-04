import React, { useState, useEffect } from 'react';
import api from '../api';
import { BarChart3, Users, Wrench, Calendar, MapPin, Star, TrendingUp, ShieldCheck, PieChart, Activity } from 'lucide-react';
import './AnalyticsHub.css';

const ANALYTICS_SUBTABS = ['users', 'providers', 'clients', 'bookings', 'regions'];

export default function AnalyticsHub() {
  const [subTab, setSubTab] = useState('users');
  const [data, setData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [detRes, ovRes] = await Promise.all([
        api.get('/admin/analytics/detailed'),
        api.get('/admin/analytics/overview')
      ]);
      setData(detRes.data);
      setOverviewData(ovRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Could not fetch platform analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = overviewData?.summaryCards || {};

  return (
    <div className="analytics-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Platform Analytics & Telemetry</h1>
          <p>Deep operational data analytics across users, artisans, bookings, demand categories, and geographic regions.</p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="analytics-toolbar">
        <div className="filter-pills">
          {ANALYTICS_SUBTABS.map(tab => (
            <button
              key={tab}
              className={`filter-pill ${subTab === tab ? 'active' : ''}`}
              onClick={() => setSubTab(tab)}
            >
              {tab.toUpperCase()} ANALYTICS
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {loading ? (
        <div className="analytics-loading">Aggregating live telemetry datasets…</div>
      ) : (
        <div className="analytics-content">
          {/* USER ANALYTICS TAB */}
          {subTab === 'users' && (
            <div className="analytics-grid animate-fade-in">
              <div className="glass-card stat-tile">
                <Users size={24} color="#38BDF8" />
                <div className="tile-val">{data?.users?.totalUsers || 0}</div>
                <div className="tile-lbl">Total Platform Users</div>
              </div>
              <div className="glass-card stat-tile">
                <TrendingUp size={24} color="#34D399" />
                <div className="tile-val">{data?.users?.activeUsers || 0}</div>
                <div className="tile-lbl">Active Unrestricted Users</div>
              </div>
              <div className="glass-card stat-tile">
                <Activity size={24} color="#F59E0B" />
                <div className="tile-val">{summary.activeUsersToday || 0}</div>
                <div className="tile-lbl">Active Users Today</div>
              </div>

              <div className="glass-card full-width">
                <h3 className="card-title">User Distribution Breakdown</h3>
                <div className="distribution-bars">
                  <div className="dist-row">
                    <span>Active Account Status</span>
                    <span>{data?.users?.activeUsers} ({Math.round(((data?.users?.activeUsers || 0) / (data?.users?.totalUsers || 1)) * 100)}%)</span>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${((data?.users?.activeUsers || 0) / (data?.users?.totalUsers || 1)) * 100}%`, background: '#34D399' }} /></div>

                  <div className="dist-row" style={{ marginTop: '1rem' }}>
                    <span>Suspended Accounts</span>
                    <span>{summary.suspendedUsers} ({Math.round(((summary.suspendedUsers || 0) / (data?.users?.totalUsers || 1)) * 100)}%)</span>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${((summary.suspendedUsers || 0) / (data?.users?.totalUsers || 1)) * 100}%`, background: '#F87171' }} /></div>
                </div>
              </div>
            </div>
          )}

          {/* PROVIDER ANALYTICS TAB */}
          {subTab === 'providers' && (
            <div className="analytics-grid animate-fade-in">
              <div className="glass-card stat-tile">
                <Wrench size={24} color="#34D399" />
                <div className="tile-val">{data?.providers?.totalProviders || 0}</div>
                <div className="tile-lbl">Total Registered Artisans</div>
              </div>
              <div className="glass-card stat-tile">
                <ShieldCheck size={24} color="#38BDF8" />
                <div className="tile-val">{data?.providers?.verifiedProviders || 0}</div>
                <div className="tile-lbl">Verified Ghana Card Artisans</div>
              </div>
              <div className="glass-card stat-tile">
                <Star size={24} color="#FBBF24" />
                <div className="tile-val">{data?.providers?.avgRating} / 5.0</div>
                <div className="tile-lbl">Average Artisan Rating</div>
              </div>

              <div className="glass-card full-width">
                <h3 className="card-title">Artisan Category Popularity</h3>
                <div className="category-demand-list">
                  {data?.categories?.map((cat, i) => (
                    <div key={i} className="cat-demand-item">
                      <span className="cat-name">{cat._id}</span>
                      <span className="cat-val">{cat.totalBookings} Total Job Requests</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CLIENT ANALYTICS TAB */}
          {subTab === 'clients' && (
            <div className="analytics-grid animate-fade-in">
              <div className="glass-card stat-tile">
                <Users size={24} color="#60A5FA" />
                <div className="tile-val">{summary.totalClients || 0}</div>
                <div className="tile-lbl">Registered Client Accounts</div>
              </div>
              <div className="glass-card stat-tile">
                <Calendar size={24} color="#38BDF8" />
                <div className="tile-val">{summary.totalCompletedBookings + summary.totalPendingBookings}</div>
                <div className="tile-lbl">Total Bookings Requested</div>
              </div>
              <div className="glass-card stat-tile">
                <BarChart3 size={24} color="#A78BFA" />
                <div className="tile-val">
                  {summary.totalClients ? ((summary.totalCompletedBookings + summary.totalPendingBookings) / summary.totalClients).toFixed(1) : 0}
                </div>
                <div className="tile-lbl">Avg Bookings per Client</div>
              </div>
            </div>
          )}

          {/* BOOKING ANALYTICS TAB */}
          {subTab === 'bookings' && (
            <div className="analytics-grid animate-fade-in">
              <div className="glass-card stat-tile">
                <Calendar size={24} color="#34D399" />
                <div className="tile-val">{summary.totalCompletedBookings || 0}</div>
                <div className="tile-lbl">Completed Jobs</div>
              </div>
              <div className="glass-card stat-tile">
                <Calendar size={24} color="#FBBF24" />
                <div className="tile-val">{summary.totalPendingBookings || 0}</div>
                <div className="tile-lbl">Pending Bookings</div>
              </div>

              <div className="glass-card full-width">
                <h3 className="card-title">Booking Status Distribution</h3>
                <div className="status-grid-pills">
                  {data?.bookingStatuses?.map((st, i) => (
                    <div key={i} className="status-metric-box">
                      <span className="sm-val">{st.count}</span>
                      <span className="sm-lbl">{st._id?.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REGIONAL ANALYTICS TAB */}
          {subTab === 'regions' && (
            <div className="analytics-grid animate-fade-in">
              <div className="glass-card full-width">
                <h3 className="card-title"><MapPin size={18} color="#38BDF8" /> Geographic Distribution Across Ghana</h3>
                <div className="regional-detail-list">
                  {overviewData?.regionalBreakdown?.map((reg, idx) => (
                    <div key={idx} className="reg-detail-row">
                      <div className="reg-info">
                        <span className="reg-name">{reg._id || 'Unspecified'}</span>
                        <span className="reg-val">{reg.count} Platform Users</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(reg.count / (summary.totalUsers || 1)) * 100}%`, background: '#38BDF8' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
