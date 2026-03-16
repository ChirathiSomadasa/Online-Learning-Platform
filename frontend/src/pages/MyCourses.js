import React, { useEffect, useState, useCallback } from 'react';
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
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';
import ErrorOutlineIcon     from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon     from '@mui/icons-material/InfoOutlined';
import onlineCourse from '../images/course/online_course.png';
import bannerTeacher from '../images/course/course_instructor.png';
import CategoryComboBox, { normalizeCategory, dedupeCategories } from '../pages/CatergoryComboBox';
import DurationPicker from '../pages/DurationPicker';

// ─── Constants ────────────────────────────────────────────────────────────────


const EMPTY_FORM = {
  title: '', description: '', instructor: '',
  category: '', duration: '', totalSeats: 30, status: 'active',
};

// ─── Validation Logic ─────────────────────────────────────────────────────────

const FIELD_RULES = {
  title: [
    { test: v => v.trim().length > 0,   msg: 'Course Title.' },
    { test: v => v.trim().length >= 5,  msg: 'Title must be at least 5 characters.' },
    { test: v => v.trim().length <= 100, msg: 'Title cannot exceed 100 characters.' },
  ],
  description: [
    { test: v => v.trim().length > 0,   msg: 'Description.' },
    { test: v => v.trim().length <= 1000, msg: 'Description cannot exceed 1000 characters.' },
  ],
  instructor: [
    { test: v => v.trim().length > 0,  msg: 'Instructor Name.' },
    { test: v => v.trim().length >= 2, msg: 'Instructor name must be at least 2 characters.' },
    { test: v => /^[a-zA-Z\s.'-]+$/.test(v.trim()), msg: 'Instructor name can only contain letters, spaces, and basic punctuation.' },
  ],
  category: [
    { test: v => v.trim().length > 0,  msg: 'Category.' },
    { test: v => v.trim().length >= 2, msg: 'Category must be at least 2 characters.' },
    { test: v => v.trim().length <= 50, msg: 'Category cannot exceed 50 characters.' },
  ],
  duration: [
    { test: v => v.trim().length <= 50, msg: 'Duration cannot exceed 50 characters.' },
  ],
  totalSeats: [
    { test: v => !isNaN(v) && Number(v) > 0,    msg: 'Total seats must be a positive number.' },
    { test: v => Number(v) >= 1,                 msg: 'Minimum 1 seat is required.' },
    { test: v => Number(v) <= 1000,              msg: 'Maximum 1000 seats allowed.' },
    { test: v => Number.isInteger(Number(v)),    msg: 'Seats must be a whole number.' },
  ],
};

const validateField = (name, value) => {
  const rules = FIELD_RULES[name];
  if (!rules) return '';
  for (const rule of rules) {
    if (!rule.test(value)) return rule.msg;
  }
  return '';
};

const validateAll = (form) => {
  const errs = {};
  Object.keys(FIELD_RULES).forEach(name => {
    const msg = validateField(name, form[name]);
    if (msg) errs[name] = msg;
  });
  return errs;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FieldError = ({ msg }) =>
  msg ? (
    <div style={styles.fieldError}>
      <ErrorOutlineIcon style={{ fontSize: '13px', flexShrink: 0 }} />
      <span>{msg}</span>
    </div>
  ) : null;

const FieldHint = ({ msg }) =>
  msg ? (
    <div style={styles.fieldHint}>
      <InfoOutlinedIcon style={{ fontSize: '12px', flexShrink: 0 }} />
      <span>{msg}</span>
    </div>
  ) : null;

const CharCount = ({ value, max }) => {
  const len = (value || '').length;
  const pct = len / max;
  const color = pct > 0.9 ? '#e74c3c' : pct > 0.75 ? '#f39c12' : '#bbb';
  return (
    <span style={{ fontSize: '11px', color, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
      {len}/{max}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MyCourses = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toasts, setToasts]     = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched]     = useState({});
  const [saving, setSaving]       = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [deleteId, setDeleteId]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  // ── Toast system (stacking) ──
  const pushToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ── Modal helpers ──
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, instructor: user?.name || '' });
    setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditingId(course._id);
    setForm({
      title: course.title || '', description: course.description || '',
      instructor: course.instructor || '', category: course.category || '',
      duration: course.duration || '', totalSeats: course.totalSeats || 30,
      status: course.status || 'active',
    });
    setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM);
    setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
  };

  const resetForm = () => {
    const fresh = editingId ? { ...EMPTY_FORM } : { ...EMPTY_FORM, instructor: user?.name || '' };
    setForm(fresh); setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
  };

  // ── Field change + live validation ──
  const handleChange = (name, value) => {
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name] || submitAttempted) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name]) }));
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Always normalize category before validation so "PROGRAMMING" and "programming" both pass
    const normalizedForm = { ...form, category: normalizeCategory(form.category) };
    setForm(normalizedForm);

    const errs = validateAll(normalizedForm);
    setFieldErrors(errs);
    // Mark all fields touched so errors show
    const allTouched = Object.keys(FIELD_RULES).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    if (Object.keys(errs).length > 0) {
      pushToast(`Please fill the missing ${Object.keys(errs).length} fields(s) before submitting.`, 'warning');
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-field-error]');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...normalizedForm, instructorId: user?._id };
      if (editingId) {
        await updateCourse(editingId, payload, token);
        pushToast('Course updated successfully!', 'success');
      } else {
        await createCourse(payload, token);
        pushToast('Course created! Students have been notified.', 'success');
      }
      closeModal(); fetchCourses();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'Something went wrong.';
      pushToast(serverMsg, 'error');
    } finally { setSaving(false); }
  };

  // ── Delete ──
  const requestDelete = (course) => {
    setDeleteId(course._id);
    setDeleteTarget(course);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCourse(deleteId, token);
      pushToast(`"${deleteTarget?.title}" has been deleted.`, 'success');
      setDeleteId(null); setDeleteTarget(null); fetchCourses();
    } catch (err) {
      pushToast(err.response?.data?.message || 'Delete failed. Please try again.', 'error');
      setDeleteId(null); setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  // ── Helpers ──
  const totalStudents = courses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
  const totalSeats    = courses.reduce((s, c) => s + (c.totalSeats    || 0), 0);
  const seatPct = (c) => c.totalSeats > 0 ? Math.min(100, (c.enrolledCount / c.totalSeats) * 100) : 0;

  const instructorMismatch = form.instructor.trim() !== '' &&
    form.instructor.trim().toLowerCase() !== (user?.name || '').toLowerCase();

  const inputStyle = (name) => ({
    ...styles.input,
    borderColor: fieldErrors[name] && touched[name]
      ? '#e74c3c'
      : touched[name] && !fieldErrors[name]
      ? '#27ae60'
      : '#e0e0e0',
    backgroundColor: fieldErrors[name] && touched[name] ? '#fff8f8' : '#fafafa',
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes float   { 0%,100% { transform:translateY(0);}  50% { transform:translateY(-10px); } }
        @keyframes toastIn { from{opacity:0;transform:translateY(24px) scale(0.95);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes toastOut{ from{opacity:1;transform:translateY(0) scale(1);}     to{opacity:0;transform:translateY(8px) scale(0.95);} }
        @keyframes shake   { 0%,100%{transform:translateX(0);}  20%,60%{transform:translateX(-5px);}  40%,80%{transform:translateX(5px);} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }
        .float-badge   { animation: float 3s ease-in-out infinite; }
        .float-badge-2 { animation: float 3s ease-in-out infinite 1.5s; }

        .course-row-hover:hover  { background-color:#fafffe !important; }
        .action-btn:hover        { opacity:0.85; transform:scale(1.05); }

        /* ── Orange focus ring (replaces browser default blue) ── */
        .f-input:focus {
          outline: none !important;
          border-color: #f39c12 !important;
          box-shadow: 0 0 0 3.5px rgba(243,156,18,0.18) !important;
          background-color: #fffdf7 !important;
        }
        .f-input.has-error:focus {
          border-color: #e74c3c !important;
          box-shadow: 0 0 0 3.5px rgba(231,76,60,0.15) !important;
        }
        .f-input.is-valid:focus {
          border-color: #27ae60 !important;
          box-shadow: 0 0 0 3.5px rgba(39,174,96,0.13) !important;
        }
        .f-input::placeholder { color:#bbb; }

        .suggestion-item:hover  { background:#fff3e0; color:#e67e22; }
        .create-btn:hover       { background:#e67e22 !important; transform:translateY(-1px); }
        .hero-btn-sec:hover     { background:#fff3e0 !important; }
        .confirm-btn:hover:not(:disabled) { background:#e67e22 !important; }
        .reset-btn:hover        { background:#fff3e0 !important; }
        .close-btn:hover        { background:#f5f5f5 !important; }
        .delete-confirm-btn:hover:not(:disabled) { background:#c0392b !important; }

        .field-label-row { display:flex; align-items:center; gap:4px; margin-bottom:5px; }
        .required-star   { color:#e74c3c; font-size:14px; line-height:1; }
        .valid-check     { color:#27ae60; font-size:14px; margin-left:4px; }
      `}</style>

      <div style={styles.page}>

        {/* ── HERO BANNER ── */}
        <section style={styles.hero}>
          <div style={styles.blob1} />
          <div style={styles.blob2} />
          <div style={styles.heroInner}>
            <div style={styles.heroLeft}>
              <span style={styles.heroEyebrow}>Instructor Panel</span>
              <h1 style={styles.heroTitle}>Manage &amp; Grow<br />Your Courses</h1>
              <p style={styles.heroSub}>
                Welcome back, <strong>{user?.name}</strong>! Create new courses, track enrollments,
                and inspire students with your expertise.
              </p>
              <div style={styles.heroBtns}>
                <button className="hero-btn-sec" style={styles.heroBtnSecondary}
                  onClick={() => document.getElementById('course-list-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  View My Courses
                </button>
              </div>
            </div>
            <div style={styles.heroRight}>
              <div style={styles.heroCircle}>
                <img src={bannerTeacher} alt="Teacher with Laptop"
                  style={{ width: '500px', objectFit: 'contain', borderRadius: '12px' }} />
              </div>
              <div style={{ ...styles.floatBadge, top: '10%', right: '-15%' }}
                className="float-badge">
                <MenuBookIcon style={{ fontSize: '16px', color: '#f39c12' }} />
                <span style={styles.floatBadgeText}>{courses.length} Courses</span>
              </div>
              <div style={{ ...styles.floatBadge, bottom: '-10%', left: '-5%' }}
                className="float-badge-2">
                <GroupIcon style={{ fontSize: '16px', color: '#f39c12' }} />
                <span style={styles.floatBadgeText}>{totalStudents} Students</span>
              </div>
              <div style={{ ...styles.floatBadge, bottom: '18%', right: '-2%' }}
                className="float-badge">
                <TrendingUpIcon style={{ fontSize: '16px', color: '#f39c12' }} />
                <span style={styles.floatBadgeText}>Track Progress</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={styles.statsRow}>
          {[
            { icon: <MenuBookIcon  style={styles.statIcon} />, num: courses.length,          lbl: 'Total Courses'  },
            { icon: <GroupIcon     style={styles.statIcon} />, num: totalStudents,            lbl: 'Total Enrolled' },
            { icon: <EventSeatIcon style={styles.statIcon} />, num: totalSeats,               lbl: 'Total Seats'    },
            { icon: <CheckCircleIcon style={styles.statIcon} />,
              num: courses.filter(c => c.status === 'active').length, lbl: 'Active Courses' },
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
            <button style={styles.createBtn} className="create-btn" onClick={openCreate}>
              <AddCircleOutlineIcon style={{ fontSize: '18px' }} />
              Add New Course
            </button>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <WarningAmberIcon style={{ fontSize: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div style={styles.loadingWrap}>
              <div style={styles.spinner} />
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
                            color: course.status === 'active' ? '#00b4b4' : '#aaa',
                          }}>
                            {course.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={styles.editBtn} className="action-btn" onClick={() => openEdit(course)}>
                              <EditIcon style={{ fontSize: '15px' }} /> Edit
                            </button>
                            <button style={styles.deleteBtn} className="action-btn" onClick={() => requestDelete(course)}>
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

      {/* ════════════════════════════════════════════════════
          CREATE / EDIT MODAL
      ════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal}>

            {/* LEFT PANEL */}
            <div style={styles.modalLeft}>
              <img src={onlineCourse} alt="Online Course"
                style={{ width: '280px', marginBottom: '20px', objectFit: 'contain', borderRadius: '12px' }} />
              <p style={styles.illustrationTitle}>{editingId ? 'Edit Course' : 'New Course'}</p>
              <p style={styles.illustrationSub}>
                {editingId
                  ? 'Update the details below to keep\nyour course current and accurate.'
                  : 'Fill in the details to publish\na new course for students.'}
              </p>

              {/* Progress indicator */}
              {(() => {
                const requiredFields = ['title', 'description', 'instructor', 'category'];
                const filled = requiredFields.filter(f => form[f]?.trim().length > 0 && !validateField(f, form[f])).length;
                const pct = Math.round((filled / requiredFields.length) * 100);
                return (
                  <div style={styles.progressWrap}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#7a4400', fontWeight: '600' }}>Form Completion</span>
                      <span style={{ fontSize: '11px', color: '#5a2d00', fontWeight: '700' }}>{pct}%</span>
                    </div>
                    <div style={styles.progressBg}>
                      <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#7a4400', marginTop: '6px' }}>
                      {filled} of {requiredFields.length} required fields complete
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* RIGHT PANEL */}
            <div style={styles.modalRight}>
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>{editingId ? 'Edit Course' : 'Add New Course'}</h2>
                </div>
                <button style={styles.closeBtn} className="close-btn" onClick={closeModal}
                  title="Close (Esc)">
                  <CloseIcon style={{ fontSize: '20px', color: '#bbb' }} />
                </button>
              </div>

              {/* Summary error banner when submission fails */}
              {submitAttempted && Object.keys(fieldErrors).filter(k => fieldErrors[k]).length > 0 && (
                <div style={styles.bannerError} role="alert">
                  <ErrorOutlineIcon style={{ fontSize: '18px', flexShrink: 0 }} />
                  <div>
                    <strong>Please correct the following errors:</strong>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                      {Object.entries(fieldErrors).filter(([, v]) => v).map(([k, v]) => (
                        <li key={k} style={{ marginBottom: '2px' }}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div style={styles.formFields}>

                  {/* ── Title ── */}
                  <div style={styles.formGroup}>
                    <div className="field-label-row">
                      <label style={styles.label} htmlFor="f-title">Course Title</label>
                      <span className="required-star">*</span>
                      {touched.title && !fieldErrors.title && <span className="valid-check">✓</span>}
                      <CharCount value={form.title} max={100} />
                    </div>
                    <input
                      id="f-title"
                      className={`f-input${fieldErrors.title && touched.title ? ' has-error' : ''}${touched.title && !fieldErrors.title ? ' is-valid' : ''}`}
                      style={inputStyle('title')}
                      placeholder="e.g. Introduction to Machine Learning"
                      value={form.title}
                      onChange={e => handleChange('title', e.target.value)}
                      onBlur={() => handleBlur('title')}
                      maxLength={100}
                      aria-invalid={!!fieldErrors.title}
                      aria-describedby="title-error"
                    />
                    <div id="title-error" data-field-error>
                      <FieldError msg={touched.title ? fieldErrors.title : ''} />
                      {!fieldErrors.title && <FieldHint msg="A clear, descriptive title helps students find your course." />}
                    </div>
                  </div>

                  {/* ── Description ── */}
                  <div style={styles.formGroup}>
                    <div className="field-label-row">
                      <label style={styles.label} htmlFor="f-desc">Description</label>
                      <span className="required-star">*</span>
                      {touched.description && !fieldErrors.description && <span className="valid-check">✓</span>}
                      <CharCount value={form.description} max={1000} />
                    </div>
                    <textarea
                      id="f-desc"
                      className={`f-input${fieldErrors.description && touched.description ? ' has-error' : ''}${touched.description && !fieldErrors.description ? ' is-valid' : ''}`}
                      style={{ ...inputStyle('description'), resize: 'vertical', minHeight: '90px', borderRadius: '8px', fontFamily: 'inherit' }}
                      placeholder="Describe what students will learn, who it's for, and what's included…"
                      value={form.description}
                      onChange={e => handleChange('description', e.target.value)}
                      onBlur={() => handleBlur('description')}
                      maxLength={1000}
                      aria-invalid={!!fieldErrors.description}
                    />
                    <div data-field-error>
                      <FieldError msg={touched.description ? fieldErrors.description : ''} />
                      {!fieldErrors.description && form.description.length < 20 && touched.description && (
                        <FieldHint msg={`${20 - form.description.length} more characters needed.`} />
                      )}
                    </div>
                  </div>

                  {/* ── Instructor + Category row ── */}
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <div className="field-label-row">
                        <label style={styles.label} htmlFor="f-inst">Instructor</label>
                        <span className="required-star">*</span>
                        {touched.instructor && !fieldErrors.instructor && <span className="valid-check">✓</span>}
                      </div>
                      <input
                        id="f-inst"
                        className={`f-input${fieldErrors.instructor && touched.instructor ? ' has-error' : ''}${touched.instructor && !fieldErrors.instructor ? ' is-valid' : ''}`}
                        style={inputStyle('instructor')}
                        placeholder="Display name shown to students"
                        value={form.instructor}
                        onChange={e => handleChange('instructor', e.target.value)}
                        onBlur={() => handleBlur('instructor')}
                        aria-invalid={!!fieldErrors.instructor}
                      />
                      <div data-field-error>
                        <FieldError msg={touched.instructor ? fieldErrors.instructor : ''} />
                      </div>
                      {instructorMismatch && (
                        <div style={styles.mismatchAlert} role="alert">
                          <WarningAmberIcon style={{ fontSize: '14px', color: '#b7770d', flexShrink: 0 }} />
                          <span>
                            Ownership stays with <strong>{user?.name}</strong>. The display name is cosmetic only.
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <div className="field-label-row">
                        <label style={styles.label}>Category</label>
                        <span className="required-star">*</span>
                        {touched.category && !fieldErrors.category && <span className="valid-check">✓</span>}
                      </div>
                      <CategoryComboBox
                        value={form.category}
                        onChange={val => handleChange('category', val)}
                        onBlur={() => handleBlur('category')}
                        existingFromDB={dedupeCategories(courses.map(c => c.category).filter(Boolean))}
                        error={fieldErrors.category}
                        touched={touched.category}
                        isValid={touched.category && !fieldErrors.category}
                      />
                    </div>
                  </div>

                  {/* ── Duration + Total Seats row ── */}
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <div className="field-label-row">
                        <label style={styles.label}>Duration</label>
                        <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '4px' }}>(optional)</span>
                      </div>
                      <DurationPicker
                        value={form.duration}
                        onChange={val => handleChange('duration', val)}
                        onBlur={() => handleBlur('duration')}
                        error={fieldErrors.duration}
                        touched={touched.duration}
                      />
                    </div>

                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <div className="field-label-row">
                        <label style={styles.label} htmlFor="f-seats">Total Seats</label>
                        {touched.totalSeats && !fieldErrors.totalSeats && <span className="valid-check">✓</span>}
                      </div>
                      <input
                        id="f-seats"
                        type="number"
                        min="1" max="1000"
                        className={`f-input${fieldErrors.totalSeats && touched.totalSeats ? ' has-error' : ''}${touched.totalSeats && !fieldErrors.totalSeats ? ' is-valid' : ''}`}
                        style={inputStyle('totalSeats')}
                        value={form.totalSeats}
                        onChange={e => handleChange('totalSeats', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        onBlur={() => handleBlur('totalSeats')}
                        aria-invalid={!!fieldErrors.totalSeats}
                      />
                      <div data-field-error>
                        <FieldError msg={touched.totalSeats ? fieldErrors.totalSeats : ''} />
                        {!fieldErrors.totalSeats && <FieldHint msg="Between 1 and 1000 seats." />}
                      </div>
                    </div>
                  </div>

                  {/* ── Status ── */}
                  <div style={styles.formGroup}>
                    <div className="field-label-row">
                      <label style={styles.label} htmlFor="f-status">Status</label>
                    </div>
                    <select
                      id="f-status"
                      className="f-input"
                      style={{ ...styles.input, cursor: 'pointer' }}
                      value={form.status}
                      onChange={e => handleChange('status', e.target.value)}>
                      <option value="active">Active — visible and open to enrolment</option>
                      <option value="inactive">Inactive — hidden from students</option>
                    </select>
                    {form.status === 'inactive' && (
                      <div style={styles.infoAlert} role="status">
                        <InfoOutlinedIcon style={{ fontSize: '14px', color: '#1a73e8', flexShrink: 0 }} />
                        <span>Inactive courses are hidden from students and cannot be enrolled in.</span>
                      </div>
                    )}
                  </div>

                </div>{/* /formFields */}

                <div style={styles.modalActions}>
                  <button type="button" style={styles.resetBtn} className="reset-btn"
                    onClick={resetForm} title="Clear all fields">
                    RESET
                  </button>
                  <button
                    type="submit"
                    style={{ ...styles.confirmBtn, opacity: saving ? 0.7 : 1 }}
                    className="confirm-btn"
                    disabled={saving}
                  >
                    {saving
                      ? <><span style={styles.btnSpinner} />SAVING…</>
                      : editingId ? 'SAVE CHANGES' : 'CREATE COURSE'}
                  </button>
                </div>
              </form>
            </div>{/* /modalRight */}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ════════════════════════════════════════════════════ */}
      {deleteId && (
        <div style={styles.overlay}>
          <div style={styles.deleteModal} role="alertdialog" aria-modal="true"
            aria-labelledby="del-title" aria-describedby="del-desc">

            <div style={styles.deleteIconWrap}>
              <DeleteOutlineIcon style={{ fontSize: '32px', color: '#e74c3c' }} />
            </div>

            <h2 id="del-title" style={styles.deleteTitle}>Delete Course?</h2>

            {deleteTarget && (
              <div style={styles.deleteTarget}>
                <strong style={{ color: '#2c3e50' }}>{deleteTarget.title}</strong>
                {deleteTarget.enrolledCount > 0 && (
                  <div style={styles.deleteWarning}>
                    <WarningAmberIcon style={{ fontSize: '15px', color: '#d68910', flexShrink: 0 }} />
                    <span>
                      <strong>{deleteTarget.enrolledCount} student{deleteTarget.enrolledCount !== 1 ? 's' : ''}</strong> are
                      currently enrolled. They will lose access immediately.
                    </span>
                  </div>
                )}
              </div>
            )}

            <p id="del-desc" style={styles.deleteDesc}>
              This action is <strong>permanent</strong> and cannot be undone.
              All course data will be removed.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={styles.resetBtn} className="reset-btn"
                onClick={() => { setDeleteId(null); setDeleteTarget(null); }}
                disabled={deleting}>
                CANCEL
              </button>
              <button
                style={{ ...styles.confirmBtn, backgroundColor: '#e74c3c' }}
                className="delete-confirm-btn"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? <><span style={styles.btnSpinner} />DELETING…</> : 'YES, DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TOAST STACK
      ════════════════════════════════════════════════════ */}
      <div style={styles.toastStack} aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} style={{
            ...styles.toast,
            backgroundColor:
              t.type === 'error'   ? '#e74c3c' :
              t.type === 'warning' ? '#f39c12' :
              '#27ae60',
          }}>
            {t.type === 'error'   && <ErrorOutlineIcon  style={{ fontSize: '16px', flexShrink: 0 }} />}
            {t.type === 'warning' && <WarningAmberIcon   style={{ fontSize: '16px', flexShrink: 0 }} />}
            {t.type === 'success' && <CheckCircleIcon    style={{ fontSize: '16px', flexShrink: 0 }} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh' },

  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #fae9d7 0%, #f8e3bf 50%, #fdd79f 100%)',
    padding: '70px 60px', overflow: 'hidden', minHeight: '380px',
  },
  blob1: { position: 'absolute', top: '-60px', right: '35%', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(243,157,18,0.31)', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-40px', right: '-1%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(243,156,18,0.31)', pointerEvents: 'none' },
  heroInner: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', maxWidth: '1100px', margin: '0 auto' },
  heroLeft:  { flex: 1, maxWidth: '500px' },
  heroEyebrow: { display: 'inline-block', backgroundColor: '#f39c12', color: '#fff', padding: '5px 16px', borderRadius: '20px', border: '1.8px solid #fff', fontSize: '13px', fontWeight: '600', marginBottom: '18px' },
  heroTitle:   { fontSize: '48px', fontWeight: '800', color: '#8b3801', margin: '0 0 18px', lineHeight: '1.2' },
  heroSub:     { fontSize: '20px', color: '#463003', lineHeight: '1.7', margin: '0 0 30px' },
  heroBtns:    { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  heroBtnSecondary: { backgroundColor: '#fff', color: '#f39c12', border: '1.5px solid #f39c12', padding: '13px 28px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s' },
  heroRight:   { position: 'relative', width: '360px', height: '300px', flexShrink: 0 },
  heroCircle:  { position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '480px', height: '480px', borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(243,156,18,0.35)' },
  floatBadge:  { position: 'absolute', backgroundColor: '#fff', borderRadius: '30px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap' },
  floatBadgeText: { fontSize: '14px', color: '#2c3e50', fontWeight: '600' },

  statsRow: { display: 'flex', gap: '20px', padding: '30px 60px', flexWrap: 'wrap', justifyContent: 'center' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '25px 35px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 3px 12px rgba(0,0,0,0.07)', flex: '1', minWidth: '180px' },
  statIconWrap: { backgroundColor: '#fff3e0', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statIcon: { color: '#f39c12', fontSize: '28px' },
  statNum:  { fontSize: '28px', fontWeight: 'bold', color: '#2c3e50', margin: 0 },
  statLbl:  { color: '#888', fontSize: '13px', margin: 0 },

  container:     { padding: '20px 60px 60px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle:  { fontSize: '24px', color: '#2c3e50', margin: 0 },
  createBtn: { backgroundColor: '#f39c12', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' },

  errorBox: { backgroundColor: '#fdecea', color: '#e74c3c', padding: '14px 18px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' },
  loadingWrap: { textAlign: 'center', padding: '60px' },
  spinner: { width: '36px', height: '36px', border: '3px solid #f0f0f0', borderTop: '3px solid #00b4b4', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' },
  loadingText: { color: '#888', fontSize: '15px' },
  empty:    { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 10px' },
  emptyText: { fontSize: '18px', color: '#2c3e50', fontWeight: '600', marginBottom: '6px' },
  emptyHint: { fontSize: '14px', color: '#aaa' },

  tableWrap:  { backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 3px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 16px', textAlign: 'left', backgroundColor: '#fff8f0', color: '#f39c12', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid #f0f0f0' },
  tr: { transition: 'background-color 0.15s' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  categoryTag: { backgroundColor: '#e8fafa', color: '#00b4b4', padding: '4px 12px', borderRadius: '15px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' },
  barWrap: { height: '6px', backgroundColor: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' },
  statusBadge: { padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' },
  editBtn: { backgroundColor: '#e8fafa', color: '#00b4b4', border: 'none', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' },
  deleteBtn: { backgroundColor: '#fdecea', color: '#e74c3c', border: 'none', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' },

  // ── Modal ──
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '18px', width: '100%', maxWidth: '830px', maxHeight: '92vh', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', display: 'flex', overflow: 'hidden', animation: 'toastIn 0.25s ease' },

  modalLeft: { width: '260px', flexShrink: 0, background: 'linear-gradient(155deg, #e6940f 45%, #eead58 60%, #f0cd91 80%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 24px 40px', textAlign: 'center' },
  illustrationTitle: { fontSize: '19px', fontWeight: '700', color: '#5a2d00', margin: '0 0 8px' },
  illustrationSub:   { fontSize: '12px', color: '#7a4400', lineHeight: '1.65', margin: '0 0 20px', whiteSpace: 'pre-line' },

  progressWrap: { width: '100%', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: '10px', padding: '12px 14px' },
  progressBg:   { height: '6px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '999px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#5a2d00', borderRadius: '999px', transition: 'width 0.35s ease' },

  modalRight:   { flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 32px', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  modalTitle:   { fontSize: '20px', color: '#2c3e50', fontWeight: '700', margin: 0 },
  closeBtn:     { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '6px', transition: 'background 0.15s', flexShrink: 0 },

  bannerError: { backgroundColor: '#fdecea', color: '#c0392b', padding: '12px 16px', borderRadius: '9px', marginBottom: '18px', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'flex-start', lineHeight: '1.55', animation: 'slideDown 0.2s ease', border: '1px solid #f5c6cb' },

  formFields: { display: 'flex', flexDirection: 'column', gap: '18px' },
  formRow:    { display: 'flex', gap: '14px' },
  formGroup:  { display: 'flex', flexDirection: 'column', gap: '0', flex: 1 },
  label:      { fontSize: '13px', fontWeight: '600', color: '#444' },

  input: {
    padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0',
    fontSize: '14px', backgroundColor: '#fafafa', color: '#2c3e50',
    transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
    width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
  },

  fieldError: { display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c', fontSize: '12px', marginTop: '5px', animation: 'slideDown 0.18s ease' },
  fieldHint:  { display: 'flex', alignItems: 'center', gap: '5px', color: '#aaa', fontSize: '11px', marginTop: '4px' },

  mismatchAlert: { display: 'flex', alignItems: 'flex-start', gap: '7px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: '#7a5a00', lineHeight: '1.55', marginTop: '6px', animation: 'slideDown 0.18s ease' },
  infoAlert:     { display: 'flex', alignItems: 'flex-start', gap: '7px', backgroundColor: '#e8f0fe', border: '1px solid #c5d9f7', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: '#1a73e8', lineHeight: '1.55', marginTop: '6px' },


  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f0f0f0' },
  resetBtn:  { padding: '10px 28px', backgroundColor: '#fff', color: '#f39c12', border: '1.5px solid #f39c12', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', letterSpacing: '0.05em', transition: 'background-color 0.2s' },
  confirmBtn: { padding: '10px 28px', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', letterSpacing: '0.05em', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSpinner: { width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' },

  // ── Delete Modal ──
  deleteModal:   { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', textAlign: 'center', animation: 'toastIn 0.25s ease' },
  deleteIconWrap: { width: '64px', height: '64px', backgroundColor: '#fdecea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  deleteTitle:   { fontSize: '20px', color: '#2c3e50', fontWeight: '700', margin: '0 0 12px' },
  deleteTarget:  { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', textAlign: 'left' },
  deleteWarning: { display: 'flex', alignItems: 'flex-start', gap: '7px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#7a5a00', marginTop: '10px', lineHeight: '1.5' },
  deleteDesc:    { color: '#888', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' },

  // ── Toast stack ──
  toastStack: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' },
  toast: { color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', boxShadow: '0 6px 24px rgba(0,0,0,0.18)', maxWidth: '340px', display: 'flex', alignItems: 'center', gap: '9px', animation: 'toastIn 0.3s ease forwards', lineHeight: '1.4' },
};

export default MyCourses;