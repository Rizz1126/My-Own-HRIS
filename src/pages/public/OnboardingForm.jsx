import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Building, User, Mail, Phone, MapPin, Calendar, CreditCard, Briefcase, FileText } from 'lucide-react';

export default function OnboardingForm() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    dateOfBirth: '',
    phone: '',
    address: '',
    maritalStatus: 'Single',
    dependents: '0',
    emergencyContact: '',
    emergencyPhone: '',
    bankName: '',
    bankAccountNumber: '',
  });

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await fetch(`/api/talent/onboarding-form/${candidateId}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load');
        }
        
        setCandidate(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (candidateId) fetchCandidate();
  }, [candidateId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        // Optional default configs passed to the backend, if any
      };
      
      const res = await fetch(`/api/talent/onboarding-form/${candidateId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      
      setSuccessData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
        Loading your secure onboarding form...
      </div>
    );
  }

  if (error && !successData) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div className="card animate-in" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Link Invalid or Expired</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-secondary)', padding: '20px' }}>
        <div className="card animate-in" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '40px' }}>
          <CheckCircle size={64} style={{ color: 'var(--color-success)', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Welcome to Humanova!</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Your employee profile has been successfully created. You can now log into the portal.
          </p>
          
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700 }}>Your Credentials</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee ID (NIK)</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{successData.employee.nik}</div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Login Email</span>
              <div style={{ fontSize: '1rem', fontWeight: 500 }}>{successData.employee.email}</div>
            </div>
            
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default Password</span>
              <div style={{ fontSize: '1rem', fontWeight: 500, background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '4px', display: 'inline-block', border: '1px dashed var(--border-color)' }}>
                demo123
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>For demo purposes, the system accepts "demo123" for any new user.</p>
            </div>
          </div>
          
          <button className="btn btn-primary w-full" onClick={() => navigate('/login')} style={{ justifyContent: 'center' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '40px 20px' }}>
      <div className="card animate-in" style={{ maxWidth: '700px', margin: '0 auto', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'var(--color-primary)', color: 'white', padding: '32px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
              H
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Humanova</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>New Employee Onboarding</h1>
          <p style={{ opacity: 0.9 }}>Welcome aboard, {candidate?.name}! Please complete your profile to finalize your employment setup.</p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '40px' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section 1: Basic Information */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'var(--color-primary)' }} /> Personal Details
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <User size={16} /> {candidate?.name}
                  </div>
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <Mail size={16} /> {candidate?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input required type="date" name="dateOfBirth" className="form-input" value={formData.dateOfBirth} onChange={handleChange} style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input required type="tel" name="phone" className="form-input" placeholder="+62 812..." value={formData.phone} onChange={handleChange} style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Full Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <textarea required name="address" className="form-input" placeholder="Your residential address" value={formData.address} onChange={handleChange} rows={3} style={{ paddingLeft: '36px' }}></textarea>
                </div>
              </div>
            </div>

            {/* Section 2: Family & Emergency */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} style={{ color: 'var(--color-primary)' }} /> Family & Emergency
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Marital Status</label>
                  <select name="maritalStatus" className="form-select" value={formData.maritalStatus} onChange={handleChange}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Number of Dependents</label>
                  <input type="number" min="0" name="dependents" className="form-input" value={formData.dependents} onChange={handleChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Emergency Contact Name</label>
                  <input required type="text" name="emergencyContact" className="form-input" placeholder="e.g. Jane Doe (Wife)" value={formData.emergencyContact} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">Emergency Phone</label>
                  <input required type="tel" name="emergencyPhone" className="form-input" placeholder="+62..." value={formData.emergencyPhone} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Section 3: Payroll / Bank */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} style={{ color: 'var(--color-primary)' }} /> Bank Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Bank Name</label>
                  <input required type="text" name="bankName" className="form-input" placeholder="e.g. BCA, Mandiri" value={formData.bankName} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">Account Number</label>
                  <input required type="text" name="bankAccountNumber" className="form-input" placeholder="e.g. 1234567890" value={formData.bankAccountNumber} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1.05rem' }} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
