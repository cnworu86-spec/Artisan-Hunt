import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import { User, ShieldCheck, Briefcase, Star, AlertOctagon, X, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import maleAvatar from '../assets/profile-male.png';
import femaleAvatar from '../assets/profile-female.png';
import './UserProfileModal.css';

export default function UserProfileModal({ userId, onClose, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFullProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/users/${userId}/full-profile`);
      setProfileData(res.data);
    } catch (err) {
      console.error('Error fetching full profile:', err);
      setError('Failed to load user profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, [userId]);

  const handleVerificationChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/verify`, { status: newStatus });
      await fetchFullProfile();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      alert('Failed to update verification status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspensionToggle = async (isSuspended) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/suspend`, { isSuspended: !isSuspended, suspensionReason: 'Admin moderation' });
      await fetchFullProfile();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      alert('Failed to update suspension status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!userId) return null;

  const user = profileData?.user;
  const bookings = profileData?.bookings || [];
  const reviewsReceived = profileData?.reviewsReceived || [];
  const reports = profileData?.reports || [];

  const role = user?.roles?.[0] || 'client';
  const vStatus = user?.verification?.verificationStatus || 'unverified';
  const isSuspended = user?.accountStatus?.isSuspended;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header Banner */}
        <div className="profile-banner">
          <div className="banner-user-info">
            <div className="banner-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {user?.profileImage ? (
                <img src={getImageUrl(user.profileImage)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={user?.gender === 'Female' ? femaleAvatar : maleAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div>
              <h2 className="banner-name">{user?.firstName} {user?.lastName}</h2>
              <div className="banner-badges">
                <span className={`badge role-tag-${role}`}>{role.toUpperCase()}</span>
                <span className={`badge v-tag-${vStatus}`}>{vStatus.toUpperCase()}</span>
                {isSuspended && <span className="badge status-suspended">SUSPENDED</span>}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <User size={16} /> Overview & Identity
          </button>
          <button className={`profile-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
            <Briefcase size={16} /> Jobs & Bookings ({bookings.length})
          </button>
          <button className={`profile-tab ${activeTab === 'ratings' ? 'active' : ''}`} onClick={() => setActiveTab('ratings')}>
            <Star size={16} /> Ratings & Reviews ({reviewsReceived.length})
          </button>
          {reports.length > 0 && (
            <button className={`profile-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              <AlertOctagon size={16} color="#EF4444" /> Safety Reports ({reports.length})
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="profile-modal-body">
          {loading ? (
            <div className="profile-loading">Loading complete profile history…</div>
          ) : error ? (
            <div className="profile-error">⚠️ {error}</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="tab-content animate-fade-in">
                  <div className="info-grid">
                    <div className="info-card">
                      <h3>Contact Information</h3>
                      <div className="info-item"><Mail size={15} /> <span>{user?.email || 'N/A'}</span></div>
                      <div className="info-item"><Phone size={15} /> <span>{user?.phoneNumber || 'N/A'}</span></div>
                      <div className="info-item"><MapPin size={15} /> <span>{user?.location?.address ? `${user.location.address}, ${user.location.region || ''}` : 'N/A'}</span></div>
                      <div className="info-item"><MapPin size={15} /> <span>GPS: {user?.location?.gpsAddress || 'N/A'}</span></div>
                      <div className="info-item"><Calendar size={15} /> <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                    </div>

                    {role === 'provider' && user?.providerDetails && (
                      <div className="info-card">
                        <h3>Artisan Professional Details</h3>
                        <div className="info-item"><strong>Category:</strong> <span>{user.providerDetails.serviceCategory || user.providerDetails.category || 'General Services'}</span></div>
                        <div className="info-item"><strong>Hourly Rate:</strong> <span>GH₵ {user.providerDetails.hourlyRate || '0.00'}</span></div>
                        <div className="info-item"><strong>Rating:</strong> <span>⭐ {user.providerDetails.rating || '0.0'} ({user.providerDetails.totalReviews || 0} reviews)</span></div>
                        <div className="info-item"><strong>Jobs Completed:</strong> <span>{user.providerDetails.completedJobs || 0} Jobs</span></div>
                      </div>
                    )}
                  </div>

                  <div className="doc-section">
                    <h3>Ghana Card Verification Document</h3>
                    <div className="doc-box">
                      <div className="doc-meta">
                        <div><strong>Ghana Card Number:</strong> {user?.verification?.ghanaCardNumberEncrypted || 'Not Provided'}</div>
                        <div><strong>Verification Status:</strong> <span className={`v-tag-${vStatus}`}>{vStatus}</span></div>
                      </div>
                      {user?.verification?.ghanaCardImage ? (
                        <img src={getImageUrl(user.verification.ghanaCardImage)} alt="Ghana Card" className="ghana-card-full-img" />
                      ) : (
                        <div className="no-doc-placeholder">📄 No Ghana Card Photo Uploaded</div>
                      )}
                    </div>
                  </div>

                  <div className="action-row">
                    {vStatus !== 'verified' ? (
                      <button className="btn-approve" disabled={actionLoading} onClick={() => handleVerificationChange('verified')}>
                        Approve & Verify User
                      </button>
                    ) : (
                      <button className="btn-warn" disabled={actionLoading} onClick={() => handleVerificationChange('pending')}>
                        Revoke Verification
                      </button>
                    )}
                    {vStatus !== 'rejected' && (
                      <button className="btn-reject" disabled={actionLoading} onClick={() => handleVerificationChange('rejected')}>
                        Reject Verification
                      </button>
                    )}
                    {!isSuspended ? (
                      <button className="btn-danger" disabled={actionLoading || role === 'admin'} onClick={() => handleSuspensionToggle(false)}>
                        Suspend Account
                      </button>
                    ) : (
                      <button className="btn-approve" disabled={actionLoading} onClick={() => handleSuspensionToggle(true)}>
                        Reactivate Account
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: JOBS */}
              {activeTab === 'jobs' && (
                <div className="tab-content animate-fade-in">
                  {bookings.length === 0 ? (
                    <div className="empty-state">No jobs or bookings recorded for this user yet.</div>
                  ) : (
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Job Ref</th>
                          <th>Role</th>
                          <th>Counterpart</th>
                          <th>Scheduled</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => {
                          const isClient = String(b.clientId?._id || b.clientId) === String(userId);
                          const counterpart = isClient 
                            ? `${b.providerId?.firstName || 'Artisan'} ${b.providerId?.lastName || ''}` 
                            : `${b.clientId?.firstName || 'Client'} ${b.clientId?.lastName || ''}`;
                          return (
                            <tr key={b._id}>
                              <td style={{ fontWeight: 700 }}>#{b._id.substring(0, 8)}</td>
                              <td><span className="mini-badge">{isClient ? 'Client' : 'Provider'}</span></td>
                              <td>{counterpart}</td>
                              <td>{b.scheduledTime ? new Date(b.scheduledTime).toLocaleDateString() : 'N/A'}</td>
                              <td><span className={`status-tag status-${b.status}`}>{b.status}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: RATINGS */}
              {activeTab === 'ratings' && (
                <div className="tab-content animate-fade-in">
                  {reviewsReceived.length === 0 ? (
                    <div className="empty-state">No customer reviews received yet.</div>
                  ) : (
                    <div className="reviews-list">
                      {reviewsReceived.map(r => (
                        <div key={r._id} className="review-card-item">
                          <div className="review-card-header">
                            <div>
                              <strong>{r.reviewerId?.firstName} {r.reviewerId?.lastName}</strong>
                              <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                          </div>
                          <p className="review-comment">"{r.comment || 'No comment written.'}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: REPORTS */}
              {activeTab === 'reports' && (
                <div className="tab-content animate-fade-in">
                  <div className="reviews-list">
                    {reports.map(rep => (
                      <div key={rep._id} className="review-card-item" style={{ borderLeft: '4px solid #EF4444' }}>
                        <div className="review-card-header">
                          <div>
                            <strong>Reporter: {rep.reporterId?.firstName} {rep.reporterId?.lastName}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#EF4444' }}>Status: {rep.status}</div>
                          </div>
                        </div>
                        <p className="review-comment">Reason: {rep.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
