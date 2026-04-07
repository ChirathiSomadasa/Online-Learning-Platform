import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

import { getUserEnrollments, updateProgress, cancelEnrollment } from '../services/enrollmentService';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AppsIcon from "@mui/icons-material/Apps";
import ViewListIcon from "@mui/icons-material/ViewList";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

/* ─────────────────────────────────────────
   CSS – light defaults, .dark overrides
───────────────────────────────────────── */
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg:       #f0f4ff;
    --surface:  #ffffff;
    --surface2: #f8faff;
    --border:   #e4eaf5;
    --accent:   #3b6ff0;
    --text:     #0f172a;
    --muted:    #64748b;
    --shadow:   rgba(59,111,240,0.08);
  }

  .dark {
    --bg:       #0b0f1c;
    --surface:  #131929;
    --surface2: #1a2236;
    --border:   rgba(255,255,255,0.08);
    --accent:   #4f8ef7;
    --text:     #e8edf8;
    --muted:    #6b7a99;
    --shadow:   rgba(0,0,0,0.4);
  }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(-10px); } to { opacity:1; transform:scale(1) translateY(0); } }

  .enroll-card {
    animation: fadeUp 0.38s ease both;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .enroll-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 48px var(--shadow) !important;
    border-color: var(--accent) !important;
  }
  .search-inp:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(59,111,240,0.15) !important; outline: none; }
  .chip-btn  { transition: all 0.18s ease; }
  .chip-btn:hover { transform: translateY(-1px); }
  .action-btn { transition: all 0.2s ease; }
  .action-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .toggle-btn { transition: all 0.18s ease; }
  .theme-btn { transition: transform 0.25s ease; }
  .theme-btn:hover { transform: rotate(20deg) scale(1.1); }
  .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .stat-card:hover { transform: translateY(-3px); }

  input[type=range] { cursor: pointer; accent-color: var(--accent); }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
    background: var(--accent); box-shadow: 0 2px 8px rgba(59,111,240,0.4);
  }
  input[type=range]::-moz-range-thumb {
    width: 20px; height: 20px; border-radius: 50%; background: var(--accent); border: none;
  }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  select option { background: var(--surface); color: var(--text); }
