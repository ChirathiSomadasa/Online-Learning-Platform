import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllCourses, createCourse, updateCourse, deleteCourse,
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
import SchoolIcon           from '@mui/icons-material/School';
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';
import onlineCourse from '../images/course/online_course.png';
import bannerTeacher from '../images/course/course_instructor.png';

const EMPTY_FORM = {
  title: '', description: '', instructor: '',
  category: '', duration: '', totalSeats: 30, status: 'active',
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
      setCourses(data.filter(c => c.instructorId === user?._id));
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
      title: course.title || '', description: course.description || '',
      instructor: course.instructor || '', category: course.category || '',
      duration: course.duration || '', totalSeats: course.totalSeats || 30,
      status: course.status || 'active',
    });
    setFormError(''); setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const resetForm  = () => setForm(editingId ? { ...form } : { ...EMPTY_FORM, instructor: user?.name || '' });

  const instructorMismatch = form.instructor.trim() !== '' &&
    form.instructor.trim().toLowerCase() !== (user?.name || '').toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.instructor || !form.category) {
      setFormError('Please fill in all required fields.'); return;
    }
    setSaving(true); setFormError('');
    try {
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
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
        .hero-btn-primary:hover  { background-color: #e67e22 !important; transform: translateY(-2px); }
        .hero-btn-secondary:hover { background-color: #fff3e0 !important; }
        .form-input-focus:focus  { border-color: #00b4b4 !important; box-shadow: 0 0 0 3px rgba(0,180,180,0.12) !important; outline: none; }
        .float-badge { animation: float 3s ease-in-out infinite; }
        .float-badge-2 { animation: float 3s ease-in-out infinite 1.5s; }
      `}</style>

      <div style={styles.page}>

        {/* ── HERO BANNER ── */}
        <section style={styles.hero}>
          <div style={styles.blob1} />
          <div style={styles.blob2} />

          <div style={styles.heroInner}>
            {/* LEFT — text */}
            <div style={styles.heroLeft}>
              <span style={styles.heroEyebrow}>Instructor Panel</span>
              <h1 style={styles.heroTitle}>
                Manage &amp; Grow<br />Your Courses
              </h1>
              <p style={styles.heroSub}>
                Welcome back, <strong>{user?.name}</strong>! Create new courses, track enrollments,
                and inspire students with your expertise.
              </p>
              <div style={styles.heroBtns}>
                <button className="hero-btn-secondary" style={styles.heroBtnSecondary}
                  onClick={() => document.getElementById('course-list-section').scrollIntoView({ behavior: 'smooth' })}>
                  View My Courses
                </button>
              </div>
            </div>

            {/* RIGHT — decorative */}
            <div style={styles.heroRight}>
              <div style={styles.heroCircle}>
                <img
                                src={bannerTeacher}
                                alt="Teacher with Laptop"
                                style={{ width: '500px', objectFit: 'contain', borderRadius: '12px' }}
                              />
              </div>
              <div style={{ ...styles.floatBadge, top: '10%', right: '-15%' }} className="float-badge">
                <MenuBookIcon style={{ fontSize: '16px', color: '#f39c12' }} />
                <span style={styles.floatBadgeText}>{courses.length} Courses</span>
              </div>
              <div style={{ ...styles.floatBadge, bottom: '-10%', left: '-5%' }} className="float-badge-2">
                <GroupIcon style={{ fontSize: '16px', color: '#f39c12' }} />
                <span style={styles.floatBadgeText}>{totalStudents} Students</span>
              </div>
              <div style={{ ...styles.floatBadge, bottom: '18%', right: '-2%' }} className="float-badge">
                <TrendingUpIcon style={{ fontSize: '16px', color: '#f39c12' }} />
                <span style={styles.floatBadgeText}>Track Progress</span>
              </div>
              <div style={{ ...styles.dot, top: '120%', left: '-25%', width: '14px', height: '14px', opacity: 0.5 }} />
              <div style={{ ...styles.dot, bottom: '25%', right: '-25%', width: '20px', height: '20px', opacity: 0.3 }} />
              <div style={{ ...styles.dot, top: '55%', left: '-38%', width: '10px', height: '10px', opacity: 0.4 }} />
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
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

        {/* ── COURSE LIST ── */}
        <div id="course-list-section" style={styles.container}>
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

            {/* LEFT */}
            <div style={styles.modalLeft}>
                          <img
                            src={onlineCourse}
                            alt="Online Course"
                            style={{ width: '320px', marginBottom: '20px', objectFit: 'contain', borderRadius: '12px' }}
                          />
                          <p style={styles.illustrationTitle}>Add New Course</p>
                          <p style={styles.illustrationSub}>
                  Fill in the details to publish{'\n'}a new course for students
                </p>
                        </div>

            {/* RIGHT */}
            <div style={styles.modalRight}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{editingId ? 'Edit Course' : 'Add New Course'}</h2>
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
                      placeholder="Enter the course title" value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description *</label>
                    <textarea className="form-input-focus"
                      style={{ ...styles.input, resize: 'vertical', minHeight: '80px', borderRadius: '8px' }}
                      placeholder="Enter description of the course" value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>
                        Instructor * <span style={styles.labelHint}>(display name)</span>
                      </label>
                      <input className="form-input-focus"
                        style={{ ...styles.input, borderColor: instructorMismatch ? '#f39c12' : undefined }}
                        placeholder="Instructor display name" value={form.instructor}
                        onChange={e => setForm({ ...form, instructor: e.target.value })} />
                      {instructorMismatch && (
                        <div style={styles.mismatchAlert}>
                          <WarningAmberIcon style={{ fontSize: '15px', color: '#b7770d', flexShrink: 0 }} />
                          <span>This course will be owned by <strong>{user?.name}</strong> and appear in your My Courses, regardless of the display name entered.</span>
                        </div>
                      )}
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Category *</label>
                      <input className="form-input-focus" style={styles.input}
                        placeholder="e.g. Programming" value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })} />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Duration</label>
                      <input className="form-input-focus" style={styles.input}
                        placeholder="e.g. 8 weeks" value={form.duration}
                        onChange={e => setForm({ ...form, duration: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Total Seats</label>
                      <input className="form-input-focus" style={styles.input}
                        type="number" min="1" value={form.totalSeats}
                        onChange={e => setForm({ ...form, totalSeats: parseInt(e.target.value) || 30 })} />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status</label>
                    <select className="form-input-focus" style={styles.input}
                      value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                </div>

                <div style={styles.modalActions}>
                  <button type="button" style={styles.resetBtn} className="reset-btn-hover" onClick={resetForm}>RESET</button>
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
              <button style={{ ...styles.confirmBtn, backgroundColor: '#e74c3c' }} onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast.show && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === 'error' ? '#e74c3c' : '#00b4b4', animation: 'toastIn 0.3s ease forwards' }}>
          {toast.msg}
        </div>
      )}
    </>
  );
};

const styles = {
  page: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh' },

  // ── Hero ──
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #fae9d7 0%, #f8e3bf 50%, #fdd79f 100%)',
    padding: '70px 60px', overflow: 'hidden', minHeight: '380px',
  },
  blob1: {
    position: 'absolute', top: '-60px', right: '35%',
    width: '240px', height: '240px', borderRadius: '50%',
    background: 'rgba(243, 157, 18, 0.31)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-40px', right: '-1%',
    width: '180px', height: '180px', borderRadius: '50%',
    background: 'rgba(243,156,18,0.31)', pointerEvents: 'none',
  },
  heroInner: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '40px',
    maxWidth: '1100px', margin: '0 auto',
  },
  heroLeft:   { flex: 1, maxWidth: '500px' },
  heroEyebrow: {
    display: 'inline-block', backgroundColor: '#f39c12', color: '#fff',
    padding: '5px 16px', borderRadius: '20px',border: '1.8px solid #fff',
    fontSize: '13px', fontWeight: '600', marginBottom: '18px',
  },
  heroTitle: { fontSize: '48px', fontWeight: '800', color: '#8b3801', margin: '0 0 18px', lineHeight: '1.2' },
  heroSub:   { fontSize: '20px', color: '#463003', lineHeight: '1.7', margin: '0 0 30px' },
  heroBtns:  { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  heroBtnPrimary: {
    backgroundColor: '#f39c12', color: '#fff', border: 'none',
    padding: '13px 28px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '15px', fontWeight: '700', transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(243,156,18,0.3)',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  heroBtnSecondary: {
    backgroundColor: '#fff', color: '#f39c12',
    border: '1.5px solid #f39c12', padding: '13px 28px',
    borderRadius: '8px', cursor: 'pointer',
    fontSize: '15px', fontWeight: '700', transition: 'all 0.2s',
  },
  heroRight: { position: 'relative', width: '360px', height: '300px', flexShrink: 0 },
  heroCircle: {
    position: 'absolute', top: '65%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '480px', height: '480px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 12px 40px rgba(243,156,18,0.35)',
  },
  floatBadge: {
    position: 'absolute', backgroundColor: '#fff', borderRadius: '30px',
    padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '7px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '600',
    color: '#2c3e50', whiteSpace: 'nowrap',
  },
  floatBadgeText: { fontSize: '14px', color: '#2c3e50', fontWeight: '600' },
  dot: { position: 'absolute', borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)' },

  // ── Stats ──
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

  errorBox: { backgroundColor: '#fdecea', color: '#e74c3c', padding: '14px 18px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' },
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

  tableWrap: { backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 3px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' },
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
    backgroundColor: '#e8fafa', color: '#00b4b4', padding: '4px 12px',
    borderRadius: '15px', fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  barWrap: { height: '6px', backgroundColor: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' },
  statusBadge: { padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' },
  editBtn: {
    backgroundColor: '#e8fafa', color: '#00b4b4', border: 'none',
    padding: '7px 14px', borderRadius: '7px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
  },
  deleteBtn: {
    backgroundColor: '#fdecea', color: '#e74c3c', border: 'none',
    padding: '7px 14px', borderRadius: '7px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
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
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', overflow: 'hidden',
  },
  modalLeft: { width: '270px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalImgWrap: { width: '100%', height: '220px', flexShrink: 0, overflow: 'hidden' },
  modalImg: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' },
  modalLeftBottom: {
    flex: 1, background: 'linear-gradient(180deg, #f9c76a 0%, #f39c12 60%, #e67e22 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px 22px', textAlign: 'center',
  },
  illustrationTitle: { fontSize: '20px', fontWeight: '700', color: '#5a2d00', margin: '0 0 8px' },
  illustrationSub: { fontSize: '13px', color: '#7a4400', lineHeight: '1.65', margin: 0, whiteSpace: 'pre-line' },

  modalRight: { flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  modalTitle: { fontSize: '20px', color: '#2c3e50', fontWeight: '700', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px' },

  formError: { backgroundColor: '#fdecea', color: '#e74c3c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' },
  formFields: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow:    { display: 'flex', gap: '14px' },
  formGroup:  { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  label:      { fontSize: '13px', fontWeight: '600', color: '#555' },
  labelHint:  { fontSize: '11px', fontWeight: '400', color: '#aaa' },
  input: {
    padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0',
    fontSize: '14px', backgroundColor: '#fafafa', color: '#2c3e50',
    transition: 'border-color 0.2s, box-shadow 0.2s', width: '100%', boxSizing: 'border-box',
  },
  mismatchAlert: {
    display: 'flex', alignItems: 'flex-start', gap: '7px',
    backgroundColor: '#fffbe6', border: '1px solid #ffe58f',
    borderRadius: '7px', padding: '9px 12px',
    fontSize: '12px', color: '#7a5a00', lineHeight: '1.55', marginTop: '5px',
  },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' },
  resetBtn: {
    padding: '10px 30px', backgroundColor: '#fff', color: '#f39c12',
    border: '1.5px solid #f39c12', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '700', letterSpacing: '0.06em', transition: 'background-color 0.2s',
  },
  confirmBtn: {
    padding: '10px 30px', backgroundColor: '#f39c12', color: '#fff',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '700', letterSpacing: '0.06em', transition: 'background-color 0.2s',
  },
  toast: {
    position: 'fixed', bottom: '24px', right: '24px', color: '#fff',
    padding: '13px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
    boxShadow: '0 6px 24px rgba(0,0,0,0.18)', zIndex: 400, maxWidth: '320px',
  },
  modalLeft: {
    width: '270px', flexShrink: 0,
    background: 'linear-gradient(155deg,  #e6940f 45%, #eead58 60%, #f0cd91 80%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '30px 28px 80px', textAlign: 'center',
  },
};

export default MyCourses;