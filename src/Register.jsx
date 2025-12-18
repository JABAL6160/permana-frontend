import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, FileText, Eye, EyeOff, CheckCircle } from "lucide-react";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: "",
    nip: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    reason: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi form
    if (!formData.fullname || !formData.nip || !formData.email || 
        !formData.username || !formData.password || !formData.confirmPassword || !formData.reason) {
      setError("Semua field harus diisi");
      return;
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format email tidak valid");
      return;
    }

    // Validasi password
    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    // Validasi alasan minimal 20 karakter
    if (formData.reason.length < 20) {
      setError("Alasan minimal 20 karakter");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/staff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.fullname,
          nip: formData.nip,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          reason: formData.reason
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/Login");
        }, 4000);
      } else {
        setError(data.error || "Registrasi gagal. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Register error:", err);
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Jika berhasil submit
  if (success) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="success-animation">
            <CheckCircle size={80} color="#10b981" />
            <h2>Permohonan Terkirim!</h2>
            <p>
              Permohonan akses staff Anda telah dikirim ke administrator.
              <br />
              Anda akan menerima notifikasi setelah permohonan disetujui.
            </p>
            <p className="redirect-info">
              Mengarahkan ke halaman login dalam 4 detik...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Registrasi Staff</h1>
          <p>Daftarkan diri Anda sebagai calon staff Permana GIS</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Nama Lengkap */}
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              name="fullname"
              placeholder="Nama Lengkap"
              value={formData.fullname}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* NIP */}
          <div className="input-group">
            <FileText className="input-icon" size={20} />
            <input
              type="text"
              name="nip"
              placeholder="NIP (Nomor Induk Pegawai)"
              value={formData.nip}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email Pegawai"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Username */}
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password (min. 6 karakter)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Konfirmasi Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Alasan */}
          <div className="input-group textarea-group">
            <FileText className="input-icon textarea-icon" size={20} />
            <textarea
              name="reason"
              placeholder="Alasan membutuhkan akses staff (min. 20 karakter)"
              value={formData.reason}
              onChange={handleChange}
              disabled={loading}
              rows="4"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-register"
            disabled={loading}
          >
            {loading ? "Mengirim Permohonan..." : "Kirim Permohonan"}
          </button>
        </form>

        <div className="register-footer">
          <p>Sudah punya akun staff?</p>
          <button
            className="btn-back-login"
            onClick={() => navigate("/Login")}
            disabled={loading}
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
}