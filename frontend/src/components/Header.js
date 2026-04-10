import React, { useState } from 'react';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { getUserNotifications } from '../services/notificationService';

const Header = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    if (!user?.email || !token) return;

    const load = async () => {
      setLoadingNotifs(true);
      try {
        const data = await getUserNotifications(user.email, token);
        setNotifications(data || []);
      } catch (e) { 
        // keep silent; optional console.warn
      } finally { setLoadingNotifs(false); }
    };

    load();
  }, [user?.email, token]);

  const ordered = [...notifications].sort(
    (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
  );
  const dropdownNotifications = useMemo(
    () => ordered.slice(0, 5),
    [ordered]
  );
  const unreadCount = 0; // no "read" field in model yet

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based nav links
  const getNavLinks = () => {
    if (user?.role === 'student') {
      return (
        <>
          <Link to="/student-home" style={styles.navLink} className="nav-link-hover">Dashboard</Link>
          <Link to="/courses"      style={styles.navLink} className="nav-link-hover">Courses</Link>
          <Link to="/enrollments"  style={styles.navLink} className="nav-link-hover">Enrollments</Link>
        </>
      );
    }
    if (user?.role === 'instructor') {
      return (
        <>
          <Link to="/instructor-home" style={styles.navLink} className="nav-link-hover">Dashboard</Link>
          <Link to="/my-courses"      style={styles.navLink} className="nav-link-hover">My Courses</Link>
          <Link to="/students"        style={styles.navLink} className="nav-link-hover">Students</Link>
        </>
      );
    }
    return (
      <>
        <Link to="/"        style={styles.navLink} className="nav-link-hover">Home</Link>
        <Link to="/courses" style={styles.navLink} className="nav-link-hover">Courses</Link>
        <Link to="/careers" style={styles.navLink} className="nav-link-hover">Careers</Link>
      </>
    );
  };

  const getMobileNavLinks = () => {
    if (user?.role === 'student') {
      return (
        <>
          <Link to="/student-home" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/courses"      style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Courses</Link>
          <Link to="/enrollments"  style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Enrollments</Link>
        </>
      );
    }
    if (user?.role === 'instructor') {
      return (
        <>
          <Link to="/instructor-home" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/my-courses"      style={styles.mobileLink} onClick={() => setMenuOpen(false)}>My Courses</Link>
          <Link to="/students"        style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Students</Link>
        </>
      );
    }
    return (
      <>
        <Link to="/"        style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/courses" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Courses</Link>
        <Link to="/careers" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Careers</Link>
      </>
    );
  };

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes notifPop {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nav-link-hover:hover { color: #49BBBD !important; }
        .login-btn-hover:hover {
          background-color: #49BBBD !important;
          color: #fff !important;
        }
        .notif-btn:hover { background-color: #f0fafa !important; }
        .notif-item:hover { background-color: #f8fffe !important; }
        .mobile-menu-anim { animation: slideDown 0.25s ease forwards; }
        .notif-dropdown-anim { animation: notifPop 0.2s ease forwards; }
        @media (max-width: 768px) {
          .desktop-nav  { display: none !important; }
          .desktop-auth { display: none !important; }
          .mobile-btn   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-btn { display: none !important; }
        }
      `}</style>

      <header style={styles.header}>

        {/* LOGO */}
        <Link to="/" style={styles.logoLink}>
          <SchoolIcon style={styles.logoIcon} />
          <span style={styles.logoText}>EduNest</span>
        </Link>

        {/* DESKTOP NAV */}
        <nav style={styles.nav} className="desktop-nav">
          {getNavLinks()}
        </nav>

        {/* DESKTOP AUTH */}
        <div style={styles.authBtns} className="desktop-auth">
          {user ? (
            <>
              {/* NOTIFICATION BELL */}
              <div style={styles.notifWrap}>
                <button
                  style={styles.notifBtn}
                  className="notif-btn"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <NotificationsNoneIcon style={styles.notifIcon} />
                  {unreadCount > 0 && (
                    <span style={styles.notifBadge}>{unreadCount}</span>
                  )}
                </button>

                {/* NOTIFICATION DROPDOWN */}
                {notifOpen && (
                  <div style={styles.notifDropdown} className="notif-dropdown-anim">

                    {/* Header */}
                    <div style={styles.notifHeader}>
                      <span style={styles.notifTitle}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={styles.notifUnreadBadge}>{unreadCount} new</span>
                      )}
                    </div>

                    {/* List */}
                    <div style={styles.notifList}>
                      {loadingNotifs ? (
                        <div style={styles.notifItem}>Loading...</div>
                      ) : dropdownNotifications.length === 0 ? (
                        <div style={styles.notifItem}>No notifications</div>
                      ) : (
                        dropdownNotifications.map(n => (
                          <div key={n._id} style={styles.notifItem} className="notif-item">
                            <div style={styles.notifTextWrap}>
                              <p style={styles.notifText}>
                                {n.message || n.type || 'Notification'}
                              </p>
                              <p style={styles.notifTime}>
                                {new Date(n.sentAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div style={styles.notifFooter}>
                      <button style={styles.notifViewAll} onClick={() => {
                        setNotifOpen(false);
                        navigate('/notifications');
                      }}>
                        View all notifications
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* PROFILE */}
              <Link to="/profile" style={styles.profileLink}>
                <PersonOutlineIcon style={styles.profileIcon} />
                <span>{user.name}</span>
              </Link>

              {/* LOGOUT */}
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogoutIcon style={styles.btnIcon} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  style={styles.loginBtn}  className="login-btn-hover">Login</Link>
              <Link to="/signup" style={styles.signupBtn}>Sign Up</Link>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          style={styles.menuBtn}
          className="mobile-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen
            ? <CloseIcon style={{ color: '#2c3e50' }} />
            : <MenuIcon  style={{ color: '#2c3e50' }} />
          }
        </button>

        {/* MOBILE DROPDOWN */}
        {menuOpen && (
          <div style={styles.mobileMenu} className="mobile-menu-anim">
            {getMobileNavLinks()}
            {user ? (
              <>
                <Link to="/profile" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <div style={styles.mobileNotifRow}>
                  <NotificationsNoneIcon style={{ color: '#49BBBD', fontSize: '20px' }} />
                  <span style={{ color: '#555', fontSize: '15px' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={styles.mobileNotifBadge}>{unreadCount}</span>
                  )}
                </div>
                <button onClick={handleLogout} style={styles.mobileLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"  style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/signup" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}

      </header>
    </>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 60px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexWrap: 'wrap',
    gap: '10px',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  logoIcon: { color: '#49BBBD', fontSize: '28px' },
  logoText: { fontSize: '22px', fontWeight: 'bold', color: '#2c3e50' },

  nav: { display: 'flex', gap: '30px' },
  navLink: {
    textDecoration: 'none',
    color: '#555',
    fontSize: '14px',
    transition: 'color 0.2s',
  },

  authBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  // NOTIFICATION
  notifWrap: {
    position: 'relative',
  },
  notifBtn: {
    position: 'relative',
    background: 'none',
    border: '1.5px solid #e0e0e0',
    borderRadius: '50%',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  notifIcon: { color: '#555', fontSize: '20px' },
  notifBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
  },
  notifDropdown: {
    position: 'absolute',
    top: '48px',
    right: '0',
    backgroundColor: '#fff',
    borderRadius: '14px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.13)',
    width: '320px',
    zIndex: 200,
    overflow: 'hidden',
    border: '1px solid #f0f0f0',
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #f0f0f0',
  },
  notifTitle: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '15px',
  },
  notifUnreadBadge: {
    backgroundColor: '#e8fafa',
    color: '#49BBBD',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  notifList: {
    maxHeight: '260px',
    overflowY: 'auto',
  },
  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 18px',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  notifDotWrap: {
    paddingTop: '4px',
    flexShrink: 0,
  },
  notifDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  notifTextWrap: { flex: 1 },
  notifText: {
    fontSize: '13px',
    color: '#2c3e50',
    margin: 0,
    marginBottom: '4px',
    lineHeight: '1.4',
  },
  notifTime: {
    fontSize: '11px',
    color: '#aaa',
    margin: 0,
  },
  notifFooter: {
    padding: '10px 18px',
    textAlign: 'center',
    borderTop: '1px solid #f0f0f0',
  },
  notifViewAll: {
    background: 'none',
    border: 'none',
    color: '#49BBBD',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  // AUTH
  loginBtn: {
    textDecoration: 'none',
    color: '#49BBBD',
    border: '1.5px solid #49BBBD',
    padding: '7px 22px',
    borderRadius: '20px',
    fontSize: '14px',
    transition: 'all 0.25s ease',
  },
  signupBtn: {
    textDecoration: 'none',
    backgroundColor: '#49BBBD',
    color: '#fff',
    padding: '7px 22px',
    borderRadius: '20px',
    fontSize: '14px',
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
    color: '#2c3e50',
    fontSize: '14px',
    border: '1.5px solid #e0e0e0',
    padding: '6px 16px',
    borderRadius: '20px',
  },
  profileIcon: { fontSize: '18px', color: '#49BBBD' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    padding: '7px 18px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnIcon: { fontSize: '16px' },

  // MOBILE
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    display: 'none',
  },
  mobileMenu: {
    position: 'absolute',
    top: '65px',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: '20px 30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 99,
  },
  mobileLink: {
    textDecoration: 'none',
    color: '#555',
    fontSize: '15px',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  mobileNotifRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
  },
  mobileNotifBadge: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '2px 7px',
    borderRadius: '20px',
  },
  mobileLogout: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
    marginTop: '6px',
  },
};

export default Header;