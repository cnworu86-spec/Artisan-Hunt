import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserCheck, Plus, Key, Edit3, X, ShieldAlert, Shield } from 'lucide-react';
import './AdminManagement.css';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/administrators');
      setAdmins(res.data);
    } catch (err) {
      console.error('Error fetching admin accounts:', err);
      setError('Could not fetch administrator accounts list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', password: '', role: 'admin' });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (adm) => {
    setEditingAdmin(adm);
    setFormData({ name: adm.name, email: adm.email, password: '', role: adm.role || 'admin' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAdmin) {
        await api.patch(`/admin/administrators/${editingAdmin._id}`, formData);
      } else {
        await api.post('/admin/administrators', formData);
      }
      setIsAddModalOpen(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save admin account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-mgmt-page animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Platform Administrators</h1>
            <p>Super Admin control center for provisioning administrator accounts, roles, and access credentials.</p>
          </div>
          <button className="btn-add-admin" onClick={handleOpenAdd}>
            <Plus size={16} /> Create Administrator
          </button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="table-card-glass">
        {loading ? (
          <div className="table-loading">Loading administrator accounts…</div>
        ) : admins.length === 0 ? (
          <div className="table-empty">No administrator accounts registered.</div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-data-table">
              <thead>
                <tr>
                  <th>Administrator ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role / Access level</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(adm => (
                  <tr key={adm._id}>
                    <td style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.82rem' }}>
                      #{adm._id.substring(0, 8)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{adm.name}</div>
                    </td>
                    <td style={{ color: '#CBD5E1' }}>
                      {adm.email}
                    </td>
                    <td>
                      <span className={`admin-role-badge role-${adm.role}`}>
                        {adm.role === 'superadmin' ? 'Super Admin' : 'Administrator'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button className="btn-action-icon" title="Edit Admin Role" onClick={() => handleOpenEdit(adm)}>
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingAdmin) && (
        <div className="modal-overlay animate-fade-in" onClick={() => { setIsAddModalOpen(false); setEditingAdmin(null); }}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingAdmin ? 'Modify Admin Role & Credentials' : 'Provision New Administrator'}</h3>
              <button className="close-btn" onClick={() => { setIsAddModalOpen(false); setEditingAdmin(null); }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Samuel Mensah"
                  required
                />
              </div>

              {!editingAdmin && (
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@artisanhunt.com"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>{editingAdmin ? 'New Password (Optional)' : 'Password'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={!editingAdmin}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Administrator (Standard Access)</option>
                  <option value="superadmin">Super Admin (Full Administrative Control)</option>
                  <option value="moderator">Moderator (Safety & Reviews Access)</option>
                </select>
              </div>

              <div className="edit-actions-row">
                <button type="button" className="btn-secondary" onClick={() => { setIsAddModalOpen(false); setEditingAdmin(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : (editingAdmin ? 'Update Administrator' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
