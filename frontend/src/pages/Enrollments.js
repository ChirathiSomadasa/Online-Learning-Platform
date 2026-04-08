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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
    --accent:   #00b4b4;
    --text:     #0f172a;
    --muted:    #64748b;
    --shadow:   rgba(0,180,180,0.08);
  }

  .dark {
    --bg:       #0b0f1c;
    --surface:  #131929;
    --surface2: #1a2236;
    --border:   rgba(255,255,255,0.08);
    --accent:   #00d4d4;
    --text:     #e8edf8;
    --muted:    #6b7a99;
    --shadow:   rgba(0,0,0,0.4);
  }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(-8px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .enroll-card {
    animation: fadeUp 0.38s ease both;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .enroll-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 52px var(--shadow) !important;
    border-color: var(--accent) !important;
  }
  .search-inp:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(0,180,180,0.15) !important; outline: none; }
  .chip-btn  { transition: all 0.18s ease; }
  .chip-btn:hover { transform: translateY(-1px); }
  .action-btn { transition: all 0.2s ease; }
  .action-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .toggle-btn { transition: all 0.18s ease; }
  .theme-btn { transition: transform 0.25s ease; }
  .theme-btn:hover { transform: rotate(20deg) scale(1.1); }
  .stat-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .stat-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.06);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .stat-card:hover { transform: translateY(-3px); }
  .stat-card:hover::after { opacity: 1; }

  .skeleton {
    background: linear-gradient(90deg, var(--border) 25%, var(--surface2) 50%, var(--border) 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 8px;
  }

  input[type=range] { cursor: pointer; accent-color: var(--accent); }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
    background: var(--accent); box-shadow: 0 2px 8px rgba(0,180,180,0.4);
  }
  input[type=range]::-moz-range-thumb {
    width: 20px; height: 20px; border-radius: 50%; background: var(--accent); border: none;
  }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  select option { background: var(--surface); color: var(--text); }

  .modal-scroll { overflow-y: auto; }
  .modal-scroll::-webkit-scrollbar { width: 4px; }
  .modal-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .progress-track {
    height: 6px; background: var(--border); border-radius: 4px; overflow: hidden;
  }
  .progress-bar {
    height: 100%; border-radius: 4px; transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  }

  .confirm-overlay {
    animation: fadeUp 0.2s ease;
  }
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
            color: dark ? '#22c98a' : '#0d9f6e',
            bg: dark ? 'rgba(34,201,138,0.12)' : '#edfaf4',
            bdr: dark ? 'rgba(34,201,138,0.2)' : '#c3ead8',
            label: 'Completed', icon: <EmojiEventsIcon style={{ fontSize: 12 }} />,
        },
        cancelled: {
            color: dark ? '#f06b6b' : '#c53030',
            bg: dark ? 'rgba(240,107,107,0.12)' : '#fff1f1',
            bdr: dark ? 'rgba(240,107,107,0.2)' : '#fecaca',
            label: 'Cancelled', icon: <CancelIcon style={{ fontSize: 12 }} />,
        },
        active: {
            color: dark ? '#00d4d4' : '#007f7f',
            bg: dark ? 'rgba(0,212,212,0.12)' : '#e6fafa',
            bdr: dark ? 'rgba(0,212,212,0.2)' : '#a7f0f0',
            label: 'Active', icon: <PlayCircleIcon style={{ fontSize: 12 }} />,
        },
    };
    return m[d] || { color: '#64748b', bg: '#f1f5f9', bdr: '#e2e8f0', label: d || 'Unknown', icon: null };
};

const progressColor = (p) => {
    if (p === 100) return '#0d9f6e';
    if (p >= 75)  return '#007f7f';
    if (p >= 50)  return '#5a3fc0';
    if (p >= 25)  return '#c47a0a';
    return '#b91c1c';
};

const sortEnrollments = (list, type) => {
    const active    = list.filter(e => e.status !== 'cancelled');
    const cancelled = list.filter(e => e.status === 'cancelled');
    const byDate    = (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt);
    if (type === 'recent')   { active.sort(byDate); cancelled.sort(byDate); }
    if (type === 'progress') { active.sort((a, b) => b.progress - a.progress); cancelled.sort(byDate); }
    if (type === 'title')    { const t = (a, b) => a.courseTitle.localeCompare(b.courseTitle); active.sort(t); cancelled.sort(t); }
    return [...active, ...cancelled];
};

