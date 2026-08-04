import React, { useState, useEffect } from 'react';
import api from '../api';
import { Briefcase, Calendar, Clock, MapPin, Search, Eye, CreditCard, ShieldAlert, AlertCircle } from 'lucide-react';
import './BookingsCenter.css';

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

export default function BookingsCenter() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Could not fetch bookings list from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = bookings
    .filter(b => statusFilter === 'all' || (b.bookingStatus || '').toLowerCase() === statusFilter)
    .filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      const clientName = `${b.clientId?.firstName} ${b.clientId?.lastName}`.toLowerCase();
      const providerName = `${b.providerId?.firstName} ${b.providerId?.lastName}`.toLowerCase();
      const category = (b.serviceCategory || '').toLowerCase();
      const bookingId = (b.bookingId || b._id || '').toLowerCase();
      return clientName.includes(q) || providerName.includes(q) || category.includes(q) || bookingId.includes(q);
    });

  const statusCounts = { all: bookings.length };
  bookings.forEach(b => {
    const st = (b.bookingStatus || 'pending').toLowerCase();
    statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  });

  const isCompleted = selectedBooking?.bookingStatus === 'completed';

  return (
    <div className="bookings-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Bookings & Jobs Management</h1>
          <p>Monitor real-time job requests, schedules, payment details, and artisan assignments.</p>
        </div>
      </div>

      <div className="bookings-toolbar">
        <div className="filter-pills">
          {STATUS_FILTERS.map(st => (
            <button
              key={st}
              className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st.replace('_', ' ').toUpperCase()} ({statusCounts[st] ?? 0})
            </button>
          ))}
        </div>

        <div className="search-box">
          <Search size={16} color="#94A3B8" />
          <input 
            placeholder="Search by Booking ID, Client, Artisan, or Category…" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="table-card-glass">
        {loading ? (
          <div className="table-loading">Fetching live platform bookings…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">No matching bookings found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Client</th>
                  <th>Artisan / Provider</th>
                  <th>Service Category</th>
                  <th>Status</th>
                  <th>Scheduled Date</th>
                  <th>Region</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const clientName = b.clientId ? `${b.clientId.firstName} ${b.clientId.lastName}` : 'Client User';
                  const providerName = b.providerId ? `${b.providerId.firstName} ${b.providerId.lastName}` : 'Unassigned';
                  const region = b.locationSnapshot?.region || b.clientId?.location?.region || 'Kumasi';
                  const status = (b.bookingStatus || 'pending').toLowerCase();

                  return (
                    <tr key={b._id}>
                      <td style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.82rem' }}>
                        #{b.bookingId || b._id.substring(0, 8)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{clientName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.clientId?.phoneNumber || 'No phone'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#C5A059' }}>{providerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.providerId?.providerDetails?.jobTitle || 'Provider'}</div>
                      </td>
                      <td style={{ color: '#E2E8F0', fontWeight: 500 }}>
                        {b.serviceCategory || 'General Service'}
                      </td>
                      <td>
                        <span className={`b-status-pill b-status-${status}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
                        {b.scheduledDate || 'Immediate'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                        {region}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <button className="btn-view-job" onClick={() => setSelectedBooking(b)}>
                          <Eye size={15} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedBooking(null)}>
          <div className="job-modal" onClick={e => e.stopPropagation()}>
            <div className="job-modal-header">
              <div>
                <h2>Booking Reference #{selectedBooking.bookingId || selectedBooking._id.substring(0, 8)}</h2>
                {isCompleted && (
                  <span className="readonly-tag">🔒 Completed Booking - Read Only</span>
                )}
              </div>
              <button className="close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>

            <div className="job-modal-body">
              <div className="job-details-grid">
                <div><strong>Client Name:</strong> {selectedBooking.clientId?.firstName} {selectedBooking.clientId?.lastName}</div>
                <div><strong>Client Phone:</strong> {selectedBooking.clientId?.phoneNumber || 'N/A'}</div>
                <div><strong>Artisan Name:</strong> {selectedBooking.providerId?.firstName} {selectedBooking.providerId?.lastName}</div>
                <div><strong>Artisan Phone:</strong> {selectedBooking.providerId?.phoneNumber || 'N/A'}</div>
                <div><strong>Service Category:</strong> {selectedBooking.serviceCategory}</div>
                <div><strong>Booking Status:</strong> <span className={`b-status-pill b-status-${selectedBooking.bookingStatus}`}>{selectedBooking.bookingStatus}</span></div>
                <div><strong>Scheduled Date:</strong> {selectedBooking.scheduledDate} {selectedBooking.scheduledTime}</div>
                <div><strong>Region Location:</strong> {selectedBooking.locationSnapshot?.region || 'Kumasi'}</div>
              </div>

              <div className="job-desc-box">
                <h4>Job Specifications & Description:</h4>
                <p>{selectedBooking.serviceDescription || 'Standard service requested by client.'}</p>
              </div>

              <div className="job-desc-box">
                <h4><CreditCard size={15} color="#38BDF8" /> Payment Information (Manual Record):</h4>
                <div style={{ fontSize: '0.85rem', color: '#CBD5E1', display: 'flex', gap: '1.5rem', marginTop: '0.2rem' }}>
                  <span>Service Amount: <strong>GH₵ {selectedBooking.paymentDetails?.serviceAmount || 0}</strong></span>
                  <span>Parts/Materials: <strong>GH₵ {selectedBooking.paymentDetails?.partsAmount || 0}</strong></span>
                  <span>Method: <strong>{selectedBooking.paymentDetails?.paymentMethod || 'Mobile Money'}</strong></span>
                </div>
              </div>

              {isCompleted && (
                <div className="completed-lock-banner">
                  <AlertCircle size={16} color="#34D399" />
                  <span>Administrative Policy: Completed bookings are finalized and read-only to preserve record integrity.</span>
                </div>
              )}
            </div>

            <div className="job-modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>Close Inspection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
