import React, { useState, useEffect } from 'react';
import api from '../api';
import { Star, Trash2, MessageSquare, Filter } from 'lucide-react';
import './ReviewsModeration.css';

export default function ReviewsModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starFilter, setStarFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Could not fetch platform reviews from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete/moderate this review?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique category names from populated review data
  const categoriesList = Array.from(
    new Set(
      reviews
        .map(r => r.reviewedUserId?.providerDetails?.jobTitle)
        .filter(Boolean)
    )
  );

  const filtered = reviews.filter(r => {
    if (starFilter !== 'all' && String(r.rating) !== String(starFilter)) return false;
    if (categoryFilter !== 'all' && r.reviewedUserId?.providerDetails?.jobTitle !== categoryFilter) return false;
    return true;
  });

  const totalRatingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const avgRating = reviews.length ? (totalRatingSum / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="reviews-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Ratings & Reviews Moderation</h1>
          <p>Monitor platform customer feedback, artisan ratings, and moderate abusive or spam comments.</p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="metrics-row">
        <div className="metric-glass-card">
          <span className="m-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }}>
            <Star size={24} />
          </span>
          <div>
            <div className="m-val">{avgRating} / 5.0</div>
            <div className="m-lbl">Average Platform Rating</div>
          </div>
        </div>

        <div className="metric-glass-card">
          <span className="m-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
            <MessageSquare size={24} />
          </span>
          <div>
            <div className="m-val">{reviews.length}</div>
            <div className="m-lbl">Total Customer Reviews</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="reviews-toolbar">
        <div className="filter-pills">
          <button 
            className={`filter-pill ${starFilter === 'all' ? 'active' : ''}`} 
            onClick={() => setStarFilter('all')}
          >
            All Ratings ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map(star => (
            <button
              key={star}
              className={`filter-pill ${starFilter === String(star) ? 'active' : ''}`}
              onClick={() => setStarFilter(String(star))}
            >
              {star} ⭐ ({reviews.filter(r => r.rating === star).length})
            </button>
          ))}
        </div>

        {categoriesList.length > 0 && (
          <div className="category-select-wrapper">
            <Filter size={15} color="#94A3B8" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Service Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* Reviews Table */}
      <div className="table-card-glass">
        {loading ? (
          <div className="table-loading">Loading platform reviews…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">No customer reviews match the selected filter.</div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-data-table">
              <thead>
                <tr>
                  <th>Rating</th>
                  <th>Client / Reviewer</th>
                  <th>Artisan / Provider</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div className="stars-row">
                        <span style={{ color: '#FBBF24', fontSize: '0.95rem' }}>{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</span>
                        <span className="num-rating">{r.rating}.0</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                        {r.reviewerId ? `${r.reviewerId.firstName} ${r.reviewerId.lastName}` : 'Anonymous'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{r.reviewerId?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#C5A059' }}>
                        {r.reviewedUserId ? `${r.reviewedUserId.firstName} ${r.reviewedUserId.lastName}` : 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{r.reviewedUserId?.providerDetails?.jobTitle || 'Provider'}</div>
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <p className="comment-text">"{r.reviewText || 'No written feedback provided.'}"</p>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <button 
                        className="btn-delete-review" 
                        disabled={deletingId === r._id}
                        onClick={() => handleDelete(r._id)}
                      >
                        <Trash2 size={14} /> {deletingId === r._id ? 'Deleting…' : 'Delete'}
                      </button>
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
