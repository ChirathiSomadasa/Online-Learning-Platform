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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

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

   const myCourses = [
    { id: 1, title: 'Node.js Fundamentals',  students: 28, duration: '8 Weeks',  category: 'Programming', level: 'Beginner',     status: 'Active' },
    { id: 2, title: 'Advanced JavaScript',   students: 15, duration: '6 Weeks',  category: 'Frontend',    level: 'Advanced',     status: 'Active' },
    { id: 3, title: 'API Design',            students: 22, duration: '5 Weeks',  category: 'Backend',     level: 'Intermediate', status: 'Draft'  },
    { id: 4, title: 'Cloud Computing',       students: 18, duration: '10 Weeks', category: 'Cloud',       level: 'Advanced',     status: 'Active' },
    { id: 5, title: 'React for Beginners',   students: 30, duration: '7 Weeks',  category: 'Frontend',    level: 'Beginner',     status: 'Active' },
    { id: 6, title: 'Database Design',       students: 12, duration: '4 Weeks',  category: 'Database',    level: 'Beginner',     status: 'Draft'  },
  ];

  const stats = [
    { icon: <MenuBookIcon   style={styles.statIcon} />, num: courses.length,      lbl: 'Total Courses'  },
    { icon: <SchoolIcon     style={styles.statIcon} />, num: totalStudents,        lbl: 'Total Students' },
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
      {/* HERO BANNER */}
      <section style={styles.heroBanner}>
        <div style={styles.overlay}>
          <div style={styles.heroContent}>
            <span style={styles.badge}>
              <RocketLaunchIcon style={{ fontSize: '14px', marginRight: '6px' }} />
              Instructor Dashboard
            </span>
            <h1 style={styles.bannerTitle}>
              Welcome back, <span style={styles.highlight}>{user?.name || 'Instructor'}</span>!
            </h1>
            <p style={styles.bannerSubtitle}>
              Manage your courses and inspire students every day
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={styles.statsContainer}>
        <div style={styles.statsRow}>
          {stats.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statIconWrap, backgroundColor: `${s.color}18` }}>
                {React.cloneElement(s.icon, { style: { fontSize: '28px', color: s.color } })}
              </div>
              <div>
                <h3 style={styles.statNum}>{s.num}</h3>
                <p style={styles.statLbl}>{s.lbl}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MY COURSES */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>My Courses</h2>
            <p style={styles.sectionSubtitle}>Courses you are currently teaching</p>
          </div>
        </div>

        <div style={styles.courseGrid}>
          {myCourses.map(course => (
            <div key={course.id} style={styles.courseCard}>

              {/* Card Top */}
              <div style={styles.cardHeader}>
                <span style={styles.courseCategory}>{course.category}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: course.status === 'Active' ? '#e8fafa' : '#fff3e0',
                  color:           course.status === 'Active' ? '#49BBBD' : '#f39c12',
                }}>
                  {course.status}
                </span>
              </div>

              {/* Title */}
              <h3 style={styles.courseTitle}>{course.title}</h3>

              {/* Meta */}
              <div style={styles.detailsBox}>
                <div style={styles.metaRow}>
                  <GroupIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.students} Students Enrolled</span>
                </div>
                <div style={styles.metaRow}>
                  <AccessTimeIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.duration}</span>
                </div>
                <div style={styles.metaRow}>
                  <PersonIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>Level: {course.level}</span>
                </div>
              </div>

            </div>
          ))}
          </div>
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
  page: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    backgroundColor: '#f8f9fd',
    minHeight: '100vh',
    paddingBottom: '50px',
  },

  // HERO
  heroBanner: {
    height: '340px',
    backgroundImage: 'url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1920")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(243,156,18,0.45) 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 80px',
  },
  heroContent: {
    maxWidth: '600px',
    color: '#fff',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(5px)',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
  },
  bannerTitle: {
    fontSize: '46px',
    fontWeight: '800',
    margin: '0 0 14px',
    lineHeight: '1.2',
  },
  highlight: { color: '#f39c12' },
  bannerSubtitle: {
    fontSize: '17px',
    opacity: 0.88,
    margin: 0,
    lineHeight: '1.6',
  },

  // STATS
  statsContainer: {
    padding: '30px 80px',
    backgroundColor: '#f8f9fd',
  },
  statsRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    flex: '1',
    minWidth: '220px',
  },
  statIconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: { fontSize: '26px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 },
  statLbl: { color: '#666', fontSize: '13px', margin: 0 },

  // COURSES SECTION
  section: { padding: '10px 80px 60px' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '26px',
    color: '#1a1a1a',
    margin: 0,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: '15px',
    marginTop: '6px',
    marginBottom: 0,
  },

  // COURSE GRID
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '28px',
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '26px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #edf2f7',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  courseCategory: {
    color: '#f39c12',
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statusBadge: {
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  courseTitle: {
    fontSize: '18px',
    color: '#1a1a1a',
    margin: '0 0 18px',
    fontWeight: '700',
    lineHeight: '1.4',
    height: '52px',
    overflow: 'hidden',
  },
  detailsBox: {
    borderTop: '1px solid #f1f3f5',
    paddingTop: '14px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  metaIcon: { color: '#a0aec0', fontSize: '17px' },
  metaText: { color: '#4a5568', fontSize: '14px' },
};

export default InstructorHome;

