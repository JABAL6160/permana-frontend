// src/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Mail, Calendar, 
  FileText, Menu, X, Home, Database, Shield,
  CheckCircle, XCircle, Clock, Trash2,
  MapIcon, Activity, LogIn, Edit, Plus,
  Trash, Eye, RefreshCw
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalUsers: 0
  });

  useEffect(() => {
    // Check if user is admin
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      alert('⚠️ Halaman ini hanya untuk Admin!');
      navigate('/');
      return;
    }
    setUser(parsedUser);
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [pendingRes, staffRes] = await Promise.all([
        fetch('http://localhost:5000/api/staff/pending'),
        fetch('http://localhost:5000/api/admin/users')
      ]);
      
      console.log('Pending Response Status:', pendingRes.status);
      console.log('Staff Response Status:', staffRes.status);
      
      const pendingData = await pendingRes.json();
      const staffData = await staffRes.json();
      
      setStats({
        totalPending: pendingData?.length || 0,
        totalApproved: staffData?.length || 0,
        totalRejected: 0,
        totalUsers: staffData?.length || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <Shield size={32} />
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home size={20} />
            <span>Overview</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={20} />
            <span>Pending Staff</span>
            {stats.totalPending > 0 && (
              <span className="badge">{stats.totalPending}</span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            <span>Manage Staff</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Activity size={20} />
            <span>Activity Logs</span>
          </button>

          <button 
            className="nav-item"
            onClick={() => navigate('/map')}
          >
            <MapIcon size={20} />
            <span>Back to Map</span>
          </button>
              
          <button 
            className="nav-item"
            onClick={() => navigate('/data')}
          >
            <Database size={20} />
            <span>Data Tiang</span>
          </button>

          <button 
            className="nav-item dashboard-btn"
            onClick={() => navigate('/')}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <Shield size={24} />
            <div>
              <strong>{user.username}</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1>Admin Dashboard</h1>
        </header>

        <div className="admin-content">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'pending' && <PendingStaffTab user={user} onUpdate={loadStats} />}
          {activeTab === 'users' && <ManageStaffTab user={user} onUpdate={loadStats} />}
          {activeTab === 'logs' && <ActivityLogsTab />}
        </div>
      </main>
    </div>
  );
};

// ============================================
// OVERVIEW TAB
// ============================================
const OverviewTab = ({ stats }) => {
  return (
    <div className="overview-tab">
      <h2>Dashboard Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={32} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalPending}</h3>
            <p>Pending Staff Approvals</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">
            <UserCheck size={32} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalApproved}</h3>
            <p>Approved Staff</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">
            <UserX size={32} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalRejected}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Active Staff</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>📋 Admin Responsibilities</h3>
        <ul>
          <li>✅ Review and approve/reject new staff registrations</li>
          <li>👥 Manage existing staff and their permissions</li>
          <li>🔒 Maintain system security and access control</li>
          <li>📊 Monitor system usage and activity</li>
        </ul>
      </div>
    </div>
  );
};

