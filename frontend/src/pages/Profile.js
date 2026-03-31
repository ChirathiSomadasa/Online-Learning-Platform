import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, updatePassword, deleteProfile } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const Profile = () => {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'editProfile' | 'editPassword' | 'deleteAccount'

  // Edit profile form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Delete form
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const fetchProfile = async () => {
      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch {
        setError('Failed to load profile. Please login again.');
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, navigate, logout]);

  const openModal = (type) => {
    setActiveModal(type);
    setEditError(''); setEditSuccess('');
    setPassError(''); setPassSuccess('');
    setDeleteError(''); setDeleteConfirmText('');
    if (type === 'editProfile') {
      setEditName(profile?.name || '');
      setEditEmail(profile?.email || '');
    }
    if (type === 'editPassword') {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    }
  };

  const closeModal = () => setActiveModal(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      const result = await updateProfile(token, { name: editName, email: editEmail });
      setProfile(prev => ({ ...prev, name: editName, email: editEmail }));
      setEditSuccess(result.message || 'Profile updated successfully!');
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.'); return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.'); return;
    }
    setPassLoading(true); setPassError(''); setPassSuccess('');
    try {
      const result = await updatePassword(token, { currentPassword, newPassword });
      setPassSuccess(result.message || 'Password updated successfully!');
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.'); return;
    }
    setDeleteLoading(true); setDeleteError('');
    try {
      await deleteProfile(token);
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Loading profile...</p>
    </div>
  );

  if (error) return (
    <div style={styles.centered}>
      <p style={styles.errorText}>{error}</p>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,180,180,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(0,180,180,0); }
        }

        .profile-card { animation: fadeUp 0.5s ease both; }
        .action-btn {
          transition: all 0.2s ease !important;
        }
        .action-btn:hover {
          transform: translateY(-2px) !important;
          filter: brightness(1.07);
        }
        .action-btn:active { transform: translateY(0) !important; }

        .detail-row { transition: background 0.15s; }
        .detail-row:hover { background: #f8fffe; border-radius: 8px; }

        .overlay {
          position: fixed; inset: 0;
          background: rgba(10, 30, 30, 0.55);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal {
          background: #fff;
          border-radius: 20px;
          width: 100%; max-width: 440px;
          padding: 36px 32px;
          animation: modalIn 0.25s ease both;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
        }
        .modal-title {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          color: #0d2626;
          margin-bottom: 6px;
        }
        .modal-sub {
          font-size: 13px;
          color: #7f9999;
          margin-bottom: 24px;
        }
        .form-group { margin-bottom: 18px; }
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #4a7070;
          margin-bottom: 7px;
        }
        .form-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #d4e8e8;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #0d2626;
          background: #f8fdfd;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: #00b4b4;
          box-shadow: 0 0 0 3px rgba(0,180,180,0.12);
          background: #fff;
        }
        .form-input::placeholder { color: #aac8c8; }

        .btn-primary {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #00b4b4, #007a7a);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .btn-danger {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .btn-danger:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .btn-ghost {
          width: 100%;
          padding: 11px;
          background: #f0f5f5;
          color: #4a7070;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: #e0eeee; }

        .alert-success {
          background: #e8faf5;
          color: #1a7a55;
          border: 1px solid #b3ecd8;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
        }
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
        .delete-warning {
          background: #fff8e6;
          border: 1px solid #f5d98a;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .delete-warning-text {
          font-size: 13px;
          color: #7a5500;
          line-height: 1.6;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4e8e8, transparent);
          margin: 20px 0;
        }
      `}</style>

      <div style={styles.page}>
        <div className="profile-card" style={styles.card}>

          {/* Header */}
          <div style={styles.profileHeader}>
            <div style={styles.avatarRing}>
              <div style={styles.avatar}>
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <h2 style={styles.name}>{profile?.name}</h2>
            <span style={styles.roleBadge}>{profile?.role}</span>
          </div>

          {/* Details */}
          <div style={styles.details}>
            {[
              { icon: <EmailIcon style={styles.icon} />, label: 'Email', value: profile?.email },
              { icon: <BadgeIcon style={styles.icon} />, label: 'Full Name', value: profile?.name },
              {
                icon: <CalendarTodayIcon style={styles.icon} />, label: 'Joined',
                value: new Date(profile?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="detail-row" style={styles.detailRow}>
                <div style={styles.labelWrap}>{icon}<span style={styles.detailLabel}>{label}</span></div>
                <span style={styles.detailValue}>{value}</span>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          {/* Actions */}
          <div style={styles.actions}>

            <button className="action-btn" onClick={() => openModal('editProfile')} style={styles.editBtn}>
              <EditIcon style={{ fontSize: '17px' }} />
              Edit Profile
            </button>

            <button className="action-btn" onClick={() => openModal('editPassword')} style={styles.passwordBtn}>
              <LockIcon style={{ fontSize: '17px' }} />
              Change Password
            </button>

            <button className="action-btn" onClick={() => { logout(); navigate('/login'); }} style={styles.logoutBtn}>
              <LogoutIcon style={{ fontSize: '17px' }} />
              Logout
            </button>

            <button className="action-btn" onClick={() => openModal('deleteAccount')} style={styles.deleteBtn}>
              <DeleteIcon style={{ fontSize: '17px' }} />
              Delete Account
            </button>

          </div>
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {activeModal === 'editProfile' && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div>
                <p className="modal-title">Edit Profile</p>
                <p className="modal-sub">Update your name and email address</p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aac8c8', marginTop: '4px' }}>
                <CloseIcon />
              </button>
            </div>

            {editSuccess && <div className="alert-success">{editSuccess}</div>}
            {editError   && <div className="alert-error">{editError}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <button className="btn-primary" type="submit" disabled={editLoading}>
                <SaveIcon style={{ fontSize: '17px' }} />
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn-ghost" type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {activeModal === 'editPassword' && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div>
                <p className="modal-title">Change Password</p>
                <p className="modal-sub">Choose a strong, unique password</p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aac8c8', marginTop: '4px' }}>
                <CloseIcon />
              </button>
            </div>

            {passSuccess && <div className="alert-success">{passSuccess}</div>}
            {passError   && <div className="alert-error">{passError}</div>}

            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required />
              </div>
              <button className="btn-primary" type="submit" disabled={passLoading}>
                <LockIcon style={{ fontSize: '17px' }} />
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button className="btn-ghost" type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE ACCOUNT MODAL ── */}
      {activeModal === 'deleteAccount' && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <p className="modal-title" style={{ color: '#c0392b' }}>Delete Account</p>
                <p className="modal-sub">This action cannot be undone</p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aac8c8', marginTop: '4px' }}>
                <CloseIcon />
              </button>
            </div>

            <div className="delete-warning">
              <WarningAmberIcon style={{ color: '#e6a817', fontSize: '20px', flexShrink: 0, marginTop: '1px' }} />
              <p className="delete-warning-text">
                Deleting your account will permanently remove all your data, enrollments, and history.
                <strong> This cannot be reversed.</strong>
              </p>
            </div>

            {deleteError && <div className="alert-error">{deleteError}</div>}

            <div className="form-group">
              <label className="form-label">Type <strong>DELETE</strong> to confirm</label>
              <input
                className="form-input"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                style={{ borderColor: deleteConfirmText === 'DELETE' ? '#e74c3c' : undefined }}
              />
            </div>

            <button
              className="btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
            >
              <DeleteIcon style={{ fontSize: '17px' }} />
              {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            <button className="btn-ghost" type="button" onClick={closeModal}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  page: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef5f5',
    padding: '40px 20px',
    fontFamily: "'DM Sans', sans-serif",
  },
  centered: {
    minHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid #d4e8e8',
    borderTop: '3px solid #00b4b4',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontSize: '15px', color: '#7f9999' },
  errorText:   { fontSize: '15px', color: '#e74c3c' },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 12px 40px rgba(0,80,80,0.10)',
    width: '100%',
    maxWidth: '480px',
    overflow: 'hidden',
  },
  profileHeader: {
    background: 'linear-gradient(135deg, #00b4b4 0%, #007a7a 100%)',
    padding: '48px 30px 36px',
    textAlign: 'center',
    position: 'relative',
  },
  avatarRing: {
    width: '96px', height: '96px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
    animation: 'pulse 2.5s ease-in-out infinite',
  },
  avatar: {
    width: '82px', height: '82px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    color: '#00b4b4',
    fontSize: '36px',
    fontFamily: "'DM Serif Display', serif",
    fontWeight: 'normal',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
  name: {
    color: '#fff',
    fontSize: '24px',
    fontFamily: "'DM Serif Display', serif",
    fontWeight: 'normal',
    margin: '0 0 10px',
    letterSpacing: '0.01em',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '5px 18px',
    borderRadius: '20px',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  details: { padding: '8px 28px 4px' },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 8px',
    borderBottom: '1px solid #eef5f5',
    cursor: 'default',
  },
  labelWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
  icon: { color: '#00b4b4', fontSize: '19px' },
  detailLabel: { color: '#7f9999', fontSize: '13px', fontWeight: '600', letterSpacing: '0.03em' },
  detailValue: { color: '#0d2626', fontSize: '14px', maxWidth: '230px', wordBreak: 'break-all', textAlign: 'right' },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #d4e8e8, transparent)',
    margin: '8px 0 0',
  },
  actions: {
    padding: '20px 28px 28px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  editBtn: {
    padding: '12px',
    backgroundColor: '#e8f7f7',
    color: '#007a7a',
    border: '1.5px solid #b3e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    fontFamily: "'DM Sans', sans-serif",
  },
  passwordBtn: {
    padding: '12px',
    backgroundColor: '#eef0ff',
    color: '#4a55a2',
    border: '1.5px solid #c5caf5',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    fontFamily: "'DM Sans', sans-serif",
  },
  logoutBtn: {
    padding: '12px',
    backgroundColor: '#fff5f5',
    color: '#c0392b',
    border: '1.5px solid #f5c6c2',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    fontFamily: "'DM Sans', sans-serif",
  },
  deleteBtn: {
    padding: '12px',
    backgroundColor: '#fff8f0',
    color: '#c0550b',
    border: '1.5px solid #f5d0a9',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    fontFamily: "'DM Sans', sans-serif",
  },
};

export default Profile;