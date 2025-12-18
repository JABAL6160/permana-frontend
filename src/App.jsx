import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Map, 
  Database, 
  Sun, 
  Moon, 
  CloudSunIcon,
  Menu,
  X,
  LogIn,
  Home,
  Shield,
  Eye,
  LogOut,
  Settings,
  User
} from "lucide-react";
import "./App.css";
import "./AppSidebar.css";

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Cek theme tersimpan
    const savedTheme = sessionStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }

    // Cek user login
    const userData = sessionStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Cek apakah perlu membuka sidebar otomatis
    const shouldOpenSidebar = sessionStorage.getItem('openSidebar');
    if (shouldOpenSidebar === 'true') {
      setSidebarOpen(true);
      sessionStorage.removeItem('openSidebar');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    sessionStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    setSidebarOpen(false);
  };

  const features = [
    {
      title: "Peta GIS",
      desc: "Lihat dan tinjau persebaran tiang jaringan milik Permana secara interaktif.",
      icon: <Map className="icon" />,
      link: "/map",
      color: "blue",
    },
    {
      title: "Data Tiang",
      desc: "Kelola dan pantau data persebaran tiang fiber optik Permana di Nusantara.",
      icon: <Database className="icon" />,
      link: "/data",
      color: "cyan",
    },
    {
      title: "Cuaca",
      desc: "Lihat dan awasi kondisi cuaca. Pastikan keselamatan anda sebelum bekerja.",
      icon: <CloudSunIcon className="icon" />,
      link: "/cuaca",
      color: "yellow",
    },
  ];

  // ✅ MENU ITEMS DENGAN MENU ADMIN DI TENGAH
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Peta GIS', path: '/map', icon: Map },
    // Menu khusus admin di tengah
    ...(user?.role === 'admin' ? [
      { name: 'Administrator Panel', path: '/admin', icon: Settings, isAdmin: true }
    ] : []),
    { name: 'Data Tiang', path: '/data', icon: Database },
    { name: 'Cuaca', path: '/cuaca', icon: CloudSunIcon }
  ];

  return (
    <div className={`dashboard-root ${isDark ? 'dark' : 'light'}`}>
      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Map size={28} />
            </div>
            <div className="sidebar-title">
              <h2>Permana GIS</h2>
              <p>Geographic Info</p>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="sidebar-user">
              <div className={`user-avatar ${
                user.role === 'admin' ? 'admin' : 
                user.role === 'staff' ? 'staff' : 'guest'
              }`}>
                {user.role === 'admin' ? <Shield size={24} /> : 
                 user.role === 'staff' ? <User size={24} /> : <Eye size={24} />}
              </div>
              <div className="user-info">
                <p className="user-name">{user.username || 'Guest User'}</p>
                <span className={`user-badge ${
                  user.role === 'admin' ? 'admin' : 
                  user.role === 'staff' ? 'staff' : 'guest'
                }`}>
                  {user.role === 'admin' ? '👑 Admin' : 
                   user.role === 'staff' ? '👤 Staff' : '👁️ Guest'}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <ul>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link 
                      to={item.path} 
                      className={`nav-link ${item.isAdmin ? 'admin-link' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                      {item.isAdmin && <span className="admin-badge">ADMIN</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Login/Logout Button */}
          <div className="sidebar-footer">
            {user ? (
              <button className="sidebar-btn logout" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            ) : (
              <Link 
                to="/Login" 
                className="sidebar-btn login"
                onClick={() => setSidebarOpen(false)}
              >
                <LogIn size={20} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Theme Toggle Button */}
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {isDark ? <Sun className="toggle-icon" /> : <Moon className="toggle-icon" />}
      </button>
      
      {/* Main Content */}
      <header className="dashboard-header">
        <h1>Permana GIS Dashboard</h1>
        <p>Kelola semua fitur sistem GIS dalam satu tempat</p>
      </header>

      <main className="dashboard-grid">
        {/* Card 1: Peta GIS */}
        <Link to="/map" className="feature-card blue">
          <div className="feature-icon">
            <Map className="icon" />
          </div>
          <h2>Peta GIS</h2>
          <p>Lihat dan tinjau persebaran tiang jaringan milik Permana secara interaktif.</p>
        </Link>

        {/* Card 2: Data Tiang */}
        <Link to="/data" className="feature-card cyan">
          <div className="feature-icon">
            <Database className="icon" />
          </div>
          <h2>Data Tiang</h2>
          <p>Kelola dan pantau data persebaran tiang fiber optik Permana di Nusantara.</p>
        </Link>

        {/* Card 3: Cuaca */}
        <Link to="/cuaca" className="feature-card yellow">
          <div className="feature-icon">
            <CloudSunIcon className="icon" />
          </div>
          <h2>Cuaca</h2>
          <p>Lihat dan awasi kondisi cuaca. Pastikan keselamatan anda sebelum bekerja.</p>
        </Link>

        
        {/* ✅ CARD ADMINISTRATOR PANEL (di tengah, hanya untuk admin) */}
        {user?.role === 'admin' && (
          <Link to="/admin" className="feature-card purple">
            <div className="feature-icon">
              <Settings className="icon" />
            </div>
            <h2>Administrator Panel</h2>
            <p>Kelola user, approve pendaftaran, dan administrasi sistem.</p>
          </Link>
        )}
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 Permana GIS by Jabal Akbar</p>
      </footer>
    </div>
  );
}