`;
document.head.appendChild(styleSheet);

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const getDisplayStatus = (status, progress) => {
    if (progress === 100) return 'completed';
    const s = status?.toLowerCase() || '';
    if (s === 'cancelled' || s === 'canceled') return 'cancelled';
    if (s === 'active' || s === 'in-progress' || s === 'in progress') return 'active';
    if (s === 'completed' || s === 'complete') return 'completed';
    return s;
};

const statusMeta = (status, progress, dark) => {
    const d = getDisplayStatus(status, progress);
    const m = {
        completed: {
            color: dark ? '#22c98a' : '#15a870',
            bg: dark ? 'rgba(34,201,138,0.14)' : '#edfaf4',
            bdr: dark ? 'rgba(34,201,138,0.25)' : '#b6ecd8',
            label: 'Completed', icon: <EmojiEventsIcon style={{ fontSize: 13 }} />,
        },
        cancelled: {
            color: dark ? '#f45c5c' : '#dc3545',
            bg: dark ? 'rgba(244,92,92,0.14)' : '#fff0f0',
            bdr: dark ? 'rgba(244,92,92,0.25)' : '#ffc9c9',
            label: 'Cancelled', icon: <CancelIcon style={{ fontSize: 13 }} />,
        },
        active: {
            color: dark ? '#4f8ef7' : '#3b6ff0',
            bg: dark ? 'rgba(79,142,247,0.14)' : '#eef3ff',
            bdr: dark ? 'rgba(79,142,247,0.25)' : '#c0d0fa',
            label: 'Active', icon: <PlayCircleIcon style={{ fontSize: 13 }} />,
        },
    };
    return m[d] || { color: '#64748b', bg: '#f1f5f9', bdr: '#e2e8f0', label: d || 'Unknown', icon: null };
};

const progressColor = (p) => {
    if (p === 100) return '#15a870';
    if (p >= 75) return '#3b6ff0';
    if (p >= 50) return '#6c47d9';
    if (p >= 25) return '#d97706';
    return '#dc3545';
};

const sortEnrollments = (list, type) => {
    const active = list.filter(e => e.status !== 'cancelled');
    const cancelled = list.filter(e => e.status === 'cancelled');
    const byDate = (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt);
    if (type === 'recent') { active.sort(byDate); cancelled.sort(byDate); }
    if (type === 'progress') { active.sort((a, b) => b.progress - a.progress); cancelled.sort(byDate); }
    if (type === 'title') { const t = (a, b) => a.courseTitle.localeCompare(b.courseTitle); active.sort(t); cancelled.sort(t); }
    return [...active, ...cancelled];
};

/* ─────────────────────────────────────────
   CircleProgress
───────────────────────────────────────── */
const CircleProgress = ({ value, size = 60, dark }) => {
    const r = 14, c = 2 * Math.PI * r, offset = c - (value / 100) * c, col = progressColor(value);
    return (
        <svg width={size} height={size} viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={r} fill="none"
                stroke={dark ? 'rgba(255,255,255,0.07)' : '#e8edf5'} strokeWidth="3" />
            <circle cx="18" cy="18" r={r} fill="none" stroke={col} strokeWidth="3"
                strokeDasharray={`${c} ${c}`} strokeDashoffset={offset}
                strokeLinecap="round" transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            <text x="18" y="22" textAnchor="middle" fontSize="6.5"
                fill={col} fontFamily="'DM Mono',monospace" fontWeight="500">{value}%</text>
        </svg>
    );
};

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
const Enrollments = () => {
    const [dark, setDark] = useState(false);
    const [enrollments, setEnrollments] = useState([]);
    const [filteredEnrollments, setFiltered] = useState([]);
    const [viewMode, setViewMode] = useState("grid");
    const [loading, setLoading] = useState(true);
    const [selectedEnrollment, setSelected] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [updatingProgress, setUpdating] = useState(false);
    const [editingProgress, setEditing] = useState(false);
    const [newProgress, setNewProgress] = useState(0);
    const [searchTerm, setSearch] = useState('');
    const [statusFilter, setStatus] = useState('all');
    const [sortBy, setSort] = useState('recent');
    const [showFilters, setShowFilters] = useState(false);
    const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, averageProgress: 0 });

    const user = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();
    const location = useLocation();
    const F = "'Plus Jakarta Sans', sans-serif";

    // Derived theme values (used inline; CSS vars handle the rest)
    const T = {
        bg: dark ? '#0b0f1c' : '#f0f4ff',
        surface: dark ? '#131929' : '#ffffff',
        surface2: dark ? '#1a2236' : '#f8faff',
        border: dark ? 'rgba(255,255,255,0.08)' : '#e4eaf5',
        accent: dark ? '#00d4d4' : '#00b4b4',
        text: dark ? '#e8edf8' : '#0f172a',
        text2: dark ? '#b0bcd4' : '#334155',
        muted: dark ? '#6b7a99' : '#64748b',
        shadow: dark ? 'rgba(0,0,0,0.4)' : 'rgba(59,111,240,0.09)',
        hdr: dark ? 'linear-gradient(135deg, #008a8a 0%, #00b4b4 100%)' : 'linear-gradient(135deg, #00b4b4 0%, #00d4d4 100%)',
    };

    useEffect(() => {
        let f = [...enrollments];
        if (searchTerm) f = f.filter(e =>
            e.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.instructor.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (statusFilter !== 'all') f = f.filter(e => {
            const s = e.status?.toLowerCase() || '';
            if (statusFilter === 'active') return s === 'active' || s === 'in-progress' || s === 'in progress';
            if (statusFilter === 'completed') return s === 'completed' || s === 'complete' || e.progress === 100;
            if (statusFilter === 'cancelled') return s === 'cancelled' || s === 'canceled';
            return true;
        });
        setFiltered(sortEnrollments(f, sortBy));
    }, [enrollments, searchTerm, statusFilter, sortBy]);

    useEffect(() => {
        fetchEnrollments();
        if (location.state?.enrollmentSuccess) {
            toast.success(location.state.message || "Successfully enrolled!");
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, []);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const data = await getUserEnrollments(user.id, token);
            setEnrollments(data); setFiltered(data); calcStats(data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load enrollments");
        } finally { setLoading(false); }
    };

    const calcStats = (data) => {
        const total = data.length;
        const completed = data.filter(e => e.progress === 100 || ['completed', 'complete'].includes(e.status?.toLowerCase())).length;
        const inProgress = data.filter(e => e.progress > 0 && e.progress < 100 && !['cancelled', 'completed'].includes(e.status?.toLowerCase())).length;
        const avg = total > 0 ? Math.round(data.reduce((s, e) => s + (e.progress || 0), 0) / total) : 0;
        setStats({ total, completed, inProgress, averageProgress: avg });
    };

    const openDetail = (enroll) => { setSelected(enroll); setNewProgress(enroll.progress || 0); setEditing(false); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setSelected(null); setEditing(false); };

    const handleUpdateProgress = async () => {
        if (!selectedEnrollment) return;
        if (newProgress < selectedEnrollment.progress) { toast.warning("Learning is forward only!"); return; }
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            await updateProgress(selectedEnrollment._id, newProgress, token);
            toast.success('Progress updated!');
            setSelected({ ...selectedEnrollment, progress: newProgress }); setEditing(false);
            const updated = enrollments.map(e => e._id === selectedEnrollment._id ? { ...e, progress: newProgress } : e);
            setEnrollments(updated); calcStats(updated);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update progress');
        } finally { setUpdating(false); }
    };

    const handleCancel = (id, title, progress) => {
        if (progress >= 50) { toast.warning("Cannot cancel — you've completed 50%+ of this course."); return; }
        toast(({ closeToast }) => (
            <div style={{ fontFamily: F }}>
                <p style={{ marginBottom: 12, fontSize: 14 }}>Cancel <b>{title}</b>?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: F }}
                        onClick={async () => {
                            try {
                                const token = localStorage.getItem('token');
                                await cancelEnrollment(id, token);
                                toast.success('Enrollment cancelled');
                                fetchEnrollments(); closeToast();
                            } catch (err) { toast.error(err.response?.data?.message || "Failed to cancel"); }
                        }}>Confirm</button>
                    <button style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}
                        onClick={closeToast}>Dismiss</button>
                </div>
            </div>
        ), { autoClose: false });
    };

    const statCards = [
        { label: 'Total Courses', value: stats.total, icon: <SchoolIcon style={{ fontSize: 22 }} />, color: '#3b6ff0', dColor: '#4f8ef7', lightBg: 'rgba(255,255,255,0.2)', darkBg: 'rgba(79,142,247,0.15)' },
        { label: 'Completed', value: stats.completed, icon: <CheckCircleIcon style={{ fontSize: 22 }} />, color: '#15a870', dColor: '#22c98a', lightBg: 'rgba(255,255,255,0.2)', darkBg: 'rgba(34,201,138,0.15)' },
        { label: 'In Progress', value: stats.inProgress, icon: <PlayCircleIcon style={{ fontSize: 22 }} />, color: '#d97706', dColor: '#f5a623', lightBg: 'rgba(255,255,255,0.2)', darkBg: 'rgba(245,166,35,0.15)' },
        { label: 'Avg. Progress', value: `${stats.averageProgress}%`, icon: <TrendingUpIcon style={{ fontSize: 22 }} />, color: '#6c47d9', dColor: '#7c5fe6', lightBg: 'rgba(255,255,255,0.2)', darkBg: 'rgba(124,95,230,0.15)' },
    ];

    return (
        <div className={dark ? 'dark' : ''}
            style={{ fontFamily: F, background: T.bg, minHeight: '100vh', color: T.text, transition: 'background 0.3s, color 0.3s' }}>
            <ToastContainer position="top-right" autoClose={3000} />

            {/* ══ HEADER ══ */}
            <header style={{ background: T.hdr, padding: '0 48px', transition: 'background 0.3s' }}>
                <div style={{ maxWidth: 1380, margin: '0 auto', padding: '28px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SchoolIcon style={{ fontSize: 26, color: '#fff' }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>My Enrollments</h1>
                            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>Track and manage your learning journey</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* ── Dark / Light mode toggle ── */}
                        <button className="theme-btn" title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            onClick={() => setDark(d => !d)}
                            style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.28)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff',
                            }}>
                            {dark
                                ? <LightModeIcon style={{ fontSize: 20 }} />
                                : <DarkModeIcon style={{ fontSize: 20 }} />}
                        </button>

                        {/* Explore */}
                        <button className="action-btn" onClick={() => navigate('/courses')} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,255,255,0.18)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff', padding: '10px 20px', borderRadius: 12,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                        }}>
                            <MenuBookIcon style={{ fontSize: 17 }} /> Explore Courses
                        </button>
                    </div>
                </div>

                {/* Stat cards inside header */}
                <div style={{ maxWidth: 1380, margin: '22px auto 0', paddingBottom: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {/* {statCards.map((s, i) => (
            <div key={i} className="stat-card" style={{
              background: dark ? s.darkBg : s.lightBg,
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 16, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: "'DM Mono',monospace" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))} */}
                </div>
            </header>

            {/* ══ FILTERS ══ */}
            <div style={{ maxWidth: 1380, margin: '28px auto 0', padding: '0 48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                        <SearchIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.muted, fontSize: 18, pointerEvents: 'none' }} />
                        <input className="search-inp" value={searchTerm} onChange={e => setSearch(e.target.value)}
                            placeholder="Search courses or instructors…"
                            style={{ width: '100%', padding: '12px 40px 12px 42px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, fontFamily: F, transition: 'all 0.2s' }} />
                        {searchTerm && (
                            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 2 }}>
                                <CloseIcon style={{ fontSize: 16 }} />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    <button className="chip-btn" onClick={() => setShowFilters(!showFilters)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '11px 18px', borderRadius: 12,
                        border: `1.5px solid ${showFilters ? T.accent : T.border}`,
                        background: showFilters ? (dark ? 'rgba(79,142,247,0.12)' : '#eef3ff') : T.surface,
                        color: showFilters ? T.accent : T.muted,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                    }}>
                        <FilterListIcon style={{ fontSize: 17 }} /> Filters
                    </button>

                    {/* Sort */}
                    <select value={sortBy} onChange={e => setSort(e.target.value)} style={{
                        padding: '12px 18px', borderRadius: 12, border: `1.5px solid ${T.border}`,
                        background: T.surface, color: T.text, fontSize: 13, fontFamily: F, cursor: 'pointer', outline: 'none', minWidth: 160,
                    }}>
                        <option value="recent">Most Recent</option>
                        <option value="progress">Highest Progress</option>
                        <option value="title">Course Title</option>
                    </select>

                    {/* Count */}
                    <span style={{ background: dark ? 'rgba(79,142,247,0.12)' : '#eef3ff', color: T.accent, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${dark ? 'rgba(79,142,247,0.2)' : '#c0d0fa'}` }}>
                        {filteredEnrollments.length} course{filteredEnrollments.length !== 1 ? 's' : ''}
                    </span>

                    {/* View toggle */}
                    <div style={{ marginLeft: 'auto', display: 'flex', background: T.surface, borderRadius: 12, border: `1.5px solid ${T.border}`, overflow: 'hidden' }}>
                        {[{ mode: 'grid', Icon: AppsIcon }, { mode: 'list', Icon: ViewListIcon }].map(({ mode, Icon }) => (
                            <button key={mode} className="toggle-btn" onClick={() => setViewMode(mode)} style={{
                                padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: F,
                                background: viewMode === mode ? (dark ? 'rgba(79,142,247,0.15)' : '#eef3ff') : 'transparent',
                                color: viewMode === mode ? T.accent : T.muted,
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                            }}>
                                <Icon style={{ fontSize: 16 }} /> {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status filter chips */}
                {showFilters && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 8 }}>
                        {['all', 'active', 'completed', 'cancelled'].map(s => (
                            <button key={s} className="chip-btn" onClick={() => setStatus(s)} style={{
                                padding: '7px 18px', borderRadius: 30,
                                border: `1.5px solid ${statusFilter === s ? T.accent : T.border}`,
                                background: statusFilter === s ? (dark ? 'rgba(79,142,247,0.14)' : '#eef3ff') : T.surface,
                                color: statusFilter === s ? T.accent : T.muted,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F, textTransform: 'capitalize',
                            }}>{s === 'all' ? 'All Courses' : s}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* ══ MAIN CONTENT ══ */}
            <main style={{ maxWidth: 1380, margin: '24px auto 60px', padding: '0 48px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
                        <div style={{ width: 40, height: 40, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        <p style={{ color: T.muted, fontSize: 14 }}>Loading your courses…</p>
                    </div>
                ) : filteredEnrollments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: T.surface, borderRadius: 24, border: `1.5px solid ${T.border}`, boxShadow: `0 4px 24px ${T.shadow}` }}>
                        <SchoolIcon style={{ fontSize: 52, color: T.border, marginBottom: 16 }} />
                        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: T.text }}>No Courses Found</h3>
                        <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>
                            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Start your learning journey today!'}
                        </p>
                        <button className="action-btn" onClick={() => navigate('/courses')} style={{
                            padding: '12px 28px', background: `linear-gradient(135deg,${T.accent},#6c47d9)`,
                            color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 16px ${T.shadow}`,
                        }}>Browse Courses</button>
                    </div>

                ) : viewMode === 'grid' ? (
                    /* ── GRID ── */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
                        {filteredEnrollments.map((enroll, idx) => {
                            const sm = statusMeta(enroll.status, enroll.progress, dark);
                            return (
                                <div key={enroll._id} className="enroll-card" onClick={() => openDetail(enroll)}
                                    style={{
                                        background: T.surface, border: `1.5px solid ${T.border}`,
                                        borderRadius: 20, padding: '22px 22px 18px', cursor: 'pointer',
                                        boxShadow: `0 2px 14px ${T.shadow}`,
                                        animationDelay: `${idx * 0.05}s`,
                                        display: 'flex', flexDirection: 'column', gap: 14,
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: sm.bg, color: sm.color, border: `1px solid ${sm.bdr}`, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            {sm.icon} {sm.label}
                                        </span>
                                        <CircleProgress value={enroll.progress} size={58} dark={dark} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.45 }}>{enroll.courseTitle}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.muted }}>
                                            <PersonIcon style={{ fontSize: 15, color: T.accent }} /> {enroll.instructor}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.muted }}>
                                            <AccessTimeIcon style={{ fontSize: 15, color: T.accent }} />
                                            {new Date(enroll.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div style={{ height: 5, background: dark ? 'rgba(255,255,255,0.07)' : '#e8edf5', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${enroll.progress}%`, background: progressColor(enroll.progress), borderRadius: 4, transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                ) : (
                    /* ── LIST ── */
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filteredEnrollments.map((enroll, idx) => {
                                const sm = statusMeta(enroll.status, enroll.progress, dark);
                                return (
                                    <div key={enroll._id} className="enroll-card" onClick={() => openDetail(enroll)}
                                        style={{
                                            background: T.surface, border: `1.5px solid ${T.border}`, borderLeft: `4px solid ${sm.color}`,
                                            borderRadius: 18, padding: '18px 22px', cursor: 'pointer',
                                            boxShadow: `0 2px 12px ${T.shadow}`,
                                            display: 'flex', alignItems: 'center', gap: 22,
                                            animationDelay: `${idx * 0.04}s`,
                                        }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: sm.bg, color: sm.color, border: `1px solid ${sm.bdr}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                                                {sm.icon} {sm.label}
                                            </span>
                                            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: T.text }}>{enroll.courseTitle}</h3>
                                            <div style={{ display: 'flex', gap: 18 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}>
                                                    <PersonIcon style={{ fontSize: 14, color: T.accent }} /> {enroll.instructor}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}>
                                                    <AccessTimeIcon style={{ fontSize: 14, color: T.accent }} />
                                                    {new Date(enroll.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                                            <div style={{ width: 110 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                    <span style={{ fontSize: 11, color: T.muted }}>Progress</span>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: progressColor(enroll.progress), fontFamily: "'DM Mono',monospace" }}>{enroll.progress}%</span>
                                                </div>
                                                <div style={{ height: 5, background: dark ? 'rgba(255,255,255,0.08)' : '#e8edf5', borderRadius: 4, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${enroll.progress}%`, background: progressColor(enroll.progress), borderRadius: 4, transition: 'width 0.5s ease' }} />
                                                </div>
                                            </div>
                                            <CircleProgress value={enroll.progress} size={52} dark={dark} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Insights sidebar */}
                        <div style={{ width: 270, flexShrink: 0, position: 'sticky', top: 20, background: T.surface, borderRadius: 20, border: `1.5px solid ${T.border}`, padding: 22, boxShadow: `0 4px 24px ${T.shadow}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                <TrendingUpIcon style={{ color: T.accent, fontSize: 20 }} />
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Learning Insights</h3>
                            </div>
                            {[
                                { label: 'Total Learning', value: `~${stats.total * 15}h` },
                                { label: 'Completion Rate', value: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` },
                                { label: 'Active Courses', value: stats.inProgress },
                                { label: 'Avg Progress', value: `${stats.averageProgress}%` },
                            ].map(({ label, value }, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${T.border}` }}>
                                    <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, fontFamily: "'DM Mono',monospace" }}>{value}</span>
                                </div>
                            ))}
                            <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>Click any card to update progress</p>
                        </div>
                    </div>
                )}
            </main>

            {/* ══ MODAL ══ */}
            {modalOpen && selectedEnrollment && (() => {
                const sm = statusMeta(selectedEnrollment.status, selectedEnrollment.progress, dark);
                return (
                    <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
                    }}>
                        <div style={{
                            background: T.surface, borderRadius: 24, maxWidth: 560, width: '100%',
                            maxHeight: '90vh', overflow: 'hidden',
                            border: `1.5px solid ${T.border}`,
                            boxShadow: `0 24px 70px ${dark ? 'rgba(0,0,0,0.7)' : 'rgba(59,111,240,0.18)'}`,
                            animation: 'modalIn 0.28s ease',
                        }}>
                            {/* Modal header */}
                            <div style={{ padding: '26px 26px 22px', background: T.hdr, position: 'relative', borderBottom: `1px solid ${T.border}` }}>
                                <button onClick={closeModal} style={{
                                    position: 'absolute', top: 18, right: 18, width: 32, height: 32, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff',
                                }}><CloseIcon style={{ fontSize: 15 }} /></button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <SchoolIcon style={{ fontSize: 24, color: '#fff' }} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                                            {sm.icon} {sm.label}
                                        </span>
                                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>{selectedEnrollment.courseTitle}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Modal body */}
                            <div style={{ padding: 26, overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
                                {/* Info grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                                    {[
                                        { icon: <PersonIcon style={{ fontSize: 18, color: T.accent }} />, label: 'Instructor', value: selectedEnrollment.instructor },
                                        { icon: <AccessTimeIcon style={{ fontSize: 18, color: T.accent }} />, label: 'Enrolled On', value: new Date(selectedEnrollment.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                    ].map(({ icon, label, value }, i) => (
                                        <div key={i} style={{ background: T.surface2, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${T.border}` }}>
                                            {icon}
                                            <div>
                                                <p style={{ margin: 0, fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                                                <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, color: T.text }}>{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress section */}
                                <div style={{ background: T.surface2, borderRadius: 16, padding: 20, marginBottom: 22, border: `1px solid ${T.border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Course Progress</h3>
                                        {!editingProgress ? (
                                            <button className="action-btn" onClick={() => setEditing(true)}
                                                disabled={selectedEnrollment.status === 'cancelled' || selectedEnrollment.progress === 100}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                                                    background: dark ? 'rgba(79,142,247,0.12)' : '#eef3ff', color: T.accent,
                                                    border: `1px solid ${dark ? 'rgba(79,142,247,0.22)' : '#c0d0fa'}`,
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                                    opacity: (selectedEnrollment.status === 'cancelled' || selectedEnrollment.progress === 100) ? 0.45 : 1,
                                                }}>
                                                <EditIcon style={{ fontSize: 14 }} /> Update
                                            </button>
                                        ) : (
                                            <button className="action-btn" onClick={handleUpdateProgress} disabled={updatingProgress} style={{
                                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                                                background: dark ? 'rgba(34,201,138,0.12)' : '#edfaf4',
                                                color: dark ? '#22c98a' : '#15a870',
                                                border: `1px solid ${dark ? 'rgba(34,201,138,0.22)' : '#b6ecd8'}`,
                                                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                            }}>
                                                {updatingProgress
                                                    ? <div style={{ width: 14, height: 14, border: `2px solid ${dark ? 'rgba(34,201,138,0.3)' : '#b6ecd8'}`, borderTop: `2px solid ${dark ? '#22c98a' : '#15a870'}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                    : <SaveIcon style={{ fontSize: 14 }} />}
                                                {updatingProgress ? 'Saving…' : 'Save'}
                                            </button>
                                        )}
                                    </div>

                                    {editingProgress ? (
                                        <div>
                                            <input type="range" min="0" max="100" step="5" value={newProgress}
                                                onChange={e => setNewProgress(parseInt(e.target.value))}
                                                style={{ width: '100%', height: 4, borderRadius: 4, marginBottom: 14 }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 26, fontWeight: 800, color: progressColor(newProgress), fontFamily: "'DM Mono',monospace" }}>{newProgress}%</span>
                                                <span style={{ fontSize: 12, color: T.muted }}>
                                                    {newProgress === 100 ? '🎉 Completed!' : newProgress > 0 ? 'In Progress' : 'Not Started'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <span style={{ fontSize: 26, fontWeight: 800, color: progressColor(selectedEnrollment.progress), fontFamily: "'DM Mono',monospace" }}>{selectedEnrollment.progress}%</span>
                                                {selectedEnrollment.progress === 100 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: dark ? 'rgba(34,201,138,0.12)' : '#edfaf4', color: dark ? '#22c98a' : '#15a870', fontSize: 12, fontWeight: 600 }}>
                                                        <EmojiEventsIcon style={{ fontSize: 15 }} /> Completed!
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ height: 6, background: dark ? 'rgba(255,255,255,0.08)' : '#e8edf5', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${selectedEnrollment.progress}%`, background: progressColor(selectedEnrollment.progress), borderRadius: 4, transition: 'width 0.5s ease' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal actions */}
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    {selectedEnrollment.status !== 'cancelled' && selectedEnrollment.progress < 50 && (
                                        <button className="action-btn" onClick={() => { closeModal(); handleCancel(selectedEnrollment._id, selectedEnrollment.courseTitle, selectedEnrollment.progress); }} style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
                                            background: dark ? 'rgba(244,92,92,0.10)' : '#fff0f0',
                                            color: dark ? '#f45c5c' : '#dc3545',
                                            border: `1px solid ${dark ? 'rgba(244,92,92,0.22)' : '#ffc9c9'}`,
                                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                        }}>
                                            <CancelIcon style={{ fontSize: 16 }} /> Cancel Enrollment
                                        </button>
                                    )}
                                    <button onClick={closeModal} style={{
                                        padding: '10px 24px', borderRadius: 12,
                                        background: T.surface2, color: T.muted, border: `1px solid ${T.border}`,
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                    }}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Enrollments;
