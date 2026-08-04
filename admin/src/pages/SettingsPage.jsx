import React, { useState, useEffect } from 'react';
import api from '../api';
import { Settings, ShieldCheck, Database, Server, Bell, Save, CheckCircle2 } from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    chatRetentionDays: 30,
    sessionTimeoutMinutes: 30,
    defaultUserStatus: 'active',
    emailNotifications: true,
    systemAlerts: true
  });
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [settRes, healthRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/system-status')
      ]);
      if (settRes.data) setSettings(settRes.data);
      setSystemHealth(healthRes.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Could not load system configurations from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError('');
    try {
      await api.put('/admin/settings', settings);
      setSuccessMsg('Platform configuration updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Failed to save settings to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Platform Settings & System Telemetry</h1>
          <p>Configure retention rules, authentication timeouts, notification preferences, and inspect system telemetry.</p>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}
      {successMsg && <div className="success-banner"><CheckCircle2 size={16} /> {successMsg}</div>}

      <div className="settings-grid">
        {/* Settings Form */}
        <div className="glass-card flex-2">
          <h3 className="section-title"><Settings size={18} color="#38BDF8" /> Platform System Configurations</h3>
          
          {loading ? (
            <div className="loading-placeholder">Loading configurations…</div>
          ) : (
            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Chat Retention Period (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.chatRetentionDays || 30}
                    onChange={e => setSettings({ ...settings, chatRetentionDays: parseInt(e.target.value) || 30 })}
                    required
                  />
                  <span className="field-hint">Automatically purge chat logs older than specified days.</span>
                </div>

                <div className="form-group">
                  <label>Inactivity Session Timeout (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.sessionTimeoutMinutes || 30}
                    onChange={e => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })}
                    required
                  />
                  <span className="field-hint">Auto-logout duration after inactivity.</span>
                </div>
              </div>

              <div className="form-group">
                <label>Default Registered User Status</label>
                <select
                  value={settings.defaultUserStatus || 'active'}
                  onChange={e => setSettings({ ...settings, defaultUserStatus: e.target.value })}
                >
                  <option value="active">Active (Default)</option>
                  <option value="pending">Pending Admin Review</option>
                </select>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!settings.emailNotifications}
                    onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  />
                  <span>Enable Administrator Email Notifications</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!settings.systemAlerts}
                    onChange={e => setSettings({ ...settings, systemAlerts: e.target.checked })}
                  />
                  <span>Broadcast System Health Alerts to Dashboard Header</span>
                </label>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn-save-settings" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving Configurations…' : 'Save System Settings'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* System Telemetry & Health Monitor */}
        <div className="glass-card flex-1">
          <h3 className="section-title"><Server size={18} color="#34D399" /> Real-time System Monitoring</h3>
          
          <div className="system-health-list">
            <div className="health-item">
              <div>
                <div className="h-label">Node.js Express Server</div>
                <div className="h-sub">Uptime: {systemHealth?.server?.uptimeSeconds ? Math.floor(systemHealth.server.uptimeSeconds / 60) : 0} mins</div>
              </div>
              <span className="status-badge-healthy">● {systemHealth?.server?.status || 'Operational'}</span>
            </div>

            <div className="health-item">
              <div>
                <div className="h-label">MongoDB Database Cluster</div>
                <div className="h-sub">Connection State</div>
              </div>
              <span className="status-badge-healthy">● {systemHealth?.database?.status || 'Connected'}</span>
            </div>

            <div className="health-item">
              <div>
                <div className="h-label">Firebase Realtime Engine</div>
                <div className="h-sub">Chat & Messaging Relay</div>
              </div>
              <span className="status-badge-healthy">● {systemHealth?.firebaseEngine?.status || 'Active'}</span>
            </div>

            <div className="health-item">
              <div>
                <div className="h-label">Expo Push Server</div>
                <div className="h-sub">Mobile Push Gateway</div>
              </div>
              <span className="status-badge-healthy">● {systemHealth?.expoNotificationServer?.status || 'Active'}</span>
            </div>

            <div className="health-item">
              <div>
                <div className="h-label">Memory Heap Usage</div>
                <div className="h-sub">Allocated RAM</div>
              </div>
              <span style={{ fontWeight: 700, color: '#38BDF8' }}>{systemHealth?.server?.memoryUsageMb || 0} MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
