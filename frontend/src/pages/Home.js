import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import women from '../images/auth/women.png';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const Home = () => {

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float {
        0%   { transform: translateY(0px); }
        50%  { transform: translateY(-14px); }
        100% { transform: translateY(0px); }
      }
      @keyframes fadeInLeft {
        from { opacity: 0; transform: translateX(-60px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeInRight {
        from { opacity: 0; transform: translateX(60px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(40px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.85); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes countUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%   { box-shadow: 0 0 0 0 rgba(73,187,189,0.4); }
        70%  { box-shadow: 0 0 0 10px rgba(73,187,189,0); }
        100% { box-shadow: 0 0 0 0 rgba(73,187,189,0); }
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-80px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(80px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      /* HERO */
      .hero-text-anim {
        animation: fadeInLeft 0.9s ease forwards;
      }
      .hero-image-anim {
        animation: fadeInRight 0.9s ease forwards, float 4s ease-in-out 1.5s infinite;
      }

      /* STATS */
      .stats-title-anim {
        animation: fadeInUp 0.7s ease forwards;
      }
      .stat-item-anim {
        animation: countUp 0.6s ease forwards;
        opacity: 0;
      }
      .stat-item-anim:nth-child(1) { animation-delay: 0.1s; }
      .stat-item-anim:nth-child(2) { animation-delay: 0.2s; }
      .stat-item-anim:nth-child(3) { animation-delay: 0.3s; }
      .stat-item-anim:nth-child(4) { animation-delay: 0.4s; }
      .stat-item-anim:nth-child(5) { animation-delay: 0.5s; }

      /* FEATURES */
      .features-title-anim {
        animation: fadeIn 0.8s ease forwards;
      }
      .feature-card-anim {
        animation: scaleIn 0.6s ease forwards;
        opacity: 0;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .feature-card-anim:nth-child(1) { animation-delay: 0.1s; }
      .feature-card-anim:nth-child(2) { animation-delay: 0.25s; }
      .feature-card-anim:nth-child(3) { animation-delay: 0.4s; }
      .feature-card-anim:hover {
        transform: translateY(-8px) !important;
        box-shadow: 0 12px 30px rgba(73,187,189,0.2) !important;
      }

      /* ABOUT */
      .about-title-anim {
        animation: fadeInUp 0.7s ease forwards;
      }
      .about-text-anim {
        animation: fadeInUp 0.7s ease 0.2s forwards;
        opacity: 0;
      }
      .role-card-left-anim {
        animation: slideInLeft 0.7s ease 0.3s forwards;
        opacity: 0;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .role-card-right-anim {
        animation: slideInRight 0.7s ease 0.3s forwards;
        opacity: 0;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .role-card-left-anim:hover,
      .role-card-right-anim:hover {
        transform: translateY(-6px) scale(1.03) !important;
        box-shadow: 0 14px 35px rgba(0,0,0,0.15) !important;
      }

      /* JOIN BUTTON PULSE */
      .join-btn-pulse {
        animation: pulse 2s infinite;
      }

      /* PLAY BUTTON HOVER */
      .play-btn-hover {
        transition: transform 0.2s ease;
      }
      .play-btn-hover:hover {
        transform: scale(1.1);
      }

      /* FEATURE ICON SPIN ON HOVER */
      .feature-icon-wrap {
        transition: background-color 0.3s ease;
      }
      .feature-card-anim:hover .feature-icon-wrap {
        background-color: #49BBBD !important;
      }
      .feature-card-anim:hover .feature-icon-wrap svg {
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={styles.page}>

      {/* HERO SECTION */}
      <section style={styles.hero}>

        {/* LEFT TEXT */}
        <div style={styles.heroLeft} className="hero-text-anim">
          <h1 style={styles.heroTitle}>
            <span style={styles.highlight}>Studying</span> Online is now<br />
            much easier
          </h1>
          <p style={styles.heroText}>
            OLP is an interesting platform that will teach
            you in a more interactive way.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/signup" style={styles.joinBtn} className="join-btn-pulse">
              Join for free
            </Link>
            <button style={styles.watchBtn}>
              <span style={styles.playIcon} className="play-btn-hover">
                <PlayArrowIcon style={{ fontSize: '20px', color: '#49BBBD' }} />
              </span>
              Watch how it works
            </button>
          </div>
        </div>

        {/* RIGHT — WOMEN IMAGE */}
        <div style={styles.heroRight}>
          <img src={women} alt="Student" style={styles.heroImage} className="hero-image-anim" />
        </div>

      </section>

      {/* SUCCESS STATS */}
      <section style={styles.stats}>
        <h2 style={styles.statsTitle} className="stats-title-anim">Our Success</h2>
        <p style={styles.statsSubtitle} className="stats-title-anim">
          We have been providing quality education and helping
          students achieve their goals through interactive learning.
        </p>
        <div style={styles.statsGrid}>
          {[
            { num: '15K+', lbl: 'Students' },
            { num: '75%',  lbl: 'Total success' },
            { num: '35',   lbl: 'Main questions' },
            { num: '26',   lbl: 'Chief experts' },
            { num: '16',   lbl: 'Years of experience' },
          ].map((s, i) => (
            <div key={i} style={styles.statItem} className="stat-item-anim">
              <h3 style={styles.statNumber}>{s.num}</h3>
              <p style={styles.statLabel}>{s.lbl}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={styles.features}>
        <p style={styles.featureTag} className="features-title-anim">
          All-In-One <span style={styles.teal}>Cloud Software.</span>
        </p>
        <p style={styles.featureSubtitle} className="features-title-anim">
          OLP is one powerful online software suite that combines all the tools
          needed to run a successful school or office.
        </p>
        <div style={styles.featureGrid}>

          <div style={styles.featureCard} className="feature-card-anim">
            <div style={styles.featureIconWrap} className="feature-icon-wrap">
              <ReceiptLongIcon style={styles.featureIcon} />
            </div>
            <h3 style={styles.featureTitle}>Online Billing, Invoicing, & Contracts</h3>
            <p style={styles.featureText}>
              Simple and secure control of your organization's financial and legal transactions.
            </p>
          </div>

          <div style={styles.featureCard} className="feature-card-anim">
            <div style={styles.featureIconWrap} className="feature-icon-wrap">
              <CalendarMonthIcon style={styles.featureIcon} />
            </div>
            <h3 style={styles.featureTitle}>Easy Scheduling & Attendance Tracking</h3>
            <p style={styles.featureText}>
              Schedule and reserve classrooms at one campus or multiple campuses with ease.
            </p>
          </div>

          <div style={styles.featureCard} className="feature-card-anim">
            <div style={styles.featureIconWrap} className="feature-icon-wrap">
              <TrackChangesIcon style={styles.featureIcon} />
            </div>
            <h3 style={styles.featureTitle}>Customer Tracking</h3>
            <p style={styles.featureText}>
              Automate and track emails to individuals or groups with our built-in system.
            </p>
          </div>

        </div>
      </section>

      {/* WHAT IS OLP */}
      <section style={styles.about}>
        <h2 style={styles.aboutTitle} className="about-title-anim">
          What is <span style={styles.teal}>OLP?</span>
        </h2>
        <p style={styles.aboutText} className="about-text-anim">
          OLP is a platform that allows educators to create online classes whereby they can
          store the course materials online, manage assignments, quizzes and exams, monitor
          due dates, grade results and provide students with feedback all in one place.
        </p>
        <div style={styles.roleGrid}>
          <div style={styles.roleCard} className="role-card-left-anim">
            <div style={styles.roleOverlay}>
              <h3 style={styles.roleTitle}>FOR INSTRUCTORS</h3>
              <Link to="/signup" style={styles.roleBtn}>Start a class today</Link>
            </div>
          </div>
          <div style={styles.roleCard2} className="role-card-right-anim">
            <div style={styles.roleOverlay}>
              <h3 style={styles.roleTitle}>FOR STUDENTS</h3>
              <Link to="/signup" style={styles.roleBtn}>Enter access code</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

const styles = {
  page: { fontFamily: 'Segoe UI, sans-serif', margin: 0, padding: 0 },

  // HERO
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '70px 80px 0',
    backgroundColor: '#49BBBD',
    borderBottomLeftRadius: '150px',
    borderBottomRightRadius: '150px',
    minHeight: '540px',
    overflow: 'hidden',
    position: 'relative',
  },
  heroLeft: {
    maxWidth: '460px',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: '46px',
    fontWeight: 'bold',
    color: '#1a2e44',
    lineHeight: '1.25',
    marginBottom: '18px',
  },
  highlight: { color: '#ffffff' },
  heroText: {
    color: '#1a2e44',
    fontSize: '15px',
    marginBottom: '38px',
    lineHeight: '1.7',
    opacity: 0.85,
  },
  heroBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },
  joinBtn: {
    backgroundColor: '#49BBBD',
    color: '#fff',
    padding: '14px 32px',
    borderRadius: '30px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 'bold',
    border: '2px solid #fff',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    display: 'inline-block',
  },
  watchBtn: {
    background: 'none',
    border: 'none',
    color: '#1a2e44',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  playIcon: {
    backgroundColor: '#fff',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    flexShrink: 0,
    cursor: 'pointer',
  },

  // HERO RIGHT
  heroRight: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flex: 1,
    height: '540px',
    paddingBottom: '0',
  },
  heroImage: {
    height: '640px',
    objectFit: 'contain',
    position: 'relative',
    zIndex: 1,
    marginBottom: '-60px',
  },

  // STATS
  stats: {
    padding: '80px 60px',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  statsTitle: {
    fontSize: '32px',
    color: '#2c3e50',
    marginBottom: '15px',
    fontWeight: 'bold',
  },
  statsSubtitle: {
    color: '#888',
    fontSize: '14px',
    maxWidth: '520px',
    margin: '0 auto 55px',
    lineHeight: '1.7',
  },
  statsGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '60px',
    flexWrap: 'wrap',
  },
  statItem: { textAlign: 'center' },
  statNumber: {
    fontSize: '38px',
    fontWeight: 'bold',
    color: '#49BBBD',
    margin: 0,
  },
  statLabel: {
    color: '#888',
    fontSize: '14px',
    marginTop: '6px',
  },

  // FEATURES
  features: {
    padding: '70px 60px',
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  featureTag: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '12px',
  },
  teal: { color: '#49BBBD' },
  featureSubtitle: {
    color: '#888',
    maxWidth: '500px',
    margin: '0 auto 50px',
    lineHeight: '1.7',
    fontSize: '14px',
  },
  featureGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap',
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: '40px 30px',
    borderRadius: '12px',
    width: '240px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
    textAlign: 'center',
  },
  featureIconWrap: {
    backgroundColor: '#e8fafa',
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    transition: 'background-color 0.3s ease',
  },
  featureIcon: {
    color: '#49BBBD',
    fontSize: '32px',
  },
  featureTitle: {
    fontSize: '16px',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  featureText: {
    fontSize: '13px',
    color: '#999',
    lineHeight: '1.7',
  },

  // ABOUT
  about: {
    padding: '70px 60px',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  aboutTitle: {
    fontSize: '30px',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  aboutText: {
    color: '#888',
    maxWidth: '600px',
    margin: '0 auto 50px',
    lineHeight: '1.8',
    fontSize: '14px',
  },
  roleGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap',
  },
  roleCard: {
    width: '280px',
    height: '180px',
    borderRadius: '12px',
    backgroundImage: 'linear-gradient(135deg, #49BBBD, #007a7a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  roleCard2: {
    width: '280px',
    height: '180px',
    borderRadius: '12px',
    backgroundImage: 'linear-gradient(135deg, #f39c12, #e67e22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  roleOverlay: { textAlign: 'center' },
  roleTitle: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  roleBtn: {
    backgroundColor: '#fff',
    color: '#2c3e50',
    padding: '8px 20px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 'bold',
  },
};

export default Home;