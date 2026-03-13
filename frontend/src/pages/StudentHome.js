import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

// MUI Icons
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import EventSeatIcon from '@mui/icons-material/EventSeat';

const StudentHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const courses = [
    { id: 1, title: 'Node.js Fundamentals',  instructor: 'Dr. Silva',    category: 'Programming', seats: '30/50' },
    { id: 2, title: 'React.js Basics',        instructor: 'Dr. Perera',   category: 'Frontend',    seats: '20/40' },
    { id: 3, title: 'Cloud Computing',        instructor: 'Dr. Fernando', category: 'Cloud',       seats: '15/35' },
    { id: 4, title: 'Machine Learning',       instructor: 'Dr. Kamal',    category: 'AI',          seats: '25/45' },
    { id: 5, title: 'Cybersecurity',          instructor: 'Dr. Nimal',    category: 'Security',    seats: '10/30' },
    { id: 6, title: 'Database Design',        instructor: 'Dr. Sunil',    category: 'Database',    seats: '18/40' },
  ];

  const stats = [
    { icon: <AutoStoriesIcon      style={styles.statIcon} />, num: '3',   lbl: 'Enrolled Courses' },
    { icon: <CheckCircleOutlineIcon style={styles.statIcon} />, num: '1', lbl: 'Completed'         },
    { icon: <AccessTimeIcon       style={styles.statIcon} />, num: '24h', lbl: 'Learning Time'     },
    { icon: <EmojiEventsIcon      style={styles.statIcon} />, num: '2',   lbl: 'Certificates'      },
  ];

  return (
    <div style={styles.page}>

      {/* HERO BANNER */}
      <section style={styles.banner}>
        <h1 style={styles.bannerTitle}>
          Welcome back, <strong>{user?.name}</strong>!
        </h1>
        <p style={styles.bannerSubtitle}>Continue your learning journey today</p>
        <span style={styles.badge}>Student Dashboard</span>
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

      {/* AVAILABLE COURSES */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Available Courses</h2>
          <p style={styles.sectionSubtitle}>Browse and enroll in courses</p>
        </div>
        <div style={styles.courseGrid}>
          {courses.map(course => (
            <div key={course.id} style={styles.courseCard}>

              <span style={styles.courseCategory}>{course.category}</span>
              <h3 style={styles.courseTitle}>{course.title}</h3>

              <div style={styles.metaRow}>
                <PersonIcon style={styles.metaIcon} />
                <span style={styles.metaText}>{course.instructor}</span>
              </div>

              <div style={styles.metaRow}>
                <EventSeatIcon style={styles.metaIcon} />
                <span style={styles.metaText}>Seats: {course.seats}</span>
              </div>

              <button style={styles.enrollBtn}>Enroll Now</button>

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
    background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    padding: '60px',
    color: '#fff',
  },
  bannerTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 10px',
  },
  bannerSubtitle: {
    fontSize: '17px',
    opacity: 0.9,
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
    backgroundColor: '#e8fafa',
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: { color: '#00b4b4', fontSize: '28px' },
  statNum: { fontSize: '28px', fontWeight: 'bold', color: '#2c3e50', margin: 0 },
  statLbl: { color: '#888', fontSize: '13px', margin: 0 },

  // Courses
  section: { padding: '20px 60px 60px' },
  sectionHeader: { marginBottom: '30px' },
  sectionTitle: { fontSize: '26px', color: '#2c3e50', margin: 0 },
  sectionSubtitle: { color: '#888', fontSize: '14px', marginTop: '5px' },
  courseGrid: { display: 'flex', gap: '25px', flexWrap: 'wrap' },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    width: '260px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
  },
  courseCategory: {
    backgroundColor: '#e8fafa',
    color: '#00b4b4',
    padding: '4px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    display: 'inline-block',
    marginBottom: '12px',
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: '16px',
    color: '#2c3e50',
    marginBottom: '14px',
    margin: '0 0 14px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '8px',
  },
  metaIcon: { color: '#00b4b4', fontSize: '16px' },
  metaText: { color: '#888', fontSize: '13px' },
  enrollBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#00b4b4',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    marginTop: '16px',
  },
};

export default StudentHome;