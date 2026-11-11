import React, { useState } from "react";
import { Bell, Mail, X, Navigation, AlertCircle, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "../config";

// ─────────────────────────────────────────────────────────────────────────────
// CU-14: Suscripción a Alertas de Zona con UI Glassmorphic Premium y Robusta
// ─────────────────────────────────────────────────────────────────────────────
const SuscripcionAlerta = ({ isOpen, onClose }) => {
  const [correo, setCorreo] = useState("");
  const [radio, setRadio] = useState("500");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setExito(false);

    const correoLimpio = correo.trim();
    if (!correoLimpio) {
      setError("Por favor ingresa un correo electrónico.");
      return;
    }

    // Validar formato de correo en el frontend para evitar llamadas fallidas
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoLimpio)) {
      setError("El formato del correo electrónico no es válido.");
      return;
    }

    setCargando(true);

    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización o está deshabilitada.");
      setCargando(false);
      return;
    }

    // Opciones para obtener alta precisión y un timeout razonable
    const opcionesGeo = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Límites geográficos de Los Mochis y ejidos aledaños (~25km radio) y centro por defecto
    const LIMITES = { latMin: 25.50, latMax: 26.10, lngMin: -109.30, lngMax: -108.70 };
    const centroLosMochis = { lat: 25.7904, lng: -108.9858 };

    navigator.geolocation.getCurrentPosition(
      async (posicion) => {
        let { latitude, longitude } = posicion.coords;

        // Si el GPS está fuera de Los Mochis, usar el centro como fallback
        if (
          latitude < LIMITES.latMin || latitude > LIMITES.latMax ||
          longitude < LIMITES.lngMin || longitude > LIMITES.lngMax
        ) {
          latitude = centroLosMochis.lat;
          longitude = centroLosMochis.lng;
        }

        if (!latitude || !longitude) {
          setError("No se pudieron obtener coordenadas geográficas válidas.");
          setCargando(false);
          return;
        }

        try {
          const respuesta = await fetch(`${API_BASE_URL}/api/suscripciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              correo_notificacion: correoLimpio,
              latitud_zona: latitude,
              longitud_zona: longitude,
              radio_cobertura_metros: parseInt(radio),
            }),
          });

          const data = await respuesta.json().catch(() => null);

          if (respuesta.ok) {
            setExito(true);
            setCorreo("");
            setRadio("500");
            setTimeout(() => {
              setExito(false);
              onClose();
            }, 3500);
          } else {
            setError(data?.error || data?.mensaje || "Error al registrar la suscripción en el servidor.");
          }
        } catch (err) {
          setError("No se pudo establecer conexión con el servidor. Verifica tu conexión de red.");
        } finally {
          setCargando(false);
        }
      },
      (err) => {
        console.error("Error de geolocalización:", err);
        // Fallback: usar centro de Los Mochis si no se puede obtener GPS
        const usarFallback = async () => {
          try {
            const respuesta = await fetch(`${API_BASE_URL}/api/suscripciones`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                correo_notificacion: correoLimpio,
                latitud_zona: centroLosMochis.lat,
                longitud_zona: centroLosMochis.lng,
                radio_cobertura_metros: parseInt(radio),
              }),
            });

            const data = await respuesta.json().catch(() => null);

            if (respuesta.ok) {
              setExito(true);
              setCorreo("");
              setRadio("500");
              setTimeout(() => {
                setExito(false);
                onClose();
              }, 3500);
            } else {
              setError(data?.error || "Error al registrar la suscripción.");
            }
          } catch (fetchErr) {
            setError("No se pudo conectar con el servidor.");
          } finally {
            setCargando(false);
          }
        };
        usarFallback();
      },
      opcionesGeo
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
        backgroundColor: "rgba(8, 12, 24, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "20px"
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "30px",
          position: "relative",
          borderRadius: "16px",
          background: "var(--adm-card)",
          border: "1px solid var(--adm-border)",
          color: "var(--adm-text)",
        }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ 
            margin: 0, 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            color: "var(--adm-text)",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.5px"
          }}>
            <span style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "#059669",
              color: "white"
            }}>
              <Bell size={20} />
            </span>
            Alertas de Zona
          </h2>
          <button
            onClick={onClose}
            style={{ 
              background: "var(--adm-card-alt)", 
              border: "1px solid var(--adm-border)", 
              borderRadius: "8px",
              cursor: "pointer", 
              color: "var(--adm-muted)",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {exito ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "20px 0",
            animation: "fadeIn 0.4s ease"
          }}>
            <div style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: "var(--adm-accent-bg)",
              border: "2px solid var(--adm-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              color: "var(--adm-accent)",
            }}>
              <Mail size={40} />
            </div>
            <h3 style={{ color: "var(--adm-text)", margin: "0 0 10px 0", fontSize: "18px", fontWeight: "700" }}>
              ¡Revisa tu correo!
            </h3>
            <p style={{ color: "var(--adm-muted)", fontSize: "14px", margin: "0 0 12px 0", lineHeight: "1.6", maxWidth: "340px" }}>
              Te hemos enviado un <strong style={{ color: "var(--adm-accent)" }}>correo de verificación</strong>. Haz clic en el enlace que encontrarás en tu bandeja de entrada para activar tu suscripción.
            </p>
            <div style={{
              backgroundColor: "var(--adm-card-alt)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "12px",
              color: "var(--adm-text)",
              lineHeight: "1.5",
              maxWidth: "340px"
            }}>
              <strong>Consejo:</strong> Si no lo ves en tu bandeja de entrada, revisa la carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong>.
            </div>
          </div>
        ) : (
          <>
            {/* Mensaje Informativo */}
            <div
              style={{
                backgroundColor: "var(--adm-accent-bg)",
                border: "1px solid var(--adm-accent-border)",
                borderRadius: "10px",
                padding: "15px 18px",
                marginBottom: "22px",
                fontSize: "13.5px",
                color: "var(--adm-text)",
                lineHeight: "1.6",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start"
              }}
            >
              <Navigation size={18} style={{ color: "var(--adm-accent)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                Utilizaremos tu <strong>ubicación en tiempo real</strong> para definir el centro de la zona de monitoreo. Te enviaremos un correo al instante si se reporta peligro dentro de tu radio seleccionado.
              </div>
            </div>

            <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Campo Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: "600", fontSize: "14px", color: "var(--adm-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mail size={15} color="var(--adm-muted)" /> Correo electrónico de destino
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    width: "100%",
                    outline: "none"
                  }}
                />
              </div>

              {/* Campo Radio */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: "600", fontSize: "14px", color: "var(--adm-text)" }}>
                  Radio de cobertura de alerta
                </label>
                <select
                  value={radio}
                  onChange={(e) => setRadio(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    width: "100%",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value="250">250 metros (Zonal cercano)</option>
                  <option value="500">500 metros (Radio medio)</option>
                  <option value="1000">1,000 metros (1 km)</option>
                  <option value="2000">2,000 metros (2 km - Rango amplio)</option>
                </select>
              </div>

              {/* Errores */}
              {error && (
                <div
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    animation: "fadeIn 0.25s ease"
                  }}
                >
                  <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ lineHeight: "1.5" }}>{error}</span>
                </div>
              )}

              {/* Acciones */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-premium"
                  style={{
                    padding: "11px 20px",
                    fontSize: "14px",
                    background: "var(--adm-card-alt)",
                    border: "1px solid var(--adm-border)",
                    color: "var(--adm-text)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="btn-premium"
                  style={{
                    padding: "11px 24px",
                    fontSize: "14px",
                    fontWeight: 700,
                    background: "#059669",
                    border: "1px solid #10b981",
                    color: "#ffffff",
                    opacity: cargando ? 0.75 : 1,
                    cursor: cargando ? "not-allowed" : "pointer"
                  }}
                >
                  <Bell size={16} />
                  {cargando ? "Obteniendo ubicación..." : "Activar Alertas"}
                </button>
              </div>
            </form>
          </>
        )}

        <p style={{ marginTop: "24px", fontSize: "12px", color: "var(--adm-muted)", textAlign: "center", lineHeight: "1.5" }}>
          Las notificaciones se envían de forma automática y anónima. Puedes desuscribirte en cualquier momento desde el enlace incluido al pie de cada alerta.
        </p>
      </div>
    </div>
  );
};

export default SuscripcionAlerta;
