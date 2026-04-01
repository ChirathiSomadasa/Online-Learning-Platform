import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSecurityQuestion, resetPasswordWithQuestion } from '../services/authService';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Step indicators
const STEPS = ['Find Account', 'Answer Question', 'Reset Password'];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 | 2 | 3 | 4(success)

  // Step 1
  const [email, setEmail]           = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Step 2
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer]         = useState('');
  const [answerError, setAnswerError] = useState('');

  // Step 3
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [resetLoading, setResetLoading]       = useState(false);
  const [resetError, setResetError]           = useState('');

  // Step 1 — Find account by email
  const handleFindAccount = async (e) => {
    e.preventDefault();
    setEmailLoading(true); setEmailError('');
    try {
      const data = await getSecurityQuestion(email);
      setSecurityQuestion(data.securityQuestion);
      setStep(2);
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Account not found.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Step 2 — Verify answer (client side — just move to step 3, actual verify on reset)
  const handleVerifyAnswer = (e) => {
    e.preventDefault();
    if (!answer.trim()) { setAnswerError('Please enter your answer.'); return; }
    setAnswerError('');
    setStep(3);
  };

  // Step 3 — Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.'); return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.'); return;
    }
    setResetLoading(true); setResetError('');
    try {
      await resetPasswordWithQuestion({ email, securityAnswer: answer, newPassword });
      setStep(4);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password.');
      // If answer was wrong, go back to step 2
      if (err.response?.status === 401) {
        setAnswer('');
        setStep(2);
        setAnswerError(err.response?.data?.message || 'Incorrect answer.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes successPop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }

        .forgot-card { animation: fadeUp 0.4s ease both; }
        .step-fade   { animation: fadeUp 0.3s ease both; }

        .fp-input {
          width: 100%;
          padding: 13px 18px;
          border: 1.5px solid #d4e8e8;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #0d2626;
          background: #f8fdfd;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .fp-input:focus {
          border-color: #00b4b4;
          box-shadow: 0 0 0 3px rgba(0,180,180,0.12);
          background: #fff;
        }
        .fp-input::placeholder { color: #aac8c8; }

        .fp-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #00b4b4, #007a7a);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
          margin-top: 6px;
        }
        .fp-btn:hover   { filter: brightness(1.08); transform: translateY(-1px); }
        .fp-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .fp-btn-ghost {
          width: 100%;
          padding: 12px;
          background: #f0f5f5;
          color: #4a7070;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .fp-btn-ghost:hover { background: #e0eeee; }

        .alert-error {
          background: #fef0ef;
          color: #c0392b;
          border: 1px solid #f5c6c2;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 32px;
        }
        .step-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step-dot.active   { background: #00b4b4; color: #fff; box-shadow: 0 0 0 3px rgba(0,180,180,0.2); }
        .step-dot.done     { background: #00b4b4; color: #fff; }
        .step-dot.inactive { background: #e0eee; color: #aac8c8; border: 2px solid #d4e8e8; }
        .step-line {
          height: 2px; width: 40px;
          background: #d4e8e8;
          transition: background 0.3s;
        }
        .step-line.done { background: #00b4b4; }

        .question-box {
          background: linear-gradient(135deg, #e8f7f7, #f0fbfb);
          border: 1.5px solid #b3e0e0;
          border-radius: 12px;
          padding: 16px 18px;
          margin-bottom: 20px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .question-text {
          font-size: 14px;
          color: #0d5050;
          font-weight: 500;
          line-height: 1.5;
        }

        .success-icon { animation: successPop 0.5s cubic-bezier(.17,.67,.4,1.3) both; }
        .pw-wrap { position: relative; }
        .pw-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; color: #aac8c8;
        }
      `}</style>

      <div style={styles.page}>
        <div className="forgot-card" style={styles.card}>

          {/* Step indicator (only show for steps 1-3) */}
          {step <= 3 && (
            <div className="step-indicator">
              {STEPS.map((label, idx) => {
                const num = idx + 1;
                const isDone   = step > num;
                const isActive = step === num;
                return (
                  <React.Fragment key={label}>
                    <div
                      className={`step-dot ${isDone ? 'done' : isActive ? 'active' : 'inactive'}`}
                      title={label}
                    >
                      {isDone ? '✓' : num}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`step-line ${isDone ? 'done' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ── STEP 1: Enter Email ── */}
          {step === 1 && (
            <div className="step-fade">
              <div style={styles.iconWrap}>
                <EmailIcon style={{ fontSize: '28px', color: '#00b4b4' }} />
              </div>
              <h2 style={styles.title}>Forgot Password?</h2>
              <p style={styles.subtitle}>Enter your registered email address to find your account.</p>

              {emailError && <div className="alert-error">{emailError}</div>}

              <form onSubmit={handleFindAccount}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    className="fp-input"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <button className="fp-btn" type="submit" disabled={emailLoading}>
                  {emailLoading ? 'Searching...' : 'Find My Account'}
                </button>
              </form>

              <Link to="/login" style={styles.backLink}>
                <ArrowBackIcon style={{ fontSize: '16px' }} />
                Back to Login
              </Link>
            </div>
          )}

          {/* ── STEP 2: Answer Security Question ── */}
          {step === 2 && (
            <div className="step-fade">
              <div style={styles.iconWrap}>
                <HelpOutlineIcon style={{ fontSize: '28px', color: '#00b4b4' }} />
              </div>
              <h2 style={styles.title}>Security Question</h2>
              <p style={styles.subtitle}>Answer your security question to verify your identity.</p>

              <div className="question-box">
                <HelpOutlineIcon style={{ color: '#00b4b4', fontSize: '20px', flexShrink: 0, marginTop: '1px' }} />
                <p className="question-text">{securityQuestion}</p>
              </div>

              {answerError && <div className="alert-error">{answerError}</div>}

              <form onSubmit={handleVerifyAnswer}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Your Answer</label>
                  <input
                    className="fp-input"
                    type="text"
                    value={answer}
                    onChange={e => { setAnswer(e.target.value); setAnswerError(''); }}
                    placeholder="Type your answer here"
                    required
                  />
                  <p style={styles.hint}>* Answer is case-insensitive</p>
                </div>
                <button className="fp-btn" type="submit">
                  Verify Answer
                </button>
              </form>

              <button className="fp-btn-ghost" onClick={() => { setStep(1); setAnswer(''); setAnswerError(''); }}>
                <ArrowBackIcon style={{ fontSize: '16px' }} />
                Back
              </button>
            </div>
          )}

          {/* ── STEP 3: Set New Password ── */}
          {step === 3 && (
            <div className="step-fade">
              <div style={styles.iconWrap}>
                <LockResetIcon style={{ fontSize: '28px', color: '#00b4b4' }} />
              </div>
              <h2 style={styles.title}>Set New Password</h2>
              <p style={styles.subtitle}>Choose a strong password for your account.</p>

              {resetError && <div className="alert-error">{resetError}</div>}

              <form onSubmit={handleResetPassword}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Password</label>
                  <div className="pw-wrap">
                    <input
                      className="fp-input"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                      placeholder="Min. 6 characters"
                      style={{ paddingRight: '44px' }}
                      required
                    />
                    <button type="button" className="pw-eye" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <VisibilityIcon style={{ fontSize: '20px' }} /> : <VisibilityOffIcon style={{ fontSize: '20px' }} />}
                    </button>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <div className="pw-wrap">
                    <input
                      className="fp-input"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setResetError(''); }}
                      placeholder="Repeat new password"
                      style={{
                        paddingRight: '44px',
                        borderColor: confirmPassword && newPassword !== confirmPassword ? '#e74c3c' : undefined
                      }}
                      required
                    />
                    <button type="button" className="pw-eye" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <VisibilityIcon style={{ fontSize: '20px' }} /> : <VisibilityOffIcon style={{ fontSize: '20px' }} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>Passwords do not match</p>
                  )}
                </div>

                <button className="fp-btn" type="submit" disabled={resetLoading}>
                  <LockResetIcon style={{ fontSize: '18px' }} />
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <button className="fp-btn-ghost" onClick={() => { setStep(2); setResetError(''); }}>
                <ArrowBackIcon style={{ fontSize: '16px' }} />
                Back
              </button>
            </div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div className="step-fade" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ marginBottom: '20px' }}>
                <CheckCircleIcon className="success-icon" style={{ fontSize: '72px', color: '#00b4b4' }} />
              </div>
              <h2 style={{ ...styles.title, marginBottom: '10px' }}>Password Reset!</h2>
              <p style={{ ...styles.subtitle, marginBottom: '32px' }}>
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <button className="fp-btn" onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef5f5',
    padding: '40px 20px',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 12px 40px rgba(0,80,80,0.10)',
    width: '100%',
    maxWidth: '420px',
    padding: '40px 36px',
  },
  iconWrap: {
    width: '60px', height: '60px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #e8f7f7, #f0fbfb)',
    border: '1.5px solid #b3e0e0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: '24px',
    color: '#0d2626',
    textAlign: 'center',
    marginBottom: '8px',
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: '13px',
    color: '#7f9999',
    textAlign: 'center',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  formGroup: { marginBottom: '18px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#4a7070',
    marginBottom: '7px',
  },
  hint: {
    fontSize: '11px',
    color: '#aac8c8',
    marginTop: '5px',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '18px',
    color: '#7f9999',
    fontSize: '13px',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
};

export default ForgotPassword;