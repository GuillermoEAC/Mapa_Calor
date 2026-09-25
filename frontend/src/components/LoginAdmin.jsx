import React, { useState } from "react";
import { Lock } from "lucide-react";
import { API_BASE_URL } from "../config";

const LoginAdmin = ({ onLoginSuccess, onCancelar }) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const datos = await respuesta.json();

      if (datos.success && datos.token) {
        onLoginSuccess(datos.token); // Enviamos el token JWT a App.jsx
      } else {
        setError(datos.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "var(--bg-deep)",
        padding: "20px",
      }}
    >
      <div
        className="glass-panel animate-modal"
        style={{
          padding: "36px 32px",
          borderRadius: "22px",
          width: "100%",
          maxWidth: "380px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 8px 20px -3px rgba(56, 189, 248, 0.4)",
              marginBottom: "12px",
            }}
          >
            <Lock size={22} />
          </div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.4px" }}>
            Panel de Control
          </h2>
          <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Acceso exclusivo para moderadores
          </span>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              color: "#fb7185",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              padding: "10px 14px",
              borderRadius: "10px",
              marginBottom: "18px",
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={manejarEnvio}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{ fontWeight: "600", fontSize: "13px", color: "#cbd5e1", display: "block", marginBottom: "6px" }}
            >
              Usuario
            </label>
            <input
              type="text"
              placeholder="admin"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                fontSize: "14px",
              }}
              required
            />
          </div>

          <div>
            <label
              style={{ fontWeight: "600", fontSize: "13px", color: "#cbd5e1", display: "block", marginBottom: "6px" }}
            >
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                fontSize: "14px",
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-action btn-primary"
            style={{
              justifyContent: "center",
              padding: "12px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "14px",
              marginTop: "8px",
              boxShadow: "0 8px 20px -4px rgba(56, 189, 248, 0.4)",
            }}
          >
            Iniciar Sesión
          </button>

          <button
            type="button"
            onClick={onCancelar}
            className="btn-action"
            style={{
              justifyContent: "center",
              padding: "10px",
              fontSize: "13px",
              background: "transparent",
              borderColor: "transparent",
              color: "#94a3b8",
            }}
          >
            ← Volver al Mapa Ciudadano
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;
