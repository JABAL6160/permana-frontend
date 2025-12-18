// ProtectedRoute.jsx - Complete Role-Based Access Control
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, X, Shield, User, Eye } from 'lucide-react';
import './ProtectedRoute.css';

// Define access rules for each route
const ROUTE_ACCESS = {
  '/map': ['guest', 'staff', 'admin'],
  '/cuaca': ['guest', 'staff', 'admin'],
  '/data': ['staff', 'admin'],  // Guest tidak bisa akses
  '/admin': ['admin']            // Hanya admin
};

export default function ProtectedRoute({ children, requireRole, routePath }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    
    if (!userData) {
      // Belum login
      setModalType('login');
      setShowModal(true);
      return;
    }

    const user = JSON.parse(userData);
    const role = user.role || 'guest';
    setUserRole(role);

    // Check route-based access
    if (routePath && ROUTE_ACCESS[routePath]) {
      const allowedRoles = ROUTE_ACCESS[routePath];
      if (!allowedRoles.includes(role)) {
        setModalType('forbidden');
        setShowModal(true);
        return;
      }
    }

    // Check specific role requirement
    if (requireRole) {
      const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
      if (!allowedRoles.includes(role)) {
        setModalType('forbidden');
        setShowModal(true);
        return;
      }
    }

    setIsAuthenticated(true);
  }, [requireRole, routePath]);

  const handleLoginRequest = () => {
    sessionStorage.setItem('openSidebar', 'true');
    setShowModal(false);
    navigate('/');
  };

  const handleClose = () => {
    setShowModal(false);
    navigate('/');
  };

  if (isAuthenticated) {
    return children;
  }

  const LoginModal = () => (
    <div className="protected-overlay">
      <div className="protected-modal">
        <button className="modal-close" onClick={handleClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="modal-icon">
          <ShieldAlert size={64} />
        </div>

        <div className="modal-content">
          <h2>Akses Dibatasi</h2>
          <p className="modal-message">
            Anda belum melakukan Login. Silakan lakukan klik Login agar 
            sistem dapat menentukan privilege user.
          </p>

          <div className="modal-info">
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <p>Login diperlukan untuk mengakses halaman ini</p>
            </div>
            <div className="info-item">
              <span className="info-icon">👤</span>
              <p>Klik tombol Login di sidebar Dashboard untuk memilih privilege</p>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-login-primary" onClick={handleLoginRequest}>
              <LogIn size={20} />
              <span>Login</span>
            </button>
            
            <button className="btn-cancel" onClick={handleClose}>
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ForbiddenModal = () => {
    const roleInfo = {
      guest: { icon: <Eye size={48} />, name: 'Guest', color: '#6c757d' },
      staff: { icon: <User size={48} />, name: 'Staff', color: '#007bff' },
      admin: { icon: <Shield size={48} />, name: 'Admin', color: '#28a745' }
    };

    const currentRole = roleInfo[userRole] || roleInfo.guest;
    
    let requiredRoleNames = '';
    if (routePath && ROUTE_ACCESS[routePath]) {
      requiredRoleNames = ROUTE_ACCESS[routePath]
        .map(r => roleInfo[r]?.name || r)
        .join(' atau ');
    } else if (requireRole) {
      const requiredRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
      requiredRoleNames = requiredRoles.map(r => roleInfo[r]?.name || r).join(' atau ');
    }

    return (
      <div className="protected-overlay">
        <div className="protected-modal forbidden-modal">
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <X size={24} />
          </button>

          <div className="modal-icon" style={{ color: '#dc3545' }}>
            <ShieldAlert size={64} />
          </div>

          <div className="modal-content">
            <h2>Akses Ditolak</h2>
            <p className="modal-message">
              Anda tidak memiliki privilege yang cukup untuk mengakses halaman ini.
            </p>

            <div className="role-comparison">
              <div className="current-role">
                <div className="role-card" style={{ borderColor: currentRole.color }}>
                  <div className="role-icon" style={{ color: currentRole.color }}>
                    {currentRole.icon}
                  </div>
                  <h3>Role Anda:</h3>
                  <p style={{ color: currentRole.color, fontWeight: 'bold' }}>
                    {currentRole.name}
                  </p>
                </div>
              </div>

              <div className="arrow-separator">
                <span style={{ fontSize: '2rem', color: '#dc3545' }}>❌</span>
              </div>

              <div className="required-role">
                <div className="role-card" style={{ borderColor: '#ffc107' }}>
                  <div className="role-icon" style={{ color: '#ffc107' }}>
                    <Shield size={48} />
                  </div>
                  <h3>Diperlukan:</h3>
                  <p style={{ color: '#ffc107', fontWeight: 'bold' }}>
                    {requiredRoleNames}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-info" style={{ marginTop: '20px' }}>
              <div className="info-item">
                <span className="info-icon">ℹ️</span>
                <p>Hubungi administrator untuk upgrade privilege Anda</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleClose}>
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {showModal && (modalType === 'login' ? <LoginModal /> : <ForbiddenModal />)}
    </>
  );
}