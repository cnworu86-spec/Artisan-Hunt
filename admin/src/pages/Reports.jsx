import React, { useState, useEffect } from 'react';
import api from '../api';
import { AlertOctagon, CheckCircle2, ShieldAlert, XCircle, Clock, Eye } from 'lucide-react';
import './Reports.css';

const REPORT_TABS = ['all', 'pending', 'under_review', 'resolved', 'dismissed'];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [resolvingId, setResolvingId] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data);
    } catch (err) {
      setError('Error fetching safety reports from server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    let note = '';
    let suspend = false;

    if (newStatus === 'resolved') {
      note = window.prompt('Enter resolution notes:', 'Report reviewed. Corrective action taken by admin.');
      if (note === null) return;
      suspend = window.confirm('Would you like to also suspend the reported user account?');
    } else if (newStatus === 'dismissed') {
      note = window.prompt('Enter dismissal reason:', 'Insufficient evidence or invalid complaint.');
      if (note === null) return;
    }

    setResolvingId(id);
    try {
      await api.patch(`/admin/reports/${id}/resolve`, { 
        status: newStatus, 
        resolutionNotes: note,
        suspendReportedUser: suspend
      });
      fetchReports();
    } catch (err) {
      alert('Failed to update report status.');
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const filtered = reports.filter(r => {
    const st = (r.status || 'pending').toLowerCase();
    if (activeTab === 'all') return true;
    return st === activeTab;
  });

  const tabCounts = { all: reports.length };
  reports.forEach(r => {
    const st = (r.status || 'pending').toLowerCase();
    tabCounts[st] = (tabCounts[st] ?? 0) + 1;
  });

  return (
    <div className="animate-fade-in reports-container">
      <div className="page-header">
        <div>
          <h1>Safety & Incident Reports Management</h1>
          <p>Review incidents, conduct safety reviews, take punitive action, and archive audit notes permanently.</p>
        </div>
      </div>

      <div className="reports-toolbar">
        <div className="filter-pills">
          {REPORT_TABS.map(tab => (
            <button
              key={tab}
              className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace('_', ' ').toUpperCase()} ({tabCounts[tab] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="table-card-glass" style={{ marginTop: '1rem' }}>
        {loading ? (
          <div className="table-loading">Loading safety incident reports…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">No safety reports found under "{activeTab.replace('_', ' ')}". Platform is clear!</div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-data-table">
              <thead>
                <tr>
                  <th>Report Ref</th>
                  <th>Reporter</th>
                  <th>Reported Party</th>
                  <th>Reason & Description</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rep => {
                  const status = (rep.status || 'pending').toLowerCase();
                  const isResolved = status === 'resolved';
                  const isDismissed = status === 'dismissed';

                  return (
                    <tr key={rep._id}>
                      <td style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.82rem' }}>
                        #{rep.reportId || rep._id.substring(0, 8)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                          {rep.reporterId ? `${rep.reporterId.firstName} ${rep.reporterId.lastName}` : 'System User'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{rep.reporterId?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#C5A059' }}>
                          {rep.reportedUserId ? `${rep.reportedUserId.firstName} ${rep.reportedUserId.lastName}` : 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{rep.reportedUserId?.email}</div>
                      </td>
                      <td style={{ color: '#CBD5E1', maxWidth: '320px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{rep.reason}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          {rep.description || 'No detailed narrative provided.'}
                        </div>
                        {rep.resolutionNotes && (
                          <div className="rep-resolution-note">
                            <strong>Note:</strong> {rep.resolutionNotes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`b-status-pill b-status-${status}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          {status === 'pending' && (
                            <button
                              className="btn-action-icon"
                              style={{ color: '#38BDF8', borderColor: '#38BDF8' }}
                              title="Mark Under Review"
                              disabled={resolvingId === rep._id}
                              onClick={() => handleStatusChange(rep._id, 'under_review')}
                            >
                              <Clock size={15} />
                            </button>
                          )}

                          {!isResolved && (
                            <button 
                              className="btn-action-icon"
                              style={{ color: '#34D399', borderColor: '#34D399' }}
                              title="Mark Resolved"
                              disabled={resolvingId === rep._id}
                              onClick={() => handleStatusChange(rep._id, 'resolved')}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {!isDismissed && !isResolved && (
                            <button 
                              className="btn-action-icon"
                              style={{ color: '#EF4444', borderColor: '#EF4444' }}
                              title="Dismiss Report"
                              disabled={resolvingId === rep._id}
                              onClick={() => handleStatusChange(rep._id, 'dismissed')}
                            >
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
