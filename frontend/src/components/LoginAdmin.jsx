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
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Resplandor decorativo de fondo */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "420px",
          height: "420px",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      <div
        className="animate-modal"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "410px",
          background: "rgba(24, 24, 27, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          borderRadius: "24px",
          padding: "36px 32px",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Cabecera del Login */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 16px auto",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
              boxShadow: "0 8px 24px -4px rgba(56, 189, 248, 0.3)",
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#ffffff",
            }}
          >
            Portal de Administración
          </h1>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: "13px",
              color: "#a1a1aa",
            }}
          >
            Control y moderación del Mapa de Inseguridad
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fda4af",
              padding: "11px 14px",
              borderRadius: "12px",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, color: "#f43f5e" }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Campo Usuario */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#e4e4e7",
                marginBottom: "8px",
                letterSpacing: "0.2px",
              }}
            >
              Usuario
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#71717a",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <User size={17} />
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
                  padding: "12px 14px 12px 42px",
                  fontSize: "14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(9, 9, 11, 0.6) !important",
                  borderColor: "rgba(255, 255, 255, 0.1) !important",
                }}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#e4e4e7",
                marginBottom: "8px",
                letterSpacing: "0.2px",
              }}
            >
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#71717a",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <Lock size={17} />
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 42px",
                  fontSize: "14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(9, 9, 11, 0.6) !important",
                  borderColor: "rgba(255, 255, 255, 0.1) !important",
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#a1a1aa",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
                title={mostrarPassword ? "Ocultar" : "Mostrar"}
              >
                {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={cargando}
            style={{
              marginTop: "8px",
              padding: "13px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: cargando ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 10px 25px -4px rgba(37, 99, 235, 0.45)",
              opacity: cargando ? 0.75 : 1,
            }}
          >
            {cargando ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <span>Acceder al Panel</span>
            )}
          </button>

          {/* Volver al mapa */}
          <button
            type="button"
            onClick={onCancelar}
            style={{
              padding: "10px",
              borderRadius: "10px",
              background: "transparent",
              border: "none",
              color: "#a1a1aa",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f4f4f5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <ArrowLeft size={15} />
            <span>Volver al Mapa Ciudadano</span>
          </button>
        </form>

        {/* Footer Seguridad */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#71717a",
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            🔒 Sesión Protegida con Bcrypt & JWT
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
