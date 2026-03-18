import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import StudentHome from './pages/StudentHome';
import InstructorHome from './pages/InstructorHome';
import NotificationsPage from './pages/NotificationsPage';

// Layout WITH header and footer
const WithLayout = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* NO header/footer */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* WITH header and footer */}
          <Route path="/" element={<WithLayout><Home /></WithLayout>} />
          <Route path="/profile" element={<WithLayout><Profile /></WithLayout>} />
          <Route path="/student-home" element={<WithLayout><StudentHome /></WithLayout>} />
          <Route path="/instructor-home" element={<WithLayout><InstructorHome /></WithLayout>} />
          <Route path="/notifications" element={<WithLayout><NotificationsPage /></WithLayout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;