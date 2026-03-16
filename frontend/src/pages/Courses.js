import React, { useEffect, useState } from 'react';
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
import bannerGirl from '../images/course/course_girl.png';

const FAQS = [
  { q: 'How do I enroll in a course?', a: 'Browse the course catalog, click "View Details" on any course, and use the enrollment option. You can filter by category or search by name to find what suits you.' },
  { q: 'Can I access course materials after enrollment?', a: 'Yes! Once enrolled, you have full access to all course materials, including lectures, assignments, and resources for the entire duration of the course.' },
  { q: 'How do I contact my instructor?', a: 'Once enrolled, you can reach your instructor through the course discussion board or the in-platform messaging system available in your student dashboard.' },
];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #00b4b4 0%, #007a75 100%)',
  'linear-gradient(135deg, #6c63ff 0%, #3b37c9 100%)',
  'linear-gradient(135deg, #f7971e 0%, #e55d1a 100%)',
  'linear-gradient(135deg, #43b89c 0%, #1d7a60 100%)',
  'linear-gradient(135deg, #e96caa 0%, #b83580 100%)',
  'linear-gradient(135deg, #4776e6 0%, #1b4dbd 100%)',
];

const CARD_ICON_BG = [
  'rgba(0,180,180,0.15)',
  'rgba(108,99,255,0.15)',
  'rgba(247,151,30,0.15)',
  'rgba(67,184,156,0.15)',
  'rgba(233,108,170,0.15)',
  'rgba(71,118,230,0.15)',
];

