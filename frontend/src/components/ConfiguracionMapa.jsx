import React, { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, CheckCircle2, Info } from "lucide-react";
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
        console.error(error);
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
        setMensajeExito("Parámetros guardados correctamente.");
        setTimeout(() => setMensajeExito(""), 4000);
      } else {
        setMensajeError("No se pudieron guardar los cambios.");
      }
    } catch (error) {
      setMensajeError("Error de conexión al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
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
          <span>Configuración del Mapa de Calor</span>
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
          Ajustes de cobertura e intensidad visual para los reportes ciudadanos.
        </p>
      </div>

      {mensajeExito && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div
          className="animate-fade-in"
          style={{
            backgroundColor: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fb7185",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "13px",
          }}
        >
          <span>{mensajeError}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        <div className="admin-card" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#f4f4f5" }}>
              Radio de Influencia
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              {config.radio} m
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>
            Tamaño de la huella térmica generada por cada incidente reportado.
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

        <div className="admin-card" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#f4f4f5" }}>
              Opacidad de Capa
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              {(config.opacidad * 100).toFixed(0)}%
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>
            Nivel de transparencia del mapa de calor sobre las calles.
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
      </div>

      <div>
        <button
          onClick={manejarGuardar}
          disabled={guardando}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            backgroundColor: "#2563eb",
            border: "1px solid #3b82f6",
            color: "#ffffff",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: guardando ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            opacity: guardando ? 0.7 : 1,
          }}
        >
          {guardando ? (
            <>
              <RefreshCw size={15} style={{ animation: "spin 0.8s linear infinite" }} />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      <div className="admin-card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start", backgroundColor: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
        <Info size={20} color="#38bdf8" style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: "0 0 4px 0", color: "#f4f4f5", fontSize: "14px", fontWeight: 600 }}>Aplicación en Tiempo Real</h4>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: "13px", lineHeight: "1.5" }}>
            Los cambios realizados en el radio de influencia y opacidad se reflejarán instantáneamente en el mapa público. Te recomendamos realizar ajustes moderados para mantener la legibilidad de las calles y reportes individuales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionMapa;
