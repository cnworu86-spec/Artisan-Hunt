import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import { ShieldAlert, CheckCircle, XCircle, Eye, UserCheck, RefreshCw, User, ArrowRight, Image as ImageIcon, Phone } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import maleAvatar from '../assets/profile-male.png';
import femaleAvatar from '../assets/profile-female.png';
import './ApprovalsQueue.css';

const VERIF_TABS = ['pending', 'verified', 'rejected', 'resubmission_requested'];
const PROFILE_UPDATE_TABS = ['all', 'pending', 'approved', 'rejected', 'resubmission_requested'];

export default function ApprovalsQueue() {
  const [mainMode, setMainMode] = useState('verifications'); // 'verifications' or 'profile_updates'
  const [providers, setProviders] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [actionId, setActionId] = useState(null);

  const fetchProviders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      const providerList = res.data.filter(u => u.roles?.includes('provider'));
      setProviders(providerList);
    } catch (err) {
      console.error('Error fetching verification queue:', err);
      setError('Could not fetch provider verification queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/profile-update-requests');
      setProfileRequests(res.data);
    } catch (err) {
      console.error('Error fetching profile update requests:', err);
      setError('Could not fetch profile update requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mainMode === 'verifications') {
      fetchProviders();
    } else {
      fetchProfileRequests();
    }
  }, [mainMode]);

  const handleDecision = async (id, status, notes = '') => {
    setActionId(id);
    try {
      await api.patch(`/admin/users/${id}/verify`, { status, notes });
      fetchProviders();
    } catch (err) {
      alert('Failed to update verification status');
    } finally {
      setActionId(null);
    }
  };

  const handleRequestResubmission = (id) => {
    const notes = window.prompt('Enter resubmission instructions for artisan:', 'Ghana Card image is blurry. Please re-upload a clear picture of front side.');
    if (notes === null) return;
    handleDecision(id, 'resubmission_requested', notes);
  };

  const handleReviewProfileRequest = async (id, status) => {
    let notes = '';
    if (status === 'resubmission_requested' || status === 'rejected') {
      notes = window.prompt(`Enter review notes/reason for ${status.replace('_', ' ')}:`, 'Requested profile image or phone number is invalid.');
      if (notes === null) return;
    }

    setActionId(id);
    try {
      await api.patch(`/admin/profile-update-requests/${id}/review`, { status, notes });
      fetchProfileRequests();
    } catch (err) {
      alert('Failed to review profile update request');
    } finally {
      setActionId(null);
    }
  };

  const filteredProviders = providers.filter(u => {
    const st = u.verification?.verificationStatus || 'unverified';
    if (activeTab === 'pending') return st === 'pending' || st === 'unverified';
    return st === activeTab;
  });

  const filteredProfileRequests = profileRequests.filter(req => {
    if (activeTab === 'all') return true;
    return (req.status || 'pending') === activeTab;
  });

  const pendingProfileRequestsCount = profileRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="approvals-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Administrative Approvals & Verification Center</h1>
          <p>Inspect Ghana Cards, identity verifications, and user-requested profile changes (pictures, emergency contacts, bio).</p>
        </div>
      </div>

      {/* Main Mode Switcher */}
      <div className="mode-switcher-bar">
        <button
          className={`mode-btn ${mainMode === 'verifications' ? 'active' : ''}`}
          onClick={() => { setMainMode('verifications'); setActiveTab('pending'); }}
        >
          Provider Ghana Cards Queue
        </button>
        <button
          className={`mode-btn ${mainMode === 'profile_updates' ? 'active' : ''}`}
          onClick={() => { setMainMode('profile_updates'); setActiveTab('pending'); }}
        >
          Profile Change Requests ({pendingProfileRequestsCount} Pending)
        </button>
      </div>

      <div className="approvals-toolbar">
        <div className="filter-pills">
          {mainMode === 'verifications' ? (
            VERIF_TABS.map(tab => {
              const count = providers.filter(p => {
                const st = p.verification?.verificationStatus || 'unverified';
                if (tab === 'pending') return st === 'pending' || st === 'unverified';
                return st === tab;
              }).length;

              return (
                <button
                  key={tab}
                  className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.replace('_', ' ').toUpperCase()} ({count})
                </button>
              );
            })
          ) : (
            PROFILE_UPDATE_TABS.map(tab => {
              const count = profileRequests.filter(r => tab === 'all' || r.status === tab).length;
              return (
                <button
                  key={tab}
                  className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.replace('_', ' ').toUpperCase()} ({count})
                </button>
              );
            })
          )}
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* MODE 1: VERIFICATIONS QUEUE */}
      {mainMode === 'verifications' && (
        loading ? (
          <div className="queue-loading">Loading verification applications…</div>
        ) : filteredProviders.length === 0 ? (
          <div className="queue-empty">
            <ShieldAlert size={48} color="#34D399" />
            <h3>Queue Clear!</h3>
            <p>No provider verification applications under "{activeTab.replace('_', ' ')}".</p>
          </div>
        ) : (
          <div className="approvals-grid">
            {filteredProviders.map(user => {
              const hasPhoto = !!user.verification?.ghanaCardImage;
              const cardNum = user.verification?.ghanaCardNumberEncrypted || 'Not Provided';
              const vStatus = user.verification?.verificationStatus || 'unverified';

              return (
                <div key={user._id} className="approval-card">
                  <div className="card-top-bar">
                    <div className="user-info-meta">
                      <div className="card-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                        {user.profileImage ? (
                          <img src={getImageUrl(user.profileImage)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={user.gender === 'Female' ? femaleAvatar : maleAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div>
                        <h3 className="card-user-name">{user.firstName} {user.lastName}</h3>
                        <span className="card-user-email">{user.email} • {user.location?.region || 'Ghana'}</span>
                      </div>
                    </div>
                    <span className={`v-status-badge v-status-${vStatus}`}>
                      {vStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="card-body-doc">
                    <div className="doc-meta-row">
                      <div><strong>Job Title:</strong> {user.providerDetails?.jobTitle || 'Artisan Specialist'}</div>
                      <div><strong>Ghana Card:</strong> <span style={{ color: '#38BDF8', fontWeight: 600 }}>{cardNum}</span></div>
                      <div><strong>Bio:</strong> {user.providerDetails?.bio || 'No bio submitted.'}</div>
                      {user.verification?.resubmissionNotes && (
                        <div className="resub-notes-box">
                          <strong>Review Note:</strong> {user.verification.resubmissionNotes}
                        </div>
                      )}
                    </div>

                    {hasPhoto ? (
                      <div className="card-image-box" onClick={() => setSelectedUserId(user._id)}>
                        <img src={getImageUrl(user.verification.ghanaCardImage)} alt="Ghana Card" />
                        <div className="image-overlay"><Eye size={18} /> Click to Inspect Document</div>
                      </div>
                    ) : (
                      <div className="no-image-placeholder">No Ghana Card image uploaded</div>
                    )}
                  </div>

                  <div className="card-actions-bar">
                    <button className="btn-inspect-full" onClick={() => setSelectedUserId(user._id)}>
                      <UserCheck size={15} /> Full Profile
                    </button>

                    {vStatus !== 'verified' && (
                      <button 
                        className="btn-quick-approve" 
                        disabled={actionId === user._id}
                        onClick={() => handleDecision(user._id, 'verified')}
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                    )}

                    {vStatus !== 'resubmission_requested' && (
                      <button 
                        className="btn-quick-resubmit"
                        disabled={actionId === user._id}
                        onClick={() => handleRequestResubmission(user._id)}
                      >
                        <RefreshCw size={15} /> Resubmit
                      </button>
                    )}

                    {vStatus !== 'rejected' && (
                      <button 
                        className="btn-quick-reject"
                        disabled={actionId === user._id}
                        onClick={() => handleDecision(user._id, 'rejected')}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* MODE 2: PROFILE UPDATE REQUESTS QUEUE */}
      {mainMode === 'profile_updates' && (
        loading ? (
          <div className="queue-loading">Loading profile change requests…</div>
        ) : filteredProfileRequests.length === 0 ? (
          <div className="queue-empty">
            <User size={48} color="#38BDF8" />
            <h3>No Profile Change Requests</h3>
            <p>There are no profile update requests under "{activeTab.replace('_', ' ')}".</p>
          </div>
        ) : (
          <div className="profile-requests-grid">
            {filteredProfileRequests.map(req => {
              const u = req.userId || {};
              const prev = req.previousData || {};
              const curr = req.requestedChanges || {};
              const status = req.status || 'pending';

              return (
                <div key={req._id} className="approval-card profile-req-card">
                  <div className="card-top-bar">
                    <div className="user-info-meta">
                      <div className="card-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                        {u.profileImage ? (
                          <img src={getImageUrl(u.profileImage)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={u.gender === 'Female' ? femaleAvatar : maleAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div>
                        <h3 className="card-user-name">{u.firstName} {u.lastName}</h3>
                        <span className="card-user-email">{u.email} • {u.roles?.join(', ')}</span>
                      </div>
                    </div>
                    <span className={`v-status-badge v-status-${status}`}>
                      {status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Comparison Section */}
                  <div className="comparison-box">
                    <h4 className="comp-title">Side-by-Side Value Comparison</h4>

                    {/* Emergency Contact Name comparison */}
                    {(curr.emergencyContactName || prev.emergencyContactName) && (
                      <div className="comp-row">
                        <div className="comp-col">
                          <span className="comp-label">Current Emergency Contact Name</span>
                          <span className="comp-val">{prev.emergencyContactName || 'Not Set'}</span>
                        </div>
                        <ArrowRight size={16} color="#38BDF8" className="comp-arrow" />
                        <div className="comp-col highlight">
                          <span className="comp-label">Requested Emergency Contact Name</span>
                          <span className="comp-val">{curr.emergencyContactName || 'No Change'}</span>
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact / Alt Phone comparison */}
                    {(curr.alternativePhoneNumber || prev.alternativePhoneNumber) && (
                      <div className="comp-row">
                        <div className="comp-col">
                          <span className="comp-label">Current Emergency Contact Phone</span>
                          <span className="comp-val">{prev.alternativePhoneNumber || 'Not Set'}</span>
                        </div>
                        <ArrowRight size={16} color="#38BDF8" className="comp-arrow" />
                        <div className="comp-col highlight">
                          <span className="comp-label">Requested Emergency Contact Phone</span>
                          <span className="comp-val">{curr.alternativePhoneNumber || 'No Change'}</span>
                        </div>
                      </div>
                    )}

                    {/* Phone Number comparison */}
                    {(curr.phoneNumber || prev.phoneNumber) && (
                      <div className="comp-row">
                        <div className="comp-col">
                          <span className="comp-label">Current Phone</span>
                          <span className="comp-val">{prev.phoneNumber || 'N/A'}</span>
                        </div>
                        <ArrowRight size={16} color="#38BDF8" className="comp-arrow" />
                        <div className="comp-col highlight">
                          <span className="comp-label">Requested Phone</span>
                          <span className="comp-val">{curr.phoneNumber || 'No Change'}</span>
                        </div>
                      </div>
                    )}

                    {/* Profile Picture comparison */}
                    {curr.profileImage && (
                      <div className="comp-row">
                        <div className="comp-col">
                          <span className="comp-label">Current Profile Photo</span>
                          {prev.profileImage ? (
                            <img src={getImageUrl(prev.profileImage)} alt="Old Profile" className="comp-img" />
                          ) : (
                            <div className="comp-no-img">No Image</div>
                          )}
                        </div>
                        <div className="comp-field-box">
                          <span className="comp-label">Proposed</span>
                          <img src={getImageUrl(curr.profileImage)} alt="New Profile" className="comp-img" />
                        </div>
                      </div>
                    )}

                    {/* Bio comparison */}
                    {curr.bio && (
                      <div className="comp-row">
                        <div className="comp-col">
                          <span className="comp-label">Current Bio</span>
                          <span className="comp-val">{prev.bio || 'N/A'}</span>
                        </div>
                        <ArrowRight size={16} color="#38BDF8" className="comp-arrow" />
                        <div className="comp-col highlight">
                          <span className="comp-label">Requested Bio</span>
                          <span className="comp-val">{curr.bio}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {req.reviewNotes && (
                    <div className="resub-notes-box">
                      <strong>Admin Notes:</strong> {req.reviewNotes}
                    </div>
                  )}

                  <div className="card-actions-bar">
                    {status !== 'approved' && (
                      <button 
                        className="btn-quick-approve" 
                        disabled={actionId === req._id}
                        onClick={() => handleReviewProfileRequest(req._id, 'approved')}
                      >
                        <CheckCircle size={15} /> Approve & Update User Profile
                      </button>
                    )}

                    {status !== 'resubmission_requested' && (
                      <button 
                        className="btn-quick-resubmit"
                        disabled={actionId === req._id}
                        onClick={() => handleReviewProfileRequest(req._id, 'resubmission_requested')}
                      >
                        <RefreshCw size={15} /> Request Resubmission
                      </button>
                    )}

                    {status !== 'rejected' && (
                      <button 
                        className="btn-quick-reject"
                        disabled={actionId === req._id}
                        onClick={() => handleReviewProfileRequest(req._id, 'rejected')}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {selectedUserId && (
        <UserProfileModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={fetchProviders}
        />
      )}
    </div>
  );
}
