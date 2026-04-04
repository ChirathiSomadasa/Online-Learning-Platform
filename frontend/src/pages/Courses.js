import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllCourses, getCourseById } from '../services/courseService';
import PersonIcon        from '@mui/icons-material/Person';
import EventSeatIcon     from '@mui/icons-material/EventSeat';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import SearchIcon        from '@mui/icons-material/Search';
import CloseIcon         from '@mui/icons-material/Close';
import CategoryIcon      from '@mui/icons-material/Category';
import InfoOutlinedIcon  from '@mui/icons-material/InfoOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon           from '@mui/icons-material/Add';
import RemoveIcon        from '@mui/icons-material/Remove';
import MenuBookIcon      from '@mui/icons-material/MenuBook';
import StarIcon          from '@mui/icons-material/Star';
import SchoolIcon        from '@mui/icons-material/School';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import WhatshotIcon      from '@mui/icons-material/Whatshot';
import FilterListIcon    from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';
import bannerGirl from '../images/course/course_girl.png';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CARDS_PER_PAGE = 6; 

const SORT_OPTIONS = [
  { value: 'popular',  label: 'Most Popular',  icon: 'trending' },
  { value: 'newest',   label: 'Newest First',  icon: 'new' },
  { value: 'seats',    label: 'Most Available', icon: 'seats' },
  { value: 'az',       label: 'Alphabetical Order',          icon: 'az' },
];

const FAQS = [
  { q: 'How do I enroll in a course?', a: 'Browse the course catalog, click "View Details" on any course, and use the enrollment option. You can filter by category or search by name to find what suits you.' },
  { q: 'Can I access course materials after enrollment?', a: 'Yes! Once enrolled, you have full access to all course materials, including lectures, assignments, and resources for the entire duration of the course.' },
  { q: 'How do I contact my instructor?', a: 'Once enrolled, you can reach your instructor through the course discussion board or the in-platform messaging system available in your student dashboard.' },
];


const THEME_GRADIENT = 'linear-gradient(135deg, #00a89d 0%, #006060 100%)';
const THEME_ACCENT = '#00a89d';
const THEME_ICON_BG = '#e8faf9'; 

const sortCourses = (list, key) => {
  const copy = [...list];
  switch (key) {
    case 'popular': return copy.sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));
    case 'newest':  return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'seats':   return copy.sort((a, b) => {
      const aLeft = (a.totalSeats || 0) - (a.enrolledCount || 0);
      const bLeft = (b.totalSeats || 0) - (b.enrolledCount || 0);
      return bLeft - aLeft;
    });
    case 'az':      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:        return copy;
  }
};

// Helper function to generate a consistent pseudo-random 1-5 rating based on the instructor's name
const getInstructorStars = (name) => {
  if (!name) return 5;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return (hash % 5) + 1; // Ensures a number between 1 and 5
};

