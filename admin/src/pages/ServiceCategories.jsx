import React, { useState, useEffect } from 'react';
import api from '../api';
import { Tag, Plus, Edit3, Trash2, CheckCircle2, Ban, X, Wrench, Hammer, Scissors, Zap, Paintbrush, Utensils, Layers, Trees as TreeGreen } from 'lucide-react';
import './ServiceCategories.css';

export default function ServiceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'Wrench', status: 'active' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching service categories:', err);
      setError('Could not fetch dynamic service categories from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: '', description: '', icon: 'Wrench', status: 'active' });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, description: cat.description || '', icon: cat.icon || 'Wrench', status: cat.status || 'active' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCat) {
        await api.patch(`/admin/categories/${editingCat._id}`, formData);
      } else {
        await api.post('/admin/categories', formData);
      }
      setIsAddModalOpen(false);
      setEditingCat(null);
      fetchCategories();
    } catch (err) {
      alert('Failed to save service category.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (cat) => {
    const newStatus = cat.status === 'active' ? 'disabled' : 'active';
    try {
      await api.patch(`/admin/categories/${cat._id}`, { status: newStatus });
      fetchCategories();
    } catch (err) {
      alert('Failed to toggle category status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  return (
    <div className="categories-page animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Dynamic Service Categories</h1>
            <p>Add, update, enable, or disable trade service categories in real-time without app re-deployment.</p>
          </div>
          <button className="btn-add-cat" onClick={handleOpenAdd}>
            <Plus size={16} /> Add New Category
          </button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="table-card-glass">
        {loading ? (
          <div className="table-loading">Loading dynamic category catalog…</div>
        ) : categories.length === 0 ? (
          <div className="table-empty">No service categories registered. Click "Add New Category" to create one.</div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-data-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const isActive = cat.status === 'active';
                  return (
                    <tr key={cat._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="cat-icon-badge">
                            <Tag size={16} color="#38BDF8" />
                          </span>
                          <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{cat.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#CBD5E1', maxWidth: '380px' }}>
                        {cat.description || 'General trade service'}
                      </td>
                      <td>
                        <span className={`cat-status-pill ${isActive ? 'active' : 'disabled'}`}>
                          {isActive ? '● Active' : '○ Disabled'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button className="btn-action-icon" title="Edit Category" onClick={() => handleOpenEdit(cat)}>
                            <Edit3 size={15} />
                          </button>
                          <button 
                            className={`btn-action-icon ${isActive ? 'warn-yellow' : 'active-green'}`} 
                            title={isActive ? 'Disable Category' : 'Enable Category'} 
                            onClick={() => toggleStatus(cat)}
                          >
                            {isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                          </button>
                          <button className="btn-action-icon danger-red" title="Delete Category" onClick={() => handleDelete(cat._id)}>
                            <Trash2 size={15} />
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

      {/* Add / Edit Category Modal */}
      {(isAddModalOpen || editingCat) && (
        <div className="modal-overlay animate-fade-in" onClick={() => { setIsAddModalOpen(false); setEditingCat(null); }}>
          <div className="cat-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cat-modal-header">
              <h3>{editingCat ? 'Edit Service Category' : 'Add New Service Category'}</h3>
              <button className="close-btn" onClick={() => { setIsAddModalOpen(false); setEditingCat(null); }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="cat-form">
              <div className="form-group">
                <label>Category Title</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Plumbing, Electrical, Carpentry"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of services provided under this category..."
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active (Available for booking & signup)</option>
                  <option value="disabled">Disabled (Hidden from public listings)</option>
                </select>
              </div>

              <div className="edit-actions-row">
                <button type="button" className="btn-secondary" onClick={() => { setIsAddModalOpen(false); setEditingCat(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : (editingCat ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
