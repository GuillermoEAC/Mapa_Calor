import React, { useState } from "react";
import { ShieldCheck, User, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../config";

const LoginAdmin = ({ onLoginSuccess, onCancelar }) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      });

      const datos = await respuesta.json();

      if (datos.success && datos.token) {
        onLoginSuccess(datos.token);
      } else {
        setError(datos.error || "Credenciales incorrectas");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b",
        padding: "20px",
      }}
    >
      <div
        className="animate-modal"
        style={{
          width: "100%",
          maxWidth: "380px",
          backgroundColor: "#121215",
          border: "1px solid #27272a",
          borderRadius: "18px",
          padding: "32px 28px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 14px auto",
              borderRadius: "12px",
              backgroundColor: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "19px",
              fontWeight: 700,
              color: "#f4f4f5",
            }}
          >
            Acceso Administrativo
          </h1>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "12.5px",
              color: "#71717a",
            }}
          >
            Panel de control y moderación
          </p>
        </div>

        {error && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              color: "#fb7185",
              padding: "10px 12px",
              borderRadius: "10px",
              fontSize: "12.5px",
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                marginBottom: "6px",
              }}
            >
              Usuario
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#52525b",
                  display: "flex",
                }}
              >
                <User size={16} />
              </div>
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "11px 12px 11px 38px",
                  fontSize: "13.5px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  color: "#f4f4f5",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                marginBottom: "6px",
              }}
            >
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#52525b",
                  display: "flex",
                }}
              >
                <Lock size={16} />
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "11px 38px 11px 38px",
                  fontSize: "13.5px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  color: "#f4f4f5",
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#71717a",
                  cursor: "pointer",
                  display: "flex",
                  padding: "4px",
                }}
              >
                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              marginTop: "6px",
              padding: "11px",
              borderRadius: "10px",
              backgroundColor: "#2563eb",
              border: "1px solid #3b82f6",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: cargando ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: cargando ? 0.7 : 1,
            }}
          >
            {cargando ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>

          <button
            type="button"
            onClick={onCancelar}
            style={{
              padding: "8px",
              background: "transparent",
              border: "none",
              color: "#71717a",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={14} />
            <span>Volver al mapa</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;
