import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import classImage from '../images/auth/login.jpg';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

const Login = () => {
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(formData);
      if (data.token) {
        saveAuth(data.user, data.token);
        navigate(data.user.role === 'instructor' ? '/instructor-home' : '/student-home');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Responsive CSS */}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background-color: #f0f0f0; }
        .login-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Segoe UI', sans-serif;
          background-color: #f0f0f0;
        }
        .login-left {
          width: 50%;
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-left img {
          width: 100%;
          height: 100%;
          max-height: 85vh;
          object-fit: cover;
          border-radius: 20px;
          display: block;
        }
        .login-image-wrap {
          position: relative;
          width: 100%;
          height: 85vh;
          border-radius: 20px;
          overflow: hidden;
        }
        .login-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 20px;
        }
        .login-overlay {
          position: absolute;
          bottom: 30px;
          left: 25px;
          color: #fff;
        }
        .login-overlay h2 {
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 6px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .login-overlay p {
          font-size: 13px;
          opacity: 0.9;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .login-right {
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 60px;
        }
        .login-form-box {
          width: 100%;
          max-width: 430px;
        }
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="login-page">

        {/* LEFT — IMAGE WITH GAP */}
        <div className="login-left">
          <div className="login-image-wrap">
            <img src={classImage} alt="Classroom" />
            <div className="login-overlay">
              <h2>Learn Anytime, Anywhere</h2>
              <p>Join thousands of students growing their skills online</p>
            </div>
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div className="login-right">
          <div className="login-form-box">

            <h2 style={styles.welcomeTitle}>Welcome to EduNest..!</h2>

            {/* TABS */}
            <div style={styles.tabs}>
              <Link to="/login"  style={styles.activeTab}>Login</Link>
              <Link to="/signup" style={styles.inactiveTab}>Register</Link>
            </div>

            <p style={styles.tagline}>
              Welcome back! Please enter your credentials to access your learning dashboard.
            </p>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your Email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrap}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your Password"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.passwordInput}
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

              <div style={styles.forgotRow}>
                <label style={styles.rememberMe}>
                  <input type="checkbox" style={{ marginRight: '6px' }} />
                  Rememebr me
                </label>
                <a href="/forgot" style={styles.forgotLink}>Forgot Password ?</a>
              </div>

              <button type="submit" style={styles.btn} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

            </form>
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
  inactiveTab: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#00b4b4',
    padding: '11px 0',
    textDecoration: 'none',
    fontSize: '15px',
    textAlign: 'center',
  },
  tagline: {
    color: '#888',
    fontSize: '14px',
    lineHeight: '1.7',
    marginBottom: '24px',
  },
  error: {
    backgroundColor: '#fdecea',
    color: '#e74c3c',
    padding: '10px 14px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  inputGroup: { marginBottom: '20px' },
  label: {
    display: 'block',
    color: '#333',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '13px 18px',
    borderRadius: '30px',
    border: '1.5px solid #d0d0d0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#333',
    backgroundColor: '#fff',
  },
  passwordWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    width: '100%',
    padding: '13px 50px 13px 18px',
    borderRadius: '30px',
    border: '1.5px solid #d0d0d0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#333',
    backgroundColor: '#fff',
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
  forgotRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  rememberMe: {
    color: '#555',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  forgotLink: {
    color: '#555',
    fontSize: '13px',
    textDecoration: 'none',
  },
  btn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#00b4b4',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default Login;