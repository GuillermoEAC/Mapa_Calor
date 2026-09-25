import React, { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, CheckCircle2, Sliders, Info, Eye } from "lucide-react";
import { API_BASE_URL } from "../config";

const ConfiguracionMapa = ({ token }) => {
  const [config, setConfig] = useState({
    radio: 500,
    desenfoque: 15,
    opacidad: 0.15,
  });
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/config`);
        const datos = await respuesta.json();
        setConfig({
          radio: datos.radio_puntos || 500,
          desenfoque: datos.desenfoque_puntos || 15,
          opacidad: parseFloat(datos.opacidad_puntos) || 0.15,
        });
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      }
    };
    cargarConfig();
  }, []);

  const manejarGuardar = async () => {
    setGuardando(true);
    setMensajeExito("");
    setMensajeError("");

    try {
      const resp = await fetch(`${API_BASE_URL}/api/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(config),
      });

      if (resp.ok) {
        setMensajeExito("Parámetros guardados exitosamente. El mapa reflejará los cambios para todos los usuarios.");
        setTimeout(() => setMensajeExito(""), 4500);
      } else {
        setMensajeError("No se pudieron guardar los cambios. Verifica tus permisos de administrador.");
      }
    } catch (error) {
      setMensajeError("Error de conexión al guardar configuración.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>
      {/* Título */}
      <div className="admin-card" style={{ padding: "20px 24px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 700,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Settings size={22} color="#38bdf8" />
          <span>Configuración de Visualización del Mapa de Calor</span>
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
          Ajusta los parámetros de densidad y dispersión del algoritmo de calor para la ciudad de Los Mochis.
        </p>
      </div>

      {/* Alertas de Feedback */}
      {mensajeExito && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#6ee7b7",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div
          className="animate-fade-in"
          style={{
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fda4af",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "13px",
          }}
        >
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Panel de Controles */}
      <div className="admin-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* Control 1: Radio */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#f4f4f5" }}>
              Radio de Influencia Geográfica
            </label>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                padding: "3px 10px",
                borderRadius: "8px",
              }}
            >
              {config.radio} metros
            </span>
          </div>
          <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#a1a1aa" }}>
            Define qué tan amplio es el círculo de impacto alrededor de cada reporte en el mapa.
          </p>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={config.radio}
            onChange={(e) => setConfig({ ...config, radio: parseInt(e.target.value) })}
          />
        </div>

        {/* Control 2: Opacidad / Intensidad */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#f4f4f5" }}>
              Intensidad y Opacidad de Capa
            </label>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                padding: "3px 10px",
                borderRadius: "8px",
              }}
            >
              {(config.opacidad * 100).toFixed(0)}%
            </span>
          </div>
          <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#a1a1aa" }}>
            Controla la visibilidad y brillo del mapa de calor sobre las calles y satélite.
          </p>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={config.opacidad}
            onChange={(e) => setConfig({ ...config, opacidad: parseFloat(e.target.value) })}
          />
        </div>

        {/* Botón Guardar */}
        <div style={{ paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <button
            onClick={manejarGuardar}
            disabled={guardando}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: guardando ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 20px -4px rgba(37, 99, 235, 0.4)",
            }}
          >
            {guardando ? (
              <>
                <RefreshCw size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Parámetros</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionMapa;
