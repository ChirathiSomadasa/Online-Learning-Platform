import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllCourses, createCourse } from '../services/courseService';

import MenuBookIcon         from '@mui/icons-material/MenuBook';
import SchoolIcon           from '@mui/icons-material/School';
import StarRateIcon         from '@mui/icons-material/StarRate';
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon             from '@mui/icons-material/Edit';
import CloseIcon            from '@mui/icons-material/Close';
import GroupIcon            from '@mui/icons-material/Group';
import WarningAmberIcon     from '@mui/icons-material/WarningAmber';
import onlineCourse from '../images/course/online_course.png';

const EMPTY_FORM = {
  title: '', description: '', instructor: '',
  category: '', duration: '',
  totalSeats: 30, status: 'active',
};

const InstructorHome = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast]         = useState({ show: false, msg: '', type: '' });

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await getAllCourses();
      // Filter strictly by instructorId — the authoritative ownership field
      const mine = data.filter(c => c.instructorId === user?._id);
      setCourses(mine);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  const totalStudents  = courses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
  const activeCourses  = courses.filter(c => c.status === 'active').length;
  const totalSeats     = courses.reduce((s, c) => s + (c.totalSeats    || 0), 0);
  const completionRate = totalSeats > 0 ? Math.round((totalStudents / totalSeats) * 100) : 0;

  const stats = [
    { icon: <MenuBookIcon   style={styles.statIcon} />, num: courses.length,      lbl: 'Total Courses'  },
    { icon: <SchoolIcon     style={styles.statIcon} />, num: totalStudents,        lbl: 'Total Students' },
    { icon: <StarRateIcon   style={styles.statIcon} />, num: activeCourses,        lbl: 'Active Courses' },
    { icon: <TrendingUpIcon style={styles.statIcon} />, num: `${completionRate}%`, lbl: 'Fill Rate'      },
  ];

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, instructor: user?.name || '' });
    setFormError('');
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setForm(EMPTY_FORM); };
  const resetForm  = () => setForm({ ...EMPTY_FORM, instructor: user?.name || '' });

  // Instructor name differs from logged-in user?
  const instructorMismatch = form.instructor.trim() !== '' &&
    form.instructor.trim().toLowerCase() !== (user?.name || '').toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.instructor || !form.category) {
      setFormError('Please fill in all required fields.'); return;
    }
    setSaving(true); setFormError('');
    try {
      // Always stamp the logged-in user's ID as owner — ignore whatever name was typed
      await createCourse({ ...form, instructorId: user?._id }, token);
      showToast('Course created! Notification sent to users ✓');
      closeModal(); fetchCourses();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(-10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .create-btn-hover:hover  { background-color: #e67e22 !important; }
        .confirm-btn-hover:hover { background-color: #e65c00 !important; }
        .reset-btn-hover:hover   { background-color: #fff3e0 !important; }
        .course-row-hover:hover  { background-color: #fafffe !important; }
        .form-input-focus:focus  { border-color:#00b4b4 !important; box-shadow:0 0 0 3px rgba(0,180,180,0.12) !important; outline:none; }
      `}</style>

      <div style={styles.page}>

        {/* BANNER */}
        <section style={styles.banner}>
          <h1 style={styles.bannerTitle}>Instructor Dashboard</h1>
          <p style={styles.bannerSubtitle}>
            Welcome back, <strong>{user?.name}</strong>! Manage your courses and track student progress.
          </p>
          <span style={styles.badge}>Instructor Panel</span>
        </section>

        {/* STATS */}
        <section style={styles.statsRow}>
          {stats.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statIconWrap}>{s.icon}</div>
              <div>
                <h3 style={styles.statNum}>{loading ? '—' : s.num}</h3>
                <p style={styles.statLbl}>{s.lbl}</p>
              </div>
            </div>
          ))}
        </section>

        {/* MY COURSES */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>My Courses</h2>
            <button style={styles.createBtn} className="create-btn-hover" onClick={openCreate}>
              <AddCircleOutlineIcon style={{ fontSize: '18px' }} />
              Create New Course
            </button>
          </div>

          {loading && (
            <div style={styles.loadingWrap}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading courses...</p>
            </div>
          )}

          {!loading && courses.length === 0 && (
            <div style={styles.empty}>
              <p style={styles.emptyText}>No courses yet</p>
              <p style={styles.emptyHint}>Click "Create New Course" to get started</p>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div style={styles.courseList}>
              {courses.map(course => (
                <div key={course._id} style={styles.courseRow} className="course-row-hover">
                  <div style={styles.courseInfo}>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    <div style={styles.courseMetaRow}>
                      <GroupIcon style={styles.metaIcon} />
                      <span style={styles.courseStudents}>
                        {course.enrolledCount || 0} / {course.totalSeats || 0} students enrolled
                      </span>
                    </div>
                  </div>
                  <div style={styles.courseActions}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: course.status === 'active' ? '#e8fafa' : '#fff3e0',
                      color:           course.status === 'active' ? '#00b4b4' : '#f39c12',
                    }}>
                      {course.status}
                    </span>
                    <button style={styles.editBtn} onClick={() => navigate('/my-courses')}>
                      <EditIcon style={{ fontSize: '15px' }} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── CREATE MODAL ── */}
      {modalOpen && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal} className="modal-anim">

            {/* LEFT — illustration panel */}
            <div style={styles.modalLeft}>
              <p style={styles.illustrationTitle}>Add New Course</p>
              <img
                src={onlineCourse}
                alt="Online Course"
                style={{ width: '320px', marginBottom: '20px', objectFit: 'contain', borderRadius: '12px' }}
              />
              <p style={styles.illustrationSub}>
      Fill in the details to publish{'\n'}a new course for students
    </p>
            </div>

            {/* RIGHT — form panel */}
            <div style={styles.modalRight}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add New Course</h2>
                <button style={styles.closeBtn} onClick={closeModal}>
                  <CloseIcon style={{ fontSize: '20px', color: '#bbb' }} />
                </button>
              </div>

              {formError && <div style={styles.formError}>{formError}</div>}

              <form onSubmit={handleSubmit}>
                <div style={styles.formFields}>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Title *</label>
                    <input className="form-input-focus" style={styles.input}
                      placeholder="Enter the course title"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description *</label>
                    <textarea className="form-input-focus"
                      style={{ ...styles.input, resize: 'vertical', minHeight: '80px', borderRadius: '8px' }}
                      placeholder="Enter description of the course"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>
                        Instructor *
                        <span style={styles.labelHint}> (display name)</span>
                      </label>
                      <input className="form-input-focus"
                        style={{ ...styles.input, borderColor: instructorMismatch ? '#f39c12' : undefined }}
                        placeholder="Instructor name"
                        value={form.instructor}
                        onChange={e => setForm({ ...form, instructor: e.target.value })} />
                      {/* Mismatch warning */}
                      {instructorMismatch && (
                        <div style={styles.mismatchAlert}>
                          <WarningAmberIcon style={{ fontSize: '15px', color: '#b7770d', flexShrink: 0 }} />
                          <span>
                            This course will be owned by <strong>{user?.name}</strong> and will appear in your My Courses,
                            regardless of the display name entered.
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Category *</label>
                      <input className="form-input-focus" style={styles.input}
                        placeholder="e.g. Programming"
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })} />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Duration</label>
                      <input className="form-input-focus" style={styles.input}
                        placeholder="e.g. 8 weeks"
                        value={form.duration}
                        onChange={e => setForm({ ...form, duration: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Total Seats</label>
                      <input className="form-input-focus" style={styles.input}
                        type="number" min="1"
                        value={form.totalSeats}
                        onChange={e => setForm({ ...form, totalSeats: parseInt(e.target.value) || 30 })} />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status</label>
                    <select className="form-input-focus" style={styles.input}
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                </div>

                <div style={styles.modalActions}>
                  <button type="button" style={styles.resetBtn} className="reset-btn-hover" onClick={resetForm}>
                    RESET
                  </button>
                  <button type="submit" style={styles.confirmBtn} className="confirm-btn-hover" disabled={saving}>
                    {saving ? 'SAVING...' : 'CONFIRM'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'error' ? '#e74c3c' : '#00b4b4',
          animation: 'toastIn 0.3s ease forwards',
        }}>
          {toast.msg}
        </div>
      )}
    </>
  );
};

const styles = {
  page: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh' },

  banner: { background: 'linear-gradient(135deg, #f39c12, #e67e22)', padding: '60px', color: '#fff' },
  bannerTitle:    { fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px' },
  bannerSubtitle: { fontSize: '17px', opacity: 0.9, margin: '0 0 20px' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff',
    padding: '5px 18px', borderRadius: '20px', fontSize: '13px',
  },

  statsRow: {
    display: 'flex', gap: '20px', padding: '30px 60px',
    flexWrap: 'wrap', justifyContent: 'center',
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '25px 35px',
    display: 'flex', alignItems: 'center', gap: '20px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)', flex: '1', minWidth: '180px',
  },
  statIconWrap: {
    backgroundColor: '#fff3e0', width: '55px', height: '55px',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statIcon: { color: '#f39c12', fontSize: '28px' },
  statNum:  { fontSize: '28px', fontWeight: 'bold', color: '#2c3e50', margin: 0 },
  statLbl:  { color: '#888', fontSize: '13px', margin: 0 },

  section:       { padding: '20px 60px 60px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  sectionTitle:  { fontSize: '26px', color: '#2c3e50', margin: 0 },
  createBtn: {
    backgroundColor: '#f39c12', color: '#fff', border: 'none',
    padding: '10px 22px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '14px', display: 'flex',
    alignItems: 'center', gap: '7px', transition: 'background-color 0.2s',
  },

  loadingWrap: { textAlign: 'center', padding: '60px' },
  spinner: {
    width: '36px', height: '36px', border: '3px solid #f0f0f0',
    borderTop: '3px solid #f39c12', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', margin: '0 auto 14px',
  },
  loadingText: { color: '#888', fontSize: '15px' },
  empty:       { textAlign: 'center', padding: '60px 20px' },
  emptyText:   { fontSize: '18px', color: '#2c3e50', fontWeight: '600', marginBottom: '6px' },
  emptyHint:   { fontSize: '14px', color: '#aaa' },

  courseList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  courseRow: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '25px 30px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)', transition: 'background-color 0.15s',
  },
  courseInfo:     {},
  courseTitle:    { fontSize: '18px', color: '#2c3e50', margin: '0 0 8px' },
  courseMetaRow:  { display: 'flex', alignItems: 'center', gap: '6px' },
  metaIcon:       { color: '#f39c12', fontSize: '16px' },
  courseStudents: { color: '#888', fontSize: '13px' },
  courseActions:  { display: 'flex', alignItems: 'center', gap: '12px' },
  statusBadge: {
    padding: '5px 14px', borderRadius: '15px',
    fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize',
  },
  editBtn: {
    backgroundColor: '#f5f5f5', color: '#555', border: 'none',
    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px',
  },

  // ── Modal ──
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(3px)', zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '18px',
    width: '100%', maxWidth: '800px', maxHeight: '90vh',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    display: 'flex', overflow: 'hidden',
  },

  // Left illustration panel — orange gradient
  modalLeft: {
    width: '270px', flexShrink: 0,
    background: 'linear-gradient(155deg,  #e48c00 45%, #f19823 60%, #f7af32 80%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '30px 28px 80px', textAlign: 'center',
  },
  illustrationTitle: {
    fontSize: '26px', fontWeight: '800', color: 'white', margin: '0 0 8px',
  },
  illustrationSub: {
    fontSize: '18px', fontWeight: '400', color: 'white', lineHeight: '1.65',
    margin: 0, whiteSpace: 'pre-line',
  },

  // Right form panel
  modalRight: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '32px', overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px',
  },
  modalTitle: { fontSize: '20px', color: '#2c3e50', fontWeight: '700', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px',
  },

  formError: {
    backgroundColor: '#fdecea', color: '#e74c3c',
    padding: '10px 14px', borderRadius: '8px',
    marginBottom: '16px', fontSize: '13px',
  },
  formFields: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow:    { display: 'flex', gap: '14px' },
  formGroup:  { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  label:      { fontSize: '13px', fontWeight: '600', color: '#555' },
  labelHint:  { fontSize: '11px', fontWeight: '400', color: '#aaa' },
  input: {
    padding: '11px 14px', borderRadius: '8px',
    border: '1.5px solid #e0e0e0', fontSize: '14px',
    backgroundColor: '#fafafa', color: '#2c3e50',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    width: '100%', boxSizing: 'border-box',
  },

  // Mismatch inline alert
  mismatchAlert: {
    display: 'flex', alignItems: 'flex-start', gap: '7px',
    backgroundColor: '#fffbe6', border: '1px solid #ffe58f',
    borderRadius: '7px', padding: '9px 12px',
    fontSize: '12px', color: '#7a5a00', lineHeight: '1.55', marginTop: '5px',
  },

  modalActions: {
    display: 'flex', gap: '12px', justifyContent: 'flex-end',
    marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f0f0f0',
  },
  resetBtn: {
    padding: '10px 30px',
    backgroundColor: '#fff', color: '#f39c12',
    border: '1.5px solid #f39c12', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px', fontWeight: '700',
    letterSpacing: '0.06em', transition: 'background-color 0.2s',
  },
  confirmBtn: {
    padding: '10px 30px',
    backgroundColor: '#ff8533', color: '#fff',
    border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px', fontWeight: '700',
    letterSpacing: '0.06em', transition: 'background-color 0.2s',
  },

  toast: {
    position: 'fixed', bottom: '24px', right: '24px',
    color: '#fff', padding: '13px 22px', borderRadius: '10px',
    fontSize: '14px', fontWeight: '600',
    boxShadow: '0 6px 24px rgba(0,0,0,0.18)', zIndex: 400,
  },
};

export default InstructorHome;

