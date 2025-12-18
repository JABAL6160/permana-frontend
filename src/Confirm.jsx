import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import "./Confirm.css";

export default function Confirm() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [fullname, setFullname] = useState("");
  const [mode, setMode] = useState(""); // approve / reject

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const action = window.location.pathname.includes("approve") ? "approve" : "reject";
    setMode(action);

    if (!id) {
      setStatus("error");
      setMessage("ID tidak valid");
      return;
    }

    // Panggil API sesuai action
    const confirmAction = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/${action}?id=${id}`);
        const text = await response.text();

        // Ambil nama admin dari hasil HTML sederhana backend
        const match = text.match(/Admin (.*?) berhasil disetujui|Permohonan admin telah ditolak/i);
        const name = match ? match[1] || "" : "";
        setFullname(name);

        if (response.ok) {
          setStatus("success");
          setMessage(text);
        } else {
          setStatus("error");
          setMessage("Terjadi kesalahan saat memproses permintaan.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Tidak dapat terhubung ke server.");
      }
    };

    confirmAction();
  }, []);

  return (
    <div className="confirm-container">
      <div className="confirm-card">
        {status === "loading" && (
          <div className="confirm-loading">
            <Loader2 className="spin" size={60} />
            <p>Memproses permintaan...</p>
          </div>
        )}

        {status === "success" && (
          <div className="confirm-success">
            {mode === "approve" ? (
              <CheckCircle size={80} color="#10b981" />
            ) : (
              <XCircle size={80} color="#ef4444" />
            )}
            <h2>
              {mode === "approve"
                ? `✅ Admin ${fullname || ""} berhasil disetujui`
                : "❌ Permohonan admin telah ditolak"}
            </h2>
            <p>
              {mode === "approve"
                ? "Calon admin kini telah ditambahkan ke daftar admin aktif."
                : "Data calon admin telah dihapus dari daftar pending."}
            </p>
            <p className="confirm-note">
              Anda dapat menutup halaman ini sekarang.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="confirm-error">
            <XCircle size={80} color="#ef4444" />
            <h2>Terjadi Kesalahan</h2>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
