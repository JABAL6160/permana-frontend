import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { API_ENDPOINTS } from "./config"; // ✅ Import API config
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = () => {
    const guestUser = {
      role: "guest",
      username: "Guest User",
    };
    sessionStorage.setItem("user", JSON.stringify(guestUser));
    navigate("/");
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!staffUsername || !staffPassword) {
      setError("Username dan password harus diisi");
      return;
    }

    setLoading(true);
    try {
      // ✅ Gunakan API_ENDPOINTS
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: staffUsername, password: staffPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        if (data.user.role === 'staff') {
          sessionStorage.setItem("user", JSON.stringify(data.user));
          navigate("/");
        } else {
          setError("Akun ini bukan akun Staff. Gunakan login Admin jika Anda admin.");
        }
      } else {
        setError(data.error || "Login gagal. Periksa username atau password.");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!adminUsername || !adminPassword) {
      setError("Username dan password harus diisi");
      return;
    }

    setLoading(true);
    try {
      // ✅ Gunakan API_ENDPOINTS
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        if (data.user.role === 'admin') {
          sessionStorage.setItem("user", JSON.stringify(data.user));
          navigate("/");
        } else {
          setError("Akun ini bukan akun Admin. Gunakan login Staff jika Anda staff.");
        }
      } else {
        setError(data.error || "Login gagal. Periksa username atau password.");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Permana GIS</h1>
          <p>Silakan pilih mode akses</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="login-options three-columns">
          {/* GUEST LOGIN */}
          <div className="login-option guest">
            <h2>Akses Sebagai Tamu</h2>
            <p>View peta dan search lokasi</p>
            <ul className="features-list">
              <li>✓ Lihat peta GIS</li>
              <li>✓ Search koordinat</li>
              <li>✗ Tidak bisa lihat Data Tiang</li>
              <li>✗ Tidak bisa edit/hapus</li>
              <li>✗ Tidak bisa lihat ODP Ports</li>
            </ul>
            <button className="btn-guest" onClick={handleGuestLogin} disabled={loading}>
              Masuk Sebagai Tamu
            </button>
          </div>

          {/* STAFF LOGIN */}
          <div className="login-option staff">
            <h2>Akses Staff</h2>
            <p>Kelola data tiang dan peta</p>

            <form onSubmit={handleStaffLogin}>
              <div className="input-group">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  placeholder="Username"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showStaffPassword ? "text" : "password"}
                  placeholder="Password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowStaffPassword(!showStaffPassword)}
                  disabled={loading}
                >
                  {showStaffPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button type="submit" className="btn-staff" disabled={loading}>
                {loading ? "Loading..." : "Login Staff"}
              </button>
            </form>

            <div className="register-section">
              <p className="register-text">Belum punya akun staff?</p>
              <button
                type="button"
                className="btn-register"
                onClick={() => navigate("/Register")}
                disabled={loading}
              >
                📝 Daftar Sebagai Staff
              </button>
            </div>

            <ul className="features-list">
              <li>✓ Semua akses tamu</li>
              <li>✓ Lihat Data Tiang</li>
              <li>✓ Tambah & Edit data</li>
              <li>✓ Lihat ODP Ports</li>
              <li>✗ Tidak bisa delete</li>
            </ul>
          </div>

          {/* ADMIN LOGIN */}
          <div className="login-option admin">
            <h2>Akses Admin</h2>
            <p>Full control & administrator panel</p>

            <form onSubmit={handleAdminLogin}>
              <div className="input-group">
                <Shield className="input-icon" size={20} />
                <input
                  type="text"
                  placeholder="Admin Username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showAdminPassword ? "text" : "password"}
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  disabled={loading}
                >
                  {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button type="submit" className="btn-admin" disabled={loading}>
                {loading ? "Loading..." : "Login Admin"}
              </button>
            </form>

            <div className="admin-info">
              <p className="info-text">
                🔒 Akun Admin bersifat absolute dan tidak dapat didaftarkan sendiri.
              </p>
            </div>

            <ul className="features-list">
              <li>✓ Semua akses staff</li>
              <li>✓ Full CRUD Access</li>
              <li>✓ Administrator Panel</li>
              <li>✓ Approve/Reject Staff</li>
              <li>✓ Manage Users</li>
            </ul>
          </div>
        </div>

        <div className="login-footer">
          <button className="btn-back" onClick={() => navigate("/")} disabled={loading}>
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}