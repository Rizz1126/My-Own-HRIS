import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, X } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [allClients, setAllClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [form, setForm] = useState({
    code: '', clientName: '', active: true,
  });

  const [editForm, setEditForm] = useState({
    code: '', clientName: '', active: true, id: null
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/master-data/clients');
      const formatted = data.map(c => ({
        id: c.id,
        code: c.code,
        clientName: c.name,
        active: c.active !== false
      }));
      setAllClients(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = allClients.filter((c) => {
    const matchSearch = (c.clientName?.toLowerCase() || '').includes(search.toLowerCase()) || (c.code?.toLowerCase() || '').includes(search.toLowerCase());
    const matchActive = activeFilter === 'All' || (activeFilter === 'Yes' ? c.active : !c.active);
    return matchSearch && matchActive;
  });

  const handleEdit = (client) => {
    setSelectedClient(client);
    setEditForm({
      id: client.id,
      code: client.code,
      clientName: client.clientName,
      active: client.active,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/master-data/clients/${selectedClient.id}`, {
        clientName: editForm.clientName,
        code: editForm.code, // Wait, usually code is unchangeable but we'll send it if needed
      });
      setShowEditModal(false);
      fetchClients();
      toast.success('Client Updated', `${editForm.clientName} has been updated successfully.`);
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{filtered.length} clients found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Client</button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input className="filter-search-input" placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
          <option value="All">All Clients</option>
          <option value="Yes">Active Only</option>
          <option value="No">Inactive Only</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Client Name</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading clients...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No clients found.
                </td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.code} style={{ opacity: c.active ? 1 : 0.6 }}>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>{c.code}</td>
                <td>
                  <div className="table-name">{c.clientName}</div>
                </td>
                <td>
                  <span className={`badge ${c.active ? 'success' : 'danger'}`}>
                    <span className="badge-dot" />{c.active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-icon btn-secondary btn-sm" title="View"
                      onClick={() => { setSelectedClient(c); setShowViewModal(true); }}><Eye size={15} /></button>
                    <button className="btn btn-icon btn-secondary btn-sm" title="Edit"
                      onClick={() => handleEdit(c)}><Edit size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Client Modal */}
      {showViewModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Client Detail</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><span className="form-label">Code</span><span style={{ fontFamily: 'monospace' }}>{selectedClient.code}</span></div>
                <div className="form-group"><span className="form-label">Active</span><span className={`badge ${selectedClient.active ? 'success' : 'danger'}`}>{selectedClient.active ? 'Yes' : 'No'}</span></div>
                <div className="form-group full-width"><span className="form-label">Client Name</span><span>{selectedClient.clientName}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit size={20} style={{ color: 'var(--color-primary)' }} />
                  Edit Client — {selectedClient.code}
                </div>
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Client Code</label>
                  <div className="form-input" style={{ background: 'var(--bg-tertiary)', cursor: 'default', opacity: 0.7 }}>
                    {editForm.code}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Code cannot be changed</div>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Client Name *</label>
                  <input className="form-input" placeholder="Company name" value={editForm.clientName} onChange={e => setEditForm({...editForm, clientName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Active</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${editForm.active ? 'active' : ''}`} onClick={() => setEditForm({...editForm, active: !editForm.active})} />
                    <span className="toggle-label">{editForm.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Client</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Client Code *</label>
                  <input className="form-input" placeholder="e.g. CL-011" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Active</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${form.active ? 'active' : ''}`} onClick={() => setForm({...form, active: !form.active})} />
                    <span className="toggle-label">{form.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Client Name *</label>
                  <input className="form-input" placeholder="Company name" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                if (form.code && form.clientName) {
                  try {
                    await api.post('/master-data/clients', {
                      code: form.code,
                      clientName: form.clientName
                    });
                    setShowAddModal(false);
                    setForm({ code: '', clientName: '', active: true });
                    fetchClients();
                    toast.success('Client Added', `${form.clientName} has been added successfully.`);
                  } catch (err) {
                    toast.error('Add Failed', err.message);
                  }
                } else {
                  toast.warning('Validation Error', 'Client Code and Name are required.');
                }
              }}>Save Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
