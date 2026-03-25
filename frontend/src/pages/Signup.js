import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import classImage from '../images/auth/signup.png';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';

const Signup = () => {
  const [step, setStep] = useState(1); // 1 = personal info, 2 = security
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student',
    securityQuestion: '', securityAnswer: ''
  });
  const [error, setError] = useState('');
  const [stepError, setStepError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStepError('');
    setError('');
  };

  // Validate step 1 before going to step 2
  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.name.trim())     { setStepError('Please enter your name.'); return; }
    if (!formData.email.trim())    { setStepError('Please enter your email.'); return; }
    if (formData.password.length < 6) { setStepError('Password must be at least 6 characters.'); return; }
    setStepError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.securityQuestion) { setStepError('Please select a security question.'); return; }
    if (!formData.securityAnswer.trim()) { setStepError('Please provide a security answer.'); return; }

    setLoading(true);
    setError('');
    try {
      const data = await register(formData);
      if (data.token) {
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background-color: #f0f0f0; }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .step-1-content { animation: slideInLeft 0.3s ease both; }
        .step-2-content { animation: slideInRight 0.3s ease both; }

        .signup-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Segoe UI', sans-serif;
          background-color: #f0f0f0;
        }
        .signup-left {
          width: 50%;
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .signup-image-wrap {
          position: relative;
          width: 100%;
          height: 85vh;
          border-radius: 20px;
          overflow: hidden;
        }
        .signup-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 20px;
        }
        .signup-overlay {
          position: absolute;
          bottom: 30px;
          left: 25px;
          color: #fff;
        }
        .signup-overlay h2 {
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 6px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .signup-overlay p {
          font-size: 13px;
          opacity: 0.9;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .signup-right {
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 60px;
        }
        .signup-form-box {
          width: 100%;
          max-width: 430px;
        }
        .su-input {
          width: 100%;
          padding: 13px 18px;
          border-radius: 30px;
          border: 1.5px solid #d0d0d0;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          color: #333;
          background-color: #fff;
          font-family: 'Segoe UI', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .su-input:focus {
          border-color: #00b4b4;
          box-shadow: 0 0 0 3px rgba(0,180,180,0.10);
        }
        .su-input::placeholder { color: #bbb; }

        .next-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #00b4b4, #007a7a);
          color: #fff;
          border: none;
          border-radius: 30px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
          transition: filter 0.2s, transform 0.2s;
          font-family: 'Segoe UI', sans-serif;
        }
        .next-btn:hover   { filter: brightness(1.08); transform: translateY(-1px); }
        .next-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .back-btn {
          width: 100%;
          padding: 13px;
          background: #f0f5f5;
          color: #4a7070;
          border: none;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
          transition: background 0.2s;
          font-family: 'Segoe UI', sans-serif;
        }
        .back-btn:hover { background: #e0eeee; }

        /* Step progress bar */
        .step-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 24px;
        }
        .step-bubble {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          font-weight: 700;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step-bubble.active   { background: #00b4b4; color: #fff; box-shadow: 0 0 0 3px rgba(0,180,180,0.2); }
        .step-bubble.done     { background: #00b4b4; color: #fff; }
        .step-bubble.inactive { background: #fff; color: #aaa; border: 2px solid #d0d0d0; }
        .step-connector {
          height: 2px; width: 50px;
          transition: background 0.3s;
        }
        .step-connector.done     { background: #00b4b4; }
        .step-connector.inactive { background: #d0d0d0; }
        .step-label-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 0 2px;
        }
        .step-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.3s;
        }
        .step-label.active   { color: #00b4b4; }
        .step-label.inactive { color: #bbb; }

        .security-info-box {
          background: linear-gradient(135deg, #e8f7f7, #f0fbfb);
          border: 1.5px solid #b3e0e0;
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .security-info-text {
          font-size: 13px;
          color: #0d5050;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .signup-left { display: none; }
          .signup-right { width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="signup-page">

        {/* LEFT — IMAGE */}
        <div className="signup-left">
          <div className="signup-image-wrap">
            <img src={classImage} alt="Classroom" />
            <div className="signup-overlay">
              <h2>Start Your Learning Journey</h2>
              <p>Create an account and unlock your potential today</p>
            </div>
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div className="signup-right">
          <div className="signup-form-box">

            <h2 style={styles.welcomeTitle}>Welcome to EduNest..!</h2>

            {/* TABS */}
            <div style={styles.tabs}>
              <Link to="/login"  style={styles.inactiveTab}>Login</Link>
              <Link to="/signup" style={styles.activeTab}>Register</Link>
            </div>

            {/* STEP PROGRESS BAR */}
            <div className="step-bar">
              <div className={`step-bubble ${step >= 1 ? 'active' : 'inactive'}`}>
                <PersonIcon style={{ fontSize: '18px' }} />
              </div>
              <div className={`step-connector ${step >= 2 ? 'done' : 'inactive'}`} />
              <div className={`step-bubble ${step === 2 ? 'active' : 'inactive'}`}>
                <ShieldIcon style={{ fontSize: '18px' }} />
              </div>
            </div>

            {/* STEP LABELS */}
            <div className="step-label-row">
              <span className={`step-label ${step === 1 ? 'active' : 'inactive'}`}>
                Personal Info
              </span>
              <span className={`step-label ${step === 2 ? 'active' : 'inactive'}`}>
                Security Setup
              </span>
            </div>

            {/* Global error (from API) */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Step-level validation error */}
            {stepError && <div style={styles.error}>{stepError}</div>}

            {/* ── STEP 1: Personal Info ── */}
            {step === 1 && (
              <div className="step-1-content">
                <p style={styles.tagline}>
                  Fill in your details to create your free account.
                </p>

                <form onSubmit={handleNext}>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      className="su-input"
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                      className="su-input"
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Password</label>
                    <div style={styles.passwordWrap}>
                      <input
                        className="su-input"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        style={{ paddingRight: '50px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        {showPassword
                          ? <VisibilityIcon style={styles.eyeIcon} />
                          : <VisibilityOffIcon style={styles.eyeIcon} />
                        }
                      </button>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Role</label>
                    <select
                      className="su-input"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>

                  <button className="next-btn" type="submit">
                    Next
                   
                  </button>

                </form>
              </div>
            )}

            {/* ── STEP 2: Security Setup ── */}
            {step === 2 && (
              <div className="step-2-content">
                <p style={styles.tagline}>
                  Set up a security question so you can recover your account if you forget your password.
                </p>

                <div className="security-info-box">
                  <ShieldIcon style={{ color: '#00b4b4', fontSize: '20px', flexShrink: 0, marginTop: '1px' }} />
                  <p className="security-info-text">
                    This question will be used to verify your identity if you forget your password.
                    Choose something only you would know.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Security Question</label>
                    <select
                      className="su-input"
                      name="securityQuestion"
                      value={formData.securityQuestion}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a question...</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                      <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                      <option value="What is your oldest sibling's middle name?">What is your oldest sibling's middle name?</option>
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Your Answer</label>
                    <input
                      className="su-input"
                      type="text"
                      name="securityAnswer"
                      placeholder="Type your answer (case-insensitive)"
                      value={formData.securityAnswer}
                      onChange={handleChange}
                      required
                    />
                    <p style={styles.hint}>* Remember this answer — you'll need it to reset your password.</p>
                  </div>

                  <button className="next-btn" type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                    
                  </button>

                  <button
                    className="back-btn"
                    type="button"
                    onClick={() => { setStep(1); setStepError(''); }}
                  >
                    <ArrowBackIcon style={{ fontSize: '16px' }} />
                    Back to Personal Info
                  </button>

                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  welcomeTitle: {
    fontSize: '22px',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '24px',
    fontWeight: '600',
  },
  tabs: {
    display: 'flex',
    marginBottom: '24px',
    borderRadius: '30px',
    overflow: 'hidden',
    border: '2px solid #00b4b4',
    width: '100%',
  },
  inactiveTab: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#00b4b4',
    padding: '11px 0',
    textDecoration: 'none',
    fontSize: '15px',
    textAlign: 'center',
  },
  activeTab: {
    flex: 1,
    backgroundColor: '#00b4b4',
    color: '#fff',
    padding: '11px 0',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: '28px',
  },
  tagline: {
    color: '#888',
    fontSize: '13px',
    lineHeight: '1.7',
    marginBottom: '20px',
  },
  error: {
    backgroundColor: '#fdecea',
    color: '#e74c3c',
    padding: '10px 14px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  inputGroup: { marginBottom: '18px' },
  label: {
    display: 'block',
    color: '#333',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '7px',
  },
  hint: {
    fontSize: '11px',
    color: '#aaa',
    marginTop: '6px',
    paddingLeft: '4px',
  },
  passwordWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  eyeIcon: { color: '#aaa', fontSize: '20px' },
};

export default Signup;