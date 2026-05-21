import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, X } from 'lucide-react';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const getBusinessStatusStyle = (status) => {
  const map = {
    'On Track': { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: 'rgba(16, 185, 129, 0.25)' },
    'At Risk': { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' },
    'Delayed': { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.25)' },
    'Completed': { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366F1', border: 'rgba(99, 102, 241, 0.25)' },
  };
  return map[status] || map['On Track'];
};

const getProjectStatusStyle = (status) => {
  const map = {
    'Active': 'success',
    'On Hold': 'warning',
    'Completed': 'info',
    'Cancelled': 'danger',
  };
  return map[status] || 'neutral';
};

export default function Projects() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [allProjects, setAllProjects] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewTab, setViewTab] = useState('detail');
  const [addTab, setAddTab] = useState('detail');
  const [editTab, setEditTab] = useState('detail');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [projectsRes, clientsRes] = await Promise.all([
        api.get('/master-data/projects'),
        api.get('/master-data/clients')
      ]);

      const formattedProjects = projectsRes.map(p => ({
        ...p,
        projectCode: p.projectCode || p.id || '',
        projectName: p.projectName || p.name || '',
        client: p.client?.name || 'Unknown',
        clientId: p.client?.id || null,
        contractValue: p.contractValue || 0,
        budget: p.budget || 0,
        contractPeriod: p.contractPeriod || '',
        remark: p.remark || '',
        projectStatus: p.projectStatus || p.status || 'Active',
        active: (p.projectStatus || p.status) !== 'Cancelled' && (p.projectStatus || p.status) !== 'Completed',
        subProjects: p.subProjects || [],
        revenueSchedule: p.revenueSchedule || [],
        progressRevenue: p.progressRevenue || 0,
        remainingRevenue: p.remainingRevenue || 0,
        businessStatus: p.businessStatus || 'On Track',
        picAM: p.picAM || '',
        picPM: p.picPM || '',
      }));

      setAllProjects(formattedProjects);
      setClientsData(clientsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const emptyForm = {
    projectCode: '', projectName: '', client: '', contractValue: 0,
    contractPeriod: '', budget: 0, remark: '', active: true,
    subProjects: [{ id: 'SP-NEW-1', name: '', budget: 0, progress: 0, period: '', contractValue: 0 }],
    revenueSchedule: [{ month: '', amount: 0, status: 'Planned' }],
    progressRevenue: 0, remainingRevenue: 0,
    businessStatus: 'On Track', projectStatus: 'Active',
    picAM: '', picPM: '',
  };

  const [form, setForm] = useState({ ...emptyForm });

  const [editForm, setEditForm] = useState({ ...emptyForm });

  // Helper: calculate progress % from revenue
  const calcProgress = (progressRevenue, contractValue) => {
    if (!contractValue || contractValue <= 0) return 0;
    return Math.min(100, Math.round((progressRevenue / contractValue) * 100));
  };

  const filtered = allProjects.filter((p) => {
    const searchTerm = search.toLowerCase();
    const projectName = (p.projectName || '').toLowerCase();
    const projectCode = (p.projectCode || '').toLowerCase();
    const clientName = (p.client || '').toLowerCase();

    const matchSearch = projectName.includes(searchTerm) ||
      projectCode.includes(searchTerm) ||
      clientName.includes(searchTerm);
    const matchActive = activeFilter === 'All' || (activeFilter === 'Yes' ? p.active : !p.active);
    return matchSearch && matchActive;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleView = (project) => {
    setSelectedProject(project);
    setViewTab('detail');
    setShowViewModal(true);
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setEditForm({
      projectCode: project.projectCode || project.id || '',
      projectName: project.projectName || project.name || '',
      client: project.client || project.client?.name || '',
      contractValue: project.contractValue || 0,
      contractPeriod: project.contractPeriod || '',
      budget: project.budget || 0,
      remark: project.remark || '',
      active: project.active,
      subProjects: project.subProjects.map(sp => ({ ...sp })),
      revenueSchedule: project.revenueSchedule.map(r => ({ ...r })),
      progressRevenue: project.progressRevenue || 0,
      remainingRevenue: project.remainingRevenue || 0,
      businessStatus: project.businessStatus || 'On Track',
      projectStatus: project.projectStatus || project.status || 'Active',
      picAM: project.picAM || '',
      picPM: project.picPM || '',
    });
    setEditTab('detail');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      // clientsData from API uses 'name' field (not 'clientName')
      const matchedClient = clientsData.find(
        c => c.name === editForm.client || c.clientName === editForm.client
      );
      const clientId = matchedClient ? matchedClient.id : (selectedProject.clientId || null);
      await api.patch(`/master-data/projects/${selectedProject.id}`, {
        name: editForm.projectName,
        clientId,
        status: editForm.projectStatus,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
      });
      // Update local state immediately so table reflects changes
      setAllProjects(prev => prev.map(p =>
        p.id === selectedProject.id
          ? {
              ...p,
              projectName: editForm.projectName,
              name: editForm.projectName,
              client: editForm.client,
              clientId,
              contractValue: editForm.contractValue,
              contractPeriod: editForm.contractPeriod,
              budget: editForm.budget,
              remark: editForm.remark,
              picAM: editForm.picAM,
              picPM: editForm.picPM,
              businessStatus: editForm.businessStatus,
              projectStatus: editForm.projectStatus,
              status: editForm.projectStatus,
              progressRevenue: editForm.progressRevenue,
              remainingRevenue: editForm.remainingRevenue,
              subProjects: editForm.subProjects,
              revenueSchedule: editForm.revenueSchedule,
              active: editForm.active,
            }
          : p
      ));
      setShowEditModal(false);
      toast.success('Project Updated', `${editForm.projectName} has been updated successfully.`);
    } catch (err) {
      toast.error('Update Failed', err.message || 'Failed to update project.');
      console.error('Project update error:', err);
    }
  };

  // Add form helpers
  const addSubProject = () => {
    setForm(prev => ({
      ...prev,
      subProjects: [...prev.subProjects, { id: `SP-NEW-${prev.subProjects.length + 1}`, name: '', budget: 0, progress: 0, period: '', contractValue: 0 }]
    }));
  };

  const updateSubProject = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      subProjects: prev.subProjects.map((sp, i) => i === idx ? { ...sp, [field]: (field === 'name' || field === 'period') ? value : Number(value) } : sp)
    }));
  };

  const removeSubProject = (idx) => {
    setForm(prev => ({ ...prev, subProjects: prev.subProjects.filter((_, i) => i !== idx) }));
  };

  const addRevenueEntry = () => {
    setForm(prev => ({
      ...prev,
      revenueSchedule: [...prev.revenueSchedule, { month: '', amount: 0, status: 'Planned' }]
    }));
  };

  const updateRevenue = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      revenueSchedule: prev.revenueSchedule.map((r, i) => i === idx ? { ...r, [field]: field === 'amount' ? Number(value) : value } : r)
    }));
  };

  const removeRevenue = (idx) => {
    setForm(prev => ({ ...prev, revenueSchedule: prev.revenueSchedule.filter((_, i) => i !== idx) }));
  };

  // Edit form helpers
  const editAddSubProject = () => {
    setEditForm(prev => ({
      ...prev,
      subProjects: [...prev.subProjects, { id: `SP-NEW-${prev.subProjects.length + 1}`, name: '', budget: 0, progress: 0, period: '', contractValue: 0 }]
    }));
  };

  const editUpdateSubProject = (idx, field, value) => {
    setEditForm(prev => ({
      ...prev,
      subProjects: prev.subProjects.map((sp, i) => i === idx ? { ...sp, [field]: (field === 'name' || field === 'period') ? value : Number(value) } : sp)
    }));
  };

  const editRemoveSubProject = (idx) => {
    setEditForm(prev => ({ ...prev, subProjects: prev.subProjects.filter((_, i) => i !== idx) }));
  };

  const editAddRevenueEntry = () => {
    setEditForm(prev => ({
      ...prev,
      revenueSchedule: [...prev.revenueSchedule, { month: '', amount: 0, status: 'Planned' }]
    }));
  };

  const editUpdateRevenue = (idx, field, value) => {
    setEditForm(prev => ({
      ...prev,
      revenueSchedule: prev.revenueSchedule.map((r, i) => i === idx ? { ...r, [field]: field === 'amount' ? Number(value) : value } : r)
    }));
  };

  const editRemoveRevenue = (idx) => {
    setEditForm(prev => ({ ...prev, revenueSchedule: prev.revenueSchedule.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{filtered.length} projects found</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setAddTab('detail'); setShowAddModal(true); }}>
          <Plus size={18} /> Add Project
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input className="filter-search-input" placeholder="Search by code, name, or client..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
          <option value="All">All Projects</option>
          <option value="Yes">Active Only</option>
          <option value="No">Inactive Only</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Code</th>
              <th>Project Name</th>
              <th>Client</th>
              <th>Contract Value</th>
              <th>Period</th>
              <th>Budget</th>
              <th>Progress</th>
              <th>Active</th>
              <th>Remark</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading projects...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No projects found.
                </td>
              </tr>
            ) : paginated.map((p) => {
              const revenueProgress = calcProgress(p.progressRevenue || 0, p.contractValue);
              return (
              <tr key={p.projectCode} style={{ opacity: p.active ? 1 : 0.6 }}>
                <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 600 }}>{p.projectCode}</td>
                <td><div className="table-name">{p.projectName}</div></td>
                <td style={{ fontSize: '0.85rem' }}>{p.client}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{formatCurrency(p.contractValue)}</td>
                <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{p.contractPeriod}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{formatCurrency(p.budget)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar-wrapper" style={{ width: '70px' }}>
                      <div className={`progress-bar-fill ${revenueProgress >= 75 ? 'success' : revenueProgress >= 40 ? '' : 'warning'}`}
                        style={{ width: `${revenueProgress}%` }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: '32px' }}>{revenueProgress}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${p.active ? 'success' : 'danger'}`}>
                    <span className="badge-dot" />{p.active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {p.remark || '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-icon btn-secondary btn-sm" title="View" onClick={() => handleView(p)}><Eye size={15} /></button>
                    <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => handleEdit(p)}><Edit size={15} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const num = start + i;
              if (num > totalPages) return null;
              return <button key={num} className={`pagination-btn ${page === num ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>;
            })}
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      </div>

      {/* View Project Modal (tabbed) */}
      {showViewModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content extra-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', marginRight: '10px' }}>{selectedProject.projectCode}</span>
                {selectedProject.projectName}
              </h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="tab-bar">
                {['detail', 'subProjects', 'revenue', 'progress'].map(tab => (
                  <button key={tab} className={`tab-btn ${viewTab === tab ? 'active' : ''}`}
                    onClick={() => setViewTab(tab)}>
                    {tab === 'detail' ? 'Detail Project' : tab === 'subProjects' ? 'Sub Projects' : tab === 'revenue' ? 'Revenue Schedule' : 'Progress'}
                  </button>
                ))}
              </div>

              {/* Detail Tab */}
              <div className={`tab-panel ${viewTab === 'detail' ? 'active' : ''}`}>
                <div className="form-grid">
                  <div className="form-group"><span className="form-label">Project Code</span><span style={{ fontFamily: 'monospace' }}>{selectedProject.projectCode}</span></div>
                  <div className="form-group"><span className="form-label">Project Name</span><span>{selectedProject.projectName}</span></div>
                  <div className="form-group"><span className="form-label">Client</span><span>{selectedProject.client}</span></div>
                  <div className="form-group"><span className="form-label">Contract Period</span><span>{selectedProject.contractPeriod}</span></div>
                  <div className="form-group"><span className="form-label">Contract Value</span><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(selectedProject.contractValue)}</span></div>
                  <div className="form-group"><span className="form-label">Budget</span><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(selectedProject.budget)}</span></div>
                  <div className="form-group"><span className="form-label">Active</span><span className={`badge ${selectedProject.active ? 'success' : 'danger'}`}>{selectedProject.active ? 'Yes' : 'No'}</span></div>
                  <div className="form-group"><span className="form-label">Progress (Revenue-based)</span><span style={{ fontWeight: 700 }}>{calcProgress(selectedProject.progressRevenue || 0, selectedProject.contractValue)}%</span></div>
                  <div className="form-group full-width"><span className="form-label">Remark</span><span>{selectedProject.remark || '—'}</span></div>
                </div>
              </div>

              {/* Sub Projects Tab */}
              <div className={`tab-panel ${viewTab === 'subProjects' ? 'active' : ''}`}>
                {selectedProject.subProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No sub-projects defined</div>
                ) : (
                  selectedProject.subProjects.map((sp) => (
                    <div key={sp.id} className="sub-project-item">
                      <div className="sub-project-header">
                        <div>
                          <div className="sub-project-name">{sp.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{sp.id}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', margin: '10px 0' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Period</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{sp.period || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Contract Value</div>
                          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(sp.contractValue || 0)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Budget</div>
                          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(sp.budget)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar-wrapper" style={{ flex: 1 }}>
                          <div className={`progress-bar-fill ${sp.progress >= 75 ? 'success' : sp.progress >= 40 ? '' : 'warning'}`}
                            style={{ width: `${sp.progress}%` }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>{sp.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Revenue Schedule Tab */}
              <div className={`tab-panel ${viewTab === 'revenue' ? 'active' : ''}`}>
                {selectedProject.revenueSchedule.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No revenue schedule defined</div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span>Month</span>
                      <span style={{ display: 'flex', gap: '40px' }}><span style={{ width: '120px', textAlign: 'right' }}>Amount</span><span style={{ width: '80px', textAlign: 'center' }}>Status</span></span>
                    </div>
                    {selectedProject.revenueSchedule.map((r, i) => (
                      <div key={i} className="revenue-item">
                        <span style={{ fontWeight: 500 }}>{r.month}</span>
                        <span style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, width: '120px', textAlign: 'right' }}>{formatCurrency(r.amount)}</span>
                          <span className={`revenue-status ${r.status.toLowerCase()}`} style={{ width: '80px', textAlign: 'center' }}>{r.status}</span>
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid var(--border-color)', marginTop: '8px', fontWeight: 700 }}>
                      <span>Total</span>
                      <span style={{ fontFamily: 'monospace' }}>{formatCurrency(selectedProject.revenueSchedule.reduce((s, r) => s + r.amount, 0))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Tab — Enriched */}
              <div className={`tab-panel ${viewTab === 'progress' ? 'active' : ''}`}>
                {(() => {
                  const viewProgress = calcProgress(selectedProject.progressRevenue || 0, selectedProject.contractValue);
                  return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px' }}>Progress (Revenue)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: viewProgress >= 75 ? 'var(--color-success)' : viewProgress >= 40 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                      {viewProgress}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {formatCurrency(selectedProject.progressRevenue || 0)} / {formatCurrency(selectedProject.contractValue)}
                    </div>
                    <div className="progress-bar-wrapper" style={{ height: '6px', marginTop: '8px' }}>
                      <div className={`progress-bar-fill ${viewProgress >= 75 ? 'success' : viewProgress >= 40 ? '' : 'warning'}`}
                        style={{ width: `${viewProgress}%` }} />
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px' }}>Progress Revenue</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-success)' }}>
                      {formatCurrency(selectedProject.progressRevenue || 0)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px' }}>Remaining Revenue</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-warning)' }}>
                      {formatCurrency(selectedProject.remainingRevenue || 0)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px' }}>Contract Value</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      {formatCurrency(selectedProject.contractValue)}
                    </div>
                  </div>
                </div>
                  );
                })()}

                {/* Status & PIC Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Business Status</div>
                    {(() => {
                      const s = getBusinessStatusStyle(selectedProject.businessStatus || 'On Track');
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
                          {selectedProject.businessStatus || 'On Track'}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Project Status</div>
                    <span className={`badge ${getProjectStatusStyle(selectedProject.projectStatus || 'Active')}`}>
                      <span className="badge-dot" />{selectedProject.projectStatus || 'Active'}
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>PIC Account Manager</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                        {(selectedProject.picAM || 'N/A').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{selectedProject.picAM || '—'}</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>PIC Project Manager</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                        {(selectedProject.picPM || 'N/A').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{selectedProject.picPM || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-project Breakdown */}
                {selectedProject.subProjects.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.92rem' }}>Sub-project Breakdown</div>
                    {selectedProject.subProjects.map(sp => (
                      <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <span style={{ flex: '0 0 200px', fontSize: '0.85rem', fontWeight: 500 }}>{sp.name}</span>
                        <div className="progress-bar-wrapper" style={{ flex: 1 }}>
                          <div className={`progress-bar-fill ${sp.progress >= 75 ? 'success' : sp.progress >= 40 ? '' : 'warning'}`}
                            style={{ width: `${sp.progress}%` }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>{sp.progress}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal (tabbed) */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content extra-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit size={20} style={{ color: 'var(--color-primary)' }} />
                  Edit Project — {selectedProject.projectCode}
                </div>
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="tab-bar">
                {['detail', 'subProjects', 'revenue', 'progress'].map(tab => (
                  <button key={tab} className={`tab-btn ${editTab === tab ? 'active' : ''}`}
                    onClick={() => setEditTab(tab)}>
                    {tab === 'detail' ? 'Detail Project' : tab === 'subProjects' ? 'Sub Projects' : tab === 'revenue' ? 'Revenue Schedule' : 'Progress'}
                  </button>
                ))}
              </div>

              {/* Detail Tab */}
              <div className={`tab-panel ${editTab === 'detail' ? 'active' : ''}`}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Project Code</label>
                    <div className="form-input" style={{ background: 'var(--bg-tertiary)', cursor: 'default', opacity: 0.7 }}>
                      {editForm.projectCode}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Code cannot be changed</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Name *</label>
                    <input className="form-input" placeholder="Project name" value={editForm.projectName} onChange={e => setEditForm({...editForm, projectName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <input className="form-input" placeholder="Select or type client" list="client-suggestions-edit" value={editForm.client} onChange={e => setEditForm({...editForm, client: e.target.value})} />
                    <datalist id="client-suggestions-edit">
                      {clientsData.map(c => (
                        <option key={c.code} value={c.clientName} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Period</label>
                    <input className="form-input" placeholder="e.g. 12 months" value={editForm.contractPeriod} onChange={e => setEditForm({...editForm, contractPeriod: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Value</label>
                    <input type="number" className="form-input" value={editForm.contractValue} onChange={e => setEditForm({...editForm, contractValue: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budget</label>
                    <input type="number" className="form-input" value={editForm.budget} onChange={e => setEditForm({...editForm, budget: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIC Account Manager</label>
                    <input className="form-input" placeholder="AM name" value={editForm.picAM} onChange={e => setEditForm({...editForm, picAM: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIC Project Manager</label>
                    <input className="form-input" placeholder="PM name" value={editForm.picPM} onChange={e => setEditForm({...editForm, picPM: e.target.value})} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Remark</label>
                    <input className="form-input" placeholder="Project description" value={editForm.remark} onChange={e => setEditForm({...editForm, remark: e.target.value})} />
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

              {/* Sub Projects Tab */}
              <div className={`tab-panel ${editTab === 'subProjects' ? 'active' : ''}`}>
                {editForm.subProjects.map((sp, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <input className="form-input" placeholder="Sub-project name" value={sp.name}
                        onChange={e => editUpdateSubProject(idx, 'name', e.target.value)} style={{ flex: 2 }} />
                      <button className="allowance-remove-btn" onClick={() => editRemoveSubProject(idx)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Period</label>
                        <input className="form-input" placeholder="e.g. Jan 2026 - Jun 2026" value={sp.period}
                          onChange={e => editUpdateSubProject(idx, 'period', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 0.7 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contract Value</label>
                        <input type="number" className="form-input" placeholder="Contract Value" value={sp.contractValue}
                          onChange={e => editUpdateSubProject(idx, 'contractValue', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 0.7 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget</label>
                        <input type="number" className="form-input" placeholder="Budget" value={sp.budget}
                          onChange={e => editUpdateSubProject(idx, 'budget', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 0.4 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progress %</label>
                        <input type="number" className="form-input" placeholder="%" min="0" max="100" value={sp.progress}
                          onChange={e => editUpdateSubProject(idx, 'progress', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button className="add-allowance-btn" onClick={editAddSubProject}>
                  <Plus size={14} /> Add Sub-project
                </button>
              </div>

              {/* Revenue Schedule Tab */}
              <div className={`tab-panel ${editTab === 'revenue' ? 'active' : ''}`}>
                {editForm.revenueSchedule.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input className="form-input" placeholder="Month (e.g. Jan 2026)" value={r.month}
                      onChange={e => editUpdateRevenue(idx, 'month', e.target.value)} style={{ flex: 1.5 }} />
                    <input type="number" className="form-input" placeholder="Amount" value={r.amount}
                      onChange={e => editUpdateRevenue(idx, 'amount', e.target.value)} style={{ flex: 1 }} />
                    <select className="form-select" value={r.status} onChange={e => editUpdateRevenue(idx, 'status', e.target.value)} style={{ flex: 0.8 }}>
                      <option value="Planned">Planned</option>
                      <option value="Invoiced">Invoiced</option>
                      <option value="Received">Received</option>
                    </select>
                    <button className="allowance-remove-btn" onClick={() => editRemoveRevenue(idx)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button className="add-allowance-btn" onClick={editAddRevenueEntry}>
                  <Plus size={14} /> Add Revenue Entry
                </button>
              </div>

              {/* Progress Tab */}
              <div className={`tab-panel ${editTab === 'progress' ? 'active' : ''}`}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Progress (Auto-calculated from Revenue)</label>
                    {(() => {
                      const autoProgress = calcProgress(editForm.progressRevenue, editForm.contractValue);
                      return (
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                          <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800,
                            color: autoProgress >= 75 ? 'var(--color-success)' : autoProgress >= 40 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                            {autoProgress}%
                          </div>
                          <div className="progress-bar-wrapper" style={{ height: '8px', marginTop: '12px' }}>
                            <div className={`progress-bar-fill ${autoProgress >= 75 ? 'success' : autoProgress >= 40 ? '' : 'warning'}`}
                              style={{ width: `${autoProgress}%` }} />
                          </div>
                          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                            {formatCurrency(editForm.progressRevenue)} / {formatCurrency(editForm.contractValue)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Progress Revenue (Rp)</label>
                    <input type="number" className="form-input" value={editForm.progressRevenue}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setEditForm({...editForm, progressRevenue: val, remainingRevenue: Math.max(0, editForm.contractValue - val)});
                      }} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Revenue yang sudah diterima/ditagihkan</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remaining Revenue</label>
                    <div className="form-input" style={{ background: 'var(--bg-tertiary)', cursor: 'default', opacity: 0.8 }}>
                      {formatCurrency(editForm.remainingRevenue || Math.max(0, editForm.contractValue - editForm.progressRevenue))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Otomatis = Contract Value − Progress Revenue</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Status</label>
                    <select className="form-select" value={editForm.businessStatus}
                      onChange={e => setEditForm({...editForm, businessStatus: e.target.value})}>
                      <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Status</label>
                    <select className="form-select" value={editForm.projectStatus}
                      onChange={e => setEditForm({...editForm, projectStatus: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
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

      {/* Add Project Modal (tabbed) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content extra-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Project</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="tab-bar">
                {['detail', 'subProjects', 'revenue', 'progress'].map(tab => (
                  <button key={tab} className={`tab-btn ${addTab === tab ? 'active' : ''}`}
                    onClick={() => setAddTab(tab)}>
                    {tab === 'detail' ? 'Detail Project' : tab === 'subProjects' ? 'Sub Projects' : tab === 'revenue' ? 'Revenue Schedule' : 'Progress'}
                  </button>
                ))}
              </div>

              {/* Detail Tab */}
              <div className={`tab-panel ${addTab === 'detail' ? 'active' : ''}`}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <input className="form-input" placeholder="Select or type client..." list="client-suggestions" value={form.client} onChange={e => {
                      const val = e.target.value;
                      const matched = clientsData.find(c => c.clientName === val);
                      if (matched) {
                        setForm({...form, client: val, projectCode: `PRJ-${matched.code}-${Math.floor(100 + Math.random() * 900)}`});
                      } else {
                        setForm({...form, client: val});
                      }
                    }} />
                    <datalist id="client-suggestions">
                      {clientsData.map(c => (
                        <option key={c.code} value={c.clientName} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Name *</label>
                    <input className="form-input" placeholder="Project name" value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Code *</label>
                    <input className="form-input" placeholder="Auto-filled from client" value={form.projectCode} onChange={e => setForm({...form, projectCode: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Period</label>
                    <input className="form-input" placeholder="e.g. 12 months" value={form.contractPeriod} onChange={e => setForm({...form, contractPeriod: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Value</label>
                    <input type="number" className="form-input" value={form.contractValue} onChange={e => setForm({...form, contractValue: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budget</label>
                    <input type="number" className="form-input" value={form.budget} onChange={e => setForm({...form, budget: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIC Account Manager</label>
                    <input className="form-input" placeholder="AM name" value={form.picAM} onChange={e => setForm({...form, picAM: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIC Project Manager</label>
                    <input className="form-input" placeholder="PM name" value={form.picPM} onChange={e => setForm({...form, picPM: e.target.value})} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Remark</label>
                    <input className="form-input" placeholder="Project description" value={form.remark} onChange={e => setForm({...form, remark: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Active</label>
                    <div className="toggle-wrapper">
                      <button className={`toggle ${form.active ? 'active' : ''}`} onClick={() => setForm({...form, active: !form.active})} />
                      <span className="toggle-label">{form.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub Projects Tab */}
              <div className={`tab-panel ${addTab === 'subProjects' ? 'active' : ''}`}>
                {form.subProjects.map((sp, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <input className="form-input" placeholder="Sub-project name" value={sp.name}
                        onChange={e => updateSubProject(idx, 'name', e.target.value)} style={{ flex: 2 }} />
                      <button className="allowance-remove-btn" onClick={() => removeSubProject(idx)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Period</label>
                        <input className="form-input" placeholder="e.g. Jan 2026 - Jun 2026" value={sp.period}
                          onChange={e => updateSubProject(idx, 'period', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 0.7 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contract Value</label>
                        <input type="number" className="form-input" placeholder="Contract Value" value={sp.contractValue}
                          onChange={e => updateSubProject(idx, 'contractValue', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 0.7 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget</label>
                        <input type="number" className="form-input" placeholder="Budget" value={sp.budget}
                          onChange={e => updateSubProject(idx, 'budget', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 0.4 }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progress %</label>
                        <input type="number" className="form-input" placeholder="%" min="0" max="100" value={sp.progress}
                          onChange={e => updateSubProject(idx, 'progress', e.target.value)} style={{ marginTop: '4px' }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button className="add-allowance-btn" onClick={addSubProject}>
                  <Plus size={14} /> Add Sub-project
                </button>
              </div>

              {/* Revenue Schedule Tab */}
              <div className={`tab-panel ${addTab === 'revenue' ? 'active' : ''}`}>
                {form.revenueSchedule.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input className="form-input" placeholder="Month (e.g. Jan 2026)" value={r.month}
                      onChange={e => updateRevenue(idx, 'month', e.target.value)} style={{ flex: 1.5 }} />
                    <input type="number" className="form-input" placeholder="Amount" value={r.amount}
                      onChange={e => updateRevenue(idx, 'amount', e.target.value)} style={{ flex: 1 }} />
                    <select className="form-select" value={r.status} onChange={e => updateRevenue(idx, 'status', e.target.value)} style={{ flex: 0.8 }}>
                      <option value="Planned">Planned</option>
                      <option value="Invoiced">Invoiced</option>
                      <option value="Received">Received</option>
                    </select>
                    <button className="allowance-remove-btn" onClick={() => removeRevenue(idx)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button className="add-allowance-btn" onClick={addRevenueEntry}>
                  <Plus size={14} /> Add Revenue Entry
                </button>
              </div>

              {/* Progress Tab — Auto-calculated from Revenue */}
              <div className={`tab-panel ${addTab === 'progress' ? 'active' : ''}`}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Progress (Auto-calculated from Revenue)</label>
                    {(() => {
                      const autoProgress = calcProgress(form.progressRevenue, form.contractValue);
                      return (
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                          <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800,
                            color: autoProgress >= 75 ? 'var(--color-success)' : autoProgress >= 40 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                            {autoProgress}%
                          </div>
                          <div className="progress-bar-wrapper" style={{ height: '8px', marginTop: '12px' }}>
                            <div className={`progress-bar-fill ${autoProgress >= 75 ? 'success' : autoProgress >= 40 ? '' : 'warning'}`}
                              style={{ width: `${autoProgress}%` }} />
                          </div>
                          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                            {formatCurrency(form.progressRevenue)} / {formatCurrency(form.contractValue)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Progress Revenue (Rp)</label>
                    <input type="number" className="form-input" value={form.progressRevenue}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setForm({...form, progressRevenue: val, remainingRevenue: Math.max(0, form.contractValue - val)});
                      }} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Revenue yang sudah diterima/ditagihkan</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remaining Revenue</label>
                    <div className="form-input" style={{ background: 'var(--bg-tertiary)', cursor: 'default', opacity: 0.8 }}>
                      {formatCurrency(form.remainingRevenue || Math.max(0, form.contractValue - form.progressRevenue))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Otomatis = Contract Value − Progress Revenue</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Status</label>
                    <select className="form-select" value={form.businessStatus}
                      onChange={e => setForm({...form, businessStatus: e.target.value})}>
                      <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Status</label>
                    <select className="form-select" value={form.projectStatus}
                      onChange={e => setForm({...form, projectStatus: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                try {
                  const matchedClient = clientsData.find(c => c.clientName === form.client);
                  await api.post('/master-data/projects', {
                    clientId: matchedClient ? matchedClient.id : null,
                    projectName: form.projectName,
                    projectCode: form.projectCode,
                    contractPeriod: form.contractPeriod,
                    contractValue: form.contractValue,
                    budget: form.budget,
                    projectStatus: 'Active',
                    businessStatus: 'On Track',
                    picAM: form.picAM,
                    picPM: form.picPM,
                    remark: form.remark,
                  });
                  setShowAddModal(false);
                  setForm({ ...emptyForm });
                  fetchData();
                  toast.success('Project Added', `${form.projectName} has been created successfully.`);
                } catch (err) {
                  toast.error('Add Failed', err.message);
                }
              }}>Save Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
