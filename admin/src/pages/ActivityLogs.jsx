import React, { useState, useEffect } from 'react';
import api from '../api';
import { FileText, Shield, Monitor, HardDrive } from 'lucide-react';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Could not fetch administrative activity audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="logs-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Administrative Activity Audit Logs</h1>
          <p>Read-only permanent audit trails of all administrator actions, moderation decisions, and system events.</p>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="table-card-glass">
        {loading ? (
          <div className="table-loading">Loading audit logs…</div>
        ) : logs.length === 0 ? (
          <div className="table-empty">No administrator activity recorded yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Administrator</th>
                  <th>Action Performed</th>
                  <th>Target Entity</th>
                  <th>Details / Notes</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#38BDF8' }}>
                        {log.adminName || 'Admin'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{log.adminEmail}</div>
                    </td>
                    <td>
                      <span className="log-action-tag">{log.action}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#C5A059' }}>
                      {log.target || 'N/A'}
                    </td>
                    <td style={{ color: '#CBD5E1', maxWidth: '300px' }}>
                      {log.details || 'System event recorded.'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