/* ─────────────────────────────────────────
   Skeleton card (loading state)
───────────────────────────────────────── */
const SkeletonCard = ({ T }) => (
    <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 20, padding: '22px 22px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 80, height: 24 }} />
            <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
        </div>
        <div className="skeleton" style={{ width: '75%', height: 18 }} />
        <div className="skeleton" style={{ width: '50%', height: 14 }} />
        <div className="skeleton" style={{ width: '100%', height: 5, borderRadius: 4 }} />
    </div>
);

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
                style={{ transition: 'stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1)' }} />
            <text x="18" y="22" textAnchor="middle" fontSize="6.5"
                fill={col} fontFamily="'DM Mono',monospace" fontWeight="500">{value}%</text>
        </svg>
    );
};

/* ─────────────────────────────────────────
   Inline Confirm Dialog
───────────────────────────────────────── */
const ConfirmDialog = ({ title, message, onConfirm, onDismiss, T, F, loading }) => (
    <div className="confirm-overlay" style={{
        background: T.surface2, border: `1.5px solid ${T.border}`,
        borderRadius: 16, padding: '20px 22px', marginTop: 16,
    }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(185,28,28,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WarningAmberIcon style={{ fontSize: 18, color: '#b91c1c' }} />
            </div>
            <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>{title}</p>
                <p style={{ margin: '5px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{message}</p>
            </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onDismiss} style={{
                padding: '8px 18px', borderRadius: 10, background: 'transparent',
                color: T.muted, border: `1px solid ${T.border}`,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F,
            }}>Keep Enrolled</button>
            <button onClick={onConfirm} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10,
                background: 'rgba(185,28,28,0.1)', color: '#b91c1c',
                border: '1px solid rgba(185,28,28,0.2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                opacity: loading ? 0.7 : 1,
            }}>
                {loading
                    ? <div style={{ width: 12, height: 12, border: '2px solid rgba(185,28,28,0.3)', borderTop: '2px solid #b91c1c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <CancelIcon style={{ fontSize: 14 }} />}
                {loading ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
        </div>
    </div>
);

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
    const [cancellingEnrollment, setCancelling] = useState(false);
    const [editingProgress, setEditing] = useState(false);
    const [newProgress, setNewProgress] = useState(0);
    const [searchTerm, setSearch] = useState('');
    const [statusFilter, setStatus] = useState('all');
    const [sortBy, setSort] = useState('recent');
    const [showFilters, setShowFilters] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, averageProgress: 0 });

    const user = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();
    const location = useLocation();
    const F = "'Plus Jakarta Sans', sans-serif";

    const T = {
        bg:      dark ? '#0b0f1c' : '#f0f4ff',
        surface: dark ? '#131929' : '#ffffff',
        surface2:dark ? '#1a2236' : '#f8faff',
        border:  dark ? 'rgba(255,255,255,0.08)' : '#e4eaf5',
        accent:  dark ? '#00d4d4' : '#00b4b4',
        text:    dark ? '#e8edf8' : '#0f172a',
        text2:   dark ? '#b0bcd4' : '#334155',
        muted:   dark ? '#6b7a99' : '#64748b',
        shadow:  dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,180,180,0.08)',
        hdr:     dark ? 'linear-gradient(135deg, #007f7f 0%, #009e9e 100%)' : 'linear-gradient(135deg, #009090 0%, #00b4b4 100%)',
    };

    useEffect(() => {
        let f = [...enrollments];
        if (searchTerm) f = f.filter(e =>
            e.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.instructor.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (statusFilter !== 'all') f = f.filter(e => {
            const s = e.status?.toLowerCase() || '';
            if (statusFilter === 'active')    return s === 'active' || s === 'in-progress' || s === 'in progress';
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
        const total      = data.length;
        const completed  = data.filter(e => e.progress === 100 || ['completed','complete'].includes(e.status?.toLowerCase())).length;
        const inProgress = data.filter(e => e.progress > 0 && e.progress < 100 && !['cancelled','completed'].includes(e.status?.toLowerCase())).length;
        const avg        = total > 0 ? Math.round(data.reduce((s, e) => s + (e.progress || 0), 0) / total) : 0;
        setStats({ total, completed, inProgress, averageProgress: avg });
    };

    const openDetail = (enroll) => {
        setSelected(enroll);
        setNewProgress(enroll.progress || 0);
        setEditing(false);
        setShowCancelConfirm(false);
        setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setSelected(null); setEditing(false); setShowCancelConfirm(false); };

    const handleUpdateProgress = async () => {
        if (!selectedEnrollment) return;
        if (newProgress < selectedEnrollment.progress) { toast.warning("Progress can only move forward."); return; }
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            await updateProgress(selectedEnrollment._id, newProgress, token);
            toast.success('Progress updated!');
            setSelected({ ...selectedEnrollment, progress: newProgress });
            setEditing(false);
            const updated = enrollments.map(e => e._id === selectedEnrollment._id ? { ...e, progress: newProgress } : e);
            setEnrollments(updated);
            calcStats(updated);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update progress');
        } finally { setUpdating(false); }
    };

    const handleCancelConfirmed = async () => {
        if (!selectedEnrollment) return;
        setCancelling(true);
        try {
            const token = localStorage.getItem('token');
            await cancelEnrollment(selectedEnrollment._id, token);
            toast.success('Enrollment cancelled successfully');
            closeModal();
            fetchEnrollments();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel enrollment');
        } finally { setCancelling(false); }
    };

    const statCards = [
        //{ label: 'Total Courses',  value: stats.total,              icon: <SchoolIcon style={{ fontSize: 20 }} />,       color: '#007f7f', lightBg: 'rgba(255,255,255,0.18)', darkBg: 'rgba(0,212,212,0.15)' },
        //{ label: 'Completed',      value: stats.completed,          icon: <CheckCircleIcon style={{ fontSize: 20 }} />,   color: '#15a870', lightBg: 'rgba(255,255,255,0.18)', darkBg: 'rgba(34,201,138,0.15)' },
        { label: 'In Progress',    value: stats.inProgress,         icon: <PlayCircleIcon style={{ fontSize: 20 }} />,    color: '#c47a0a', lightBg: 'rgba(255,255,255,0.18)', darkBg: 'rgba(196,122,10,0.15)' },
        { label: 'Avg. Progress',  value: `${stats.averageProgress}%`, icon: <TrendingUpIcon style={{ fontSize: 20 }} />, color: '#5a3fc0', lightBg: 'rgba(255,255,255,0.18)', darkBg: 'rgba(90,63,192,0.15)' },
    ];

    return (
        <div className={dark ? 'dark' : ''}
            style={{ fontFamily: F, background: T.bg, minHeight: '150vh', color: T.text, transition: 'background 0.3s, color 0.3s' }}>
            <ToastContainer position="top-right" autoClose={3000} theme={dark ? 'dark' : 'light'} />

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
                            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 400 }}>Track and manage your learning journey</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button className="theme-btn" title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            onClick={() => setDark(d => !d)}
                            style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                            {dark ? <LightModeIcon style={{ fontSize: 20 }} /> : <DarkModeIcon style={{ fontSize: 20 }} />}
                        </button>
                        <button className="action-btn" onClick={() => navigate('/courses')} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff', padding: '10px 20px', borderRadius: 12,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                        }}>
                            <MenuBookIcon style={{ fontSize: 17 }} /> Explore Courses
                        </button>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div style={{ maxWidth: 1380, margin: '22px auto 0', paddingBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {statCards.map((s, i) => (
                        <div key={i} className="stat-card" style={{
                            background: dark ? s.darkBg : s.lightBg,
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 18, padding: '16px 20px',
                            display: 'flex', alignItems: 'center', gap: 14,
                            backdropFilter: 'blur(8px)',
                        }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>
                                    {loading
                                        ? <div className="skeleton" style={{ width: 40, height: 28, display: 'inline-block', verticalAlign: 'middle' }} />
                                        : s.value}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: 500, letterSpacing: '0.04em' }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
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
                        background: showFilters ? (dark ? 'rgba(0,212,212,0.1)' : '#e6fafa') : T.surface,
                        color: showFilters ? T.accent : T.muted,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                    }}>
                        <FilterListIcon style={{ fontSize: 17 }} /> Filters
                        {statusFilter !== 'all' && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'inline-block', marginLeft: 2 }} />
                        )}
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

                    {/* Count badge */}
                    <span style={{
                        background: dark ? 'rgba(0,212,212,0.1)' : '#e6fafa',
                        color: T.accent, padding: '6px 14px', borderRadius: 20,
                        fontSize: 12, fontWeight: 700,
                        border: `1px solid ${dark ? 'rgba(0,212,212,0.18)' : '#a7f0f0'}`,
                    }}>
                        {filteredEnrollments.length} course{filteredEnrollments.length !== 1 ? 's' : ''}
                    </span>

                    {/* View toggle */}
                    <div style={{ marginLeft: 'auto', display: 'flex', background: T.surface, borderRadius: 12, border: `1.5px solid ${T.border}`, overflow: 'hidden' }}>
                        {[{ mode: 'grid', Icon: AppsIcon }, { mode: 'list', Icon: ViewListIcon }].map(({ mode, Icon }) => (
                            <button key={mode} className="toggle-btn" onClick={() => setViewMode(mode)} style={{
                                padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: F,
                                background: viewMode === mode ? (dark ? 'rgba(0,212,212,0.12)' : '#e6fafa') : 'transparent',
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
                                background: statusFilter === s ? (dark ? 'rgba(0,212,212,0.12)' : '#e6fafa') : T.surface,
                                color: statusFilter === s ? T.accent : T.muted,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F, textTransform: 'capitalize',
                            }}>{s === 'all' ? 'All Courses' : s}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* ══ MAIN CONTENT ══ */}
            <main style={{ maxWidth: 1380, margin: '24px auto ', padding: '0 48px' }}>
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} T={T} />)}
                    </div>
                ) : filteredEnrollments.length === 0 ? (
                    /* ── Empty state ── */
                    <div style={{ textAlign: 'center', padding: '72px 20px', background: T.surface, borderRadius: 24, border: `1.5px solid ${T.border}`, boxShadow: `0 4px 24px ${T.shadow}` }}>
                        <div style={{ width: 72, height: 72, borderRadius: 20, background: dark ? 'rgba(0,212,212,0.1)' : '#e6fafa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <SchoolIcon style={{ fontSize: 36, color: T.accent }} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px', color: T.text }}>
                            {searchTerm || statusFilter !== 'all' ? 'No Results Found' : 'No Courses Yet'}
                        </h3>
                        <p style={{ color: T.muted, fontSize: 14, marginBottom: 28, maxWidth: 340, margin: '0 auto 28px', lineHeight: 1.6 }}>
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Enroll in a course to start tracking your progress here.'}
                        </p>
                        {!(searchTerm || statusFilter !== 'all') && (
                            <button className="action-btn" onClick={() => navigate('/courses')} style={{
                                padding: '13px 30px',
                                background: T.accent,
                                color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', fontFamily: F, boxShadow: `0 6px 20px rgba(0,180,180,0.3)`,
                            }}>Browse Courses</button>
                        )}
                        {(searchTerm || statusFilter !== 'all') && (
                            <button className="action-btn" onClick={() => { setSearch(''); setStatus('all'); }} style={{
                                padding: '10px 22px', background: 'transparent', border: `1.5px solid ${T.border}`,
                                color: T.text, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                            }}>Clear Filters</button>
                        )}
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
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.45, flex: 1 }}>{enroll.courseTitle}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.muted }}>
                                            <PersonIcon style={{ fontSize: 15, color: T.accent }} /> {enroll.instructor}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.muted }}>
                                            <AccessTimeIcon style={{ fontSize: 15, color: T.accent }} />
                                            {new Date(enroll.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-bar" style={{ width: `${enroll.progress}%`, background: progressColor(enroll.progress) }} />
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
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: sm.bg, color: sm.color, border: `1px solid ${sm.bdr}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                                                {sm.icon} {sm.label}
                                            </span>
                                            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enroll.courseTitle}</h3>
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
                                            <div style={{ width: 120 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <span style={{ fontSize: 11, color: T.muted }}>Progress</span>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: progressColor(enroll.progress), fontFamily: "'DM Mono',monospace" }}>{enroll.progress}%</span>
                                                </div>
                                                <div className="progress-track">
                                                    <div className="progress-bar" style={{ width: `${enroll.progress}%`, background: progressColor(enroll.progress) }} />
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: dark ? 'rgba(0,212,212,0.1)' : '#e6fafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUpIcon style={{ color: T.accent, fontSize: 18 }} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Learning Insights</h3>
                            </div>
                            {[
                                { label: 'Total Learning',    value: `~${stats.total * 15}h` },
                                { label: 'Completion Rate',   value: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` },
                                { label: 'Active Courses',    value: stats.inProgress },
                                { label: 'Avg Progress',      value: `${stats.averageProgress}%` },
                            ].map(({ label, value }, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                                    <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: T.accent, fontFamily: "'DM Mono',monospace" }}>{value}</span>
                                </div>
                            ))}
                            <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginTop: 16, fontStyle: 'italic', lineHeight: 1.5 }}>Click any card to view details or update progress</p>
                        </div>
                    </div>
                )}
            </main>

            {/* ══ MODAL ══ */}
            {modalOpen && selectedEnrollment && (() => {
                const sm      = statusMeta(selectedEnrollment.status, selectedEnrollment.progress, dark);
                const isCancelled = getDisplayStatus(selectedEnrollment.status, selectedEnrollment.progress) === 'cancelled';
                const isComplete  = selectedEnrollment.progress === 100;
                const canCancel   = !isCancelled && !isComplete && selectedEnrollment.progress < 50;
                return (
                    <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
                    }}>
                        <div style={{
                            background: T.surface, borderRadius: 26, maxWidth: 560, width: '100%',
                            maxHeight: '90vh', overflow: 'hidden',
                            border: `1.5px solid ${T.border}`,
                            boxShadow: `0 28px 80px ${dark ? 'rgba(0,0,0,0.75)' : 'rgba(0,100,100,0.18)'}`,
                            animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            {/* Modal header */}
                            <div style={{ padding: '26px 26px 22px', background: T.hdr, position: 'relative', flexShrink: 0 }}>
                                <button onClick={closeModal} style={{
                                    position: 'absolute', top: 18, right: 18, width: 32, height: 32, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff',
                                }}><CloseIcon style={{ fontSize: 15 }} /></button>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingRight: 40 }}>
                                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <SchoolIcon style={{ fontSize: 24, color: '#fff' }} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                            {sm.icon} {sm.label}
                                        </span>
                                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>{selectedEnrollment.courseTitle}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Modal body */}
                            <div className="modal-scroll" style={{ padding: 26, flex: 1, overflowY: 'auto' }}>
                                {/* Info grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                    {[
                                        { icon: <PersonIcon style={{ fontSize: 16, color: T.accent }} />, label: 'Instructor', value: selectedEnrollment.instructor },
                                        { icon: <AccessTimeIcon style={{ fontSize: 16, color: T.accent }} />, label: 'Enrolled On', value: new Date(selectedEnrollment.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
                                    ].map(({ icon, label, value }, i) => (
                                        <div key={i} style={{ background: T.surface2, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${T.border}` }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: dark ? 'rgba(0,212,212,0.1)' : '#e6fafa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {icon}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                                                <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress section */}
                                <div style={{ background: T.surface2, borderRadius: 18, padding: 20, marginBottom: 20, border: `1px solid ${T.border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Course Progress</h3>
                                        {!editingProgress ? (
                                            <button className="action-btn" onClick={() => setEditing(true)}
                                                disabled={isCancelled || isComplete}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                                                    background: dark ? 'rgba(0,212,212,0.1)' : '#e6fafa', color: T.accent,
                                                    border: `1px solid ${dark ? 'rgba(0,212,212,0.2)' : '#a7f0f0'}`,
                                                    fontSize: 12, fontWeight: 600, cursor: isCancelled || isComplete ? 'not-allowed' : 'pointer',
                                                    fontFamily: F, opacity: (isCancelled || isComplete) ? 0.4 : 1,
                                                }}>
                                                <EditIcon style={{ fontSize: 14 }} /> Update Progress
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="action-btn" onClick={() => setEditing(false)} style={{
                                                    display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10,
                                                    background: 'transparent', color: T.muted, border: `1px solid ${T.border}`,
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                                }}>
                                                    <CloseIcon style={{ fontSize: 13 }} /> Cancel
                                                </button>
                                                <button className="action-btn" onClick={handleUpdateProgress} disabled={updatingProgress} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                                                    background: dark ? 'rgba(13,159,110,0.12)' : '#edfaf4',
                                                    color: dark ? '#22c98a' : '#0d9f6e',
                                                    border: `1px solid ${dark ? 'rgba(13,159,110,0.22)' : '#b6ead8'}`,
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                                }}>
                                                    {updatingProgress
                                                        ? <div style={{ width: 13, height: 13, border: `2px solid ${dark ? 'rgba(34,201,138,0.3)' : '#b6ead8'}`, borderTop: `2px solid ${dark ? '#22c98a' : '#0d9f6e'}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                        : <SaveIcon style={{ fontSize: 14 }} />}
                                                    {updatingProgress ? 'Saving…' : 'Save'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editingProgress ? (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                                                <span style={{ fontSize: 36, fontWeight: 800, color: progressColor(newProgress), fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>
                                                    {newProgress}%
                                                </span>
                                                <span style={{ fontSize: 12, color: T.muted, padding: '5px 12px', background: T.surface, borderRadius: 20, border: `1px solid ${T.border}` }}>
                                                    {newProgress === 100 ? '🎉 Course complete!' : newProgress > 0 ? 'In progress' : 'Not started'}
                                                </span>
                                            </div>
                                            <input type="range" min="0" max="100" step="5" value={newProgress}
                                                onChange={e => setNewProgress(parseInt(e.target.value))}
                                                style={{ width: '100%', height: 4, borderRadius: 4, marginBottom: 8 }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted }}>
                                                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                            </div>
                                            {newProgress < selectedEnrollment.progress && (
                                                <p style={{ fontSize: 11, color: dark ? '#f06b6b' : '#c53030', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <WarningAmberIcon style={{ fontSize: 13 }} /> Progress can only move forward.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                                <span style={{ fontSize: 36, fontWeight: 800, color: progressColor(selectedEnrollment.progress), fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>
                                                    {selectedEnrollment.progress}%
                                                </span>
                                                {isComplete && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: dark ? 'rgba(34,201,138,0.12)' : '#edfaf4', color: dark ? '#22c98a' : '#0d9f6e', fontSize: 12, fontWeight: 700 }}>
                                                        <EmojiEventsIcon style={{ fontSize: 15 }} /> Completed!
                                                    </span>
                                                )}
                                            </div>
                                            <div className="progress-track">
                                                <div className="progress-bar" style={{ width: `${selectedEnrollment.progress}%`, background: progressColor(selectedEnrollment.progress) }} />
                                            </div>
                                            {!isComplete && !isCancelled && (
                                                <p style={{ margin: '10px 0 0', fontSize: 12, color: T.muted }}>
                                                    {selectedEnrollment.progress === 0 ? 'Not started yet — click Update Progress to begin tracking.' : `${100 - selectedEnrollment.progress}% remaining to complete this course.`}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Cancel section */}
                                {canCancel && !showCancelConfirm && (
                                    <button className="action-btn" onClick={() => setShowCancelConfirm(true)} style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '11px 18px', borderRadius: 12, width: '100%',
                                        background: dark ? 'rgba(185,28,28,0.08)' : '#fff1f1',
                                        color: dark ? '#f06b6b' : '#c53030',
                                        border: `1px solid ${dark ? 'rgba(185,28,28,0.2)' : '#fecaca'}`,
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                        justifyContent: 'center',
                                    }}>
                                        <CancelIcon style={{ fontSize: 16 }} /> Cancel Enrollment
                                    </button>
                                )}

                                {showCancelConfirm && (
                                    <ConfirmDialog
                                        title="Cancel this enrollment?"
                                        message={`You'll lose your progress in "${selectedEnrollment.courseTitle}". This action cannot be undone.`}
                                        onConfirm={handleCancelConfirmed}
                                        onDismiss={() => setShowCancelConfirm(false)}
                                        T={T} F={F} loading={cancellingEnrollment}
                                    />
                                )}

                                {/* Footer close */}
                                {!showCancelConfirm && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                        <button onClick={closeModal} style={{
                                            padding: '10px 26px', borderRadius: 12,
                                            background: T.surface2, color: T.muted, border: `1px solid ${T.border}`,
                                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                        }}>Close</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Enrollments;