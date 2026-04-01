import React from 'react';
import { useAuth } from '../context/AuthContext';

// MUI Icons
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

const InstructorHome = () => {
  const { user } = useAuth();

  const myCourses = [
    { id: 1, title: 'Node.js Fundamentals',  students: 28, duration: '8 Weeks',  category: 'Programming', level: 'Beginner',     status: 'Active' },
    { id: 2, title: 'Advanced JavaScript',   students: 15, duration: '6 Weeks',  category: 'Frontend',    level: 'Advanced',     status: 'Active' },
    { id: 3, title: 'API Design',            students: 22, duration: '5 Weeks',  category: 'Backend',     level: 'Intermediate', status: 'Draft'  },
    { id: 4, title: 'Cloud Computing',       students: 18, duration: '10 Weeks', category: 'Cloud',       level: 'Advanced',     status: 'Active' },
    { id: 5, title: 'React for Beginners',   students: 30, duration: '7 Weeks',  category: 'Frontend',    level: 'Beginner',     status: 'Active' },
    { id: 6, title: 'Database Design',       students: 12, duration: '4 Weeks',  category: 'Database',    level: 'Beginner',     status: 'Draft'  },
  ];

  const stats = [
    { icon: <MenuBookIcon  />, num: '6',   lbl: 'Total Courses',    color: '#f39c12' },
    { icon: <SchoolIcon    />, num: '125', lbl: 'Total Students',   color: '#49BBBD' },
    { icon: <TrendingUpIcon/>, num: '92%', lbl: 'Completion Rate',  color: '#2ecc71' },
  ];

  return (
    <div style={styles.page}>

      {/* HERO BANNER */}
      <section style={styles.heroBanner}>
        <div style={styles.overlay}>
          <div style={styles.heroContent}>
            <span style={styles.badge}>
              <RocketLaunchIcon style={{ fontSize: '14px', marginRight: '6px' }} />
              Instructor Dashboard
            </span>
            <h1 style={styles.bannerTitle}>
              Welcome back, <span style={styles.highlight}>{user?.name || 'Instructor'}</span>!
            </h1>
            <p style={styles.bannerSubtitle}>
              Manage your courses and inspire students every day
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={styles.statsContainer}>
        <div style={styles.statsRow}>
          {stats.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statIconWrap, backgroundColor: `${s.color}18` }}>
                {React.cloneElement(s.icon, { style: { fontSize: '28px', color: s.color } })}
              </div>
              <div>
                <h3 style={styles.statNum}>{s.num}</h3>
                <p style={styles.statLbl}>{s.lbl}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MY COURSES */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>My Courses</h2>
            <p style={styles.sectionSubtitle}>Courses you are currently teaching</p>
          </div>
        </div>

        <div style={styles.courseGrid}>
          {myCourses.map(course => (
            <div key={course.id} style={styles.courseCard}>

              {/* Card Top */}
              <div style={styles.cardHeader}>
                <span style={styles.courseCategory}>{course.category}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: course.status === 'Active' ? '#e8fafa' : '#fff3e0',
                  color:           course.status === 'Active' ? '#49BBBD' : '#f39c12',
                }}>
                  {course.status}
                </span>
              </div>

              {/* Title */}
              <h3 style={styles.courseTitle}>{course.title}</h3>

              {/* Meta */}
              <div style={styles.detailsBox}>
                <div style={styles.metaRow}>
                  <GroupIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.students} Students Enrolled</span>
                </div>
                <div style={styles.metaRow}>
                  <AccessTimeIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.duration}</span>
                </div>
                <div style={styles.metaRow}>
                  <PersonIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>Level: {course.level}</span>
                </div>
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
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    backgroundColor: '#f8f9fd',
    minHeight: '100vh',
    paddingBottom: '50px',
  },

  // HERO
  heroBanner: {
    height: '340px',
    backgroundImage: 'url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1920")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(243,156,18,0.45) 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 80px',
  },
  heroContent: {
    maxWidth: '600px',
    color: '#fff',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(5px)',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
  },
  bannerTitle: {
    fontSize: '46px',
    fontWeight: '800',
    margin: '0 0 14px',
    lineHeight: '1.2',
  },
  highlight: { color: '#f39c12' },
  bannerSubtitle: {
    fontSize: '17px',
    opacity: 0.88,
    margin: 0,
    lineHeight: '1.6',
  },

  // STATS
  statsContainer: {
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
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: { fontSize: '26px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 },
  statLbl: { color: '#666', fontSize: '13px', margin: 0 },

  // COURSES SECTION
  section: { padding: '10px 80px 60px' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '26px',
    color: '#1a1a1a',
    margin: 0,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: '15px',
    marginTop: '6px',
    marginBottom: 0,
  },

  // COURSE GRID
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '28px',
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '26px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #edf2f7',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  courseCategory: {
    color: '#f39c12',
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statusBadge: {
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  courseTitle: {
    fontSize: '18px',
    color: '#1a1a1a',
    margin: '0 0 18px',
    fontWeight: '700',
    lineHeight: '1.4',
    height: '52px',
    overflow: 'hidden',
  },
  detailsBox: {
    borderTop: '1px solid #f1f3f5',
    paddingTop: '14px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  metaIcon: { color: '#a0aec0', fontSize: '17px' },
  metaText: { color: '#4a5568', fontSize: '14px' },
};

export default InstructorHome;