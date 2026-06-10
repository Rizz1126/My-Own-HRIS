import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Hash, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Signup() {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP verification
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Resend countdown
  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
    if (resendTimer === 0) setCanResend(true);
  }, [step, resendTimer]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name || !employeeId || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Move to OTP step
    setStep(2);
    setResendTimer(60);
    setCanResend(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleVerify = async () => {
    setError('');
    setIsLoading(true);

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    // Mock: any 6-digit code is accepted
    const result = signup(name, email, password, employeeId);
    if (result.success) {
      // Redirect to My Profile so new user can complete their profile
      navigate('/ess/my-profile', { state: { newUser: true } });
    } else {
      setError(result.error || 'Verification failed');
    }
    setIsLoading(false);
  };

  const handleResend = () => {
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
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
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="auth-logo" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <div className="auth-logo-icon">H</div>
            </div>

            {step === 1 ? (
              <>
                <h2 className="auth-form-title" style={{ marginBottom: '6px' }}>Create Account</h2>
                <p className="auth-form-subtitle">Register to access your Humanova dashboard</p>
              </>
            ) : (
              <>
                <h2 className="auth-form-title" style={{ marginBottom: '6px' }}>Email Verification</h2>
                <p className="auth-form-subtitle">We sent a verification code to</p>
                <p style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.95rem' }}>{email}</p>
              </>
            )}
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              <form onSubmit={handleFormSubmit} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrapper">
                    <User size={18} className="auth-input-icon" />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Employee ID</label>
                  <div className="auth-input-wrapper">
                    <Hash size={18} className="auth-input-icon" />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="EMP001"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
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

                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="auth-email-note">
                  <Mail size={14} />
                  <span>This email will be used for all work activities including payslip delivery</span>
                </div>

                <button type="submit" className="auth-submit">
                  Continue
                </button>
              </form>

              <p className="auth-form-footer">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </>
          ) : (
            <div className="auth-otp-section">
              {/* OTP Input */}
              <div className="otp-input-group" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-input ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button
                className="auth-submit"
                onClick={handleVerify}
                disabled={isLoading || otp.join('').length < 6}
                style={{ marginTop: '20px' }}
              >
                {isLoading ? (
                  'Verifying...'
                ) : (
                  <><CheckCircle2 size={18} /> Verify & Create Account</>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                {canResend ? (
                  <button className="auth-link" onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={14} /> Resend verification code
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Resend code in <strong>{resendTimer}s</strong>
                  </span>
                )}
              </div>

              <button
                className="auth-back-btn"
                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
              >
                <ArrowLeft size={16} /> Back to registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
