import React from 'react';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.content}>

        <div style={styles.section}>
          <h3 style={styles.title}>
            <SchoolIcon style={styles.titleIcon} />
            Online Learning Platform
          </h3>
          <p style={styles.text}>Empowering learners through quality education.</p>
        </div>

        <div style={styles.section}>
          <h4 style={styles.subtitle}>Quick Links</h4>
          <p style={styles.text}>Home</p>
          <p style={styles.text}>Courses</p>
          <p style={styles.text}>About</p>
        </div>

        <div style={styles.section}>
          <h4 style={styles.subtitle}>Contact</h4>
          <p style={styles.text}>
            <EmailIcon style={styles.contactIcon} /> info@edunest.com
          </p>
        </div>

      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '40px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  section: { minWidth: '150px' },
  title: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  titleIcon: { color: '#00b4b4', fontSize: '22px' },
  subtitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#00b4b4',
  },
  text: {
    fontSize: '14px',
    color: '#bdc3c7',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  contactIcon: { fontSize: '16px', color: '#00b4b4' },
};

export default Footer;