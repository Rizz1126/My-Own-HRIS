import { useState } from 'react';
import { X, Copy, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function GenerateOnboardingModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', position: '', baseSalary: '' });
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create a candidate with stage 'Offered'
      // Requires: name, email. We'll pass a dummy jobId for now, or the backend allows null jobId?
      // Wait, schema says jobId is not null in candidates!
      // Let's fetch the first available job or create a dummy 'Direct Hire' job if none exist.
      const jobs = await api.get('/talent/jobs');
      let defaultJobId = jobs.length > 0 ? jobs[0].id : null;
      
      if (!defaultJobId) {
        // If no jobs exist, we create a generic 'Direct Hire' job
        const newJob = await api.post('/talent/jobs', {
          title: 'Direct Hire',
          type: 'Full-time',
          status: 'Open'
        });
        defaultJobId = newJob.id;
      }

      const candidate = await api.post('/talent/candidates', {
        name: formData.name,
        email: formData.email,
        jobId: defaultJobId,
        stage: 'Offered'
      });

      const link = `${window.location.origin}/onboarding/fill/${candidate.id}`;
      setGeneratedLink(link);
      toast.success('Link Generated', 'Onboarding link created successfully.');
    } catch (err) {
      toast.error('Failed', err.message || 'Could not generate link.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-content card animate-in" style={{ width: '100%', maxWidth: '500px', margin: '20px', padding: '0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Generate Onboarding Link</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {!generatedLink ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Enter the candidate's details to generate a secure, one-time onboarding link. The candidate will fill out the rest of their data.
              </p>
              
              <div>
                <label className="form-label">Full Name</label>
                <input required type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              
              <div>
                <label className="form-label">Email Address</label>
                <input required type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Position / Role</label>
                  <input required type="text" className="form-input" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} placeholder="e.g. Frontend Developer" />
                </div>
                <div>
                  <label className="form-label">Base Salary</label>
                  <input required type="number" className="form-input" value={formData.baseSalary} onChange={(e) => setFormData({...formData, baseSalary: e.target.value})} placeholder="e.g. 10000000" />
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Link'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-success)' }}>
                <CheckCircle size={48} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Link Generated!</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Copy the link below and send it to <strong>{formData.name}</strong>. Once they submit the form, their employee account will be automatically created.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <LinkIcon size={16} style={{ color: 'var(--text-muted)' }} />
                <input type="text" readOnly value={generatedLink} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }} />
                <button className="btn btn-secondary btn-sm" onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div style={{ marginTop: '32px' }}>
                <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => { setGeneratedLink(''); onClose(); }}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
