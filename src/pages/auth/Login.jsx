import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, AlertCircle, User } from 'lucide-react';

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

      <div className="auth-centered">
        <div className="auth-card">
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '4px' }}>
              <div className="auth-logo-icon">H</div>
              <span style={{ fontSize: '1.9rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--color-primary), #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Humanova</span>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center' }}>Transforming HR Experience</p>
            <h2 className="auth-form-title" style={{ marginBottom: '6px', textAlign: 'center' }}>Welcome Back</h2>
            <p className="auth-form-subtitle" style={{ textAlign: 'center' }}>Sign in to your Humanova account</p>
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
          </form>

          <div className="auth-demo-info">
            <p style={{ fontWeight: 600, marginBottom: '6px' }}>Demo Accounts:</p>
            <p><code>EMP001</code> / <code>admin123</code> <span style={{ opacity: 0.6 }}>— Super Admin</span></p>
            <p><code>EMP002</code> / <code>hr123</code> <span style={{ opacity: 0.6 }}>— Admin (HR)</span></p>
            <p><code>EMP003</code> / <code>demo123</code> <span style={{ opacity: 0.6 }}>— Employee</span></p>
          </div>

          <p className="auth-form-footer">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