const CARD_ACCENT = ['#00b4b4','#6c63ff','#f7971e','#43b89c','#e96caa','#4776e6'];

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]           = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('');
  const [categories, setCategories]     = useState([]);
  const [selected, setSelected]         = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [openFaq, setOpenFaq]           = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true); setError('');
    try {
      const data = await getAllCourses();
      setCourses(data);
      setFiltered(data);
      const cats = [...new Set(data.map(c => c.category))].filter(Boolean).sort();
      setCategories(cats);
    } catch {
      setError('Failed to load courses. Make sure the Course Catalog Service is running.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let result = courses;
    if (search) result = result.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    );
    if (category) result = result.filter(c => c.category === category);
    setFiltered(result);
  }, [search, category, courses]);

  const openDetail = async (id) => {
    setModalOpen(true); setModalLoading(true);
    try {
      const data = await getCourseById(id);
      setSelected(data);
    } catch { setSelected(null); }
    finally { setModalLoading(false); }
  };

  const closeModal = () => { setModalOpen(false); setSelected(null); };

  // Navigate to the enroll form, passing the course id (and optionally state)
  const handleEnroll = () => {
    navigate(`/enroll/${selected._id}`);
  };

  const seatPct   = (c) => c.totalSeats > 0 ? Math.min(100, (c.enrolledCount / c.totalSeats) * 100) : 0;
  const seatColor = (pct) => pct >= 90 ? '#e74c3c' : pct >= 70 ? '#f39c12' : '#00b4b4';

  const availabilityLabel = (pct) => pct >= 90 ? 'Almost Full' : pct >= 70 ? 'Filling Up' : 'Open';
  const availabilityBg    = (pct) => pct >= 90 ? '#fdecea' : pct >= 70 ? '#fff8e1' : '#e8faf9';
  const availabilityFg    = (pct) => pct >= 90 ? '#e74c3c' : pct >= 70 ? '#f39c12' : '#00a89d';

  const instructorMap = courses.reduce((acc, c) => {
    if (!c.instructor) return acc;
    if (!acc[c.instructor]) acc[c.instructor] = [];
    acc[c.instructor].push(c.title);
    return acc;
  }, {});
  const instructorList = Object.entries(instructorMap);

  const modalCardIdx = selected ? courses.findIndex(c => c._id === selected._id) : 0;
  const modalGrad    = CARD_GRADIENTS[modalCardIdx % CARD_GRADIENTS.length] || CARD_GRADIENTS[0];
  const modalAccent  = CARD_ACCENT[modalCardIdx % CARD_ACCENT.length]       || CARD_ACCENT[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(-12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(0,180,180,0.35); }
          70%  { box-shadow: 0 0 0 10px rgba(0,180,180,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,180,180,0); }
        }

        .ccard {
          animation: fadeInUp 0.42s ease forwards;
          opacity: 0;
          transition: transform 0.24s ease, box-shadow 0.24s ease;
        }
        .ccard:hover { transform: translateY(-7px); box-shadow: 0 22px 50px rgba(0,0,0,0.12) !important; }
        .ccard:hover .ccard-reveal { max-height: 70px; opacity: 1; }
        .ccard:hover .ccard-banner-overlay { opacity: 0.55; }
        .ccard:nth-child(1) { animation-delay: 0.05s; }
        .ccard:nth-child(2) { animation-delay: 0.10s; }
        .ccard:nth-child(3) { animation-delay: 0.16s; }
        .ccard:nth-child(4) { animation-delay: 0.22s; }
        .ccard:nth-child(5) { animation-delay: 0.28s; }
        .ccard:nth-child(6) { animation-delay: 0.34s; }
        .ccard-reveal { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; }
        .ccard-banner-overlay { opacity: 0.40; transition: opacity 0.3s; }

        .view-btn:hover  { filter: brightness(1.1); transform: scale(1.02); }
        .view-btn:active { transform: scale(0.98); }

        .enroll-modal-btn:hover  { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.2) !important; }
        .enroll-modal-btn:active { transform: translateY(0px); }

        .search-input:focus  { border-color: #00b4b4 !important; box-shadow: 0 0 0 3px rgba(0,180,180,0.14) !important; }
        .filter-select:focus { border-color: #00b4b4 !important; outline: none; }

        .modal-anim { animation: modalIn 0.22s ease forwards; }

        .hero-btn-primary:hover   { background-color: #007a75 !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,168,157,0.42) !important; }
        .hero-btn-secondary:hover { background-color: #e0f7f6 !important; }
        .faq-row:hover            { background-color: #f0fafa !important; border-radius: 10px; }
        .instructor-card:hover    { transform: translateY(-5px); box-shadow: 0 10px 28px rgba(0,0,0,0.1) !important; }
        .float-badge   { animation: float 3s ease-in-out infinite; }
        .float-badge-2 { animation: float 3s ease-in-out infinite 1.5s; }
        .pulse-dot     { animation: pulseRing 2s ease-in-out infinite; }
        .category-chip:hover { transform: scale(1.06); }

        ::-webkit-scrollbar       { width: 6px; }
        ::-webkit-scrollbar-track { background: #f0f0f0; }
        ::-webkit-scrollbar-thumb { background: #00b4b4; border-radius: 4px; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#f3f6f9', minHeight: '100vh' }}>

        {/* ── HERO ── */}
        <section style={styles.hero}>
          <div style={styles.blob1} />
          <div style={styles.blob2} />
          <div style={styles.heroInner}>
            <div style={styles.heroLeft}>
              <span style={styles.heroEyebrow}>
                {user ? `Welcome back, ${user.name}!` : 'Start Learning Today'}
              </span>
              <h1 style={{ ...styles.heroTitle, fontFamily: "'Jakarta-Sans', sans-serif" }}>
                Elevate Your Potential<br />With E-Learning
              </h1>
              <p style={styles.heroSub}>
                Discover expert-led courses tailored to your goals. Learn at your own pace
                and unlock new skills from anywhere in the world.
              </p>
              <div style={styles.heroBtns}>
                <button className="hero-btn-primary" style={styles.heroBtnPrimary}
                  onClick={() => document.getElementById('explore-section').scrollIntoView({ behavior: 'smooth' })}>
                  Explore Courses
                </button>
                <button className="hero-btn-secondary" style={styles.heroBtnSecondary}
                  onClick={() => document.getElementById('faq-section').scrollIntoView({ behavior: 'smooth' })}>
                  Learn More
                </button>
              </div>
            </div>
            <div style={styles.heroRight}>
              <div style={styles.heroCircle}>
                <img src={bannerGirl} alt="Teacher with Laptop"
                  style={{ width: '900px', objectFit: 'contain', borderRadius: '12px' }} />
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
              <div style={{ ...styles.dot, top: '120%', left: '-25%', width: '14px', height: '14px', opacity: 0.5 }} />
              <div style={{ ...styles.dot, bottom: '25%', right: '-25%', width: '20px', height: '20px', opacity: 0.3 }} />
              <div style={{ ...styles.dot, top: '55%', left: '-38%', width: '10px', height: '10px', opacity: 0.4 }} />
            </div>
          </div>
        </section>

        {/* ── EXPLORE ── */}
        <div id="explore-section" style={{ padding: '64px 60px' }}>
          <div style={styles.sectionHead}>
            <span style={styles.sectionEyebrow}>Our Courses</span>
            <h2 style={{ ...styles.sectionTitle, fontFamily: "'Jakarta-Sans', sans-serif" }}>Explore Our Course</h2>
          </div>

          {/* Filter bar */}
          <div style={styles.filterBar}>
            <div style={styles.searchWrap}>
              <SearchIcon style={styles.searchIcon} />
              <input className="search-input" style={styles.searchInput}
                placeholder="Search courses, topics, instructors…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button style={styles.clearBtn} onClick={() => setSearch('')}>
                  <CloseIcon style={{ fontSize: '16px', color: '#aaa' }} />
                </button>
              )}
            </div>
            {/* <select className="filter-select" style={styles.select}
              value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select> */}
            <span style={styles.resultsCount}>{filtered.length} course{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <button className="category-chip" onClick={() => setCategory('')}
                style={{ ...styles.chip, ...(category === '' ? styles.chipActive : {}) }}>
                All
              </button>
              {categories.map(c => (
                <button key={c} className="category-chip" onClick={() => setCategory(c)}
                  style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <span> {error}</span>
              <button style={styles.retryBtn} onClick={fetchCourses}>Retry</button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '80px' }}>
              <div style={styles.spinner}></div>
              <p style={{ color: '#888', fontSize: '15px', marginTop: '12px' }}>Loading courses…</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <p style={{ fontSize: '56px', margin: '0 0 10px' }}>📭</p>
              <p style={{ fontSize: '19px', color: '#2c3e50', fontWeight: '700', marginBottom: '6px' }}>No courses found</p>
              <p style={{ fontSize: '14px', color: '#aaa' }}>Try adjusting your search or category filter</p>
            </div>
          )}

          {/* ── CARD GRID ── */}
          {!loading && !error && (
            <div style={styles.grid}>
              {filtered.map((course, idx) => {
                const pct       = seatPct(course);
                const accent    = CARD_ACCENT[idx % CARD_ACCENT.length];
                const grad      = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                const iconBg    = CARD_ICON_BG[idx % CARD_ICON_BG.length];
                const available = (course.totalSeats || 0) - (course.enrolledCount || 0);
                const avLabel   = availabilityLabel(pct);
                const avBg      = availabilityBg(pct);
                const avFg      = availabilityFg(pct);

                return (
                  <div key={course._id} className="ccard" style={styles.card}>
                    {/* Coloured banner */}
                    <div style={{ ...styles.cardBanner, background: grad }}>
                      <svg className="ccard-banner-overlay" viewBox="0 0 340 100" preserveAspectRatio="none"
                        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.4 }}>
                        <path d="M0,60 C80,90 160,30 240,70 C300,100 340,50 340,50 L340,100 L0,100 Z"
                          fill="rgba(255,255,255,0.18)" />
                      </svg>
                      <span style={styles.categoryPill}>{course.category}</span>
                      <span style={{ ...styles.availBadge, backgroundColor: avBg, color: avFg }}>
                        <span style={{ ...styles.availDot, backgroundColor: avFg }} className={pct < 90 ? 'pulse-dot' : ''} />
                        {avLabel}
                      </span>
                      <div style={{ ...styles.bannerIcon, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                        <SchoolIcon style={{ fontSize: '30px', color: '#fff' }} />
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={styles.cardBody}>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <p style={styles.description}>{course.description}</p>
                      <div className="ccard-reveal" style={{ fontSize: '12px', color: '#999', lineHeight: '1.6', marginBottom: '4px' }}>
                        Click "View Details" for full course info and enrollment options.
                      </div>
                      <div style={styles.metaChips}>
                        <span style={{ ...styles.metaChip, backgroundColor: iconBg, color: accent }}>
                          <PersonIcon style={{ fontSize: '13px' }} />
                          {course.instructor}
                        </span>
                        {course.duration && (
                          <span style={{ ...styles.metaChip, backgroundColor: '#f3f0ff', color: '#6c63ff' }}>
                            <AccessTimeIcon style={{ fontSize: '13px' }} />
                            {course.duration}
                          </span>
                        )}
                        <span style={{ ...styles.metaChip, backgroundColor: '#fff8e1', color: '#e0a020' }}>
                          <EventSeatIcon style={{ fontSize: '13px' }} />
                          {available} left
                        </span>
                      </div>
                      <div style={styles.progressSection}>
                        <div style={styles.progressLabel}>
                          <span style={{ fontSize: '12px', color: '#999' }}>Enrollment</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: accent }}>
                            {course.enrolledCount || 0}/{course.totalSeats || 0}
                          </span>
                        </div>
                        <div style={styles.progressTrack}>
                          <div style={{
                            height: '100%', borderRadius: '999px',
                            width: `${pct}%`, background: grad,
                            transition: 'width 0.6s ease',
                            position: 'relative', overflow: 'hidden',
                          }}>
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                              backgroundSize: '400px 100%',
                              animation: 'shimmer 2.2s infinite',
                            }} />
                          </div>
                        </div>
                      </div>
                      <button className="view-btn" style={{ ...styles.viewBtn, background: grad }}
                        onClick={() => openDetail(course._id)}>
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── INSTRUCTORS ── */}
        {!loading && instructorList.length > 0 && (
          <section style={{ backgroundColor: '#fff', padding: '64px 60px' }}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionEyebrow}>Team Member</span>
              <h2 style={{ ...styles.sectionTitle, fontFamily: "'Jakarta-Sans', sans-serif" }}>Our Expert Instructors</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
              {instructorList.map(([name, courseList], i) => (
                <div key={i} style={styles.instructorCard} className="instructor-card">
                  <div style={{ ...styles.instructorAvatar, background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}>
                    <PersonIcon style={{ fontSize: '36px', color: '#fff' }} />
                  </div>
                  <h3 style={styles.instructorName}>{name}</h3>
                  <p style={{ fontSize: '13px', color: CARD_ACCENT[i % CARD_ACCENT.length], fontWeight: '600', margin: '0 0 12px' }}>
                    {courseList.length} Course{courseList.length !== 1 ? 's' : ''}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    {courseList.map((title, j) => (
                      <span key={j} style={{
                        backgroundColor: CARD_ICON_BG[i % CARD_ICON_BG.length],
                        color: CARD_ACCENT[i % CARD_ACCENT.length],
                        padding: '4px 10px', borderRadius: '10px',
                        fontSize: '11px', fontWeight: '600',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{title}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                    {[...Array(5)].map((_, k) => (
                      <StarIcon key={k} style={{ color: CARD_ACCENT[i % CARD_ACCENT.length], fontSize: '16px' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        <section id="faq-section" style={{ backgroundColor: '#f3f6f9', padding: '72px 60px' }}>
          <div style={{ display: 'flex', gap: '60px', maxWidth: '1100px', margin: '0 auto', alignItems: 'flex-start' }}>
            <div style={{ width: '280px', flexShrink: 0 }}>
              <span style={styles.sectionEyebrow}>Testimonial</span>
              <h2 style={{ ...styles.sectionTitle, fontFamily: "'Jakarta-Sans', sans-serif", textAlign: 'left', marginTop: '8px' }}>
                Frequently asked Questions
              </h2>
              <p style={{ fontSize: '14px', color: '#888', lineHeight: '1.7', margin: 0 }}>
                For any unanswered questions, reach out to our support team via email.
                We'll respond as soon as possible to assist you.
              </p>
            </div>
            <div style={{ flex: 1 }}>
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-row"
                  style={{ padding: '18px 8px', borderBottom: '1px solid #e8e8e8', cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#2c3e50', flex: 1 }}>{faq.q}</span>
                    <span style={{ flexShrink: 0 }}>
                      {openFaq === i
                        ? <RemoveIcon style={{ fontSize: '18px', color: '#00a89d' }} />
                        : <AddIcon    style={{ fontSize: '18px', color: '#888' }} />}
                    </span>
                  </div>
                  {openFaq === i && (
                    <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', margin: '12px 0 0', paddingRight: '30px' }}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── DETAIL MODAL ── */}
      {modalOpen && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal} className="modal-anim">

            {/* Gradient banner header */}
            <div style={{
              height: '90px',
              borderRadius: '16px 16px 0 0',
              background: modalLoading ? CARD_GRADIENTS[0] : modalGrad,
              display: 'flex', alignItems: 'center',
              padding: '0 24px', gap: '14px',
              flexShrink: 0,
            }}>
              {!modalLoading && selected && (
                <>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <SchoolIcon style={{ fontSize: '28px', color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {selected.category}
                    </p>
                    <h2 style={{
                      margin: 0, fontSize: '18px', color: '#fff', fontWeight: '800',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {selected.title}
                    </h2>
                  </div>
                </>
              )}
              <button
                style={{ ...styles.closeBtn, marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.22)', border: 'none' }}
                onClick={closeModal}
              >
                <CloseIcon style={{ fontSize: '18px', color: '#fff' }} />
              </button>
            </div>

            {/* Loading spinner */}
            {modalLoading && (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={styles.spinner}></div>
              </div>
            )}

            {/* Error state */}
            {!modalLoading && !selected && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#e74c3c' }}>Failed to load course details.</p>
              </div>
            )}

            {/* Main content */}
            {!modalLoading && selected && (
              <div style={{ padding: '24px 28px 28px', overflowY: 'auto', maxHeight: 'calc(90vh - 90px)' }}>

                {/* Description */}
                <p style={{
                  fontSize: '14px', color: '#555', lineHeight: '1.75',
                  backgroundColor: '#f7f9fb', padding: '14px 16px',
                  borderRadius: '10px', marginBottom: '22px',
                  borderLeft: `3px solid ${modalAccent}`,
                }}>
                  {selected.description}
                </p>

                {/* Detail grid — no Course ID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
                  {[
                    { icon: <PersonIcon        style={styles.detailIcon} />, label: 'Instructor', value: selected.instructor },
                    { icon: <CategoryIcon      style={styles.detailIcon} />, label: 'Category',   value: selected.category },
                    { icon: <AccessTimeIcon    style={styles.detailIcon} />, label: 'Duration',   value: selected.duration || '—' },
                    { icon: <EventSeatIcon     style={styles.detailIcon} />, label: 'Seats',      value: `${selected.enrolledCount} / ${selected.totalSeats} enrolled` },
                    { icon: <CalendarTodayIcon style={styles.detailIcon} />, label: 'Created',    value: new Date(selected.createdAt).toLocaleDateString() },
                    { icon: <InfoOutlinedIcon  style={styles.detailIcon} />, label: 'Status',     value: selected.status, highlight: selected.status === 'active' },
                  ].map((item, i) => (
                    <div key={i} style={styles.detailItem}>
                      {item.icon}
                      <div>
                        <p style={styles.detailLabel}>{item.label}</p>
                        <p style={{
                          ...styles.detailValue,
                          ...(item.highlight ? { color: '#00b4b4', fontWeight: '700', textTransform: 'capitalize' } : {}),
                        }}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: '26px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>Capacity</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: seatColor(seatPct(selected)) }}>
                      {Math.round(seatPct(selected))}% filled
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      width: `${seatPct(selected)}%`,
                      background: modalGrad,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* ── Enroll Now button ── */}
                <button
                  className="enroll-modal-btn"
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: modalGrad,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.22s',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.02em',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  onClick={handleEnroll}
                >
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
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #f0fafa 0%, #e0f7f6 50%, #ccf0ee 100%)',
    padding: '70px 60px', overflow: 'hidden', minHeight: '380px',
  },
  blob1: {
    position: 'absolute', top: '-60px', right: '25%',
    width: '220px', height: '220px', borderRadius: '50%',
    background: 'rgba(0,168,157,0.25)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-40px', right: '-2%',
    width: '160px', height: '160px', borderRadius: '50%',
    background: 'rgba(0,168,157,0.35)', pointerEvents: 'none',
  },
  heroInner: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '40px',
    maxWidth: '1100px', margin: '0 auto',
  },
  heroLeft: { flex: 1, maxWidth: '500px' },
  heroEyebrow: {
    display: 'inline-block', backgroundColor: '#00a89d', color: '#fff',
    padding: '5px 16px', borderRadius: '20px', fontSize: '13px',
    fontWeight: '700', marginBottom: '18px',
  },
  heroTitle: {
    fontSize: '48px', fontWeight: '800', color: '#004040',
    margin: '0 0 18px', lineHeight: '1.2',
  },
  heroSub: { fontSize: '17px', color: '#1a5050', lineHeight: '1.8', margin: '0 0 30px' },
  heroBtns: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  heroBtnPrimary: {
    backgroundColor: '#00a89d', color: '#fff', border: 'none',
    padding: '13px 32px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '15px', fontWeight: '700', transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(0,168,157,0.3)', fontFamily: "'DM Sans', sans-serif",
  },
  heroBtnSecondary: {
    backgroundColor: '#fff', color: '#00a89d', border: '1.5px solid #00a89d',
    padding: '13px 32px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
  },
  heroRight: { position: 'relative', width: '360px', height: '300px', flexShrink: 0 },
  heroCircle: {
    position: 'absolute', top: '65%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '480px', height: '480px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #00a89d, #007a75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 12px 40px rgba(0,168,157,0.35)',
  },
  floatBadge: {
    position: 'absolute', backgroundColor: '#fff', borderRadius: '30px',
    padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '7px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '12px',
    fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap',
  },
  floatBadgeText: { fontSize: '12px', color: '#2c3e50', fontWeight: '600' },
  dot: {
    position: 'absolute', borderRadius: '50%',
    background: 'linear-gradient(135deg, #00a89d, #007a75)',
  },
  sectionHead: { textAlign: 'center', marginBottom: '36px' },
  sectionEyebrow: {
    display: 'inline-block', color: '#00a89d', fontSize: '12px',
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
  },
  sectionTitle: { fontSize: '32px', fontWeight: '800', color: '#1a2b3c', margin: '6px 0 0' },
  filterBar: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: '220px' },
  searchIcon: { position: 'absolute', left: '16px', color: '#bbb', fontSize: '20px', pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '13px 42px 13px 46px',
    borderRadius: '30px', border: '1.5px solid #e0e0e0',
    fontSize: '14px', outline: 'none',
    backgroundColor: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  },
  clearBtn: {
    position: 'absolute', right: '14px', background: 'none',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px',
  },
  select: {
    padding: '13px 20px', borderRadius: '30px', border: '1.5px solid #e0e0e0',
    fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer', minWidth: '170px',
    fontFamily: "'DM Sans', sans-serif",
  },
  resultsCount: { color: '#aaa', fontSize: '13px', whiteSpace: 'nowrap', fontWeight: '600' },
  chip: {
    padding: '7px 18px', borderRadius: '30px', border: '1.5px solid #e0e0e0',
    backgroundColor: '#fff', color: '#666', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.18s', fontFamily: "'DM Sans', sans-serif",
  },
  chipActive: {
    backgroundColor: '#00b4b4', borderColor: '#00b4b4', color: '#fff',
    boxShadow: '0 4px 12px rgba(0,180,180,0.3)',
  },
  errorBox: {
    backgroundColor: '#fdecea', color: '#e74c3c', padding: '14px 20px',
    borderRadius: '10px', marginBottom: '20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px',
  },
  retryBtn: {
    background: 'none', border: '1.5px solid #e74c3c', color: '#e74c3c',
    padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid #e0e0e0', borderTop: '3px solid #00b4b4',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '26px',
  },
  card: {
    backgroundColor: '#fff', borderRadius: '18px', overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column',
  },
  cardBanner: {
    position: 'relative', height: '120px',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '16px 16px 0', overflow: 'hidden', flexShrink: 0,
  },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.92)', color: '#1a2b3c',
    padding: '4px 12px', borderRadius: '20px', fontSize: '10px',
    fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', zIndex: 1,
  },
  availBadge: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '4px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', zIndex: 1,
  },
  availDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  bannerIcon: {
    position: 'absolute', bottom: '-18px', left: '50%',
    transform: 'translateX(-50%)',
    width: '52px', height: '52px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 2,
  },
  cardBody: { padding: '36px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 },
  courseTitle: {
    fontSize: '16px', fontWeight: '800', color: '#1a2b3c',
    margin: '0 0 8px', lineHeight: '1.35',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  description: {
    fontSize: '13px', color: '#8a96a3', lineHeight: '1.65', margin: '0 0 12px',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  metaChips: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '16px' },
  metaChip: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
  },
  progressSection: { marginBottom: '16px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  progressTrack: { height: '7px', backgroundColor: '#f0f2f5', borderRadius: '999px', overflow: 'hidden' },
  viewBtn: {
    width: '100%', padding: '11px', color: '#fff', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontWeight: '700', fontSize: '14px',
    transition: 'all 0.2s', marginTop: 'auto',
    letterSpacing: '0.02em', fontFamily: "'DM Sans', sans-serif",
  },
  instructorCard: {
    backgroundColor: '#fafafa', borderRadius: '16px', padding: '28px 22px',
    width: '220px', textAlign: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
  },
  instructorAvatar: {
    width: '72px', height: '72px', borderRadius: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 14px', boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
  },
  instructorName: { fontSize: '16px', fontWeight: '700', color: '#2c3e50', margin: '0 0 4px' },
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.48)',
    backdropFilter: 'blur(4px)', zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '16px',
    width: '100%', maxWidth: '560px', maxHeight: '90vh',
    boxShadow: '0 24px 70px rgba(0,0,0,0.22)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  closeBtn: {
    background: '#f5f5f5', border: 'none', borderRadius: '50%',
    width: '34px', height: '34px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background-color 0.2s',
  },
  detailItem: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    backgroundColor: '#f7f9fb', padding: '12px', borderRadius: '10px',
  },
  detailIcon: { color: '#00b4b4', fontSize: '20px', marginTop: '2px', flexShrink: 0 },
  detailLabel: {
    fontSize: '10px', color: '#b0b8c4', margin: '0 0 3px',
    textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.06em',
  },
  detailValue: { fontSize: '14px', color: '#1a2b3c', margin: 0, fontWeight: '600' },
};

export default Courses;