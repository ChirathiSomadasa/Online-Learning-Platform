import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

// MUI Icons
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import StarRateIcon from '@mui/icons-material/StarRate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';

const InstructorHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const myCourses = [
    { id: 1, title: 'Node.js Fundamentals', students: 28, status: 'Active' },
    { id: 2, title: 'Advanced JavaScript', students: 15, status: 'Active' },
    { id: 3, title: 'API Design', students: 22, status: 'Draft' },
  ];

  const stats = [
    { icon: <MenuBookIcon style={styles.statIcon} />, num: '3',   lbl: 'Total Courses' },
    { icon: <SchoolIcon   style={styles.statIcon} />, num: '65',  lbl: 'Total Students' },
    { icon: <StarRateIcon style={styles.statIcon} />, num: '4.8', lbl: 'Average Rating' },
    { icon: <TrendingUpIcon style={styles.statIcon} />, num: '92%', lbl: 'Completion Rate' },
  ];

  return (
    <div style={styles.page}>

      {/* HERO BANNER */}
      <section style={styles.banner}>
        <h1 style={styles.bannerTitle}>Instructor Dashboard</h1>
        <p style={styles.bannerSubtitle}>
          Welcome back, <strong>{user?.name}</strong>! Manage your courses and track student progress.
        </p>
        <span style={styles.badge}>Instructor Panel</span>
      </section>

      {/* STATS */}
      <section style={styles.statsRow}>
        {stats.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={styles.statIconWrap}>{s.icon}</div>
            <div>
              <h3 style={styles.statNum}>{s.num}</h3>
              <p style={styles.statLbl}>{s.lbl}</p>
            </div>
          </div>
        ))}
      </section>

      {/* MY COURSES */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>My Courses</h2>
          <button style={styles.createBtn}>
            <AddCircleOutlineIcon style={{ fontSize: '18px' }} />
            Create New Course
          </button>
        </div>

        <div style={styles.courseList}>
          {myCourses.map(course => (
            <div key={course.id} style={styles.courseRow}>

              <div style={styles.courseInfo}>
                <h3 style={styles.courseTitle}>{course.title}</h3>
                <div style={styles.courseMetaRow}>
                  <GroupIcon style={styles.metaIcon} />
                  <span style={styles.courseStudents}>{course.students} students enrolled</span>
                </div>
              </div>

              <div style={styles.courseActions}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: course.status === 'Active' ? '#e8fafa' : '#fff3e0',
                  color: course.status === 'Active' ? '#00b4b4' : '#f39c12',
                }}>
                  {course.status}
                </span>
                <button style={styles.editBtn}>
                  <EditIcon style={{ fontSize: '15px' }} />
                  Edit
                </button>
                <button style={styles.viewBtn}>
                  <GroupIcon style={{ fontSize: '15px' }} />
                  View Students
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

const styles = {
  page: {
    fontFamily: 'Segoe UI, sans-serif',
    backgroundColor: '#f5f6fa',
    minHeight: '100vh',
  },

  // Banner
  banner: {
    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
    padding: '60px',
    color: '#fff',
  },
  bannerTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '10px',
    margin: '0 0 10px',
  },
  bannerSubtitle: {
    fontSize: '17px',
    opacity: 0.9,
    marginBottom: '20px',
    margin: '0 0 20px',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '5px 18px',
    borderRadius: '20px',
    fontSize: '13px',
  },

  // Stats
  statsRow: {
    display: 'flex',
    gap: '20px',
    padding: '30px 60px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px 35px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
    flex: '1',
    minWidth: '180px',
  },
  statIconWrap: {
    backgroundColor: '#fff3e0',
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: { color: '#f39c12', fontSize: '28px' },
  statNum: { fontSize: '28px', fontWeight: 'bold', color: '#2c3e50', margin: 0 },
  statLbl: { color: '#888', fontSize: '13px', margin: 0 },

  // Courses section
  section: { padding: '20px 60px 60px' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
  },
  sectionTitle: { fontSize: '26px', color: '#2c3e50', margin: 0 },
  createBtn: {
    backgroundColor: '#f39c12',
    color: '#fff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },

  courseList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  courseRow: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
  },
  courseInfo: {},
  courseTitle: { fontSize: '18px', color: '#2c3e50', margin: '0 0 8px' },
  courseMetaRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  metaIcon: { color: '#f39c12', fontSize: '16px' },
  courseStudents: { color: '#888', fontSize: '13px' },

  courseActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  statusBadge: {
    padding: '5px 14px',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  editBtn: {
    backgroundColor: '#f5f5f5',
    color: '#555',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  viewBtn: {
    backgroundColor: '#f39c12',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
};

export default InstructorHome;