// ============================================
// PENDING STAFF TAB
// ============================================
const PendingStaffTab = ({ user, onUpdate }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/staff/pending');
      console.log('Load Registrations Response Status:', res.status);
      const data = await res.json();
      console.log('Registrations Data:', data);
      setRegistrations(data || []);
    } catch (err) {
      console.error('Error loading registrations:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui pendaftaran staff ini?')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/staff/${id}/approve`, {
        method: 'POST',
        headers: {
          'X-User-Username': user.username,
          'X-User-Id': user.id,
          'X-User-Role': user.role
        }
      });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ Pendaftaran staff berhasil disetujui!');
        loadRegistrations();
        onUpdate();
      } else {
        alert('❌ Gagal menyetujui pendaftaran: ' + data.error);
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('❌ Terjadi kesalahan saat menyetujui');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Alasan penolakan (opsional):');
    if (reason === null) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/staff/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Username': user.username,
          'X-User-Id': user.id,
          'X-User-Role': user.role
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ Pendaftaran berhasil ditolak');
        loadRegistrations();
        onUpdate();
      } else {
        alert('❌ Gagal menolak pendaftaran: ' + data.error);
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('❌ Terjadi kesalahan saat menolak');
    }
  };

  if (loading) {
    return <div className="loading">Loading pending staff...</div>;
  }

  return (
    <div className="pending-tab">
      <div className="tab-header">
        <h2>Pending Staff Registrations</h2>
        <button className="btn-refresh" onClick={loadRegistrations}>
          🔄 Refresh
        </button>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <Clock size={64} />
          <h3>No Pending Staff</h3>
          <p>Semua permohonan staff telah diproses</p>
        </div>
      ) : (
        <div className="registrations-list">
          {registrations.map(reg => (
            <div key={reg.id} className="registration-card">
              <div className="reg-header">
                <div className="reg-user">
                  <Users size={24} />
                  <div>
                    <h3>{reg.fullname}</h3>
                    <span className="reg-username">@{reg.username}</span>
                  </div>
                </div>
                <span className="status-badge pending">Pending</span>
              </div>

              <div className="reg-details">
                <div className="detail-row">
                  <FileText size={16} />
                  <span><strong>NIP:</strong> {reg.nip}</span>
                </div>
                <div className="detail-row">
                  <Mail size={16} />
                  <span><strong>Email:</strong> {reg.email}</span>
                </div>
                <div className="detail-row">
                  <Calendar size={16} />
                  <span><strong>Tanggal:</strong> {new Date(reg.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="reg-reason">
                <strong>Alasan:</strong>
                <p>{reg.reason}</p>
              </div>

              <div className="reg-actions">
                <button 
                  className="btn-approve"
                  onClick={() => handleApprove(reg.id)}
                >
                  <CheckCircle size={18} />
                  Approve
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleReject(reg.id)}
                >
                  <XCircle size={18} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// MANAGE STAFF TAB
// ============================================
const ManageStaffTab = ({ user, onUpdate }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/users');
      const data = await res.json();
      setStaff(data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id, username) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus staff "${username}"?`)) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Username': user.username,
          'X-User-Id': user.id,
          'X-User-Role': user.role
        }
      });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ Staff berhasil dihapus');
        loadStaff();
        onUpdate();
      } else {
        alert('❌ Gagal menghapus staff: ' + data.error);
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
      alert('❌ Terjadi kesalahan saat menghapus staff');
    }
  };

  if (loading) {
    return <div className="loading">Loading staff...</div>;
  }

  return (
    <div className="users-tab">
      <div className="tab-header">
        <h2>Manage Staff</h2>
        <button className="btn-refresh" onClick={loadStaff}>
          🔄 Refresh
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="empty-state">
          <Users size={64} />
          <h3>No Staff Found</h3>
          <p>Belum ada staff yang terdaftar</p>
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>NIP</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.fullname}</td>
                  <td>
                    <div className="user-cell">
                      <Users size={18} />
                      <strong>{s.username}</strong>
                    </div>
                  </td>
                  <td>{s.email}</td>
                  <td>{s.nip}</td>
                  <td>
                    <span className={`role-badge ${s.role}`}>
                      {s.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-delete-user"
                      onClick={() => handleDeleteStaff(s.id, s.username)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================
// ACTIVITY LOGS TAB (NEW!)
// ============================================
const ActivityLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, login, create, update, delete
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });

  useEffect(() => {
    loadLogs();
  }, [pagination.offset, pagination.limit]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/activity-logs?limit=${pagination.limit}&offset=${pagination.offset}`
      );
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (err) {
      console.error('Error loading logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const iconMap = {
      login: <LogIn size={18} />,
      create_pole: <Plus size={18} />,
      update_pole: <Edit size={18} />,
      delete_pole: <Trash size={18} />,
      create_port: <Plus size={18} />,
      update_port: <Edit size={18} />,
      delete_port: <Trash size={18} />,
      approve_staff: <CheckCircle size={18} />,
      reject_staff: <XCircle size={18} />,
      delete_user: <Trash2 size={18} />
    };
    return iconMap[action] || <Activity size={18} />;
  };

  const getActionColor = (action) => {
    if (action.includes('delete')) return '#ef4444';
    if (action.includes('create') || action.includes('approve')) return '#10b981';
    if (action.includes('update') || action.includes('edit')) return '#3b82f6';
    if (action === 'login') return '#8b5cf6';
    if (action.includes('reject')) return '#f97316';
    return '#6b7280';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.action.includes(filter);
  });

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  if (loading) {
    return <div className="loading">Loading activity logs...</div>;
  }

  return (
    <div className="logs-tab">
      <div className="tab-header">
        <h2>Activity Logs</h2>
        <div className="logs-actions">
          <select 
            className="filter-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Activities</option>
            <option value="login">Login</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
          <button className="btn-refresh" onClick={loadLogs}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="empty-state">
          <Activity size={64} />
          <h3>No Activity Logs</h3>
          <p>Belum ada aktivitas yang tercatat</p>
        </div>
      ) : (
        <>
          <div className="logs-list">
            {filteredLogs.map(log => (
              <div key={log.id} className="log-card">
                <div className="log-icon" style={{ color: getActionColor(log.action) }}>
                  {getActionIcon(log.action)}
                </div>
                <div className="log-content">
                  <div className="log-header">
                    <span className="log-user">
                      <strong>{log.username}</strong>
                      <span className={`log-role ${log.role}`}>{log.role}</span>
                    </span>
                    <span className="log-time">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="log-description">{log.description}</p>
                  <div className="log-footer">
                    <span className="log-action-badge" style={{ 
                      background: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action)
                    }}>
                      {log.action}
                    </span>
                    {log.ip_address && (
                      <span className="log-ip">
                        <Eye size={14} />
                        {log.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button 
              onClick={handlePrevPage} 
              disabled={pagination.offset === 0}
              className="btn-pagination"
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <button 
              onClick={handleNextPage}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="btn-pagination"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;