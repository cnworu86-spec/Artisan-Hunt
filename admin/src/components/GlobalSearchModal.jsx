import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, X, User, Briefcase, AlertOctagon, ShieldCheck } from 'lucide-react';
import './GlobalSearchModal.css';

export default function GlobalSearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], bookings: [], reports: [], admins: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], bookings: [], reports: [], admins: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay animate-fade-in" onClick={onClose}>
      <div className="global-search-card" onClick={e => e.stopPropagation()}>
        <div className="search-input-header">
          <Search size={20} color="#38BDF8" />
          <input
            autoFocus
            type="text"
            placeholder="Search across Users, Bookings, Reports, Admins by ID, Name, Email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="search-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="search-results-body">
          {loading && <div className="search-loading">Searching platform databases...</div>}

          {!loading && !query && (
            <div className="search-hint">
              Type a name, email, phone number, booking reference, or safety report ID to search.
            </div>
          )}

          {!loading && query && (
            results.users.length === 0 &&
            results.bookings.length === 0 &&
            results.reports.length === 0 &&
            results.admins.length === 0 ? (
              <div className="search-empty">No results matching "{query}"</div>
            ) : (
              <div className="results-group-list">
                {results.users.length > 0 && (
                  <div className="result-section">
                    <h4><User size={15} color="#38BDF8" /> Users & Artisans ({results.users.length})</h4>
                    {results.users.map(u => (
                      <div key={u._id} className="result-item" onClick={() => { onSelectResult('users', u); onClose(); }}>
                        <div className="r-avatar">{u.firstName?.[0]}</div>
                        <div className="r-info">
                          <span className="r-title">{u.firstName} {u.lastName}</span>
                          <span className="r-sub">{u.email} • {u.roles?.join(', ')} • {u.location?.region || 'Ghana'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.bookings.length > 0 && (
                  <div className="result-section">
                    <h4><Briefcase size={15} color="#C5A059" /> Bookings & Jobs ({results.bookings.length})</h4>
                    {results.bookings.map(b => (
                      <div key={b._id} className="result-item" onClick={() => { onSelectResult('bookings', b); onClose(); }}>
                        <div className="r-info">
                          <span className="r-title">#{b.bookingId || b._id.substring(0, 8)} - {b.serviceCategory}</span>
                          <span className="r-sub">Client: {b.clientId?.firstName || 'Client'} | Status: {b.bookingStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.reports.length > 0 && (
                  <div className="result-section">
                    <h4><AlertOctagon size={15} color="#EF4444" /> Safety Reports ({results.reports.length})</h4>
                    {results.reports.map(r => (
                      <div key={r._id} className="result-item" onClick={() => { onSelectResult('reports', r); onClose(); }}>
                        <div className="r-info">
                          <span className="r-title">#{r.reportId || r._id.substring(0, 8)} - {r.reason}</span>
                          <span className="r-sub">Status: {r.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
