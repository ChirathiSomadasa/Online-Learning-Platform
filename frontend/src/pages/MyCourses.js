import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllCourses, createCourse, updateCourse, deleteCourse, getInstructorCourses,
} from '../services/courseService';

// MUI Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import GroupsIcon from '@mui/icons-material/Groups';
import PublishIcon from '@mui/icons-material/Publish';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

// Table Header Icons
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import StyleIcon from '@mui/icons-material/Style';
import TuneIcon from '@mui/icons-material/Tune';
import PieChartIcon from '@mui/icons-material/PieChart';
import VerifiedIcon from '@mui/icons-material/Verified';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

// Images & Components
import onlineCourse from '../images/course/online_course.png';
import bannerTeacher from '../images/course/course_instructor.png';
import CategoryComboBox, { normalizeCategory, dedupeCategories } from '../pages/CatergoryComboBox';
import DurationPicker from '../pages/DurationPicker';

const EMPTY_FORM = {
  title: '', description: '', instructor: '',
  category: '', duration: '', totalSeats: 30, status: 'active', price: 0,   // add price
};

const FIELD_RULES = {
  title: [
    { test: v => v.trim().length > 0, msg: 'Course title is required.' },
    { test: v => v.trim().length >= 5, msg: 'Title must be at least 5 characters.' },
    { test: v => v.trim().length <= 100, msg: 'Title cannot exceed 100 characters.' },
  ],
  description: [
    { test: v => v.trim().length > 0, msg: 'Description is required.' },
    { test: v => v.trim().length <= 1000, msg: 'Description cannot exceed 1000 characters.' },
  ],
  instructor: [
    { test: v => v.trim().length > 0, msg: 'Instructor name is required.' },
    { test: v => v.trim().length >= 2, msg: 'Instructor name must be at least 2 characters.' },
    { test: v => /^[a-zA-Z\s.'-]+$/.test(v.trim()), msg: 'Instructor name may only contain letters, spaces, and basic punctuation.' },
  ],
  category: [
    { test: v => v.trim().length > 0, msg: 'Category is required.' },
    { test: v => v.trim().length >= 2, msg: 'Category must be at least 2 characters.' },
    { test: v => v.trim().length <= 50, msg: 'Category cannot exceed 50 characters.' },
  ],
  duration: [
    { test: v => v.trim().length <= 50, msg: 'Duration cannot exceed 50 characters.' },
  ],
  totalSeats: [
    { test: v => !isNaN(v) && Number(v) > 0, msg: 'Total seats must be a positive number.' },
    { test: v => Number(v) >= 1, msg: 'Minimum 1 seat is required.' },
    { test: v => Number(v) <= 1000, msg: 'Maximum 1000 seats allowed.' },
    { test: v => Number.isInteger(Number(v)), msg: 'Seats must be a whole number.' },
  ],
};

const validateField = (name, value) => {
  const rules = FIELD_RULES[name];
  if (!rules) return '';
  for (const rule of rules) { if (!rule.test(value)) return rule.msg; }
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

const FieldError = ({ msg }) =>
  msg ? (
    <div style={styles.fieldError}>
      <ErrorOutlineIcon style={{ fontSize: '13px', flexShrink: 0 }} />
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

const TOAST_META = {
  success: { icon: <CheckCircleIcon style={{ fontSize: '18px', flexShrink: 0 }} />, bg: '#f0faf4', border: '#b7dfc6', text: '#1a6636', bar: '#27ae60' },
  warning: { icon: <ReportProblemIcon style={{ fontSize: '18px', flexShrink: 0 }} />, bg: '#fffbf0', border: '#f5dfa0', text: '#7a5500', bar: '#f39c12' },
  error: { icon: <ErrorOutlineIcon style={{ fontSize: '18px', flexShrink: 0 }} />, bg: '#fff5f5', border: '#f5c6cb', text: '#9b1c1c', bar: '#e74c3c' },
  info: { icon: <InfoOutlinedIcon style={{ fontSize: '18px', flexShrink: 0 }} />, bg: '#f0f4ff', border: '#bfcffa', text: '#1a3a99', bar: '#3b6fd4' },
};

const ToastCard = ({ toast, onDismiss }) => {
  const meta = TOAST_META[toast.type] || TOAST_META.info;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      backgroundColor: meta.bg, border: `1px solid ${meta.border}`,
      borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      minWidth: '300px', maxWidth: '380px', overflow: 'hidden',
      animation: 'toastSlideIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <div style={{ height: '3px', backgroundColor: `${meta.bar}30` }}>
        <div style={{ height: '100%', backgroundColor: meta.bar, animation: 'toastProgress 4s linear forwards' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 14px 14px 16px' }}>
        <span style={{ color: meta.bar, marginTop: '1px' }}>{meta.icon}</span>
        <p style={{ margin: 0, fontSize: '13px', color: meta.text, lineHeight: '1.55', flex: 1, fontWeight: '500' }}>
          {toast.msg}
        </p>
        <button
          onClick={() => onDismiss(toast.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: meta.text, opacity: 0.5, padding: '0', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '1px' }}
          aria-label="Dismiss"
        >
          <CloseIcon style={{ fontSize: '16px' }} />
        </button>
      </div>
    </div>
  );
};

const MyCourses = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'instructor') navigate('/student-home');
  }, [user, navigate]);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
  setLoading(true); setError('');
  try {
    const data = await getInstructorCourses(token);
    setCourses(data);
  } catch {
    setError('Failed to load courses. Ensure the Course Catalog Service is running.');
  } finally { setLoading(false); }
};

  const pushToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setOriginalForm(null);
    setForm({ ...EMPTY_FORM, instructor: user?.name || '' });
    setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditingId(course._id);
    const snapshot = {
      title: course.title || '',
      description: course.description || '',
      instructor: course.instructor || '',
      category: course.category || '',
      duration: course.duration || '',
      totalSeats: course.totalSeats || 30,
      status: course.status || 'active',
      price: course.price || 0,   // add price
    };
    setForm(snapshot);
    setOriginalForm(snapshot);
    setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM);
    setOriginalForm(null);
    setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
  };

  const resetForm = () => {
    const fresh = editingId
      ? { ...EMPTY_FORM }
      : { ...EMPTY_FORM, instructor: user?.name || '' };
    setForm(fresh); setFieldErrors({}); setTouched({}); setSubmitAttempted(false);
  };

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name] || submitAttempted) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const normalizedForm = { ...form, category: normalizeCategory(form.category) };
    setForm(normalizedForm);

    const errs = validateAll(normalizedForm);
    setFieldErrors(errs);
    setTouched(Object.keys(FIELD_RULES).reduce((acc, k) => ({ ...acc, [k]: true }), {}));

    const errCount = Object.keys(errs).length;
    if (errCount > 0) {
      pushToast(
        `${errCount} field${errCount > 1 ? 's require' : ' requires'} attention before saving. Review the highlighted fields below.`,
        'warning',
      );
      const firstErrorEl = document.querySelector('[data-field-error]');
      if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (editingId && originalForm) {
      const fields = Object.keys(EMPTY_FORM);
      const isDirty = fields.some(k => String(normalizedForm[k] ?? '').trim() !== String(originalForm[k] ?? '').trim());
      if (!isDirty) {
        pushToast('No changes detected. Nothing to save.', 'info');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = { ...normalizedForm, instructorId: user?._id };
      if (editingId) {
        await updateCourse(editingId, payload, token);
        pushToast('Course updated successfully.', 'success');
      } else {
        await createCourse(payload, token);
        pushToast('Course published. Students have been notified.', 'success');
      }
      closeModal(); fetchCourses();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      pushToast(serverMsg, 'error');
    } finally { setSaving(false); }
  };

  const requestDelete = (course) => { setDeleteId(course._id); setDeleteTarget(course); };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCourse(deleteId, token);
      pushToast(`"${deleteTarget?.title}" has been permanently deleted.`, 'success');
      setDeleteId(null); setDeleteTarget(null); fetchCourses();
    } catch (err) {
      pushToast(err.response?.data?.message || 'Delete failed. Please try again.', 'error');
      setDeleteId(null); setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const seatPct = (c) => c.totalSeats > 0 ? Math.min(100, (c.enrolledCount / c.totalSeats) * 100) : 0;

  const inputStyle = (name) => ({
    ...styles.input,
    borderColor: fieldErrors[name] && touched[name]
      ? '#e74c3c'
      : touched[name] && !fieldErrors[name]
        ? '#27ae60'
        : '#e0e0e0',
    backgroundColor: fieldErrors[name] && touched[name] ? '#fff8f8' : '#fafafa',
  });

  const requiredFields = ['title', 'description', 'instructor', 'category'];
  const filledCount = requiredFields.filter(f => form[f]?.trim().length > 0 && !validateField(f, form[f])).length;
  const progressPct = Math.round((filledCount / requiredFields.length) * 100);

  return (
    <>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes float     { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }

        @keyframes toastSlideIn {
          from { opacity:0; transform:translateX(40px) scale(0.96); }
          to   { opacity:1; transform:translateX(0)    scale(1);    }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }

        .float-badge   { animation: float 3s ease-in-out infinite; }
        .float-badge-2 { animation: float 3s ease-in-out infinite 1.5s; }
        .feature-card-hover:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important; }

        /* ENHANCED TABLE ROW WITH ORANGE GLOW */
        .course-card-row {
          background-color: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03), 0 0 0 1px transparent;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }
        .course-card-row:hover {
          transform: translateY(-4px) scale(1.005);
          /* Inner orange border and outer orange glow */
          box-shadow: 0 0 0 1.5px #f39c12, 0 12px 30px rgba(243, 156, 18, 0.25);
          z-index: 10;
        }
        
        /* ORANGE ACCENT RIBBON ON HOVER */
        .row-ribbon {
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 4px;
          background-color: #f39c12;
          border-radius: 0 4px 4px 0;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .course-card-row:hover .row-ribbon {
          opacity: 1;
        }

        /* ENHANCED ACTION BUTTONS WITH TEXT */
        .icon-btn-edit, .icon-btn-delete {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; padding: 6px 10px; border-radius: 8px; border: none;
          cursor: pointer; transition: all 0.2s; background: transparent;
        }
        .icon-btn-edit { color: #64748b; }
        .icon-btn-edit:hover { background: #e8fafa; color: #00b4b4; transform: scale(1.05); }
        .icon-btn-delete { color: #64748b; }
        .icon-btn-delete:hover { background: #fdecea; color: #e74c3c; transform: scale(1.05); }
        
        .btn-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .f-input:focus {
          outline: none !important;
          border-color: #f39c12 !important;
          box-shadow: 0 0 0 3.5px rgba(243,156,18,0.18) !important;
          background-color: #fffdf7 !important;
        }
        .f-input.has-error:focus { border-color: #e74c3c !important; box-shadow: 0 0 0 3.5px rgba(231,76,60,0.15) !important; }
        .f-input.is-valid:focus  { border-color: #27ae60 !important; box-shadow: 0 0 0 3.5px rgba(39,174,96,0.13) !important; }
        .f-input::placeholder { color:#bbb; }

        .create-btn:hover              { background:#e67e22 !important; transform:translateY(-1px); box-shadow: 0 4px 12px rgba(230,126,34,0.3); }
        .hero-btn-sec:hover            { background:#fff3e0 !important; }
        .confirm-btn:hover:not(:disabled) { background:#e67e22 !important; }
        .reset-btn:hover               { background:#fff3e0 !important; }
        .close-btn:hover               { background:#f5f5f5 !important; }
        .delete-confirm-btn:hover:not(:disabled) { background:#c0392b !important; }

        .field-label-row { display:flex; align-items:center; gap:4px; margin-bottom:5px; }
        .required-star   { color:#e74c3c; font-size:14px; line-height:1; }
        .valid-check     { color:#27ae60; font-size:14px; margin-left:4px; }
      `}</style>

      <div style={styles.page}>

        <section style={styles.hero}>
          <div style={styles.blob1} />
          <div style={styles.blob2} />
          <div style={styles.heroInner}>
            <div style={styles.heroLeft}>
              <h1 style={styles.heroTitle}>Manage Your<br />Curriculum</h1>
              <p style={styles.heroSub}>
                Build, update, and manage your educational content. Use the tools below to structure your curriculum and oversee student enrollments.
              </p>
              <div style={styles.heroBtns}>
                <button className="hero-btn-sec" style={styles.heroBtnSecondary}
                  onClick={() => document.getElementById('course-list-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  View Course List
                </button>
              </div>
            </div>
            <div style={styles.heroRight}>
              <div style={styles.heroCircle}>
                <img src={bannerTeacher} alt="Instructor"
                  style={{ width: '500px', objectFit: 'contain', borderRadius: '12px' }} />
              </div>
            </div>
          </div>
        </section>

        {/* INSTRUCTOR BEST PRACTICES & GUIDELINES */}
        <section style={styles.featuresRow}>
          {[
            { icon: <ViewModuleIcon style={styles.featureIcon} />, title: 'Curriculum Design', desc: 'Organize your materials into logical, progressive modules.' },
            { icon: <OndemandVideoIcon style={styles.featureIcon} />, title: 'Media Standards', desc: 'Ensure high-definition video and crisp, clear audio.' },
            { icon: <GroupsIcon style={styles.featureIcon} />, title: 'Capacity Planning', desc: 'Set realistic seat limits to maintain interaction quality.' },
            { icon: <PublishIcon style={styles.featureIcon} />, title: 'Publishing Rules', desc: 'Verify all course details before changing status to Active.' },
          ].map((f, i) => (
            <div key={i} style={styles.featureCard} className="feature-card-hover">
              <div style={styles.featureIconWrap}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </section>

        <div id="course-list-section" style={styles.container}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LocalLibraryIcon style={{ fontSize: '32px', color: '#f39c12' }} />
              <h2 style={styles.sectionTitle}>Course Directory</h2>
            </div>
            <button style={styles.createBtn} className="create-btn" onClick={openCreate}>
              <AddCircleOutlineIcon style={{ fontSize: '18px' }} />
              Create New Course
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
              <div style={styles.emptyIconBg}>
                <MenuBookIcon style={{ fontSize: '42px', color: '#f39c12' }} />
              </div>
              <p style={styles.emptyText}>Your directory is empty</p>
              <p style={styles.emptyHint}>Click "Create New Course" to start building your first module.</p>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {/* Explicit percentage widths mapped out to equal 100% */}
                    <th style={{ ...styles.th, paddingLeft: '24px', width: '30%' }}>
                      <div style={styles.thContent}>
                        <MenuBookIcon style={styles.thIcon} /> Course Details
                      </div>
                    </th>
                    <th style={{ ...styles.th, width: '15%' }}>
                      <div style={styles.thContent}>
                        <StyleIcon style={styles.thIcon} /> Category
                      </div>
                    </th>
                    <th style={{ ...styles.th, width: '15%' }}>
                      <div style={styles.thContent}>
                        <TuneIcon style={styles.thIcon} /> Logistics
                      </div>
                    </th>
                    <th style={{ ...styles.th, width: '18%' }}>
                      <div style={styles.thContent}>
                        <PieChartIcon style={styles.thIcon} /> Capacity
                      </div>
                    </th>
                    <th style={{ ...styles.th, width: '10%' }}>
                      <div style={styles.thContent}>
                        <VerifiedIcon style={styles.thIcon} /> Status
                      </div>
                    </th>
                    <th style={{ ...styles.th, textAlign: 'center', paddingRight: '24px', width: '12%' }}>
                      <div style={{ ...styles.thContent, justifyContent: 'center' }}>
                        <SettingsSuggestIcon style={styles.thIcon} /> Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => {
                    const pct = seatPct(course);
                    const barColor = pct >= 90 ? '#e74c3c' : pct >= 70 ? '#f39c12' : '#00b4b4';

                    return (
                      <tr key={course._id} className="course-card-row">
                        {/* Course Details */}
                        <td style={{ ...styles.td, position: 'relative', paddingLeft: '24px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                          <div className="row-ribbon" />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ color: '#1e293b', fontSize: '15px', fontWeight: '700' }}>{course.title}</strong>
                            {/* Width changed to 100% to allow fluid scaling and precise truncation */}
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {course.description}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={styles.td}>
                          <span style={styles.categoryTag}>{course.category}</span>
                        </td>

                        {/* Logistics (Duration & Seats combined visually) */}
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
                              <AccessTimeIcon style={{ fontSize: '14px', color: '#f39c12' }} />
                              <span>{course.duration || 'Not set'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
                              <PeopleOutlineIcon style={{ fontSize: '14px', color: '#00b4b4' }} />
                              <span>{course.enrolledCount || 0} / {course.totalSeats || 0} enrolled</span>
                            </div>
                          </div>
                        </td>

                        {/* Capacity Progress */}
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>Filled</span>
                            <span style={{ fontSize: '12px', color: barColor, fontWeight: '700' }}>{Math.round(pct)}%</span>
                          </div>
                          <div style={styles.barWrap}>
                            <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: barColor }} />
                          </div>
                        </td>

                        {/* Status */}
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: course.status === 'active' ? '#e0fcf3' : '#f1f5f9',
                            color: course.status === 'active' ? '#0d9468' : '#64748b',
                            border: course.status === 'active' ? '1px solid #99e8cc' : '1px solid #cbd5e1'
                          }}>
                            {course.status === 'active' ? '● Active' : '○ Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ ...styles.td, textAlign: 'center', paddingRight: '24px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button className="icon-btn-edit" onClick={() => openEdit(course)} title="Edit Course">
                              <EditIcon style={{ fontSize: '18px' }} />
                              <span className="btn-label">Edit</span>
                            </button>
                            <button className="icon-btn-delete" onClick={() => requestDelete(course)} title="Delete Course">
                              <DeleteOutlineIcon style={{ fontSize: '18px' }} />
                              <span className="btn-label">Delete</span>
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

      {/* Modals */}
      {modalOpen && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal}>
            <div style={styles.modalLeft}>
              <img src={onlineCourse} alt="Online Course"
                style={{ width: '280px', marginBottom: '20px', objectFit: 'contain', borderRadius: '12px' }} />
              <p style={styles.illustrationTitle}>{editingId ? 'Edit Course' : 'New Course'}</p>
              <p style={styles.illustrationSub}>
                {editingId
                  ? 'Update the details below to keep\nyour course current and accurate.'
                  : 'Fill in the details to publish\na new course for students.'}
              </p>

              <div style={styles.progressWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#7a4400', fontWeight: '600' }}>Form Completion</span>
                  <span style={{ fontSize: '11px', color: '#5a2d00', fontWeight: '700' }}>{progressPct}%</span>
                </div>
                <div style={styles.progressBg}>
                  <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
                </div>
                <p style={{ fontSize: '11px', color: '#7a4400', marginTop: '6px' }}>
                  {filledCount} of {requiredFields.length} required fields complete
                </p>
              </div>
            </div>

            <div style={styles.modalRight}>
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>{editingId ? 'Edit Course' : 'Add New Course'}</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#aaa' }}>
                    Fields marked <span style={{ color: '#e74c3c' }}>*</span> are required
                  </p>
                </div>
                <button style={styles.closeBtn} className="close-btn" onClick={closeModal} title="Close">
                  <CloseIcon style={{ fontSize: '20px', color: '#bbb' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div style={styles.formFields}>

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
                    />
                    <div data-field-error>
                      <FieldError msg={touched.title ? fieldErrors.title : ''} />
                    </div>
                  </div>

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
                      style={{ ...inputStyle('description'), resize: 'vertical', minHeight: '100px', borderRadius: '8px', fontFamily: 'inherit' }}
                      placeholder="Describe what students will learn, who it is for, and what is included."
                      value={form.description}
                      onChange={e => handleChange('description', e.target.value)}
                      onBlur={() => handleBlur('description')}
                      maxLength={1000}
                      aria-invalid={!!fieldErrors.description}
                    />
                    <div data-field-error>
                      <FieldError msg={touched.description ? fieldErrors.description : ''} />
                    </div>
                  </div>
                  <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '2px 0' }} />

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

                  <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '2px 0' }} />

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
                        type="number" min="1" max="1000"
                        className={`f-input${fieldErrors.totalSeats && touched.totalSeats ? ' has-error' : ''}${touched.totalSeats && !fieldErrors.totalSeats ? ' is-valid' : ''}`}
                        style={inputStyle('totalSeats')}
                        value={form.totalSeats}
                        onChange={e => handleChange('totalSeats', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        onBlur={() => handleBlur('totalSeats')}
                        aria-invalid={!!fieldErrors.totalSeats}
                      />
                      <div data-field-error>
                        <FieldError msg={touched.totalSeats ? fieldErrors.totalSeats : ''} />
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <div className="field-label-row">
                        <label style={styles.label} htmlFor="f-price">Price (USD)</label>
                        <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '4px' }}>(0 = Free)</span>
                      </div>
                      <input
                        id="f-price"
                        type="number"
                        min="0"
                        step="0.01"
                        className="f-input"
                        style={styles.input}
                        placeholder="0.00"
                        value={form.price}
                        onChange={e => handleChange('price', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleBlur('price')}
                      />
                    </div>
                  </div>

                  <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '2px 0' }} />

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

                </div>

                <div style={styles.modalActions}>
                  <button type="button" style={styles.resetBtn} className="reset-btn" onClick={resetForm}>
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
            </div>
          </div>
        </div>
      )}

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
                      currently enrolled and will lose access immediately.
                    </span>
                  </div>
                )}
              </div>
            )}
            <p id="del-desc" style={styles.deleteDesc}>
              This action is <strong>permanent</strong> and cannot be undone. All course data will be removed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={styles.resetBtn} className="reset-btn"
                onClick={() => { setDeleteId(null); setDeleteTarget(null); }} disabled={deleting}>
                CANCEL
              </button>
              <button style={{ ...styles.confirmBtn, backgroundColor: '#e74c3c' }}
                className="delete-confirm-btn" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <><span style={styles.btnSpinner} />DELETING…</> : 'YES, DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 600, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </>
  );
};

const styles = {
  page: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh' },

  hero: { position: 'relative', background: 'linear-gradient(135deg, #fae9d7 0%, #f8e3bf 50%, #fdd79f 100%)', padding: '70px 60px', overflow: 'hidden', minHeight: '380px' },
  blob1: { position: 'absolute', top: '-60px', right: '35%', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(243,157,18,0.31)', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-40px', right: '-1%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(243,156,18,0.31)', pointerEvents: 'none' },
  heroInner: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', maxWidth: '1100px', margin: '0 auto' },
  heroLeft: { flex: 1, maxWidth: '500px' },
  heroTitle: { fontSize: '48px', fontWeight: '800', color: '#8b3801', margin: '0 0 18px', lineHeight: '1.2' },
  heroSub: { fontSize: '20px', color: '#463003', lineHeight: '1.7', margin: '0 0 30px' },
  heroBtns: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  heroBtnSecondary: { backgroundColor: '#fff', color: '#f39c12', border: '1.5px solid #f39c12', padding: '13px 28px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s' },
  heroRight: { position: 'relative', width: '360px', height: '300px', flexShrink: 0 },
  heroCircle: { position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%,-50%)', width: '480px', height: '480px', borderRadius: '50%', background: 'linear-gradient(135deg,#f39c12,#e67e22)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(243,156,18,0.35)' },

  featuresRow: { display: 'flex', gap: '20px', padding: '30px 60px', flexWrap: 'wrap', justifyContent: 'center' },
  featureCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', boxShadow: '0 3px 12px rgba(0,0,0,0.04)', flex: '1', minWidth: '200px', border: '1px solid #f0f0f0', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  featureIconWrap: { color: '#00b4b4', marginBottom: '8px' },
  featureIcon: { fontSize: '40px', color: '#00a89d' },
  featureTitle: { fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', margin: 0 },
  featureDesc: { color: '#888', fontSize: '13px', margin: 0, lineHeight: '1.5' },

  container: { padding: '20px 40px 60px', maxWidth: '1400px', margin: '0 auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  sectionTitle: { fontSize: '24px', color: '#1e293b', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' },
  createBtn: { backgroundColor: '#f39c12', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' },

  errorBox: { backgroundColor: '#fdecea', color: '#e74c3c', padding: '14px 18px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' },
  loadingWrap: { textAlign: 'center', padding: '60px' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #00b4b4', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' },
  loadingText: { color: '#64748b', fontSize: '15px' },

  empty: { textAlign: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' },
  emptyIconBg: { width: '80px', height: '80px', backgroundColor: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  emptyText: { fontSize: '20px', color: '#1e293b', fontWeight: '700', marginBottom: '8px' },
  emptyHint: { fontSize: '15px', color: '#64748b' },


  tableWrap: { overflow: 'hidden', paddingBottom: '20px' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', tableLayout: 'fixed' },
  th: { padding: '10px 12px', textAlign: 'left', borderBottom: 'none' },
  thContent: { display: 'flex', alignItems: 'center', gap: '6px', color: '#e67e22', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' },
  thIcon: { fontSize: '16px', color: '#f39c12' },

  td: { padding: '16px 12px', verticalAlign: 'middle' },

  categoryTag: { backgroundColor: '#fff7ed', color: '#e67e22', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em', border: '1px solid #fdba74' },
  barWrap: { height: '8px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' },


  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '18px', width: '100%', maxWidth: '900px', maxHeight: '92vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', overflow: 'hidden' },

  modalLeft: { width: '270px', flexShrink: 0, background: 'linear-gradient(155deg, #e6940f 45%, #eead58 60%, #f0cd91 80%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 24px 40px', textAlign: 'center' },
  illustrationTitle: { fontSize: '19px', fontWeight: '700', color: '#5a2d00', margin: '0 0 8px' },
  illustrationSub: { fontSize: '12px', color: '#7a4400', lineHeight: '1.65', margin: '0 0 20px', whiteSpace: 'pre-line' },
  progressWrap: { width: '100%', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: '10px', padding: '12px 14px' },
  progressBg: { height: '6px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '999px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#5a2d00', borderRadius: '999px', transition: 'width 0.35s ease' },

  modalRight: { flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 32px', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  modalTitle: { fontSize: '20px', color: '#2c3e50', fontWeight: '700', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '6px', transition: 'background 0.15s', flexShrink: 0 },

  formFields: { display: 'flex', flexDirection: 'column', gap: '22px' },
  formRow: { display: 'flex', gap: '18px' },
  formGroup: { display: 'flex', flexDirection: 'column', flex: 1 },
  label: { fontSize: '13px', fontWeight: '600', color: '#444' },

  input: { padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '14px', backgroundColor: '#fafafa', color: '#2c3e50', transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },

  fieldError: { display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c', fontSize: '12px', marginTop: '5px', animation: 'slideDown 0.18s ease' },
  infoAlert: { display: 'flex', alignItems: 'flex-start', gap: '7px', backgroundColor: '#e8f0fe', border: '1px solid #c5d9f7', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: '#1a73e8', lineHeight: '1.55', marginTop: '6px' },

  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f0f0f0' },
  resetBtn: { padding: '10px 28px', backgroundColor: '#fff', color: '#f39c12', border: '1.5px solid #f39c12', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', letterSpacing: '0.05em', transition: 'background-color 0.2s' },
  confirmBtn: { padding: '10px 28px', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', letterSpacing: '0.05em', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSpinner: { width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' },

  deleteModal: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', textAlign: 'center' },
  deleteIconWrap: { width: '64px', height: '64px', backgroundColor: '#fdecea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  deleteTitle: { fontSize: '20px', color: '#2c3e50', fontWeight: '700', margin: '0 0 12px' },
  deleteTarget: { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', textAlign: 'left' },
  deleteWarning: { display: 'flex', alignItems: 'flex-start', gap: '7px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#7a5a00', marginTop: '10px', lineHeight: '1.5' },
  deleteDesc: { color: '#888', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' },
};

export default MyCourses;