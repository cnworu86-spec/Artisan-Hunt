import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import UserProfileModal from '../components/UserProfileModal';
import { Eye, ShieldCheck, UserX, UserCheck, Lock, Key, Edit3, X } from 'lucide-react';
import maleAvatar from '../assets/profile-male.png';
import femaleAvatar from '../assets/profile-female.png';
import './UsersList.css';

const FILTER_TABS = [
  'all', 
  'client', 
  'provider', 
  'both', 
  'verified', 
  'pending_verification', 
  'suspended', 
  'blocked', 
  'active'
];

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);

  // Edit user state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', region: '', role: 'client' });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError('Error fetching user directory from server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSuspension = async (user) => {
    const isSuspended = user.accountStatus?.isSuspended;
    let reason = '';
    if (!isSuspended) {
      reason = window.prompt('Enter suspension reason:', 'Violation of terms of service');
      if (reason === null) return;
    }

    setUpdatingId(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/suspend`, { isSuspended: !isSuspended, suspensionReason: reason });
      fetchUsers();
    } catch (err) {
      alert('Failed to update suspension status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleBlock = async (user) => {
    const isBlocked = user.accountStatus?.isBlocked;
    if (!window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this account?`)) return;

    setUpdatingId(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/block`, { isBlocked: !isBlocked });
      fetchUsers();
    } catch (err) {
      alert('Failed to update block status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Reset user password? This will generate a new temporary password.')) return;
    setUpdatingId(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/reset-password`);
      alert(`Temporary password generated successfully:\n\n${res.data.tempPassword}\n\nPlease communicate this securely to the user.`);
    } catch (err) {
      alert('Failed to reset password.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      region: user.location?.region || 'Kumasi',
      role: user.roles?.length > 1 ? 'both' : (user.roles?.[0] || 'client')
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdatingId(editingUser._id);
    try {
      await api.patch(`/admin/users/${editingUser._id}`, editForm);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user details.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRolesLabel = (u) => {
    if (u.roles?.includes('admin')) return 'Admin';
    if (u.roles?.includes('client') && u.roles?.includes('provider')) return 'Both';
    if (u.roles?.includes('provider')) return 'Provider';
    return 'Client';
  };

  const filtered = users.filter(u => {
    const roleLabel = getRolesLabel(u).toLowerCase();
    const vStatus = u.verification?.verificationStatus || 'unverified';
    const isSuspended = u.accountStatus?.isSuspended;
    const isBlocked = u.accountStatus?.isBlocked;
    const isActive = !isSuspended && !isBlocked;

    if (activeFilter === 'client' && roleLabel !== 'client') return false;
    if (activeFilter === 'provider' && roleLabel !== 'provider') return false;
    if (activeFilter === 'both' && roleLabel !== 'both') return false;
    if (activeFilter === 'verified' && vStatus !== 'verified') return false;
    if (activeFilter === 'pending_verification' && vStatus !== 'pending') return false;
    if (activeFilter === 'suspended' && !isSuspended) return false;
    if (activeFilter === 'blocked' && !isBlocked) return false;
    if (activeFilter === 'active' && !isActive) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phoneNumber || '').toLowerCase();
    const id = (u._id || '').toLowerCase();

    return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
  });

  return (
    <div className="users-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>User Directory Management</h1>
          <p>Search, inspect, edit, suspend, and manage all platform clients, artisans, and admins.</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="users-toolbar">
        <div className="filter-pills">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              className={`filter-pill ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <input
          className="search-input"
          placeholder="Search by ID, Name, Email, Phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* Users Table */}
      <div className="table-card-glass">
        {loading ? (
          <div className="table-loading">Fetching live user records from database…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">No users match the selected criteria.</div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-data-table">
              <thead>
                <tr>
                  <th>User / Email</th>
                  <th>Roles</th>
                  <th>Ghana Card</th>
                  <th>Verification</th>
                  <th>Account Status</th>
                  <th>Region</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const roleLabel = getRolesLabel(user);
                  const isSuspended = user.accountStatus?.isSuspended;
                  const isBlocked = user.accountStatus?.isBlocked;
                  const vStatus = user.verification?.verificationStatus || 'unverified';
                  const name = `${user.firstName} ${user.lastName}`;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                            {user.profileImage ? (
                              <img src={getImageUrl(user.profileImage)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={user.gender === 'Female' ? femaleAvatar : maleAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <div>
                            <div className="u-name">{name}</div>
                            <div className="u-email">{user.email} • {user.phoneNumber || 'No phone'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${roleLabel.toLowerCase()}`}>{roleLabel}</span>
                      </td>
                      <td>
                        {user.verification?.ghanaCardNumberEncrypted ? (
                          <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>
                            {user.verification.ghanaCardNumberEncrypted}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Not provided</span>
                        )}
                      </td>
                      <td>
                        <span className={`v-status-badge v-status-${vStatus}`}>
                          {vStatus === 'verified' ? '✓ Verified' : vStatus === 'pending' ? '⏳ Pending' : vStatus === 'resubmission_requested' ? '🔄 Resubmit' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        {isBlocked ? (
                          <span className="status-badge status-blocked">🚫 Blocked</span>
                        ) : isSuspended ? (
                          <span className="status-badge status-suspended">⚠️ Suspended</span>
                        ) : (
                          <span className="status-badge status-active">● Active</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
                        {user.location?.region || 'Kumasi'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button 
                            className="btn-action-icon" 
                            title="Inspect Profile & Booking History"
                            onClick={() => setSelectedUserForProfile(user._id)}
                          >
                            <Eye size={15} />
                          </button>

                          <button 
                            className="btn-action-icon" 
                            title="Edit User Info"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit3 size={15} />
                          </button>

                          <button 
                            className="btn-action-icon" 
                            title="Reset User Password"
                            disabled={updatingId === user._id}
                            onClick={() => handleResetPassword(user._id)}
                          >
                            <Key size={15} />
                          </button>

                          <button 
                            className={`btn-action-icon ${isSuspended ? 'active-green' : 'warn-yellow'}`}
                            title={isSuspended ? 'Unsuspend Account' : 'Suspend Account'}
                            disabled={updatingId === user._id || user.roles?.includes('admin')}
                            onClick={() => toggleSuspension(user)}
                          >
                            <UserX size={15} />
                          </button>

                          <button 
                            className={`btn-action-icon ${isBlocked ? 'active-green' : 'danger-red'}`}
                            title={isBlocked ? 'Unblock Account' : 'Block Account'}
                            disabled={updatingId === user._id || user.roles?.includes('admin')}
                            onClick={() => toggleBlock(user)}
                          >
                            <Lock size={15} />
                          </button>
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

      {/* Deep User Profile Modal */}
      {selectedUserForProfile && (
        <UserProfileModal
          userId={selectedUserForProfile}
          onClose={() => setSelectedUserForProfile(null)}
          onUserUpdated={fetchUsers}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay animate-fade-in" onClick={() => setEditingUser(null)}>
          <div className="edit-user-card" onClick={e => e.stopPropagation()}>
            <div className="edit-card-header">
              <h3>Edit User Demographic Info</h3>
              <button className="close-btn" onClick={() => setEditingUser(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    value={editForm.firstName}
                    onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    value={editForm.lastName}
                    onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    value={editForm.phoneNumber}
                    onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Region</label>
                  <select
                    value={editForm.region}
                    onChange={e => setEditForm({ ...editForm, region: e.target.value })}
                  >
                    <option value="Kumasi">Kumasi</option>
                    <option value="Accra">Accra</option>
                    <option value="Takoradi">Takoradi</option>
                    <option value="Tamale">Tamale</option>
                    <option value="Cape Coast">Cape Coast</option>
                    <option value="Sunyani">Sunyani</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Roles</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="client">Client Only</option>
                    <option value="provider">Provider Only</option>
                    <option value="both">Both (Client + Provider)</option>
                  </select>
                </div>
              </div>

              <div className="edit-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={updatingId === editingUser._id}>
                  {updatingId === editingUser._id ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
