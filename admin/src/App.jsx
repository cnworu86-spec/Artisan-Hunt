import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Briefcase, 
  Star, 
  AlertOctagon, 
  LogOut, 
  Settings, 
  Search, 
  Bell, 
  Clock, 
  Tag, 
  BarChart3, 
  FileText, 
  UserCheck, 
  Activity 
} from 'lucide-react';
import './App.css';
import api from './api';
import DashboardOverview from './pages/DashboardOverview';
import UsersList from './pages/UsersList';
import ApprovalsQueue from './pages/ApprovalsQueue';
import BookingsCenter from './pages/BookingsCenter';
import ReviewsModeration from './pages/ReviewsModeration';
import Reports from './pages/Reports';
import ServiceCategories from './pages/ServiceCategories';
import AnalyticsHub from './pages/AnalyticsHub';
import ActivityLogs from './pages/ActivityLogs';
import AdminManagement from './pages/AdminManagement';
import SettingsPage from './pages/SettingsPage';
import AdminLogin from './pages/AdminLogin';
import GlobalSearchModal from './components/GlobalSearchModal';
import appIcon from './assets/app-icon.png';
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('adminToken'));
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminData')) || { firstName: 'Admin', email: 'admin@artisanhunt.com' };
    } catch {
      return { firstName: 'Admin', email: 'admin@artisanhunt.com' };
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Notifications
  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/admin/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => setNotifications([]));
  }, [isLoggedIn, activeTab]);

  // Session Inactivity Auto-logout (30 mins)
  useEffect(() => {
    if (!isLoggedIn) return;
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        alert('Session expired due to inactivity. Logging out...');
        handleLogout();
      }, 30 * 60 * 1000); // 30 minutes
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [isLoggedIn]);

  function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => {
      setIsLoggedIn(true);
      setAdminUser(JSON.parse(localStorage.getItem('adminData')) || { firstName: 'Admin' });
    }} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Control Center', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'User Directory', icon: <Users size={18} /> },
    { id: 'approvals', label: 'Verification Queue', icon: <ShieldCheck size={18} /> },
    { id: 'bookings', label: 'Jobs & Bookings', icon: <Briefcase size={18} /> },
    { id: 'reports', label: 'Safety Reports', icon: <AlertOctagon size={18} /> },
    { id: 'reviews', label: 'Ratings & Reviews', icon: <Star size={18} /> },
    { id: 'categories', label: 'Service Categories', icon: <Tag size={18} /> },
    { id: 'analytics', label: 'Analytics Hub', icon: <BarChart3 size={18} /> },
    { id: 'logs', label: 'Activity Audit Logs', icon: <FileText size={18} /> },
    { id: 'admins', label: 'Administrators', icon: <UserCheck size={18} /> },
    { id: 'settings', label: 'Platform Settings', icon: <Settings size={18} /> },
  ];

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardOverview onNavigate={setActiveTab} />;
      case 'users': return <UsersList />;
      case 'approvals': return <ApprovalsQueue />;
      case 'bookings': return <BookingsCenter />;
      case 'reports': return <Reports />;
      case 'reviews': return <ReviewsModeration />;
      case 'categories': return <ServiceCategories />;
      case 'analytics': return <AnalyticsHub />;
      case 'logs': return <ActivityLogs />;
      case 'admins': return <AdminManagement />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={appIcon} alt="App Logo" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logo-text">Artisan Hunt</span>
            <span className="logo-subtext">Admin Control Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-sm">{adminUser.firstName?.[0] || 'A'}</div>
            <div className="user-details">
              <span className="user-name">{adminUser.firstName || 'Administrator'}</span>
              <span className="user-role">Super Admin</span>
            </div>
          </div>
          <button className="nav-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content-layout">
        {/* Top Header Navigation */}
        <header className="top-header-bar">
          <div className="header-search-trigger" onClick={() => setIsSearchOpen(true)}>
            <Search size={16} color="#38BDF8" />
            <span>Search users, bookings, reports, ID... (Ctrl + K)</span>
          </div>

          <div className="header-right-meta">
            <div className="time-display">
              <Clock size={15} color="#C5A059" />
              <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString()}</span>
            </div>

            <div className="notification-wrapper">
              <button 
                className="notification-bell" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} color="#F8FAFC" />
                {notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
              </button>

              {showNotifications && (
                <div className="notification-popover animate-fade-in">
                  <div className="popover-header">
                    <h4>Notifications & Alerts</h4>
                    <span className="popover-count">{notifications.length} Unread</span>
                  </div>
                  <div className="popover-body">
                    {notifications.length === 0 ? (
                      <div className="popover-empty">No unread alerts at this time.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="notif-item">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-msg">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="header-admin-pill">
              <div className="h-avatar">{adminUser.firstName?.[0] || 'A'}</div>
              <span>{adminUser.firstName || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className="page-body-content">
          {renderPage()}
        </div>
      </main>

      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelectResult={(type, item) => {
          if (type === 'users') setActiveTab('users');
          if (type === 'bookings') setActiveTab('bookings');
          if (type === 'reports') setActiveTab('reports');
        }}
      />
    </div>
  );
}

export default App;
