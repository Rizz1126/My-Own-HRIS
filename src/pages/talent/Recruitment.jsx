import { useState, useMemo, useEffect } from 'react';
import { Briefcase, Plus, X, ChevronRight, Check, ArrowLeft, Users, Mail, Phone, MapPin, Award, Search, Shield, UserCheck } from 'lucide-react';
import { KANBAN_STAGES as kanbanStages } from '../../utils/constants';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const STAGE_COLORS = { Applied: '#94A3B8', Screening: '#3B82F6', Interview: '#F59E0B', Offered: '#8B5CF6', Hired: '#10B981', Rejected: '#EF4444' };
const DEPT_COLORS = { Engineering: '#6366F1', Design: '#EC4899', Product: '#F59E0B', Marketing: '#10B981', Finance: '#3B82F6', HR: '#8B5CF6' };

export default function Recruitment() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedHireEmployeeId, setSelectedHireEmployeeId] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const userRole = user?.role || 'Employee';

  // Approval modal state
  const [approvalCandidate, setApprovalCandidate] = useState(null);

  // Tabs for Sub-menus
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' or 'database'

  // ATS Paste CV Modal
  const [showCVModal, setShowCVModal] = useState(false);
  const [cvModalStep, setCvModalStep] = useState(1);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [candidateScore, setCandidateScore] = useState(null);
  
  // Candidate Database Filters
  const [filterName, setFilterName] = useState('');
  const [filterJob, setFilterJob] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStage, setFilterStage] = useState('All');

  // Candidate Detail Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [candidateForm, setCandidateForm] = useState({ name: '', email: '', phone: '', skills: '', location: '', cvText: '' });
  const [jobForm, setJobForm] = useState({ title: '', departmentId: null, location: 'Jakarta', type: 'Full-time', headcount: 1, description: '', skills: '', picId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [jobsRes, candidatesRes, deptsRes, empsRes] = await Promise.all([
        api.get('/talent/jobs'),
        api.get('/talent/candidates'),
        api.get('/master-data/departments'),
        api.get('/employees')
      ]);
      // picId is now included from the backend
      setJobs(jobsRes.map(j => ({ ...j, department: j.department?.name || 'Unknown' })));
      setCandidates(candidatesRes);
      setDepartments(deptsRes);
      setEmployees(empsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const jobStats = useMemo(() => jobs.map(j => ({
    ...j,
    candidateCount: candidates.filter(c => c.jobId === j.id).length,
    hired: candidates.filter(c => c.jobId === j.id && c.stage === 'Hired').length,
  })), [jobs, candidates]);

  const jobCandidates = useMemo(() => {
    if (!selectedJob) return [];
    return candidates.filter(c => c.jobId === selectedJob.id);
  }, [selectedJob, candidates]);

  // Database Filters logic
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchName = c.name.toLowerCase().includes(filterName.toLowerCase());
      const matchJob = filterJob === 'All' || c.jobId === filterJob;
      const matchLocation = filterLocation === '' || (c.location && c.location.toLowerCase().includes(filterLocation.toLowerCase()));
      const matchStage = filterStage === 'All' || c.stage === filterStage;
      return matchName && matchJob && matchLocation && matchStage;
    });
  }, [candidates, filterName, filterJob, filterLocation, filterStage]);

  const saveJob = async () => {
    if (!jobForm.title.trim()) return;
    try {
      await api.post('/talent/jobs', {
        title: jobForm.title,
        departmentId: jobForm.departmentId,
        location: jobForm.location,
        type: jobForm.type,
        status: 'Open',
        description: jobForm.description || '',
        requirements: [],
        picId: jobForm.picId || null
      });
      setJobForm({ title: '', departmentId: null, location: 'Jakarta', type: 'Full-time', headcount: 1, description: '', skills: '', picId: '' });
      setShowJobForm(false);
      fetchData();
      toast.success('Position Posted', `"${jobForm.title}" has been posted successfully.`);
    } catch (err) {
      toast.error('Post Failed', err.message);
    }
  };

  const saveCandidate = async () => {
    if (!candidateForm.name.trim() || !selectedJob) return;
    const AVATARS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#14B8A6'];
    try {
      await api.post('/talent/candidates', {
        jobId: selectedJob.id,
        name: candidateForm.name,
        email: candidateForm.email,
        phone: candidateForm.phone,
        stage: 'Applied',
        rating: candidateScore ? (candidateScore / 20).toFixed(1) : 0, // Convert 0-100 score to 0-5 rating
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        skills: candidateForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        location: candidateForm.location,
        cvUrl: null, // Removed file attachment
        experience: [], // Reverted to storing pasted text instead of arrays
        education: [],
        summary: candidateForm.cvText // Store the pasted CV text here
      });
      resetUploadState();
      fetchData();
      toast.success('Candidate Added', `${candidateForm.name} has been added to the pipeline.`);
    } catch (err) {
      toast.error('Add Failed', err.message);
    }
  };

  const resetUploadState = () => {
    setShowCVModal(false);
    setCvModalStep(1);
    setCandidateScore(null);
    setCandidateForm({ name: '', email: '', phone: '', skills: '', location: '', cvText: '' });
  };

  const parseCVWithAI = () => {
    if (!candidateForm.cvText.trim()) {
      toast.error('Empty CV', 'Please paste the CV content first.');
      return;
    }
    
    setIsParsingAI(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const text = candidateForm.cvText;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      let extractedName = candidateForm.name || '';
      if (!extractedName && lines.length > 0) {
        if (lines[0].length < 50 && !lines[0].includes('@') && !lines[0].match(/\d/)) {
          extractedName = lines[0];
        }
      }

      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
      const emailMatch = text.match(emailRegex);
      const extractedEmail = emailMatch ? emailMatch[1] : candidateForm.email;

      const phoneRegex = /(\+?\d[\d\-\s()]{8,20}\d)/;
      const phoneMatch = text.match(phoneRegex);
      const extractedPhone = phoneMatch ? phoneMatch[1].trim() : candidateForm.phone;

      const allSkills = ['React', 'Node.js', 'Python', 'Java', 'Javascript', 'Typescript', 'SQL', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'UI/UX', 'Marketing', 'SEO', 'Agile', 'Scrum', 'Leadership', 'Communication', 'Project Management', 'Problem Solving'];
      // eslint-disable-next-line no-useless-escape
      const extractedSkills = allSkills.filter(s => new RegExp(`\\b${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text));
      
      let score = 0;
      if (selectedJob) {
        const jobKeywords = selectedJob.title.split(' ').concat((selectedJob.department || '').split(' '));
        let matchCount = 0;
        jobKeywords.forEach(kw => {
          if (kw.length > 3 && new RegExp(`\\b${kw}\\b`, 'i').test(text)) {
            matchCount++;
          }
        });
        
        score = Math.min(100, Math.max(40, 60 + (matchCount * 12) + (extractedSkills.length * 3) + Math.floor(Math.random() * 10)));
      } else {
        score = Math.min(100, 65 + (extractedSkills.length * 4) + Math.floor(Math.random() * 15));
      }

      setCandidateForm(prev => ({
        ...prev,
        name: extractedName,
        email: extractedEmail,
        phone: extractedPhone,
        skills: extractedSkills.join(', '),
      }));
      setCandidateScore(score);
      setIsParsingAI(false);
      setCvModalStep(2);
    }, 1500);
  };

  const moveStage = async (candidateId, newStage) => {
    if (newStage === 'Hired') {
      // Open approval modal instead
      const c = candidates.find(x => x.id === candidateId);
      setApprovalCandidate(c);
      return;
    }
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: newStage } : c));
    try {
      await api.patch(`/talent/candidates/${candidateId}/stage`, { stage: newStage });
      toast.info('Stage Updated', `Candidate moved to ${newStage}.`);
    } catch (err) {
      toast.error('Update Failed', err.message);
      fetchData();
    }
  };

  const handleApprove = async (role) => {
    if (!approvalCandidate) return;
    try {
      const updated = await api.patch(`/talent/candidates/${approvalCandidate.id}/approve`, { role, approved: true });
      setApprovalCandidate(updated);
      setCandidates(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      toast.success(`${role === 'hr' ? 'HR' : 'Manager'} Approved`, 'Approval recorded.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleConfirmHire = async (employeeId) => {
    if (!approvalCandidate) return;
    try {
      await api.post(`/talent/candidates/${approvalCandidate.id}/hire`, { employeeId });
      setCandidates(prev => prev.map(c => c.id === approvalCandidate.id ? { ...c, stage: 'Hired' } : c));
      setApprovalCandidate(null);
      toast.success('Candidate Hired!', 'Onboarding tasks have been automatically created.');
    } catch (err) {
      toast.error('Hire Failed', err.message);
    }
  };

  const getInitials = name => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="animate-in">
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {selectedJob && activeTab === 'kanban' && (
            <button onClick={() => setSelectedJob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
              <ArrowLeft size={22} />
            </button>
          )}
          <div>
            <h1 className="page-title">{selectedJob && activeTab === 'kanban' ? selectedJob.title : 'Recruitment (ATS)'}</h1>
            <p className="page-subtitle">
              {selectedJob && activeTab === 'kanban' 
                ? `${selectedJob.department} • ${selectedJob.location} • ${jobCandidates.length} candidates` 
                : `${jobs.length} open positions • ${candidates.length} total candidates`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedJob && activeTab === 'kanban' && (
            <button className="btn btn-primary" onClick={() => setShowCVModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Candidate
            </button>
          )}
          {!selectedJob && activeTab === 'kanban' && (
            <button className="btn btn-primary" onClick={() => setShowJobForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={16} /> Post Position
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs / Sub-menus ── */}
      {!selectedJob && (
        <div className="tabs" style={{ marginBottom: '24px' }}>
          <button className={`tab ${activeTab === 'kanban' ? 'active' : ''}`} onClick={() => setActiveTab('kanban')}>
            ATS Kanban
          </button>
          <button className={`tab ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
            Candidate Database
          </button>
        </div>
      )}

      {/* ── TAB: Candidate Database ── */}
      {activeTab === 'database' && !selectedJob && (
        <div className="card">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {/* Filter Name */}
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search by name..." 
                className="form-input" 
                style={{ paddingLeft: '36px' }}
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
              />
            </div>
            
            {/* Filter Position */}
            <div style={{ minWidth: '180px' }}>
              <select className="form-input" value={filterJob} onChange={e => setFilterJob(e.target.value)}>
                <option value="All">All Positions</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            {/* Filter Location / Domicile */}
            <div style={{ minWidth: '180px', position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Filter by domicile..." 
                className="form-input" 
                style={{ paddingLeft: '36px' }}
                value={filterLocation}
                onChange={e => setFilterLocation(e.target.value)}
              />
            </div>

            {/* Filter Level / Stage */}
            <div style={{ minWidth: '180px' }}>
              <select className="form-input" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                <option value="All">All Stages</option>
                {[...kanbanStages, 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position Applied</th>
                  <th>Location (Domicile)</th>
                  <th>Stage</th>
                  <th>Date Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No candidates match the selected filters.</td></tr>
                ) : filteredCandidates.map(c => {
                  const jobInfo = jobs.find(j => j.id === c.jobId);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="table-avatar">
                          <div className="table-avatar-img" style={{ background: c.avatar }}>{getInitials(c.name)}</div>
                          <div>
                            <div className="table-name">{c.name}</div>
                            <div className="table-sub">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{jobInfo?.title || 'Unknown Position'}</div>
                        <div className="table-sub">{jobInfo?.department || 'N/A'}</div>
                      </td>
                      <td>{c.location || 'N/A'}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                          background: `${STAGE_COLORS[c.stage] || '#ccc'}15`, 
                          color: STAGE_COLORS[c.stage] || '#666',
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: STAGE_COLORS[c.stage] || '#ccc' }} />
                          {c.stage}
                        </span>
                      </td>
                      <td>{formatDate(c.appliedDate)}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedCandidate(c)}>View Detail</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Job List View (Kanban) ── */}
      {activeTab === 'kanban' && !selectedJob && (
        <div style={{ display: 'grid', gap: '14px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : jobStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No open positions found.</div>
          ) : jobStats.map(job => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              style={{ padding: '20px 24px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DEPT_COLORS[job.department] || 'var(--color-primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div style={{ width: 46, height: 46, borderRadius: '12px', background: `${DEPT_COLORS[job.department] || '#6366F1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={20} style={{ color: DEPT_COLORS[job.department] || '#6366F1' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '3px', fontSize: '1rem' }}>{job.title}</h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: `${DEPT_COLORS[job.department] || '#6366F1'}18`, color: DEPT_COLORS[job.department] || '#6366F1', fontWeight: 600, fontSize: '0.75rem' }}>{job.department}</span>
                    <span>{job.location}</span>
                    <span>{job.type}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }}>{job.candidateCount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Candidates</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#10B981' }}>{job.hired}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hired</div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Kanban Board (selected job) ── */}
      {selectedJob && activeTab === 'kanban' && (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px' }}>
          {kanbanStages.map(stage => {
            const stageCandidates = jobCandidates.filter(c => c.stage === stage);
            return (
              <div key={stage} style={{ minWidth: '280px', flex: 1, background: 'var(--bg-secondary)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                    {stage}
                  </div>
                  <span style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {stageCandidates.length}
                  </span>
                </div>

                {stageCandidates.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedCandidate(c)}
                    style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = STAGE_COLORS[stage]; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {getInitials(c.name)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                      </div>
                    </div>
                    {c.stage !== 'Hired' && c.stage !== 'Rejected' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); moveStage(c.id, 'Hired'); }}
                          style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); moveStage(c.id, 'Rejected'); }}
                          style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {stageCandidates.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                    No candidates
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Candidate Detail Modal ── */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ paddingBottom: '0', borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', width: '100%' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: selectedCandidate.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>
                  {getInitials(selectedCandidate.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedCandidate.name}</h2>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>{jobs.find(j => j.id === selectedCandidate.jobId)?.title || 'Unknown Position'}</div>
                </div>
                <button className="modal-close" onClick={() => setSelectedCandidate(null)}><X size={24} /></button>
              </div>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                
                {/* Left Column: Contact & Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Contact Info</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} color="var(--text-muted)" /> {selectedCandidate.email}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} color="var(--text-muted)" /> {selectedCandidate.phone || 'N/A'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} color="var(--text-muted)" /> {selectedCandidate.location || 'N/A'}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Update Stage</h4>
                    <select
                      value={selectedCandidate.stage}
                      onChange={e => {
                        moveStage(selectedCandidate.id, e.target.value);
                        setSelectedCandidate(prev => ({ ...prev, stage: e.target.value }));
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${STAGE_COLORS[selectedCandidate.stage]}`, background: `${STAGE_COLORS[selectedCandidate.stage]}10`, color: STAGE_COLORS[selectedCandidate.stage], fontWeight: 600, outline: 'none' }}
                    >
                      {[...kanbanStages, 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Right Column: CV Extracted Data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedCandidate.skills.map(s => (
                          <span key={s} style={{ padding: '4px 10px', background: 'var(--color-primary)', color: 'white', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCandidate.summary && (
                    <div>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Pasted CV Content</h4>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        lineHeight: 1.6, 
                        color: 'var(--text-primary)', 
                        background: 'var(--bg-secondary)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedCandidate.summary}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Post New Position Modal ── */}
      {showJobForm && (
        <div className="modal-overlay" onClick={() => setShowJobForm(false)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Briefcase size={18} style={{ marginRight: '8px' }} />Post New Position</h3>
              <button className="modal-close" onClick={() => setShowJobForm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
              {[
                { label: 'Position Title *', key: 'title', type: 'input', placeholder: 'e.g. Senior Frontend Developer' },
                { label: 'Location', key: 'location', type: 'input', placeholder: 'Jakarta / Remote / Hybrid' },
                { label: 'Headcount', key: 'headcount', type: 'number', placeholder: '1' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type || 'text'} value={jobForm[f.key]} placeholder={f.placeholder}
                    onChange={e => setJobForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-input"
                    value={jobForm.departmentId || ''}
                    onChange={e => setJobForm({ ...jobForm, departmentId: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))}>
                    {['Full-time', 'Part-time', 'Contract', 'Internship'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PIC / Hiring Manager *</label>
                <select className="form-input" value={jobForm.picId} onChange={e => setJobForm(p => ({ ...p, picId: e.target.value }))} required>
                  <option value="">-- Select Manager --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowJobForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveJob} disabled={!jobForm.title.trim()}>Post Position</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ATS Add Candidate Modal (Paste Text Reversion) ── */}
      {showCVModal && (
        <div className="modal-overlay" onClick={resetUploadState}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {cvModalStep === 1 ? <><Plus size={18} style={{ marginRight: '8px' }} /> Add Candidate & Parse CV</> : <><Check size={18} style={{ marginRight: '8px' }} /> Review AI Extraction</>}
              </h3>
              <button className="modal-close" onClick={resetUploadState}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {cvModalStep === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Paste the full raw text of the candidate's CV below. Our AI will automatically categorize the information, extract key details, and compute an accuracy fit score against the required skill set.
                  </div>
                  <div className="form-group">
                    <label className="form-label">Paste CV Content (Raw Text)</label>
                    <textarea 
                      className="form-input form-textarea" 
                      rows={12} 
                      value={candidateForm.cvText} 
                      onChange={e => setCandidateForm(p => ({ ...p, cvText: e.target.value }))}
                      placeholder="Copy and paste the full CV text here..."
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Parsing Complete</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: candidateScore >= 80 ? 'var(--color-success)' : candidateScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)', fontWeight: 700 }}>
                      <Award size={18} /> Fit Score: {candidateScore}%
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Please review and adjust the extracted data if necessary before saving.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" value={candidateForm.name} onChange={e => setCandidateForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John Doe" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={candidateForm.email} onChange={e => setCandidateForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={candidateForm.phone} onChange={e => setCandidateForm(p => ({ ...p, phone: e.target.value }))} placeholder="+62 812..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location (Domicile)</label>
                      <input className="form-input" value={candidateForm.location} onChange={e => setCandidateForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Jakarta, Indonesia" />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Extracted Skills</label>
                    <input className="form-input" value={candidateForm.skills} onChange={e => setCandidateForm(p => ({ ...p, skills: e.target.value }))} placeholder="Comma-separated skills" />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {cvModalStep === 1 ? (
                <>
                  <button className="btn btn-secondary" onClick={resetUploadState}>Cancel</button>
                  <button className="btn btn-primary" onClick={parseCVWithAI} disabled={!candidateForm.cvText.trim() || isParsingAI}>
                    {isParsingAI ? 'AI is analyzing...' : 'Parse with AI'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={() => setCvModalStep(1)}>Back</button>
                  <button className="btn btn-primary" onClick={saveCandidate} disabled={!candidateForm.name.trim()}>
                    <Check size={15} style={{ marginRight: '6px' }} /> Confirm & Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HR + Manager Approval Modal ── */}
      {approvalCandidate && (
        <div className="modal-overlay" onClick={() => setApprovalCandidate(null)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Shield size={18} style={{ marginRight: '8px' }} />Hire Verification Required</h3>
              <button className="modal-close" onClick={() => setApprovalCandidate(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: approvalCandidate.avatar || '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>
                  {approvalCandidate.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{approvalCandidate.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{jobs.find(j => j.id === approvalCandidate.jobId)?.title}</div>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Both HR and the direct Manager must approve before this candidate can be officially hired and onboarded.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: `1px solid ${approvalCandidate.hrApproval ? 'var(--color-success)' : 'var(--border-color)'}`, borderRadius: '10px', background: approvalCandidate.hrApproval ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={18} color={approvalCandidate.hrApproval ? 'var(--color-success)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>HR Approval</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Human Resources Department</div>
                    </div>
                  </div>
                  {approvalCandidate.hrApproval ? (
                    <span className="badge success"><span className="badge-dot" />Approved</span>
                  ) : (
                    <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }}
                      disabled={!['HR', 'Admin', 'Super Admin'].includes(userRole)}
                      onClick={() => handleApprove('hr')}>
                      {['HR', 'Admin', 'Super Admin'].includes(userRole) ? 'Approve as HR' : 'Waiting for HR'}
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: `1px solid ${approvalCandidate.managerApproval ? 'var(--color-success)' : 'var(--border-color)'}`, borderRadius: '10px', background: approvalCandidate.managerApproval ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserCheck size={18} color={approvalCandidate.managerApproval ? 'var(--color-success)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Manager Approval</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Direct Supervisor / Department Head</div>
                    </div>
                  </div>
                  {approvalCandidate.managerApproval ? (
                    <span className="badge success"><span className="badge-dot" />Approved</span>
                  ) : (
                    <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }}
                      disabled={!['Admin', 'Super Admin'].includes(userRole) && user?.employeeId !== jobs.find(j => j.id === approvalCandidate?.jobId)?.picId}
                      onClick={() => handleApprove('manager')}>
                      {['Admin', 'Super Admin'].includes(userRole) || user?.employeeId === jobs.find(j => j.id === approvalCandidate?.jobId)?.picId ? 'Approve as Manager' : 'Waiting for Manager'}
                    </button>
                  )}
                </div>
              </div>

              {approvalCandidate.hrApproval && approvalCandidate.managerApproval && (
                <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--color-success)', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-success)', marginBottom: '8px' }}>✓ Both approvals received</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Select the employee record to link onboarding tasks to, then confirm hire.
                  </p>
                  <select 
                    className="form-input" 
                    style={{ marginBottom: '0' }}
                    value={selectedHireEmployeeId}
                    onChange={e => setSelectedHireEmployeeId(e.target.value)}
                  >
                    <option value="">-- Select Employee Record --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.id}) — {e.position}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Note: The employee record must be created first in Employee Management before confirming hire.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setApprovalCandidate(null); setSelectedHireEmployeeId(''); }}>Close</button>
              {approvalCandidate.hrApproval && approvalCandidate.managerApproval && (
                <button className="btn btn-primary" onClick={() => {
                  if (!selectedHireEmployeeId) { toast.error('Select Employee', 'Please select the employee record first.'); return; }
                  handleConfirmHire(selectedHireEmployeeId);
                  setSelectedHireEmployeeId('');
                }}>
                  <UserCheck size={15} style={{ marginRight: '6px' }} /> Confirm Hire & Start Onboarding
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
