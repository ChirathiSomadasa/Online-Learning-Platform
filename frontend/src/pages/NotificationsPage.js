import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications } from '../services/notificationService';

const NotificationsPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || !token) {
      navigate('/login');
      return;
    }

    const load = async () => {
      try {
        const data = await getUserNotifications(user.email, token);
        setNotifications(data || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.email, token, navigate]);

  return (
    <>
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>All Notifications</h2>

          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : notifications.length === 0 ? (
            <p style={styles.muted}>No notifications</p>
          ) : (
            <div style={styles.list}>
              {notifications.map(n => (
                <div key={n._id} style={styles.item}>
                  <p style={styles.text}>{n.message || n.type || 'Notification'}</p>
                  <p style={styles.time}>{new Date(n.sentAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    minHeight: '85vh',
    backgroundColor: '#f5f6fa',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: '700px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  title: { margin: '0 0 18px', color: '#2c3e50' },
  muted: { color: '#888' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  item: {
    border: '1px solid #f0f0f0',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  text: { margin: 0, color: '#2c3e50', fontSize: '14px' },
  time: { margin: '6px 0 0', color: '#aaa', fontSize: '12px' },
};

export default NotificationsPage;