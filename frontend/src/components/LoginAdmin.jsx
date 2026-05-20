import React, { useState } from "react";
import { Lock } from "lucide-react";

const LoginAdmin = ({ onLoginSuccess, onCancelar }) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const respuesta = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const datos = await respuesta.json();

      if (datos.success) {
        onLoginSuccess(); // Le avisamos a App.jsx que la contraseña es correcta
      } else {
        setError(datos.error); // Mostramos el error en pantalla
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
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "350px",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#1E293B", marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <Lock size={28} /> Acceso Admin
        </h2>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#ef4444",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={manejarEnvio}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <div>
            <label
              style={{ fontWeight: "bold", fontSize: "14px", color: "#64748b" }}
            >
              Usuario:
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <div>
            <label
              style={{ fontWeight: "bold", fontSize: "14px", color: "#64748b" }}
            >
              Contraseña:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: "#3B82F6",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "5px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Iniciar Sesión
          </button>

          <button
            type="button"
            onClick={onCancelar}
            style={{
              backgroundColor: "transparent",
              color: "#64748b",
              border: "none",
              padding: "10px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Volver al Mapa
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;
