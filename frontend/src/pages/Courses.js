import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllCourses, getCourseById } from '../services/courseService';
import PersonIcon from '@mui/icons-material/Person';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const Courses = () => {
  const { user } = useAuth();
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

  // ── Load courses ──
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllCourses();
      setCourses(data);
      setFiltered(data);
      const cats = [...new Set(data.map(c => c.category))].filter(Boolean).sort();
      setCategories(cats);
    } catch (err) {
      setError('Failed to load courses. Make sure the Course Catalog Service is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Filter ──
  useEffect(() => {
    let result = courses;
    if (search) result = result.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    );
    if (category) result = result.filter(c => c.category === category);
    setFiltered(result);
  }, [search, category, courses]);

  // ── Open detail modal ──
  const openDetail = async (id) => {
    setModalOpen(true);
    setModalLoading(true);
    try {
      const data = await getCourseById(id);
      setSelected(data);
    } catch {
      setSelected(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => { setModalOpen(false); setSelected(null); };

  const seatPct = (c) => c.totalSeats > 0
    ? Math.min(100, (c.enrolledCount / c.totalSeats) * 100)
    : 0;

  const seatColor = (pct) =>
    pct >= 90 ? '#e74c3c' : pct >= 70 ? '#f39c12' : '#00b4b4';

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .course-card-hover {
          transition: transform 0.22s ease, box-shadow 0.22s ease !important;
          animation: fadeInUp 0.4s ease forwards;
          opacity: 0;
        }
        .course-card-hover:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 10px 28px rgba(0,180,180,0.18) !important;
        }
        .course-card-hover:nth-child(1)  { animation-delay: 0.05s; }
        .course-card-hover:nth-child(2)  { animation-delay: 0.10s; }
        .course-card-hover:nth-child(3)  { animation-delay: 0.15s; }
        .course-card-hover:nth-child(4)  { animation-delay: 0.20s; }
        .course-card-hover:nth-child(5)  { animation-delay: 0.25s; }
        .course-card-hover:nth-child(6)  { animation-delay: 0.30s; }
        .enroll-btn-hover:hover { background-color: #007a7a !important; transform: scale(1.02); }
        .modal-anim { animation: modalIn 0.2s ease forwards; }
        .search-input:focus { border-color: #00b4b4 !important; box-shadow: 0 0 0 3px rgba(0,180,180,0.15) !important; }
        .filter-select:focus { border-color: #00b4b4 !important; outline: none; }
        .close-btn:hover { background-color: #f0f0f0 !important; }
      `}</style>

      <div style={styles.page}>

        {/* BANNER */}
        <section style={styles.banner}>
          <h1 style={styles.bannerTitle}>Explore Courses</h1>
          <p style={styles.bannerSubtitle}>
            {user
              ? `Hi ${user.name}, discover courses tailored for you`
              : 'Discover and enroll in courses from expert instructors'}
          </p>
          <span style={styles.badge}>Course Catalog Service — Port 3002</span>
        </section>

        <div style={styles.container}>

          {/* SEARCH & FILTER */}
          <div style={styles.filterBar}>
            <div style={styles.searchWrap}>
              <SearchIcon style={styles.searchIcon} />
              <input
                className="search-input"
                style={styles.searchInput}
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button style={styles.clearBtn} onClick={() => setSearch('')}>
                  <CloseIcon style={{ fontSize: '16px', color: '#aaa' }} />
                </button>
              )}
            </div>
            <select
              className="filter-select"
              style={styles.select}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={styles.resultsCount}>
              {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ERROR */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️ {error}</span>
              <button style={styles.retryBtn} onClick={fetchCourses}>Retry</button>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div style={styles.loadingWrap}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading courses...</p>
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && filtered.length === 0 && (
            <div style={styles.empty}>
              <p style={styles.emptyIcon}>📭</p>
              <p style={styles.emptyText}>No courses found</p>
              <p style={styles.emptyHint}>Try adjusting your search or category filter</p>
            </div>
          )}

          {/* COURSES GRID */}
          {!loading && !error && (
            <div style={styles.grid}>
              {filtered.map(course => {
                const pct = seatPct(course);
                const color = seatColor(pct);
                const available = (course.totalSeats || 0) - (course.enrolledCount || 0);
                return (
                  <div key={course._id} style={styles.card} className="course-card-hover">

                    <div style={styles.cardTop}>
                      <span style={styles.categoryTag}>{course.category}</span>
                      <span style={{ ...styles.statusDot, backgroundColor: color }}></span>
                    </div>

                    <h3 style={styles.courseTitle}>{course.title}</h3>

                    <div style={styles.metaRow}>
                      <PersonIcon style={styles.metaIcon} />
                      <span style={styles.metaText}>{course.instructor}</span>
                    </div>

                    {course.duration && (
                      <div style={styles.metaRow}>
                        <AccessTimeIcon style={styles.metaIcon} />
                        <span style={styles.metaText}>{course.duration}</span>
                      </div>
                    )}

                    <div style={styles.metaRow}>
                      <EventSeatIcon style={styles.metaIcon} />
                      <span style={styles.metaText}>{available} seats available</span>
                    </div>

                    <p style={styles.description}>{course.description}</p>

                    {/* Seat progress bar */}
                    <div style={styles.barWrap}>
                      <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <p style={styles.barLabel}>
                      {course.enrolledCount || 0} / {course.totalSeats || 0} enrolled
                    </p>

                    <button
                      style={styles.viewBtn}
                      className="enroll-btn-hover"
                      onClick={() => openDetail(course._id)}
                    >
                      View Details
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {modalOpen && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal} className="modal-anim">

            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalLoading ? 'Loading...' : selected?.title}
              </h2>
              <button style={styles.closeBtn} className="close-btn" onClick={closeModal}>
                <CloseIcon style={{ fontSize: '20px', color: '#555' }} />
              </button>
            </div>

            {modalLoading ? (
              <div style={styles.loadingWrap}>
                <div style={styles.spinner}></div>
              </div>
            ) : selected ? (
              <>
                <p style={styles.modalDesc}>{selected.description}</p>

                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <PersonIcon style={styles.detailIcon} />
                    <div>
                      <p style={styles.detailLabel}>Instructor</p>
                      <p style={styles.detailValue}>{selected.instructor}</p>
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <CategoryIcon style={styles.detailIcon} />
                    <div>
                      <p style={styles.detailLabel}>Category</p>
                      <p style={styles.detailValue}>{selected.category}</p>
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <AccessTimeIcon style={styles.detailIcon} />
                    <div>
                      <p style={styles.detailLabel}>Duration</p>
                      <p style={styles.detailValue}>{selected.duration || '—'}</p>
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <EventSeatIcon style={styles.detailIcon} />
                    <div>
                      <p style={styles.detailLabel}>Seats</p>
                      <p style={styles.detailValue}>
                        {selected.enrolledCount} / {selected.totalSeats} enrolled
                      </p>
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <CalendarTodayIcon style={styles.detailIcon} />
                    <div>
                      <p style={styles.detailLabel}>Created</p>
                      <p style={styles.detailValue}>
                        {new Date(selected.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <InfoOutlinedIcon style={styles.detailIcon} />
                    <div>
                      <p style={styles.detailLabel}>Status</p>
                      <p style={{ ...styles.detailValue, color: selected.status === 'active' ? '#00b4b4' : '#aaa', fontWeight: '600', textTransform: 'capitalize' }}>
                        {selected.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={styles.idBox}>
                  <span style={styles.idLabel}>Course ID: </span>
                  <span style={styles.idValue}>{selected._id}</span>
                </div>

                {/* Seat bar in modal */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={styles.barWrap}>
                    <div style={{
                      ...styles.barFill,
                      width: `${seatPct(selected)}%`,
                      backgroundColor: seatColor(seatPct(selected))
                    }} />
                  </div>
                  <p style={styles.barLabel}>
                    {Math.round(seatPct(selected))}% capacity filled
                  </p>
                </div>

                <button
                  style={styles.enrollModalBtn}
                  className="enroll-btn-hover"
                  onClick={closeModal}
                >
                  Close
                </button>
              </>
            ) : (
              <p style={{ color: '#e74c3c', textAlign: 'center' }}>Failed to load course details.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  page: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh' },

  banner: {
    background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    padding: '60px',
    color: '#fff',
  },
  bannerTitle: { fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px' },
  bannerSubtitle: { fontSize: '17px', opacity: 0.9, margin: '0 0 20px' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '5px 18px',
    borderRadius: '20px',
    fontSize: '13px',
  },

  container: { padding: '30px 60px 60px' },

  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '220px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#aaa',
    fontSize: '20px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 44px',
    borderRadius: '30px',
    border: '1.5px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  clearBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
  },
  select: {
    padding: '12px 18px',
    borderRadius: '30px',
    border: '1.5px solid #ddd',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    minWidth: '170px',
  },
  resultsCount: { color: '#888', fontSize: '14px', whiteSpace: 'nowrap' },

  errorBox: {
    backgroundColor: '#fdecea',
    color: '#e74c3c',
    padding: '14px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },
  retryBtn: {
    background: 'none',
    border: '1.5px solid #e74c3c',
    color: '#e74c3c',
    padding: '5px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
  },

  loadingWrap: { textAlign: 'center', padding: '60px' },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid #e0e0e0',
    borderTop: '3px solid #00b4b4',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: { color: '#888', fontSize: '15px' },

  empty: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: '52px', margin: '0 0 10px' },
  emptyText: { fontSize: '18px', color: '#2c3e50', fontWeight: '600', marginBottom: '6px' },
  emptyHint: { fontSize: '14px', color: '#aaa' },

  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '24px',
    width: '290px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    borderTop: '3px solid #00b4b4',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  categoryTag: {
    backgroundColor: '#e8fafa',
    color: '#00b4b4',
    padding: '4px 12px',
    borderRadius: '15px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  statusDot: {
    width: '9px', height: '9px',
    borderRadius: '50%',
    boxShadow: '0 0 0 3px rgba(0,180,180,0.15)',
  },
  courseTitle: {
    fontSize: '16px',
    color: '#2c3e50',
    fontWeight: 'bold',
    margin: '0 0 12px',
    lineHeight: '1.35',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '7px',
  },
  metaIcon: { color: '#00b4b4', fontSize: '16px' },
  metaText: { color: '#888', fontSize: '13px' },
  description: {
    fontSize: '13px',
    color: '#999',
    lineHeight: '1.6',
    margin: '12px 0 12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
  },

  barWrap: {
    height: '6px',
    backgroundColor: '#f0f0f0',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '5px',
  },
  barFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },
  barLabel: { fontSize: '12px', color: '#aaa', margin: '0 0 14px' },

  viewBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#00b4b4',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.2s',
    marginTop: 'auto',
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(3px)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '22px',
    color: '#2c3e50',
    fontWeight: 'bold',
    margin: 0,
    flex: 1,
    paddingRight: '12px',
    lineHeight: '1.3',
  },
  closeBtn: {
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '50%',
    width: '34px', height: '34px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.2s',
  },
  modalDesc: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.7',
    marginBottom: '24px',
    backgroundColor: '#f9f9f9',
    padding: '14px 16px',
    borderRadius: '10px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
    marginBottom: '18px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#f9f9f9',
    padding: '12px',
    borderRadius: '10px',
  },
  detailIcon: { color: '#00b4b4', fontSize: '20px', marginTop: '2px', flexShrink: 0 },
  detailLabel: { fontSize: '11px', color: '#aaa', margin: '0 0 3px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' },
  detailValue: { fontSize: '14px', color: '#2c3e50', margin: 0, fontWeight: '500' },

  idBox: {
    backgroundColor: '#f0f0f0',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '12px',
    wordBreak: 'break-all',
  },
  idLabel: { color: '#888', fontWeight: '600' },
  idValue: { color: '#2c3e50', fontFamily: 'monospace' },

  enrollModalBtn: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#00b4b4',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default Courses;