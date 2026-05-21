import { FileText, Upload, Grid, List, Download, Eye, Trash2, X, File, Calendar, User, HardDrive } from 'lucide-react';
import { useState } from 'react';
import { getInitials, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const DOCUMENTS = [
  { id: 1, name: 'KTP - Andi Pratama', category: 'Identity', employee: 'Andi Pratama', uploadDate: '2024-01-15', size: '2.1 MB', type: 'PDF' },
  { id: 2, name: 'NPWP - Siti Rahayu', category: 'Tax', employee: 'Siti Rahayu', uploadDate: '2024-02-20', size: '1.5 MB', type: 'PDF' },
  { id: 3, name: 'Degree Certificate - Budi Santoso', category: 'Education', employee: 'Budi Santoso', uploadDate: '2023-06-10', size: '3.2 MB', type: 'PDF' },
  { id: 4, name: 'Employment Contract - Dewi Lestari', category: 'Contract', employee: 'Dewi Lestari', uploadDate: '2024-03-01', size: '850 KB', type: 'PDF' },
  { id: 5, name: 'Medical Certificate - Rizky F.', category: 'Health', employee: 'Rizky Firmansyah', uploadDate: '2024-01-30', size: '1.8 MB', type: 'PDF' },
  { id: 6, name: 'BPJS Card - Putri Wijaya', category: 'Insurance', employee: 'Putri Wijaya', uploadDate: '2024-02-14', size: '920 KB', type: 'IMG' },
  { id: 7, name: 'Training Certificate - Ahmad H.', category: 'Training', employee: 'Ahmad Hidayat', uploadDate: '2024-03-15', size: '2.5 MB', type: 'PDF' },
  { id: 8, name: 'KTP - Rina Marlina', category: 'Identity', employee: 'Rina Marlina', uploadDate: '2024-01-20', size: '1.9 MB', type: 'PDF' },
];

const CATEGORIES = ['All', 'Identity', 'Tax', 'Education', 'Contract', 'Health', 'Insurance', 'Training'];
const catColors = { Identity: '#6366F1', Tax: '#F59E0B', Education: '#3B82F6', Contract: '#10B981', Health: '#EF4444', Insurance: '#8B5CF6', Training: '#14B8A6' };

export default function Documents() {
  const toast = useToast();
  const [viewMode, setViewMode] = useState('list');
  const [category, setCategory] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [documents, setDocuments] = useState(DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'delete'

  // Extract unique employees for the filter dropdown
  const uniqueEmployees = ['All', ...new Set(documents.map(d => d.employee))];

  const filtered = documents.filter(d => {
    const matchCategory = category === 'All' || d.category === category;
    const matchEmployee = employeeFilter === 'All' || d.employee === employeeFilter;
    return matchCategory && matchEmployee;
  });

  const openModal = (doc, type) => {
    setSelectedDoc(doc);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedDoc(null);
    setModalType(null);
  };

  const handleDownload = (doc) => {
    toast.info('Download Initiated', `Preparing "${doc.name}" (${doc.size}) for download.`);
  };

  const handleDelete = () => {
    if (selectedDoc) {
      setDocuments(prev => prev.filter(d => d.id !== selectedDoc.id));
      closeModal();
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Document Management</h1>
          <p className="page-subtitle">{documents.length} documents stored</p>
        </div>
        <button className="btn btn-primary"><Upload size={18} /> Upload Document</button>
      </div>

      {/* Upload Area */}
      <div className="card" style={{ border: '2px dashed var(--border-color)', textAlign: 'center', padding: '40px', marginBottom: '20px', cursor: 'pointer' }}>
        <Upload size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Drag & drop files here or click to browse</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Supports PDF, JPG, PNG up to 10MB</p>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '12px' }}>
        <select className="filter-select" style={{ minWidth: '160px' }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Types' : c}</option>)}
        </select>
        <select className="filter-select" style={{ minWidth: '200px' }} value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp === 'All' ? 'All Employees' : emp}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('list')}><List size={16} /></button>
          <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('grid')}><Grid size={16} /></button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Document</th><th>Category</th><th>Employee</th><th>Uploaded</th><th>Size</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={20} style={{ color: 'var(--color-primary)' }} /><span className="font-semibold">{doc.name}</span></div></td>
                  <td><span className="badge" style={{ background: `${catColors[doc.category]}20`, color: catColors[doc.category] }}>{doc.category}</span></td>
                  <td>{doc.employee}</td>
                  <td>{formatDate(doc.uploadDate)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{doc.size}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-icon btn-sm btn-secondary" title="View" onClick={() => openModal(doc, 'view')}><Eye size={15} /></button>
                      <button className="btn btn-icon btn-sm btn-secondary" title="Download" onClick={() => handleDownload(doc)}><Download size={15} /></button>
                      <button className="btn btn-icon btn-sm btn-secondary" title="Delete" onClick={() => openModal(doc, 'delete')}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid-4">
          {filtered.map(doc => (
            <div key={doc.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openModal(doc, 'view')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <FileText size={20} />
                </div>
                <span className="badge" style={{ background: `${catColors[doc.category]}20`, color: catColors[doc.category] }}>{doc.category}</span>
              </div>
              <div className="font-semibold" style={{ marginBottom: '4px', fontSize: '0.88rem' }}>{doc.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{doc.size} • {formatDate(doc.uploadDate)}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-icon btn-sm btn-secondary" title="View" onClick={(e) => { e.stopPropagation(); openModal(doc, 'view'); }}><Eye size={14} /></button>
                <button className="btn btn-icon btn-sm btn-secondary" title="Download" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}><Download size={14} /></button>
                <button className="btn btn-icon btn-sm btn-secondary" title="Delete" onClick={(e) => { e.stopPropagation(); openModal(doc, 'delete'); }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Document Modal */}
      {modalType === 'view' && selectedDoc && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Document Preview</h3>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Document Preview Area */}
              <div style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                minHeight: '200px',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '20px',
                  background: `${catColors[selectedDoc.category]}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <File size={40} style={{ color: catColors[selectedDoc.category] }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', textAlign: 'center' }}>{selectedDoc.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{selectedDoc.type} File</div>
              </div>

              {/* Document Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <File size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedDoc.category}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--color-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-info)' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Employee</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedDoc.employee}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload Date</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(selectedDoc.uploadDate)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--color-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                    <HardDrive size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>File Size</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedDoc.size}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Close</button>
              <button className="btn btn-primary" onClick={() => handleDownload(selectedDoc)}>
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === 'delete' && selectedDoc && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Document</h3>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '16px',
                background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Trash2 size={28} />
              </div>
              <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Are you sure?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                You are about to delete <strong style={{ color: 'var(--text-primary)' }}>"{selectedDoc.name}"</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={16} /> Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
