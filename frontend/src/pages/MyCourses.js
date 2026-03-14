import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../services/courseService';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon             from '@mui/icons-material/Edit';
import DeleteOutlineIcon    from '@mui/icons-material/DeleteOutline';
import CloseIcon            from '@mui/icons-material/Close';
import GroupIcon            from '@mui/icons-material/Group';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import MenuBookIcon         from '@mui/icons-material/MenuBook';
import EventSeatIcon        from '@mui/icons-material/EventSeat';
import WarningAmberIcon     from '@mui/icons-material/WarningAmber';
import onlineCourse from '../images/course/online_course.png';

const EMPTY_FORM = {
  title: '', description: '', instructor: '',
  category: '', duration: '',
  totalSeats: 30, status: 'active',
};

const MyCourses = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState({ show: false, msg: '', type: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    if (user && user.role !== 'instructor') navigate('/student-home');
  }, [user, navigate]);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true); setError('');
    try {
      const data = await getAllCourses();
      // Filter strictly by instructorId — display name is irrelevant for ownership
      const mine = data.filter(c => c.instructorId === user?._id);
      setCourses(mine);
    } catch {
      setError('Failed to load courses. Make sure the Course Catalog Service is running.');
    } finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, instructor: user?.name || '' });
    setFormError(''); setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditingId(course._id);
    setForm({
      title:       course.title        || '',
      description: course.description  || '',
      instructor:  course.instructor   || '',
      category:    course.category     || '',
      duration:    course.duration     || '',
      totalSeats:  course.totalSeats   || 30,
      status:      course.status       || 'active',
    });
    setFormError(''); setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const resetForm  = () => setForm(
    editingId ? { ...form } : { ...EMPTY_FORM, instructor: user?.name || '' }
  );

  // Warn if typed instructor name differs from logged-in user
  const instructorMismatch = form.instructor.trim() !== '' &&
    form.instructor.trim().toLowerCase() !== (user?.name || '').toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.instructor || !form.category) {
      setFormError('Please fill in all required fields.'); return;
    }
    setSaving(true); setFormError('');
    try {
      // Always stamp logged-in user's ID as owner — display name is just cosmetic
      const payload = { ...form, instructorId: user?._id };
      if (editingId) {
        await updateCourse(editingId, payload, token);
        showToast('Course updated successfully ✓');
      } else {
        await createCourse(payload, token);
        showToast('Course created! Notification sent to users ✓');
      }
      closeModal(); fetchCourses();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCourse(deleteId, token);
      showToast('Course deleted successfully');
      setDeleteId(null); fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
      setDeleteId(null);
    } finally { setDeleting(false); }
  };

  const totalStudents = courses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
  const totalSeats    = courses.reduce((s, c) => s + (c.totalSeats    || 0), 0);
  const seatPct = (c) => c.totalSeats > 0 ? Math.min(100, (c.enrolledCount / c.totalSeats) * 100) : 0;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .course-row-hover:hover  { background-color: #fafffe !important; }
        .action-btn-hover:hover  { opacity: 0.85; transform: scale(1.05); }
        .create-btn-hover:hover  { background-color: #e67e22 !important; }
        .confirm-btn-hover:hover { background-color: #e65c00 !important; }
        .reset-btn-hover:hover   { background-color: #fff3e0 !important; }
        .form-input-focus:focus  { border-color: #00b4b4 !important; box-shadow: 0 0 0 3px rgba(0,180,180,0.12) !important; outline: none; }
      `}</style>

      <div style={styles.page}>

        {/* BANNER */}
        <section style={styles.banner}>
          <h1 style={styles.bannerTitle}>My Courses</h1>
          <p style={styles.bannerSubtitle}>
            Manage your course catalog — create, edit, and track enrollments
          </p>
          <span style={styles.badge}>Instructor Panel</span>
        </section>

        {/* STATS */}
        <section style={styles.statsRow}>
          {[
            { icon: <MenuBookIcon    style={styles.statIcon} />, num: courses.length, lbl: 'Total Courses'  },
            { icon: <GroupIcon       style={styles.statIcon} />, num: totalStudents,  lbl: 'Total Enrolled' },
            { icon: <EventSeatIcon   style={styles.statIcon} />, num: totalSeats,     lbl: 'Total Seats'    },
            { icon: <CheckCircleIcon style={styles.statIcon} />,
              num: courses.filter(c => c.status === 'active').length,
              lbl: 'Active Courses' },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statIconWrap}>{s.icon}</div>
              <div>
                <h3 style={styles.statNum}>{s.num}</h3>
                <p style={styles.statLbl}>{s.lbl}</p>
              </div>
            </div>
          ))}
        </section>

        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Course List</h2>
            <button style={styles.createBtn} className="create-btn-hover" onClick={openCreate}>
              <AddCircleOutlineIcon style={{ fontSize: '18px' }} />
              Add New Course
            </button>
          </div>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          {loading && (
            <div style={styles.loadingWrap}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading your courses...</p>
            </div>
          )}

          {!loading && !error && courses.length === 0 && (
            <div style={styles.empty}>
              <p style={styles.emptyIcon}>📚</p>
              <p style={styles.emptyText}>No courses yet</p>
              <p style={styles.emptyHint}>Click "Add New Course" to create your first course</p>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Title', 'Category', 'Duration', 'Enrolled / Seats', 'Capacity', 'Status', 'Actions']
                      .map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => {
                    const pct = seatPct(course);
                    const barColor = pct >= 90 ? '#e74c3c' : pct >= 70 ? '#f39c12' : '#00b4b4';
                    return (
                      <tr key={course._id} style={styles.tr} className="course-row-hover">
                        <td style={styles.td}>
                          <strong style={{ color: '#2c3e50', fontSize: '14px' }}>{course.title}</strong>
                          <p style={{ color: '#aaa', fontSize: '12px', margin: '3px 0 0', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {course.description}
                          </p>
                        </td>
                        <td style={styles.td}><span style={styles.categoryTag}>{course.category}</span></td>
                        <td style={{ ...styles.td, color: '#888', fontSize: '13px' }}>{course.duration || '—'}</td>
                        <td style={{ ...styles.td, color: '#2c3e50', fontSize: '13px' }}>
                          {course.enrolledCount || 0} / {course.totalSeats || 0}
                        </td>
                        <td style={{ ...styles.td, minWidth: '120px' }}>
                          <div style={styles.barWrap}>
                            <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: barColor }} />
                          </div>
                          <p style={{ fontSize: '11px', color: '#aaa', margin: '3px 0 0' }}>{Math.round(pct)}%</p>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: course.status === 'active' ? '#e8fafa' : '#f5f5f5',
                            color:           course.status === 'active' ? '#00b4b4' : '#aaa',
                          }}>
                            {course.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={styles.editBtn} className="action-btn-hover" onClick={() => openEdit(course)}>
                              <EditIcon style={{ fontSize: '15px' }} /> Edit
                            </button>
                            <button style={styles.deleteBtn} className="action-btn-hover" onClick={() => setDeleteId(course._id)}>
                              <DeleteOutlineIcon style={{ fontSize: '15px' }} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {modalOpen && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal} className="modal-anim">

            
          {/* LEFT — illustration panel */}
<div style={styles.modalLeft}>
  <img
    src={onlineCourse}
    alt="Online Course"
    style={{ width: '320px', marginBottom: '20px', objectFit: 'contain', borderRadius: '12px' }}
  />
  <p style={styles.illustrationTitle}>
    {editingId ? 'Edit Course' : 'Add New Course'}
  </p>
  <p style={styles.illustrationSub}>
    {editingId
      ? 'Update the details of\nyour existing course'
      : 'Fill in the details to publish\na new course for students'}
  </p>
</div>

            {/* RIGHT — form panel */}
            <div style={styles.modalRight}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {editingId ? 'Edit Course' : 'Add New Course'}
                </h2>
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
                        placeholder="Instructor display name"
                        value={form.instructor}
                        onChange={e => setForm({ ...form, instructor: e.target.value })} />
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

      {/* ── DELETE CONFIRM ── */}
      {deleteId && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: '400px', display: 'block', padding: '32px' }} className="modal-anim">
            <h2 style={{ fontSize: '18px', color: '#2c3e50', fontWeight: 'bold', marginBottom: '12px' }}>🗑 Delete Course?</h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              This action cannot be undone. The course will be permanently removed.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.resetBtn} onClick={() => setDeleteId(null)} disabled={deleting}>CANCEL</button>
              <button style={{ ...styles.confirmBtn, backgroundColor: '#e74c3c' }}
                onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
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

  container: { padding: '20px 60px 60px' },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle:  { fontSize: '24px', color: '#2c3e50', margin: 0 },
  createBtn: {
    backgroundColor: '#f39c12', color: '#fff', border: 'none',
    padding: '11px 22px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '14px', display: 'flex',
    alignItems: 'center', gap: '7px', transition: 'background-color 0.2s',
  },

  errorBox: {
    backgroundColor: '#fdecea', color: '#e74c3c',
    padding: '14px 18px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px',
  },

  loadingWrap: { textAlign: 'center', padding: '60px' },
  spinner: {
    width: '36px', height: '36px', border: '3px solid #f0f0f0',
    borderTop: '3px solid #00b4b4', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', margin: '0 auto 14px',
  },
  loadingText: { color: '#888', fontSize: '15px' },
  empty:       { textAlign: 'center', padding: '60px 20px' },
  emptyIcon:   { fontSize: '48px', margin: '0 0 10px' },
  emptyText:   { fontSize: '18px', color: '#2c3e50', fontWeight: '600', marginBottom: '6px' },
  emptyHint:   { fontSize: '14px', color: '#aaa' },

  tableWrap: {
    backgroundColor: '#fff', borderRadius: '14px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 16px', textAlign: 'left',
    backgroundColor: '#fff8f0', color: '#f39c12',
    fontSize: '12px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    borderBottom: '2px solid #f0f0f0',
  },
  tr: { transition: 'background-color 0.15s' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },

  categoryTag: {
    backgroundColor: '#e8fafa', color: '#00b4b4',
    padding: '4px 12px', borderRadius: '15px',
    fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  barWrap: { height: '6px', backgroundColor: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' },
  statusBadge: {
    padding: '4px 12px', borderRadius: '15px',
    fontSize: '12px', fontWeight: '700', textTransform: 'capitalize',
  },
  editBtn: {
    backgroundColor: '#e8fafa', color: '#00b4b4', border: 'none',
    padding: '7px 14px', borderRadius: '7px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600', display: 'flex',
    alignItems: 'center', gap: '4px', transition: 'all 0.15s',
  },
  deleteBtn: {
    backgroundColor: '#fdecea', color: '#e74c3c', border: 'none',
    padding: '7px 14px', borderRadius: '7px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600', display: 'flex',
    alignItems: 'center', gap: '4px', transition: 'all 0.15s',
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
    background: 'linear-gradient(155deg,  #e6940f 45%, #eead58 60%, #f0cd91 80%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '30px 28px 80px', textAlign: 'center',
  },
  illustrationTitle: {
    fontSize: '24px', fontWeight: '800', color: '#573205', margin: '0 0 8px',
  },
  illustrationSub: {
    fontSize: '16px', fontWeight: '600', color: '#a05a10', lineHeight: '1.65',
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
    boxShadow: '0 6px 24px rgba(0,0,0,0.18)', zIndex: 400, maxWidth: '320px',
  },
};

export default MyCourses;