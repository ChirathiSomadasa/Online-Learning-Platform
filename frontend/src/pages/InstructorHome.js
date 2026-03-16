import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllCourses } from '../services/courseService';

import MenuBookIcon   from '@mui/icons-material/MenuBook';
import SchoolIcon     from '@mui/icons-material/School';
import StarRateIcon   from '@mui/icons-material/StarRate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon      from '@mui/icons-material/Group';

const InstructorHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await getAllCourses();
      setCourses(data.filter(c => c.instructorId === user?._id));
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  const totalStudents  = courses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
  const activeCourses  = courses.filter(c => c.status === 'active').length;
  const totalSeats     = courses.reduce((s, c) => s + (c.totalSeats    || 0), 0);
  const completionRate = totalSeats > 0 ? Math.round((totalStudents / totalSeats) * 100) : 0;

  const stats = [
    { icon: <MenuBookIcon   style={styles.statIcon} />, num: courses.length,      lbl: 'Total Courses'  },
    { icon: <SchoolIcon     style={styles.statIcon} />, num: totalStudents,        lbl: 'Total Students' },
    { icon: <StarRateIcon   style={styles.statIcon} />, num: activeCourses,        lbl: 'Active Courses' },
    { icon: <TrendingUpIcon style={styles.statIcon} />, num: `${completionRate}%`, lbl: 'Fill Rate'      },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .course-row-hover:hover { background-color: #fafffe !important; }
        .manage-btn:hover { background-color: #e67e22 !important; transform: translateY(-1px); }
      `}</style>

      <div style={styles.page}>

        {/* ── BANNER ── */}
        <section style={styles.banner}>
          <h1 style={styles.bannerTitle}>Instructor Dashboard</h1>
          <p style={styles.bannerSubtitle}>
            Welcome back, <strong>{user?.name}</strong>! Manage your courses and track student progress.
          </p>
          <span style={styles.badge}>Instructor Panel</span>
        </section>

        {/* ── STATS ── */}
        <section style={styles.statsRow}>
          {stats.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statIconWrap}>{s.icon}</div>
              <div>
                <h3 style={styles.statNum}>{loading ? '—' : s.num}</h3>
                <p style={styles.statLbl}>{s.lbl}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── MY COURSES ── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>My Courses</h2>
            <button
              style={styles.manageBtn}
              className="manage-btn"
              onClick={() => navigate('/my-courses')}
            >
              Manage All Courses →
            </button>
          </div>

          {loading && (
            <div style={styles.loadingWrap}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Loading courses...</p>
            </div>
          )}

          {!loading && courses.length === 0 && (
            <div style={styles.empty}>
              <p style={styles.emptyText}>No courses yet</p>
              <p style={styles.emptyHint}>
                Go to{' '}
                <span
                  style={{ color: '#f39c12', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/my-courses')}
                >
                  My Courses
                </span>
                {' '}to create your first course
              </p>
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
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: course.status === 'active' ? '#e8fafa' : '#fff3e0',
                    color:           course.status === 'active' ? '#00b4b4' : '#f39c12',
                  }}>
                    {course.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

const styles = {
  page: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh' },

  banner:         { background: 'linear-gradient(135deg, #f39c12, #e67e22)', padding: '60px', color: '#fff' },
  bannerTitle:    { fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px' },
  bannerSubtitle: { fontSize: '17px', opacity: 0.9, margin: '0 0 20px' },
  badge:          { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '5px 18px', borderRadius: '20px', fontSize: '13px' },

  statsRow: { display: 'flex', gap: '20px', padding: '30px 60px', flexWrap: 'wrap', justifyContent: 'center' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '25px 35px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 3px 12px rgba(0,0,0,0.07)', flex: '1', minWidth: '180px' },
  statIconWrap: { backgroundColor: '#fff3e0', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statIcon: { color: '#f39c12', fontSize: '28px' },
  statNum:  { fontSize: '28px', fontWeight: 'bold', color: '#2c3e50', margin: 0 },
  statLbl:  { color: '#888', fontSize: '13px', margin: 0 },

  section:       { padding: '20px 60px 60px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  sectionTitle:  { fontSize: '26px', color: '#2c3e50', margin: 0 },
  manageBtn: {
    backgroundColor: '#f39c12', color: '#fff', border: 'none',
    padding: '10px 22px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
  },

  loadingWrap: { textAlign: 'center', padding: '60px' },
  spinner:     { width: '36px', height: '36px', border: '3px solid #f0f0f0', borderTop: '3px solid #f39c12', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' },
  loadingText: { color: '#888', fontSize: '15px' },
  empty:       { textAlign: 'center', padding: '60px 20px' },
  emptyText:   { fontSize: '18px', color: '#2c3e50', fontWeight: '600', marginBottom: '6px' },
  emptyHint:   { fontSize: '14px', color: '#aaa' },

  courseList:    { display: 'flex', flexDirection: 'column', gap: '15px' },
  courseRow:     { backgroundColor: '#fff', borderRadius: '12px', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.07)', transition: 'background-color 0.15s' },
  courseInfo:    {},
  courseTitle:   { fontSize: '18px', color: '#2c3e50', margin: '0 0 8px' },
  courseMetaRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  metaIcon:      { color: '#f39c12', fontSize: '16px' },
  courseStudents:{ color: '#888', fontSize: '13px' },
  statusBadge:   { padding: '5px 14px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' },
};

export default InstructorHome;