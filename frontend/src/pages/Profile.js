import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Profile = () => {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchProfile = async () => {
      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile. Please login again.');
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, navigate, logout]);

  if (loading) {
    return (
      <>
       
        <div style={styles.centered}>
          <p style={styles.loadingText}>Loading profile...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        
        <div style={styles.centered}>
          <p style={styles.errorText}>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
     
      <div style={styles.page}>
        <div style={styles.card}>

          {/* Profile Header */}
          <div style={styles.profileHeader}>
            <div style={styles.avatar}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 style={styles.name}>{profile?.name}</h2>
            <span style={styles.roleBadge}>{profile?.role}</span>
          </div>

          {/* Profile Details */}
          <div style={styles.details}>

            <div style={styles.detailRow}>
              <div style={styles.labelWrap}>
                <EmailIcon style={styles.icon} />
                <span style={styles.detailLabel}>Email</span>
              </div>
              <span style={styles.detailValue}>{profile?.email}</span>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.labelWrap}>
                <BadgeIcon style={styles.icon} />
                <span style={styles.detailLabel}>Full Name</span>
              </div>
              <span style={styles.detailValue}>{profile?.name}</span>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.labelWrap}>
                <CalendarTodayIcon style={styles.icon} />
                <span style={styles.detailLabel}>Joined</span>
              </div>
              <span style={styles.detailValue}>
                {new Date(profile?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>

          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={styles.logoutBtn}
            >
              <LogoutIcon style={{ fontSize: '18px' }} />
              Logout
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    padding: '40px 20px',
  },
  centered: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { fontSize: '18px', color: '#7f8c8d' },
  errorText: { fontSize: '16px', color: '#e74c3c' },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px',
    overflow: 'hidden',
  },
  profileHeader: {
    background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    padding: '50px 30px',
    textAlign: 'center',
  },
  avatar: {
    width: '85px',
    height: '85px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    color: '#00b4b4',
    fontSize: '38px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
  },
  name: { color: '#fff', fontSize: '26px', margin: '0 0 12px' },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
    padding: '5px 20px',
    borderRadius: '20px',
    fontSize: '13px',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  details: { padding: '10px 30px' },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  labelWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  icon: { color: '#00b4b4', fontSize: '20px' },
  detailLabel: { color: '#7f8c8d', fontSize: '14px', fontWeight: '600' },
  detailValue: {
    color: '#2c3e50',
    fontSize: '14px',
    maxWidth: '250px',
    wordBreak: 'break-all',
    textAlign: 'right',
  },
  actions: {
    padding: '20px 30px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  backBtn: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#f0f2f5',
    color: '#2c3e50',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  logoutBtn: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default Profile;