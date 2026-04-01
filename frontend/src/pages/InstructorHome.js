import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllCourses } from '../services/courseService';

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
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const data = await getAllCourses();
        // Filter courses to only show those created by the logged-in instructor
        setCourses(data.filter(c => c.instructorId === user?._id));
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Calculate dynamic stats
  const totalStudents = courses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
  const totalSeats = courses.reduce((s, c) => s + (c.totalSeats || 0), 0);
  const fillRate = totalSeats > 0 ? Math.round((totalStudents / totalSeats) * 100) : 0;

  const stats = [
    { icon: <MenuBookIcon  />, num: loading ? '-' : courses.length.toString(),   lbl: 'Total Courses',  color: '#f39c12' },
    { icon: <SchoolIcon    />, num: loading ? '-' : totalStudents.toString(),    lbl: 'Total Students', color: '#49BBBD' },
    { icon: <TrendingUpIcon/>, num: loading ? '-' : `${fillRate}%`,              lbl: 'Fill Rate',      color: '#2ecc71' },
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading your courses...</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No courses created yet.</div>
        ) : (
          <div style={styles.courseGrid}>
            {courses.map(course => {
              const isActive = (course.status || '').toLowerCase() === 'active';

              return (
                <div key={course._id} style={styles.courseCard}>

                  {/* Card Top */}
                  <div style={styles.cardHeader}>
                    <span style={styles.courseCategory}>{course.category || 'General'}</span>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: isActive ? '#e8fafa' : '#fff3e0',
                      color:           isActive ? '#49BBBD' : '#f39c12',
                    }}>
                      {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Draft'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={styles.courseTitle}>{course.title}</h3>

                  {/* Meta */}
                  <div style={styles.detailsBox}>
                    <div style={styles.metaRow}>
                      <GroupIcon style={styles.metaIcon} />
                      <span style={styles.metaText}>{course.enrolledCount || 0} Students Enrolled</span>
                    </div>
                    <div style={styles.metaRow}>
                      <AccessTimeIcon style={styles.metaIcon} />
                      <span style={styles.metaText}>{course.duration || 'Self-paced'}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <PersonIcon style={styles.metaIcon} />
                      <span style={styles.metaText}>Level: {course.level || 'All Levels'}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
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