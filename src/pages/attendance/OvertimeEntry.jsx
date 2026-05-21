import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  BrainCircuit, 
  Loader2,
  Check,
  X,
  Target,
  TrendingUp,
  User
} from 'lucide-react';
import { api } from '../../utils/api';
import { useEmployees } from '../../context/EmployeeContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

export default function OvertimeEntry() {
  const navigate = useNavigate();
  const toast = useToast();
  const { employees, isLoadingEmployees } = useEmployees();
  const [mode, setMode] = useState(null); // 'auto' or 'manual'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '21:00',
    hours: '3',
    task: '',
    achievement: 'Completed',
    progressDetails: '',
    evidenceUrl: '',
    isWeekend: false
  });

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    if (mode === 'auto') {
      setIsAnalyzing(true);
      try {
        // Mocking file upload and AI analysis
        const mockUrl = `https://storage.hris-ai.com/evidence/${uploadedFile.name}`;
        const response = await api.post('/overtime/analyze', { fileUrl: mockUrl });
        
        setFormData(prev => ({
          ...prev,
          ...response,
          evidenceUrl: mockUrl
        }));
        
        toast.success('AI Analysis Complete', 'Evidence data has been successfully extracted.');
      } catch (err) {
        toast.error('AI Analysis Failed', 'Could not read the file. Please fill manually.');
        setMode('manual');
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // Manual mode just sets the evidence URL mock
      setFormData(prev => ({
        ...prev,
        evidenceUrl: `https://storage.hris-ai.com/evidence/${uploadedFile.name}`
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.date || !formData.task || (!file && mode === 'manual')) {
      toast.error('Missing Information', 'Please fill all required fields and upload evidence.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
      const newId = `OVT-${ts}-${rand}`;

      await api.post('/overtime/requests', {
        id: newId,
        ...formData
      });

      toast.success('Overtime Recorded', 'Data has been saved and synchronized with payroll.');
      navigate('/attendance/overtime');
    } catch (err) {
      toast.error('Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateHours = (start, end) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(1);
  };

  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      setFormData(prev => ({
        ...prev,
        hours: calculateHours(prev.startTime, prev.endTime)
      }));
    }
  }, [formData.startTime, formData.endTime]);

  if (!mode) {
    return (
      <div className="animate-in" style={{ maxWidth: '900px', margin: '40px auto' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/attendance/overtime')} style={{ marginBottom: '24px' }}>
          <ArrowLeft size={18} /> Back to Overtime
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>New Overtime Record</h1>
          <p className="page-subtitle" style={{ fontSize: '1.1rem' }}>Choose how you want to input the overtime evidence</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* AI Auto-Read Option */}
          <div 
            className="glass-card hover-glow" 
            style={{ 
              padding: '40px', 
              cursor: 'pointer', 
              textAlign: 'center',
              border: '2px solid transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            onClick={() => setMode('auto')}
          >
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(135deg, var(--color-primary), #a855f7)', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'white',
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
            }}>
              <BrainCircuit size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>AI Auto-Read</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Upload your evidence file (photo, PDF, or screenshot) and let our AI extract all details automatically.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <span className="badge success">Fastest</span>
            </div>
          </div>

          {/* Manual Input Option */}
          <div 
            className="glass-card hover-glow" 
            style={{ 
              padding: '40px', 
              cursor: 'pointer', 
              textAlign: 'center',
              border: '2px solid transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-secondary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            onClick={() => setMode('manual')}
          >
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'white',
              boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
            }}>
              <FileText size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Manual Entry</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Fill in the overtime details manually and upload the evidence file as a requirement.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <span className="badge neutral">Traditional</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: '1000px', margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn btn-secondary" onClick={() => {
          setMode(null);
          setFile(null);
          setFormData({
            employeeId: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '18:00',
            endTime: '21:00',
            hours: '3',
            task: '',
            achievement: 'Completed',
            progressDetails: '',
            evidenceUrl: '',
            isWeekend: false
          });
        }}>
          <ArrowLeft size={18} /> Change Method
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`badge ${mode === 'auto' ? 'primary' : 'secondary'}`} style={{ padding: '8px 16px' }}>
            {mode === 'auto' ? <BrainCircuit size={14} style={{ marginRight: '6px' }} /> : <FileText size={14} style={{ marginRight: '6px' }} />}
            {mode === 'auto' ? 'AI Auto-Read Mode' : 'Manual Entry Mode'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        {/* Left Side: Upload & Status */}
        <div>
          <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="var(--color-primary)" /> Evidence Upload
            </h4>
            
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{ 
                border: '2px dashed var(--border-color)', 
                borderRadius: '12px', 
                padding: '32px 16px', 
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-secondary)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*,.pdf" />
              {file ? (
                <div>
                  <div style={{ color: 'var(--color-success)', marginBottom: '8px' }}><CheckCircle2 size={32} style={{ margin: '0 auto' }} /></div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '12px' }}><Upload size={32} style={{ margin: '0 auto' }} /></div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Select Evidence</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG or PDF up to 5MB</div>
                </div>
              )}
            </div>

            {isAnalyzing && (
              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                background: 'rgba(99, 102, 241, 0.1)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Loader2 size={18} className="animate-spin" color="var(--color-primary)" />
                <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>AI is reading your file...</div>
              </div>
            )}

            {!file && mode === 'manual' && (
              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                background: 'rgba(239, 68, 68, 0.05)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={18} color="var(--color-danger)" />
                <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Evidence is required for manual entry.</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} /> Select Employee
              </label>
              <select 
                className="form-input" 
                value={formData.employeeId} 
                onChange={e => setFormData(p => ({ ...p, employeeId: e.target.value }))}
                required
              >
                <option value="">— Choose employee —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} /> Date
                </label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.date} 
                  onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} /> Duration
                </label>
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '10px 16px', 
                  borderRadius: 'var(--radius-md)', 
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{formData.hours} Hours</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="isWeekend"
                      checked={formData.isWeekend}
                      onChange={e => setFormData(p => ({ ...p, isWeekend: e.target.checked }))}
                    />
                    <label htmlFor="isWeekend" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>Weekend?</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={formData.startTime} 
                  onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))} 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={formData.endTime} 
                  onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))} 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Task Description
              </label>
              <textarea 
                className="form-input form-textarea" 
                rows={3} 
                placeholder="What was done during overtime?" 
                value={formData.task} 
                onChange={e => setFormData(p => ({ ...p, task: e.target.value }))}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={16} /> Achievement
                </label>
                <select 
                  className="form-input" 
                  value={formData.achievement} 
                  onChange={e => setFormData(p => ({ ...p, achievement: e.target.value }))}
                  required
                >
                  <option value="Completed">Completed</option>
                  <option value="On Progress">On Progress</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} /> Progress Details
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 80% finished, etc." 
                  value={formData.progressDetails} 
                  onChange={e => setFormData(p => ({ ...p, progressDetails: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => navigate('/attendance/overtime')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 2 }}
                disabled={isSubmitting || isAnalyzing}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {isSubmitting ? 'Saving...' : 'Submit Overtime & Sync Payroll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