// A searchable popover that handles 100s of categories gracefully
const CategoryPicker = ({ categories, value, onChange }) => {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const ref                     = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = categories.filter(c => c.toLowerCase().includes(query.toLowerCase()));
  const label    = value || 'All Categories';

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '11px 18px', borderRadius: '30px',
          border: `1.5px solid ${value ? '#00b4b4' : '#e0e0e0'}`,
          backgroundColor: value ? '#e8faf9' : '#fff',
          color: value ? '#00a89d' : '#555',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          transition: 'all 0.18s', whiteSpace: 'nowrap',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: value ? '0 2px 10px rgba(0,180,180,0.15)' : 'none',
        }}
      >
        <FilterListIcon style={{ fontSize: '17px' }} />
        {label}
        {value && (
          <span
            onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); }}
            style={{ marginLeft: '2px', color: '#00a89d', lineHeight: 1, fontSize: '16px' }}
          >×</span>
        )}
        <KeyboardArrowDownIcon style={{ fontSize: '18px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
          backgroundColor: '#fff', borderRadius: '14px', minWidth: '240px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0',
          overflow: 'hidden',
        }}>
          {/* Search within categories */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
            <SearchIcon style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: '16px' }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search categories…"
              style={{
                width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px',
                border: '1.5px solid #e0e0e0', fontSize: '13px', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '6px 0' }}>
            <button
              onClick={() => { onChange(''); setQuery(''); setOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 16px',
                background: !value ? '#e8faf9' : 'none',
                color: !value ? '#00a89d' : '#444',
                border: 'none', cursor: 'pointer', fontSize: '13px',
                fontWeight: !value ? '700' : '500', transition: 'background 0.12s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              All Categories
              <span style={{ marginLeft: '6px', color: '#bbb', fontSize: '11px' }}>({categories.length} total)</span>
            </button>

            {filtered.length === 0 && (
              <p style={{ padding: '12px 16px', color: '#bbb', fontSize: '13px', margin: 0 }}>No match found</p>
            )}

            {filtered.map(cat => (
              <button
                key={cat}
                onClick={() => { onChange(cat); setQuery(''); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 16px',
                  background: value === cat ? '#e8faf9' : 'none',
                  color: value === cat ? '#00a89d' : '#444',
                  border: 'none', cursor: 'pointer', fontSize: '13px',
                  fontWeight: value === cat ? '700' : '500', transition: 'background 0.12s',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                className="cat-option"
              >
                {cat}
                {value === cat && <span style={{ color: '#00a89d' }}>✓</span>}
              </button>
            ))}
          </div>

          <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', fontSize: '11px', color: '#bbb' }}>
            {filtered.length} of {categories.length} categories
          </div>
        </div>
      )}
    </div>
  );
};

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  // Build page number list — always show first, last, current ±1, with ellipsis
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={pgBtn(page === 1)}
      >
        <ChevronLeftIcon style={{ fontSize: '20px' }} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} style={{ color: '#bbb', fontSize: '14px', padding: '0 4px' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              ...pgBtn(false),
              backgroundColor: p === page ? '#00b4b4' : '#fff',
              color: p === page ? '#fff' : '#555',
              borderColor: p === page ? '#00b4b4' : '#e0e0e0',
              fontWeight: p === page ? '700' : '500',
              boxShadow: p === page ? '0 4px 12px rgba(0,180,180,0.3)' : 'none',
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        style={pgBtn(page === totalPages)}
      >
        <ChevronRightIcon style={{ fontSize: '20px' }} />
      </button>

      <span style={{ fontSize: '12px', color: '#bbb', marginLeft: '8px' }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
};

const pgBtn = (disabled) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '38px', height: '38px', borderRadius: '10px',
  border: '1.5px solid #e0e0e0', backgroundColor: '#fff',
  color: disabled ? '#ccc' : '#555', cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '14px', fontWeight: '500', transition: 'all 0.15s',
  opacity: disabled ? 0.5 : 1,
  fontFamily: "'DM Sans', sans-serif",
});


