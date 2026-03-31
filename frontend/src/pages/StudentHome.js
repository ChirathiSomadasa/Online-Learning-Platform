import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// MUI Icons
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

const StudentHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for dynamic stats and enrollments
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    enrolled: 0,
    completed: 0,
    hours: 0
  });

  const courses = [
    { id: 1, title: 'Node.js Fundamentals', instructor: 'Dr. Silva', category: 'Programming', seats: '30/50', duration: '8 Weeks', level: 'Beginner' },
    { id: 2, title: 'React.js Basics', instructor: 'Dr. Perera', category: 'Frontend', seats: '20/40', duration: '6 Weeks', level: 'Intermediate' },
    { id: 3, title: 'Cloud Computing', instructor: 'Dr. Fernando', category: 'Cloud', seats: '15/35', duration: '10 Weeks', level: 'Advanced' },
    { id: 4, title: 'Machine Learning', instructor: 'Dr. Kamal', category: 'AI', seats: '25/45', duration: '12 Weeks', level: 'Intermediate' },
    { id: 5, title: 'Cybersecurity', instructor: 'Dr. Nimal', category: 'Security', seats: '10/30', duration: '8 Weeks', level: 'Beginner' },
    { id: 6, title: 'Database Design', instructor: 'Dr. Sunil', category: 'Database', seats: '18/40', duration: '5 Weeks', level: 'Beginner' },
  ];

  useEffect(() => {
    if (user && user.id) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3003/api/enrollment/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      setEnrollments(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const enrolled = data.length;
    const completed = data.filter(e => e.progress === 100).length;
    const hours = enrolled * 15; 
    setUserStats({ enrolled, completed, hours });
  };

  const displayStats = [
    { icon: <AutoStoriesIcon style={styles.statIcon} />, num: userStats.enrolled.toString(), lbl: 'Enrolled Courses', color: '#49BBBD' },
    { icon: <CheckCircleOutlineIcon style={styles.statIcon} />, num: userStats.completed.toString(), lbl: 'Completed', color: '#2ecc71' },
    { icon: <AccessTimeIcon style={styles.statIcon} />, num: `${userStats.hours}h`, lbl: 'Learning Time', color: '#f1c40f' },
  ];

  return (
    <div style={styles.page}>
      
      {/* HERO BANNER WITH IMAGE */}
      <section style={styles.heroBanner}>
        <div style={styles.overlay}>
          <div style={styles.heroContent}>
            <span style={styles.badge}>
              <RocketLaunchIcon style={{ fontSize: '14px', marginRight: '5px' }} />
              Student Dashboard
            </span>
            <h1 style={styles.bannerTitle}>
              Welcome back, <span style={styles.highlight}>{user?.name || 'Scholar'}</span>!
            </h1>
            <p style={styles.bannerSubtitle}>
              Continue your learning journey today
            </p>
            <button style={styles.primaryBtn} onClick={() => navigate('/my-courses')}>
              View My Progress
            </button>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section style={styles.statsContainer}>
        <div style={styles.statsRow}>
          {displayStats.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statIconWrap, backgroundColor: `${s.color}15` }}>
                {React.cloneElement(s.icon, { style: { ...styles.statIcon, color: s.color } })}
              </div>
              <div>
                <h3 style={styles.statNum}>{s.num}</h3>
                <p style={styles.statLbl}>{s.lbl}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AVAILABLE COURSES */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Explore New Horizons</h2>
            <p style={styles.sectionSubtitle}>Handpicked courses based on your interests</p>
          </div>
          <button style={styles.textBtn}>View All Courses</button>
        </div>

        <div style={styles.courseGrid}>
          {courses.map(course => (
            <div key={course.id} style={styles.courseCard}>
              <div style={styles.cardHeader}>
                <span style={styles.courseCategory}>{course.category}</span>
                <span style={styles.levelTag}>{course.level}</span>
              </div>
              
              <h3 style={styles.courseTitle}>{course.title}</h3>

              <div style={styles.detailsBox}>
                <div style={styles.metaRow}>
                  <PersonIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.instructor}</span>
                </div>
                <div style={styles.metaRow}>
                  <AccessTimeIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.duration}</span>
                </div>
                <div style={styles.metaRow}>
                  <EventSeatIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.seats} seats left</span>
                </div>
              </div>

              <button 
                style={styles.enrollBtn}
                onMouseOver={(e) => e.target.style.backgroundColor = '#008b8b'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#00b4b4'}
              >
                Enroll Now
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    backgroundColor: '#f8f9fd',
    minHeight: '100vh',
    paddingBottom: '50px',
  },
  heroBanner: {
    height: '400px',
    backgroundImage: 'url("https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1920")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(4, 176, 182, 0.5) 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 80px',
  },
  heroContent: {
    maxWidth: '600px',
    color: '#fff',
  },
  bannerTitle: {
    fontSize: '48px',
    fontWeight: '800',
    margin: '15px 0',
    lineHeight: '1.2',
  },
  highlight: {
    color: '#37c9cb',
  },
  bannerSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(5px)',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  primaryBtn: {
    padding: '14px 28px',
    backgroundColor: '#00b4b4',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  statsContainer: {
  marginTop: '0',           
  position: 'relative',
  zIndex: 2,
  padding: '30px 80px',    
  backgroundColor: '#f8f9fd',
  },
  statsRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    flex: '1',
    minWidth: '220px',
  },
  statIconWrap: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: { fontSize: '28px' },
  statNum: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 },
  statLbl: { color: '#666', fontSize: '14px', margin: 0 },
  section: { padding: '60px 80px' },
  sectionHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    marginBottom: '40px' 
  },
  sectionTitle: { fontSize: '28px', color: '#1a1a1a', margin: 0, fontWeight: '700' },
  sectionSubtitle: { color: '#666', fontSize: '16px', marginTop: '8px' },
  textBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#00b4b4', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    fontSize: '15px'
  },
  courseGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
    gap: '30px' 
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
    border: '1px solid #edf2f7',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  courseCategory: {
    color: '#00b4b4',
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  levelTag: {
    fontSize: '11px',
    backgroundColor: '#f1f3f5',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#495057',
  },
  courseTitle: {
    fontSize: '19px',
    color: '#1a1a1a',
    margin: '0 0 20px',
    fontWeight: '700',
    lineHeight: '1.4',
    height: '54px',
    overflow: 'hidden',
  },
  detailsBox: {
    borderTop: '1px solid #f1f3f5',
    paddingTop: '15px',
    marginBottom: '20px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  metaIcon: { color: '#a0aec0', fontSize: '18px' },
  metaText: { color: '#4a5568', fontSize: '14px' },
  enrollBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#00b4b4',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '15px',
    transition: 'background-color 0.2s',
  },
};

export default StudentHome;