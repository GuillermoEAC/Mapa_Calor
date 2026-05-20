import React, { useState } from "react";
import { Bell, Mail, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CU-14: Suscripción a Alertas de Zona
// ─────────────────────────────────────────────────────────────────────────────
const SuscripcionAlerta = ({ isOpen, onClose }) => {
  const [correo, setCorreo] = useState("");
  const [radio, setRadio] = useState("500");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    // Obtener ubicación del usuario
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización.");
      setCargando(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (posicion) => {
        const { latitude, longitude } = posicion.coords;

        try {
          const respuesta = await fetch("http://localhost:3000/api/suscripciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              correo,
              latitud: latitude,
              longitud: longitude,
              radio: parseInt(radio),
            }),
          });

          if (respuesta.ok) {
            alert("¡Suscripción exitosa! Recibirás alertas en tu correo cuando haya incidentes cerca de tu ubicación.");
            setCorreo("");
            setRadio("500");
            onClose();
          } else {
            const data = await respuesta.json().catch(() => null);
            setError(data?.mensaje || "Error al registrar la suscripción. Intenta de nuevo.");
          }
        } catch (err) {
          setError("No se pudo conectar con el servidor.");
        } finally {
          setCargando(false);
        }
      },
      (err) => {
        setError("No pudimos obtener tu ubicación. Por favor, permite el acceso a la ubicación en tu navegador.");
        setCargando(false);
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "90%",
          maxWidth: "450px",
          borderRadius: "16px",
          padding: "25px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
        }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "#8B5CF6" }}>
            <Bell /> Alertas de Zona
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Info */}
        <div
          style={{
            backgroundColor: "#F5F3FF",
            border: "1px solid #DDD6FE",
            borderRadius: "10px",
            padding: "12px 15px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#5B21B6",
            lineHeight: "1.5",
          }}
        >
          Se utilizará tu ubicación actual para definir la zona de alerta. Recibirás un correo cuando se apruebe un reporte dentro del radio seleccionado.
        </div>

        <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px", color: "#1E293B", display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={16} color="#64748B" /> Correo electrónico
            </label>
            <input
              type="email"
              required
              placeholder="tucorreo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Radio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px", color: "#1E293B" }}>
              Radio de alerta
            </label>
            <select
              value={radio}
              onChange={(e) => setRadio(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="250">250 metros</option>
              <option value="500">500 metros</option>
              <option value="1000">1,000 metros (1 km)</option>
              <option value="2000">2,000 metros (2 km)</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#991B1B",
              }}
            >
              {error}
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "5px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 15px",
                border: "none",
                backgroundColor: "#e2e8f0",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              style={{
                padding: "10px 20px",
                border: "none",
                backgroundColor: "#8B5CF6",
                color: "white",
                borderRadius: "5px",
                cursor: cargando ? "not-allowed" : "pointer",
                fontWeight: "bold",
                opacity: cargando ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Bell size={16} />
              {cargando ? "Registrando..." : "Suscribirse"}
            </button>
          </div>
        </form>

        <p style={{ marginTop: "20px", fontSize: "12px", color: "#94A3B8", textAlign: "center" }}>
          Puedes cancelar tu suscripción en cualquier momento desde el enlace en tu correo.
        </p>
      </div>
    </div>
  );
};

export default SuscripcionAlerta;