const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('');
  const [categories, setCategories]     = useState([]);
  const [sortBy, setSortBy]             = useState('popular');
  const [page, setPage]                 = useState(1);

  const [selected, setSelected]         = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [openFaq, setOpenFaq]           = useState(null);

  const exploreRef = useRef(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true); setError('');
    try {
      const data = await getAllCourses();
      setCourses(data);
      const cats = [...new Set(data.map(c => c.category))].filter(Boolean).sort();
      setCategories(cats);
    } catch {
      setError('Failed to load courses. Make sure the Course Catalog Service is running.');
    } finally { setLoading(false); }
  };

  const filtered = React.useMemo(() => {
    let result = courses;
    if (search)   result = result.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor || '').toLowerCase().includes(search.toLowerCase())
    );
    if (category) result = result.filter(c => c.category === category);
    return sortCourses(result, sortBy);
  }, [courses, search, category, sortBy]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, category, sortBy]);

  const handlePageChange = useCallback((p) => {
    setPage(p);
    exploreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const openDetail = async (id) => {
    setModalOpen(true); setModalLoading(true);
    try {
      const data = await getCourseById(id);
      setSelected(data);
    } catch { setSelected(null); }
    finally { setModalLoading(false); }
  };

  const closeModal = () => { setModalOpen(false); setSelected(null); };
 // const handleEnroll = () => { navigate(`/enroll/${selected._id}`); };
  const seatPct        = (c)   => c.totalSeats > 0 ? Math.min(100, (c.enrolledCount / c.totalSeats) * 100) : 0;
  const availLabel     = (pct) => pct >= 90 ? 'Almost Full' : pct >= 70 ? 'Filling Up' : 'Open';
  const availBg        = (pct) => pct >= 90 ? '#fdecea' : pct >= 70 ? '#fff8e1' : '#e8faf9';
  const availFg        = (pct) => pct >= 90 ? '#e74c3c' : pct >= 70 ? '#f39c12' : '#00a89d';
  const seatColor      = (pct) => pct >= 90 ? '#e74c3c' : pct >= 70 ? '#f39c12' : '#00a89d';

const handleEnroll = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await axios.post(
      'http://localhost:3003/api/enrollment',
      { courseId: selected._id },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data) {
      toast.success('Successfully enrolled in course!');
      closeModal();
      // Navigate to enrollments page with success message
      navigate('/enrollments', {
        state: {
          enrollmentSuccess: true,
          message: `Successfully enrolled in ${selected.title}`
        }
      });
    }
  } catch (error) {
    console.error('Enrollment error:', error);
    toast.error(error.response?.data?.message || 'Failed to enroll in course');
  }
};



  const instructorMap  = courses.reduce((acc, c) => {
    if (!c.instructor) return acc;
    if (!acc[c.instructor]) acc[c.instructor] = [];
    acc[c.instructor].push(c.title);
    return acc;
  }, {});
  const instructorList = Object.entries(instructorMap);

  const topCourse = courses.length > 0
    ? [...courses].sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))[0]
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');
        * { box-sizing: border-box; }

        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes fadeInUp  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn   { from { opacity:0; transform:scale(0.94) translateY(-12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes float     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes shimmer   { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(0,180,180,0.35);} 70%{box-shadow:0 0 0 10px rgba(0,180,180,0);} 100%{box-shadow:0 0 0 0 rgba(0,180,180,0);} }

        .ccard { animation: fadeInUp 0.42s ease forwards; opacity:0; transition:transform 0.24s ease,box-shadow 0.24s ease; display: flex; flex-direction: column;}
        .ccard:hover { transform:translateY(-7px); box-shadow:0 22px 50px rgba(0,0,0,0.12) !important; }
        .ccard:hover .ccard-reveal { max-height:70px; opacity:1; }
        .ccard:hover .ccard-banner-overlay { opacity:0.55; }
        .ccard:nth-child(1){animation-delay:0.04s;} .ccard:nth-child(2){animation-delay:0.08s;}
        .ccard:nth-child(3){animation-delay:0.12s;} .ccard:nth-child(4){animation-delay:0.16s;}
        .ccard:nth-child(5){animation-delay:0.20s;} .ccard:nth-child(6){animation-delay:0.24s;}

        .ccard-reveal { max-height:0; opacity:0; overflow:hidden; transition:max-height 0.3s ease,opacity 0.3s ease; }
        .ccard-banner-overlay { opacity:0.40; transition:opacity 0.3s; }

        .view-btn:hover  { filter:brightness(1.1); transform:scale(1.02); }
        .view-btn:active { transform:scale(0.98); }
        .enroll-modal-btn:hover  { filter:brightness(1.1); transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,0,0,0.2) !important; }
        .search-input:focus  { border-color:#00b4b4 !important; box-shadow:0 0 0 3px rgba(0,180,180,0.14) !important; }
        .modal-anim { animation:modalIn 0.22s ease forwards; }
        .hero-btn-primary:hover   { background-color:#007a75 !important; transform:translateY(-2px); }
        .hero-btn-secondary:hover { background-color:#e0f7f6 !important; }
        .faq-row:hover            { background-color:#f0fafa !important; border-radius:10px; }
        .instructor-card:hover    { transform:translateY(-5px); box-shadow:0 10px 28px rgba(0,0,0,0.1) !important; }
        .float-badge   { animation:float 3s ease-in-out infinite; }
        .float-badge-2 { animation:float 3s ease-in-out infinite 1.5s; }
        .pulse-dot     { animation:pulseRing 2s ease-in-out infinite; }
        .sort-btn:hover { background:#e8faf9 !important; border-color:#00b4b4 !important; color:#00a89d !important; }
        .sort-btn.active { background:#00b4b4 !important; border-color:#00b4b4 !important; color:#fff !important; }
        .pg-btn:hover:not(:disabled) { background:#e8faf9 !important; border-color:#00b4b4 !important; color:#00a89d !important; }
        .cat-option:hover { background:#f0fafa !important; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-thumb { background:#00b4b4; border-radius:4px; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#f3f6f9', minHeight: '100vh' }}>

        <section style={styles.hero}>
          <div style={styles.blob1} /><div style={styles.blob2} />
          <div style={styles.heroInner}>
            <div style={styles.heroLeft}>
              <span style={styles.heroEyebrow}>{'Start Learning Today'}</span>
              <h1 style={styles.heroTitle}>Elevate Your Potential<br />With E-Learning</h1>
              <p style={styles.heroSub}>
                Discover expert-led courses tailored to your goals. Learn at your own pace
                and unlock new skills from anywhere in the world.
              </p>
              {!loading && courses.length > 0 && (
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {[
                    { label: `${courses.length} Courses`, color: '#00a89d' },
                    { label: `${categories.length} Categories`, color: '#006060' },
                  ].map((s, i) => (
                    <span key={i} style={{ backgroundColor: '#fff', color: s.color, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.heroBtns}>
                <button className="hero-btn-primary" style={styles.heroBtnPrimary}
                  onClick={() => exploreRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore Courses
                </button>
                <button className="hero-btn-secondary" style={styles.heroBtnSecondary}
                  onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Learn More
                </button>
              </div>
            </div>
            <div style={styles.heroRight}>
              <div style={styles.heroCircle}>
                <img src={bannerGirl} alt="Learning" style={{ width: '900px', objectFit: 'contain', borderRadius: '12px' }} />
              </div>
              <div style={{ ...styles.floatBadge, top: '10%', right: '-35%' }} className="float-badge">
                <MenuBookIcon style={{ fontSize: '16px', color: '#00a89d' }} />
                <span style={styles.floatBadgeText}>Large Course Collection</span>
              </div>
              <div style={{ ...styles.floatBadge, bottom: '-15%', left: '-5%' }} className="float-badge-2">
                <PersonIcon style={{ fontSize: '16px', color: '#00a89d' }} />
                <span style={styles.floatBadgeText}>Expert Instructors</span>
              </div>
              <div style={{ ...styles.floatBadge, bottom: '8%', right: '-50%' }} className="float-badge">
                <EventSeatIcon style={{ fontSize: '16px', color: '#00a89d' }} />
                <span style={styles.floatBadgeText}>Flexible Enrollment</span>
              </div>
            </div>
          </div>
        </section>
        {!loading && topCourse && (
          <div style={{ padding: '0 60px', marginTop: '-10px', marginBottom: '0' }}>
            <div style={{
              background: THEME_GRADIENT,
              borderRadius: '18px', padding: '22px 28px',
              display: 'flex', alignItems: 'center', gap: '18px',
              boxShadow: '0 10px 32px rgba(0,100,100,0.2)',
            }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <WhatshotIcon style={{ color: '#ffd700', fontSize: '22px' }} />
                <span style={{ color: '#ffd700', fontWeight: '800', fontSize: '12px', letterSpacing: '0.06em' }}>MOST POPULAR</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{topCourse.category}</p>
                <p style={{ margin: '2px 0 0', color: '#fff', fontSize: '17px', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topCourse.title}</p>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#ffd700', fontWeight: '800', fontSize: '20px' }}>{topCourse.enrolledCount || 0}</p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>Enrolled</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#ffd700', fontWeight: '800', fontSize: '20px' }}>{Math.round(seatPct(topCourse))}%</p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>Full</p>
                </div>
              </div>
              <button
                onClick={() => openDetail(topCourse._id)}
                style={{ backgroundColor: '#fff', color: '#006060', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
              >
                View
              </button>
            </div>
          </div>
        )}

        <div ref={exploreRef} id="explore-section" style={{ padding: '52px 60px' }}>
          <div style={styles.sectionHead}>
            <span style={styles.sectionEyebrow}>Our Courses</span>
            <h2 style={styles.sectionTitle}>Explore Our Courses</h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>

            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <SearchIcon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: '20px', pointerEvents: 'none' }} />
              <input
                className="search-input"
                style={styles.searchInput}
                placeholder="Search courses, topics, instructors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setSearch('')}>
                  <CloseIcon style={{ fontSize: '16px', color: '#aaa' }} />
                </button>
              )}
            </div>

            <CategoryPicker categories={categories} value={category} onChange={setCategory} />

            <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#bbb', fontWeight: '600', marginRight: '4px' }}>SORT BY</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`sort-btn${sortBy === opt.value ? ' active' : ''}`}
                onClick={() => setSortBy(opt.value)}
                style={{
                  padding: '7px 16px', borderRadius: '20px',
                  border: `1.5px solid ${sortBy === opt.value ? '#00b4b4' : '#e0e0e0'}`,
                  backgroundColor: sortBy === opt.value ? '#00b4b4' : '#fff',
                  color: sortBy === opt.value ? '#fff' : '#666',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>{error}</span>
              <button style={styles.retryBtn} onClick={fetchCourses}>Retry</button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '80px' }}>
              <div style={styles.spinner} />
              <p style={{ color: '#888', fontSize: '15px', marginTop: '12px' }}>Loading courses…</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <p style={{ fontSize: '56px', margin: '0 0 10px' }}>📭</p>
              <p style={{ fontSize: '19px', color: '#2c3e50', fontWeight: '700', marginBottom: '6px' }}>No courses found</p>
              <p style={{ fontSize: '14px', color: '#aaa' }}>Try adjusting your search or category filter</p>
              <button onClick={() => { setSearch(''); setCategory(''); }} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '20px', border: '1.5px solid #00b4b4', backgroundColor: 'transparent', color: '#00b4b4', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
                Clear Filters
              </button>
            </div>
          )}
          {!loading && !error && paginated.length > 0 && (
            <>
              <p style={{ fontSize: '12px', color: '#bbb', fontWeight: '600', marginBottom: '18px' }}>
                Showing {(safePage - 1) * CARDS_PER_PAGE + 1}–{Math.min(safePage * CARDS_PER_PAGE, filtered.length)} of {filtered.length} courses
              </p>

              <div style={styles.grid}>
                {paginated.map((course, idx) => {
                  const pct       = seatPct(course);
                  const available = (course.totalSeats || 0) - (course.enrolledCount || 0);
                  const isTop     = sortBy === 'popular' && idx === 0 && safePage === 1;

                  return (
                    <div key={course._id} className="ccard" style={{ ...styles.card, position: 'relative' }}>
              
                      {isTop && (
                        <div style={{ position: 'absolute', top: '12px', left: '-4px', zIndex: 5, backgroundColor: '#ffd700', color: '#4a3800', fontSize: '10px', fontWeight: '800', padding: '3px 10px 3px 8px', borderRadius: '0 6px 6px 0', boxShadow: '2px 2px 8px rgba(0,0,0,0.15)', letterSpacing: '0.05em' }}>
                          TOP PICK
                        </div>
                      )}

                      <div style={{ ...styles.cardBanner, background: THEME_GRADIENT }}>
                        <svg className="ccard-banner-overlay" viewBox="0 0 340 100" preserveAspectRatio="none"
                          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.4 }}>
                          <path d="M0,60 C80,90 160,30 240,70 C300,100 340,50 340,50 L340,100 L0,100 Z" fill="rgba(255,255,255,0.18)" />
                        </svg>
                        <span style={styles.categoryPill}>{course.category}</span>
                        <span style={{ ...styles.availBadge, backgroundColor: availBg(pct), color: availFg(pct) }}>
                          <span style={{ ...styles.availDot, backgroundColor: availFg(pct) }} className={pct < 90 ? 'pulse-dot' : ''} />
                          {availLabel(pct)}
                        </span>
                        <div style={{ ...styles.bannerIcon, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                          <SchoolIcon style={{ fontSize: '30px', color: '#fff' }} />
                        </div>
                      </div>

                      <div style={styles.cardBody}>
                        {/* Simplified preview - removed description */}
                        <h3 style={styles.courseTitle}>{course.title}</h3>
                        
                        <div className="ccard-reveal" style={{ fontSize: '12px', color: '#999', lineHeight: '1.6', marginBottom: '10px' }}>
                          Click "View Details" to see the full course description and enrollment options.
                        </div>

                        {/* Kept only essential browsing chips */}
                        <div style={styles.metaChips}>
                          <span style={{ ...styles.metaChip, backgroundColor: THEME_ICON_BG, color: THEME_ACCENT }}>
                            <PersonIcon style={{ fontSize: '13px' }} />{course.instructor}
                          </span>
                          {course.duration && (
                            <span style={{ ...styles.metaChip, backgroundColor: THEME_ICON_BG, color: THEME_ACCENT }}>
                              <AccessTimeIcon style={{ fontSize: '13px' }} />{course.duration}
                            </span>
                          )}
                           <span style={{ ...styles.metaChip, backgroundColor: '#fff8e1', color: '#e0a020' }}>
                            <EventSeatIcon style={{ fontSize: '13px' }} />{available} left
                          </span>
                        </div>

                        {/* View button pushed to bottom */}
                        <button className="view-btn" style={{ ...styles.viewBtn, background: THEME_GRADIENT, marginTop: 'auto' }}
                          onClick={() => openDetail(course._id)}>
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination page={safePage} totalPages={totalPages} onChange={handlePageChange} />
            </>
          )}
        </div>

        {!loading && instructorList.length > 0 && (
          <section style={{ backgroundColor: '#fff', padding: '64px 60px' }}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionEyebrow}>Team Member</span>
              <h2 style={styles.sectionTitle}>Our Expert Instructors</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
              {instructorList.map(([name, courseList], i) => {
                const numStars = getInstructorStars(name);
                return (
                  <div key={i} style={styles.instructorCard} className="instructor-card">
                    <div style={{ ...styles.instructorAvatar, background: THEME_GRADIENT }}>
                      <PersonIcon style={{ fontSize: '36px', color: '#fff' }} />
                    </div>
                    <h3 style={styles.instructorName}>{name}</h3>
                    <p style={{ fontSize: '13px', color: THEME_ACCENT, fontWeight: '600', margin: '0 0 12px' }}>
                      {courseList.length} Course{courseList.length !== 1 ? 's' : ''}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      {courseList.slice(0, 3).map((title, j) => (
                        <span key={j} style={{ backgroundColor: THEME_ICON_BG, color: THEME_ACCENT, padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {title}
                        </span>
                      ))}
                      {courseList.length > 3 && (
                        <span style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>+{courseList.length - 3} more</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                      {[...Array(5)].map((_, k) => (
                        <StarIcon 
                          key={k} 
                          style={{ 
                            color: k < numStars ? '#ffd700' : '#e0e0e0', 
                            fontSize: '16px' 
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section id="faq-section" style={{ backgroundColor: '#f3f6f9', padding: '72px 60px' }}>
          <div style={{ display: 'flex', gap: '60px', maxWidth: '1100px', margin: '0 auto', alignItems: 'flex-start' }}>
            <div style={{ width: '280px', flexShrink: 0 }}>
              <span style={styles.sectionEyebrow}>FAQ</span>
              <h2 style={{ ...styles.sectionTitle, textAlign: 'left', marginTop: '8px' }}>Frequently Asked Questions</h2>
              <p style={{ fontSize: '14px', color: '#888', lineHeight: '1.7', margin: 0 }}>
                For any unanswered questions, reach out to our support team via email. We'll respond as soon as possible.
              </p>
            </div>
            <div style={{ flex: 1 }}>
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-row"
                  style={{ padding: '18px 8px', borderBottom: '1px solid #e8e8e8', cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#2c3e50', flex: 1 }}>{faq.q}</span>
                    {openFaq === i ? <RemoveIcon style={{ fontSize: '18px', color: '#00a89d', flexShrink: 0 }} /> : <AddIcon style={{ fontSize: '18px', color: '#888', flexShrink: 0 }} />}
                  </div>
                  {openFaq === i && <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', margin: '12px 0 0', paddingRight: '30px' }}>{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal} className="modal-anim">
            <div style={{ height: '90px', borderRadius: '16px 16px 0 0', background: THEME_GRADIENT, display: 'flex', alignItems: 'center', padding: '0 24px', gap: '14px', flexShrink: 0 }}>
              {!modalLoading && selected && (
                <>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SchoolIcon style={{ fontSize: '28px', color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selected.category}</p>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.title}</h2>
                  </div>
                </>
              )}
              <button style={{ ...styles.closeBtn, marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.22)', border: 'none' }} onClick={closeModal}>
                <CloseIcon style={{ fontSize: '18px', color: '#fff' }} />
              </button>
            </div>

            {modalLoading && <div style={{ textAlign: 'center', padding: '60px' }}><div style={styles.spinner} /></div>}
            {!modalLoading && !selected && <div style={{ padding: '40px', textAlign: 'center' }}><p style={{ color: '#e74c3c' }}>Failed to load course details.</p></div>}

            {!modalLoading && selected && (
              <div style={{ padding: '24px 28px 28px', overflowY: 'auto', maxHeight: 'calc(90vh - 90px)' }}>
                <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.75', backgroundColor: '#f7f9fb', padding: '14px 16px', borderRadius: '10px', marginBottom: '22px', borderLeft: `3px solid ${THEME_ACCENT}` }}>
                  {selected.description}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
                  {[
                    { icon: <PersonIcon style={styles.detailIcon} />,        label: 'Instructor', value: selected.instructor },
                    { icon: <CategoryIcon style={styles.detailIcon} />,      label: 'Category',   value: selected.category },
                    { icon: <AccessTimeIcon style={styles.detailIcon} />,    label: 'Duration',   value: selected.duration || '—' },
                    { icon: <EventSeatIcon style={styles.detailIcon} />,     label: 'Seats',      value: `${selected.enrolledCount} / ${selected.totalSeats} enrolled` },
                    { icon: <CalendarTodayIcon style={styles.detailIcon} />, label: 'Created',    value: new Date(selected.createdAt).toLocaleDateString() },
                    { icon: <InfoOutlinedIcon style={styles.detailIcon} />,  label: 'Status',     value: selected.status, highlight: selected.status === 'active' },
                  ].map((item, i) => (
                    <div key={i} style={styles.detailItem}>
                      {item.icon}
                      <div>
                        <p style={styles.detailLabel}>{item.label}</p>
                        <p style={{ ...styles.detailValue, ...(item.highlight ? { color: '#00b4b4', fontWeight: '700', textTransform: 'capitalize' } : {}) }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '26px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>Capacity</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: seatColor(seatPct(selected)) }}>{Math.round(seatPct(selected))}% filled</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', width: `${seatPct(selected)}%`, background: THEME_GRADIENT, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <button className="enroll-modal-btn" style={{ width: '100%', padding: '15px', background: THEME_GRADIENT, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.22s', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 18px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={handleEnroll}>
                  Enroll Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  hero: { position: 'relative', background: 'linear-gradient(135deg, #f0fafa 0%, #e0f7f6 50%, #ccf0ee 100%)', padding: '70px 60px', overflow: 'hidden', minHeight: '380px' },
  blob1: { position: 'absolute', top: '-60px', right: '25%', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(0,168,157,0.25)', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-40px', right: '-2%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(0,168,157,0.35)', pointerEvents: 'none' },
  heroInner: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', maxWidth: '1100px', margin: '0 auto' },
  heroLeft: { flex: 1, maxWidth: '500px' },
  heroEyebrow: { display: 'inline-block', backgroundColor: '#00a89d', color: '#fff', padding: '5px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '18px' },
  heroTitle: { fontSize: '48px', fontWeight: '800', color: '#004040', margin: '0 0 18px', lineHeight: '1.2', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  heroSub: { fontSize: '17px', color: '#1a5050', lineHeight: '1.8', margin: '0 0 20px' },
  heroBtns: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  heroBtnPrimary: { backgroundColor: '#00a89d', color: '#fff', border: 'none', padding: '13px 32px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,168,157,0.3)', fontFamily: "'DM Sans', sans-serif" },
  heroBtnSecondary: { backgroundColor: '#fff', color: '#00a89d', border: '1.5px solid #00a89d', padding: '13px 32px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" },
  heroRight: { position: 'relative', width: '360px', height: '300px', flexShrink: 0 },
  heroCircle: { position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '480px', height: '480px', borderRadius: '50%', background: 'linear-gradient(135deg, #00a89d, #007a75)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(0,168,157,0.35)' },
  floatBadge: { position: 'absolute', backgroundColor: '#fff', borderRadius: '30px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap' },
  floatBadgeText: { fontSize: '12px', color: '#2c3e50', fontWeight: '600' },

  sectionHead: { textAlign: 'center', marginBottom: '36px' },
  sectionEyebrow: { display: 'inline-block', color: '#00a89d', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' },
  sectionTitle: { fontSize: '32px', fontWeight: '800', color: '#1a2b3c', margin: '6px 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif" },

  searchInput: { width: '100%', padding: '13px 42px 13px 46px', borderRadius: '30px', border: '1.5px solid #e0e0e0', fontSize: '14px', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: "'DM Sans', sans-serif" },

  errorBox: { backgroundColor: '#fdecea', color: '#e74c3c', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' },
  retryBtn: { background: 'none', border: '1.5px solid #e74c3c', color: '#e74c3c', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #00b4b4', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '26px' },
  card: { backgroundColor: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' },
  cardBanner: { position: 'relative', height: '120px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 16px 0', overflow: 'hidden', flexShrink: 0 },
  categoryPill: { backgroundColor: 'rgba(255,255,255,0.92)', color: '#1a2b3c', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', zIndex: 1 },
  availBadge: { display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', zIndex: 1 },
  availDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  bannerIcon: { position: 'absolute', bottom: '-18px', left: '50%', transform: 'translateX(-50%)', width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 2 },
  cardBody: { padding: '36px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 },
  courseTitle: { fontSize: '16px', fontWeight: '800', color: '#1a2b3c', margin: '0 0 16px', lineHeight: '1.35', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  metaChips: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '16px' },
  metaChip: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' },
  viewBtn: { width: '100%', padding: '11px', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', marginTop: 'auto', letterSpacing: '0.02em', fontFamily: "'DM Sans', sans-serif" },

  instructorCard: { backgroundColor: '#fafafa', borderRadius: '16px', padding: '28px 22px', width: '220px', textAlign: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' },
  instructorAvatar: { width: '72px', height: '72px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' },
  instructorName: { fontSize: '16px', fontWeight: '700', color: '#2c3e50', margin: '0 0 4px' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', boxShadow: '0 24px 70px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  closeBtn: { background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '34px', height: '34px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  detailItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#f7f9fb', padding: '12px', borderRadius: '10px' },
  detailIcon: { color: '#00b4b4', fontSize: '20px', marginTop: '2px', flexShrink: 0 },
  detailLabel: { fontSize: '10px', color: '#b0b8c4', margin: '0 0 3px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.06em' },
  detailValue: { fontSize: '14px', color: '#1a2b3c', margin: 0, fontWeight: '600' },
};

export default Courses;