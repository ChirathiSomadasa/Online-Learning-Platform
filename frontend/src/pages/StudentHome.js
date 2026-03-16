import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// MUI Icons
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const StudentHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalLearningHours: 0,
    certificatesEarned: 0,
    averageProgress: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch enrollments
      const enrollmentsRes = await axios.get(
        `http://localhost:3003/api/enrollment/user/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const userEnrollments = enrollmentsRes.data;
      setEnrollments(userEnrollments);
      
      // Calculate stats
      calculateStats(userEnrollments);
      
      // Fetch available courses (you can implement this)
      // const coursesRes = await axios.get('http://localhost:3002/api/courses');
      // setCourses(coursesRes.data);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load your dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (enrollmentsData) => {
    const total = enrollmentsData.length;
    const completed = enrollmentsData.filter(e => e.progress === 100).length;
    const inProgress = enrollmentsData.filter(e => e.progress > 0 && e.progress < 100).length;
    
    // Calculate average progress
    const totalProgress = enrollmentsData.reduce((sum, e) => sum + (e.progress || 0), 0);
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    
    // Estimate learning hours (assuming 15 hours per course on average)
    const totalHours = total * 15;
    
    setStats({
      enrolledCourses: total,
      completedCourses: completed,
      inProgressCourses: inProgress,
      totalLearningHours: totalHours,
      certificatesEarned: completed, // Assuming certificate for completed courses
      averageProgress: avgProgress
    });
  };

  const handleEnroll = (courseId) => {
    navigate(`/courses`, { state: { selectedCourseId: courseId } });
  };

  const viewAllCourses = () => {
    navigate('/courses');
  };

  const viewMyEnrollments = () => {
    navigate('/enrollments');
  };

  // Sample courses - replace with actual API call
  const availableCourses = [
    { id: 1, title: 'Node.js Fundamentals',  instructor: 'Dr. Silva',    category: 'Programming', totalSeats: 50, enrolledCount: 30 },
    { id: 2, title: 'React.js Basics',        instructor: 'Dr. Perera',   category: 'Frontend',    totalSeats: 40, enrolledCount: 20 },
    { id: 3, title: 'Cloud Computing',        instructor: 'Dr. Fernando', category: 'Cloud',       totalSeats: 35, enrolledCount: 15 },
    { id: 4, title: 'Machine Learning',       instructor: 'Dr. Kamal',    category: 'AI',          totalSeats: 45, enrolledCount: 25 },
    { id: 5, title: 'Cybersecurity',          instructor: 'Dr. Nimal',    category: 'Security',    totalSeats: 30, enrolledCount: 10 },
    { id: 6, title: 'Database Design',        instructor: 'Dr. Sunil',    category: 'Database',    totalSeats: 40, enrolledCount: 18 },
  ];

  // Dynamic stats based on user data
  const userStats = [
    { 
      icon: <AutoStoriesIcon style={styles.statIcon} />, 
      num: stats.enrolledCourses.toString(), 
      lbl: 'Enrolled Courses',
      color: '#00b4b4',
      bgColor: '#e8fafa'
    },
    { 
      icon: <CheckCircleOutlineIcon style={{ ...styles.statIcon, color: '#2e7d32' }} />, 
      num: stats.completedCourses.toString(), 
      lbl: 'Completed',
      color: '#2e7d32',
      bgColor: '#e6f7e6'
    },
    { 
      icon: <AccessTimeIcon style={{ ...styles.statIcon, color: '#f39c12' }} />, 
      num: `${stats.totalLearningHours}h`, 
      lbl: 'Learning Time',
      color: '#f39c12',
      bgColor: '#fff3e0'
    },
    { 
      icon: <EmojiEventsIcon style={{ ...styles.statIcon, color: '#6c63ff' }} />, 
      num: stats.certificatesEarned.toString(), 
      lbl: 'Certificates',
      color: '#6c63ff',
      bgColor: '#e8e8ff'
    },
  ];

  // Additional stats for progress
  const progressStats = [
    {
      icon: <TrendingUpIcon style={{ color: '#00b4b4' }} />,
      label: 'In Progress',
      value: stats.inProgressCourses,
      color: '#00b4b4'
    },
    {
      icon: <SchoolIcon style={{ color: '#6c63ff' }} />,
      label: 'Avg. Progress',
      value: `${stats.averageProgress}%`,
      color: '#6c63ff'
    }
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* HERO BANNER with User Details */}
      <section style={styles.banner}>
        <div style={styles.bannerContent}>
          <div>
            <h1 style={styles.bannerTitle}>
              Welcome back, <strong>{user?.name}</strong>!
            </h1>
            <p style={styles.bannerSubtitle}>
              {user?.email} • Student since {new Date(user?.createdAt || Date.now()).getFullYear()}
            </p>
            <div style={styles.bannerBadges}>
              <span style={styles.badge}>
                <SchoolIcon style={{ fontSize: '14px', marginRight: '4px' }} />
                Student Dashboard
              </span>
              {stats.enrolledCourses > 0 && (
                <span style={{ ...styles.badge, backgroundColor: 'rgba(255,255,255,0.3)' }}>
                  <AutoStoriesIcon style={{ fontSize: '14px', marginRight: '4px' }} />
                  {stats.enrolledCourses} Active Enrollments
                </span>
              )}
            </div>
          </div>
                    
        </div>
      </section>

      {/* MAIN STATS ROW */}
      <section style={styles.statsRow}>
        {userStats.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.statIconWrap, backgroundColor: s.bgColor }}>
              {s.icon}
            </div>
            <div>
              <h3 style={{ ...styles.statNum, color: s.color }}>{s.num}</h3>
              <p style={styles.statLbl}>{s.lbl}</p>
            </div>
          </div>
        ))}
      </section>

      {/* PROGRESS STATS ROW */}
      {stats.enrolledCourses > 0 && (
        <section style={styles.progressRow}>
          {progressStats.map((stat, index) => (
            <div key={index} style={styles.progressCard}>
              <div style={{ ...styles.progressIconWrap, backgroundColor: `${stat.color}15` }}>
                {stat.icon}
              </div>
              <div>
                <p style={styles.progressLabel}>{stat.label}</p>
                <p style={{ ...styles.progressValue, color: stat.color }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* AVAILABLE COURSES */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Available Courses</h2>
            <p style={styles.sectionSubtitle}>Browse and enroll in new courses</p>
          </div>
          <button style={styles.viewAllBtn} onClick={viewAllCourses}>
            View All Courses →
          </button>
        </div>
        
        <div style={styles.courseGrid}>
          {availableCourses.slice(0, 3).map(course => {
            const availableSeats = course.totalSeats - course.enrolledCount;
            const isEnrolled = enrollments.some(e => e.courseId === course.id.toString());
            
            return (
              <div key={course.id} style={styles.courseCard}>
                <span style={styles.courseCategory}>{course.category}</span>
                <h3 style={styles.courseTitle}>{course.title}</h3>

                <div style={styles.metaRow}>
                  <PersonIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>{course.instructor}</span>
                </div>

                <div style={styles.metaRow}>
                  <EventSeatIcon style={styles.metaIcon} />
                  <span style={styles.metaText}>
                    {availableSeats} seats available
                  </span>
                </div>

                {isEnrolled ? (
                  <button 
                    style={styles.enrolledBtn}
                    onClick={() => navigate('/enrollments')}
                  >
                    Already Enrolled
                  </button>
                ) : (
                  <button 
                    style={styles.enrollBtn}
                    onClick={() => handleEnroll(course.id)}
                  >
                    Enroll Now
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {stats.enrolledCourses > 0 && (
          <div style={styles.recentActivity}>
            <h3 style={styles.activityTitle}>Recent Activity</h3>
            <div style={styles.activityList}>
              {enrollments.slice(0, 3).map(enrollment => (
                <div key={enrollment._id} style={styles.activityItem}>
                  <SchoolIcon style={{ color: '#00b4b4', fontSize: 20 }} />
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}>
                      <strong>{enrollment.courseTitle}</strong> - {enrollment.progress}% complete
                    </p>
                    <p style={styles.activityTime}>
                      Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{
                    ...styles.progressIndicator,
                    width: `${enrollment.progress}%`,
                    backgroundColor: enrollment.progress === 100 ? '#2e7d32' : '#00b4b4'
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}
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

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #00b4b4',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    color: '#888',
    fontSize: '15px',
  },

  // Banner
  banner: {
    background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    padding: '40px 60px',
    color: '#fff',
  },
  bannerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  bannerTitle: {
    fontSize: '36px',
    fontWeight: 'normal',
    margin: '0 0 8px',
  },
  bannerSubtitle: {
    fontSize: '15px',
    opacity: 0.9,
    margin: '0 0 15px',
  },
  bannerBadges: {
    display: 'flex',
    gap: '10px',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryAction: {
    backgroundColor: '#fff',
    color: '#00b4b4',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1.5px solid #fff',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Stats
  statsRow: {
    display: 'flex',
    gap: '20px',
    padding: '30px 60px 0',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
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
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: { fontSize: '28px' },
  statNum: { fontSize: '28px', fontWeight: 'bold', margin: 0 },
  statLbl: { color: '#888', fontSize: '13px', margin: 0 },

  // Progress Row
  progressRow: {
    display: 'flex',
    gap: '20px',
    padding: '20px 60px 0',
    flexWrap: 'wrap',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '15px 25px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
    flex: '1',
  },
  progressIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#888',
    margin: '0 0 4px',
  },
  progressValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },

  // Courses Section
  section: {
    padding: '30px 60px 60px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '26px',
    color: '#2c3e50',
    margin: 0,
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: '14px',
    marginTop: '5px',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#00b4b4',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  courseGrid: {
    display: 'flex',
    gap: '25px',
    flexWrap: 'wrap',
    marginBottom: '40px',
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    width: 'calc(33.333% - 17px)',
    minWidth: '280px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
    transition: 'transform 0.2s, box-shadow 0.2s',
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
    fontSize: '18px',
    color: '#2c3e50',
    margin: '0 0 14px',
    fontWeight: '700',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '8px',
  },
  metaIcon: {
    color: '#00b4b4',
    fontSize: '16px',
  },
  metaText: {
    color: '#888',
    fontSize: '13px',
  },
  enrollBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#00b4b4',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    marginTop: '16px',
    transition: 'background-color 0.2s',
  },
  enrolledBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#e0e0e0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    marginTop: '16px',
  },

  // Recent Activity
  recentActivity: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
    marginTop: '30px',
  },
  activityTitle: {
    fontSize: '18px',
    color: '#2c3e50',
    margin: '0 0 20px',
    fontWeight: '600',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    margin: '0 0 4px',
    fontSize: '14px',
    color: '#2c3e50',
  },
  activityTime: {
    margin: 0,
    fontSize: '12px',
    color: '#888',
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    transition: 'width 0.3s ease',
  },
};

// Add keyframes animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .course-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.1);
  }
  .primaryAction:hover {
    background-color: #f0f0f0;
  }
  .secondaryAction:hover {
    background-color: rgba(255,255,255,0.1);
  }
  .viewAllBtn:hover {
    background-color: #f0fafa;
  }
`;
document.head.appendChild(styleSheet);

export default StudentHome;