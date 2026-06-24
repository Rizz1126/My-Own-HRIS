import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, AlertCircle, User } from 'lucide-react';

// Feature Flag for Visitor View (Can be enabled/disabled by changing the value to true/false)
const ENABLE_VISITOR_VIEW = true;

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    sessionStorage.removeItem('hris-visitor-mode');
    setError('');
    setIsLoading(true);

    if (!identifier || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const result = await loginWithCredentials(identifier, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-gradient" />
        <div className="auth-bg-pattern" />
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>

      <div className="auth-container">
        {/* Left Branding Panel */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <h1 className="auth-branding-title" style={{ fontWeight: 600 }}>Humanova</h1>
            <p className="auth-branding-desc" style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)' }}>
              Transforming HR Experience
            </p>
            <div className="auth-branding-features">
              <div className="auth-branding-feature">
                <div className="auth-branding-check">✓</div>
                <span>Automated Payroll Engine</span>
              </div>
              <div className="auth-branding-feature">
                <div className="auth-branding-check">✓</div>
                <span>Employee Self-Service (ESS)</span>
              </div>
              <div className="auth-branding-feature">
                <div className="auth-branding-check">✓</div>
                <span>Real-time Analytics Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            {/* Logo & Welcome */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div className="auth-logo" style={{ justifyContent: 'center', marginBottom: '16px' }}>
                <div className="auth-logo-icon">H</div>
              </div>
              <h2 className="auth-form-title" style={{ marginBottom: '6px' }}>Welcome Back</h2>
              <p className="auth-form-subtitle">Sign in to your account</p>
            </div>

            {error && (
              <div className="auth-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Employee ID</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. EMP001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">Password</label>
                  <a href="#" className="auth-forgot">Forgot password?</a>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>

              {ENABLE_VISITOR_VIEW && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="auth-submit" 
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                      border: '1px solid rgba(255, 255, 255, 0.3)', 
                      color: 'white',
                      boxShadow: 'none'
                    }}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const result = await loginWithCredentials('EMP001', 'admin123');
                        if (result.success) {
                          sessionStorage.setItem('hris-visitor-mode', 'true');
                          navigate('/');
                        } else {
                          setError(result.error);
                        }
                      } catch (err) {
                        setError('An unexpected error occurred');
                      }
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                  >
                    Continue as Visitor (Super Admin)
                  </button>
                  <button 
                    type="button" 
                    className="auth-submit" 
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                      border: '1px solid rgba(255, 255, 255, 0.3)', 
                      color: 'white',
                      boxShadow: 'none'
                    }}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const result = await loginWithCredentials('EMP003', 'demo123');
                        if (result.success) {
                          sessionStorage.setItem('hris-visitor-mode', 'true');
                          navigate('/');
                        } else {
                          setError(result.error);
                        }
                      } catch (err) {
                        setError('An unexpected error occurred');
                      }
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                  >
                    Continue as Visitor (Employee)
                  </button>
                </div>
              )}
            </form>

            <p className="auth-form-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">Create account</Link>
            </p>


          </div>
        </div>
      </div>
    </div>
  );
}
