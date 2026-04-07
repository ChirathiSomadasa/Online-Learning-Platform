import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, updatePassword, deleteProfile } from '../services/authService';
import { getMyPayments } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import EmailIcon         from '@mui/icons-material/Email';
import BadgeIcon         from '@mui/icons-material/Badge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon        from '@mui/icons-material/Logout';
import EditIcon          from '@mui/icons-material/Edit';
import LockIcon          from '@mui/icons-material/Lock';
import DeleteIcon        from '@mui/icons-material/Delete';
import SaveIcon          from '@mui/icons-material/Save';
import CloseIcon         from '@mui/icons-material/Close';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import PaymentIcon       from '@mui/icons-material/Payment';
import ReceiptLongIcon   from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import CancelIcon        from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const Profile = () => {
  const { token, logout } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'payments'

  // Payment history
  const [payments, setPayments]         = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError]     = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState(null);

  // Edit profile form
  const [editName, setEditName]   = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [passLoading, setPassLoading]           = useState(false);
  const [passError, setPassError]               = useState('');
  const [passSuccess, setPassSuccess]           = useState('');

  // Delete form
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading]         = useState(false);
  const [deleteError, setDeleteError]             = useState('');

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

  // Fetch payments when payments tab is opened
  useEffect(() => {
    if (activeTab !== 'payments') return;
    const fetchPayments = async () => {
      setPaymentsLoading(true); setPaymentsError('');
      try {
        const data = await getMyPayments();
        setPayments(data);
      } catch {
        setPaymentsError('Failed to load payment history.');
      } finally {
        setPaymentsLoading(false);
      }
    };
    fetchPayments();
  }, [activeTab]);

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
    if (newPassword !== confirmPassword) { setPassError('New passwords do not match.'); return; }
    if (newPassword.length < 6) { setPassError('New password must be at least 6 characters.'); return; }
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
    if (deleteConfirmText !== 'DELETE') { setDeleteError('Please type DELETE to confirm.'); return; }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded': return <CheckCircleIcon style={{ fontSize: '16px', color: '#0d9468' }} />;
      case 'failed':
      case 'cancelled': return <CancelIcon style={{ fontSize: '16px', color: '#e74c3c' }} />;
      case 'refunded':  return <ReceiptLongIcon style={{ fontSize: '16px', color: '#7a5500' }} />;
      default:          return <HourglassEmptyIcon style={{ fontSize: '16px', color: '#aaa' }} />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'succeeded': return { bg: '#e0fcf3', color: '#0d9468', border: '#99e8cc' };
      case 'failed':    return { bg: '#fdecea', color: '#e74c3c', border: '#f5c6c2' };
      case 'cancelled': return { bg: '#fdecea', color: '#e74c3c', border: '#f5c6c2' };
      case 'refunded':  return { bg: '#fff8e6', color: '#7a5500', border: '#f5d98a' };
      default:          return { bg: '#f5f5f5', color: '#888', border: '#ddd' };
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
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,180,180,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(0,180,180,0); }
        }

        .profile-page { animation: fadeUp 0.5s ease both; }
        .action-btn { transition: all 0.2s ease !important; }
        .action-btn:hover { transform: translateY(-2px) !important; filter: brightness(1.07); }
        .action-btn:active { transform: translateY(0) !important; }
        .detail-row { transition: background 0.15s; }
        .detail-row:hover { background: rgba(0,180,180,0.04); border-radius: 12px; }

        .tab-btn {
          padding: 16px 24px;
          background: none; border: none;
          font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          color: #7f9999;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .tab-btn.active {
          color: #00b4b4;
          border-bottom: 3px solid #00b4b4;
        }
        .tab-btn:hover { color: #00b4b4; }

        .payment-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px;
          border-radius: 12px;
          background: #f8fdfd;
          border: 1px solid #d4e8e8;
          margin-bottom: 12px;
          transition: box-shadow 0.15s;
        }
        .payment-row:hover { box-shadow: 0 4px 16px rgba(0,180,180,0.12); }

        .overlay {
          position: fixed; inset: 0;
          background: rgba(10, 30, 30, 0.55);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal {
          background: #fff; border-radius: 20px;
          width: 100%; max-width: 440px;
          padding: 36px 32px;
          animation: modalIn 0.25s ease both;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
        }
        .modal-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: #0d2626; margin-bottom: 6px; }
        .modal-sub { font-size: 13px; color: #7f9999; margin-bottom: 24px; }
        .form-group { margin-bottom: 18px; }
        .form-label {
          display: block; font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #4a7070; margin-bottom: 7px;
        }
        .form-input {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #d4e8e8; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #0d2626; background: #f8fdfd;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none;
        }
        .form-input:focus { border-color: #00b4b4; box-shadow: 0 0 0 3px rgba(0,180,180,0.12); background: #fff; }
        .form-input::placeholder { color: #aac8c8; }
        .btn-primary {
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #00b4b4, #007a7a);
          color: #fff; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; margin-top: 4px;
        }
        .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-danger {
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #fff; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; margin-top: 4px;
        }
        .btn-danger:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-ghost {
          width: 100%; padding: 11px; background: #f0f5f5; color: #4a7070;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer; margin-top: 10px; transition: all 0.2s;
        }
        .btn-ghost:hover { background: #e0eeee; }
        .alert-success {
          background: #e8faf5; color: #1a7a55; border: 1px solid #b3ecd8;
          border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 500; margin-bottom: 16px;
        }
        .alert-error {
          background: #fef0ef; color: #c0392b; border: 1px solid #f5c6c2;
          border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 500; margin-bottom: 16px;
        }
        .delete-warning {
          background: #fff8e6; border: 1px solid #f5d98a; border-radius: 10px;
          padding: 14px 16px; margin-bottom: 20px;
          display: flex; gap: 10px; align-items: flex-start;
        }
        .delete-warning-text { font-size: 13px; color: #7a5500; line-height: 1.6; }
      `}</style>

      <div style={styles.page}>
        <div className="profile-page" style={styles.container}>

          {/* ── Header ── */}
          <div style={styles.profileHeader}>
            <div style={styles.headerContent}>
              <div style={styles.avatarRing}>
                <div style={styles.avatar}>
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div style={styles.headerInfo}>
                <h1 style={styles.name}>{profile?.name}</h1>
                <span style={styles.roleBadge}>{profile?.role}</span>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={styles.tabsContainer}>
            <button
              className={`tab-btn${activeTab === 'profile' ? ' active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <BadgeIcon style={{ fontSize: '18px' }} /> Profile
            </button>
            <button
              className={`tab-btn${activeTab === 'payments' ? ' active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <PaymentIcon style={{ fontSize: '18px' }} /> Payment History
            </button>
          </div>

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <>
              <div style={styles.contentWrapper}>
                <div style={styles.detailsSection}>
                  <h3 style={styles.sectionTitle}>Profile Information</h3>
                  <div style={styles.detailsGrid}>
                    {[
                      { icon: <EmailIcon style={styles.icon} />, label: 'Email', value: profile?.email },
                      { icon: <BadgeIcon style={styles.icon} />, label: 'Full Name', value: profile?.name },
                      {
                        icon: <CalendarTodayIcon style={styles.icon} />, label: 'Joined',
                        value: new Date(profile?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="detail-row" style={styles.detailCard}>
                        <div style={styles.iconWrapper}>{icon}</div>
                        <div style={styles.detailContent}>
                          <span style={styles.detailLabel}>{label}</span>
                          <span style={styles.detailValue}>{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.actionsSection}>
                  <h3 style={styles.sectionTitle}>Account Actions</h3>
                  <div style={styles.actionsGrid}>
                    <button className="action-btn" onClick={() => openModal('editProfile')} style={styles.editBtn}>
                      <EditIcon style={{ fontSize: '20px' }} /> Edit Profile
                    </button>
                    <button className="action-btn" onClick={() => openModal('editPassword')} style={styles.passwordBtn}>
                      <LockIcon style={{ fontSize: '20px' }} /> Change Password
                    </button>
                    <button className="action-btn" onClick={() => { logout(); navigate('/login'); }} style={styles.logoutBtn}>
                      <LogoutIcon style={{ fontSize: '20px' }} /> Logout
                    </button>
                    <button className="action-btn" onClick={() => openModal('deleteAccount')} style={styles.deleteBtn}>
                      <DeleteIcon style={{ fontSize: '20px' }} /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Payment History Tab ── */}
          {activeTab === 'payments' && (
            <div style={styles.contentWrapper}>
              {paymentsLoading && (
                <div style={{ textAlign: 'center', padding: '80px 40px' }}>
                  <div style={styles.spinner} />
                  <p style={{ color: '#7f9999', marginTop: '16px', fontSize: '15px' }}>Loading payments...</p>
                </div>
              )}

              {paymentsError && (
                <div style={{ background: '#fef0ef', color: '#c0392b', border: '1px solid #f5c6c2', borderRadius: '12px', padding: '16px 20px', fontSize: '14px' }}>
                  {paymentsError}
                </div>
              )}

              {!paymentsLoading && !paymentsError && payments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 40px' }}>
                  <ReceiptLongIcon style={{ fontSize: '64px', color: '#d4e8e8', marginBottom: '20px' }} />
                  <p style={{ color: '#7f9999', fontSize: '18px', fontWeight: '600' }}>No payments yet</p>
                  <p style={{ color: '#aac8c8', fontSize: '14px', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>Your payment history will appear here after enrolling in paid courses.</p>
                </div>
              )}

              {!paymentsLoading && payments.length > 0 && (
                <div style={styles.paymentsSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <h3 style={styles.sectionTitle}>Payment History</h3>
                    <p style={{ fontSize: '13px', color: '#7f9999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {payments.length} transaction{payments.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div style={styles.paymentsList}>
                    {payments.map((payment) => {
                      const statusStyle = getStatusStyle(payment.status);
                      return (
                        <div key={payment._id} className="payment-row" style={styles.paymentRow}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0d2626', marginBottom: '4px' }}>
                              {payment.courseTitle || 'Course'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#7f9999' }}>
                              {new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                            <p style={{ fontSize: '16px', fontWeight: '700', color: '#0d2626', minWidth: '80px', textAlign: 'right' }}>
                              ${(payment.amount / 100).toFixed(2)}
                            </p>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1.5px solid ${statusStyle.border}`,
                              textTransform: 'capitalize',
                            }}>
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Total summary ── */}
                  <div style={styles.totalSummary}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: '500' }}>
                        Total Spent
                      </p>
                    </div>
                    <p style={{ color: '#fff', fontSize: '28px', fontWeight: '700' }}>
                      ${(payments
                        .filter(p => p.status === 'succeeded')
                        .reduce((sum, p) => sum + p.amount, 0) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
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
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    backgroundColor: '#f5fafa', fontFamily: "'DM Sans', sans-serif",
  },
  centered: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '14px',
  },
  spinner: {
    width: '40px', height: '40px', border: '3px solid #d4e8e8',
    borderTop: '3px solid #00b4b4', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', margin: '0 auto',
  },
  loadingText: { fontSize: '15px', color: '#7f9999' },
  errorText:   { fontSize: '15px', color: '#e74c3c' },
  container: {
    width: '100%', overflow: 'hidden',
  },
  profileHeader: {
    background: 'linear-gradient(135deg, #00b4b4 0%, #007a7a 100%)',
    padding: '60px 40px 50px', position: 'relative',
  },
  headerContent: {
    display: 'flex', alignItems: 'flex-end', gap: '32px',
    maxWidth: '1200px', margin: '0 auto',
  },
  avatarRing: {
    width: '120px', height: '120px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'pulse 2.5s ease-in-out infinite',
  },
  avatar: {
    width: '106px', height: '106px', borderRadius: '50%',
    backgroundColor: '#fff', color: '#00b4b4',
    fontSize: '48px', fontFamily: "'DM Serif Display', serif",
    fontWeight: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  headerInfo: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '12px',
  },
  name: {
    color: '#fff', fontSize: '36px', fontFamily: "'DM Serif Display', serif",
    fontWeight: 'normal', margin: '0', letterSpacing: '0.01em',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff',
    padding: '8px 20px', borderRadius: '24px', fontSize: '13px', width: 'fit-content',
    textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600',
    border: '1.5px solid rgba(255,255,255,0.3)',
  },
  tabsContainer: {
    display: 'flex', borderBottom: '2px solid #e5f0f0',
    maxWidth: '1200px', margin: '0 auto', width: '100%', paddingX: '40px',
  },
  contentWrapper: {
    maxWidth: '1200px', margin: '0 auto', width: '100%',
    padding: '40px', paddingBottom: '60px',
  },
  detailsSection: {
    marginBottom: '60px',
  },
  sectionTitle: {
    fontSize: '20px', fontWeight: '600', color: '#0d2626',
    marginBottom: '24px', fontFamily: "'DM Serif Display', serif",
    letterSpacing: '0.01em',
  },
  detailsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  detailCard: {
    display: 'flex', alignItems: 'flex-start', gap: '16px',
    padding: '20px', borderRadius: '12px', backgroundColor: '#f8fdfd',
    border: '1.5px solid #d4e8e8', cursor: 'default',
  },
  iconWrapper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '44px', height: '44px', borderRadius: '10px',
    backgroundColor: 'rgba(0, 180, 180, 0.1)', flexShrink: 0,
  },
  icon:        { color: '#00b4b4', fontSize: '22px' },
  detailContent: {
    display: 'flex', flexDirection: 'column', gap: '4px', flex: 1,
  },
  detailLabel: { color: '#7f9999', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' },
  detailValue: { color: '#0d2626', fontSize: '15px', fontWeight: '500' },
  
  actionsSection: {},
  actionsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  editBtn: {
    padding: '16px', backgroundColor: '#e8f7f7', color: '#007a7a',
    border: '1.5px solid #b3e0e0', borderRadius: '12px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
  },
  passwordBtn: {
    padding: '16px', backgroundColor: '#eef0ff', color: '#4a55a2',
    border: '1.5px solid #c5caf5', borderRadius: '12px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
  },
  logoutBtn: {
    padding: '16px', backgroundColor: '#fff5f5', color: '#c0392b',
    border: '1.5px solid #f5c6c2', borderRadius: '12px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
  },
  deleteBtn: {
    padding: '16px', backgroundColor: '#fff8f0', color: '#c0550b',
    border: '1.5px solid #f5d0a9', borderRadius: '12px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
  },
  paymentsSection: {
    display: 'flex', flexDirection: 'column',
  },
  paymentsList: {
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  paymentRow: {
    paddingX: '24px',
  },
  totalSummary: {
    marginTop: '40px', padding: '32px 28px',
    borderRadius: '12px', background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
};

export default Profile;
