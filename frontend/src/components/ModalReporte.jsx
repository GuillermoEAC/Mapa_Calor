import React, { useState } from "react";
import { AlertCircle, X, ShieldCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Modal de Reporte Ciudadano con UI Glassmorphic Premium
// ─────────────────────────────────────────────────────────────────────────────
const ModalReporte = ({ isOpen, onClose, onSubmit, ubicacion }) => {
  const [tipoIncidente, setTipoIncidente] = useState("robo");
  const [descripcion, setDescripcion] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setTipoIncidente("robo");
      setDescripcion("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const manejarEnvio = (e) => {
    e.preventDefault();
    const datosReporte = {
      tipo: tipoIncidente,
      descripcion: descripcion.trim(),
      latitud: ubicacion[0],
      longitud: ubicacion[1],
    };
    onSubmit(datosReporte);
  };

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
        zIndex: 9999,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "20px"
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "30px",
          position: "relative",
          background: "#1e293b",
          border: "1px solid #334155",
        }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ 
            margin: 0, 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            color: "#f8fafc",
            fontSize: "20px",
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
              background: "#ef4444",
              color: "white"
            }}>
              <AlertCircle size={20} />
            </span>
            Detalle del Reporte
          </h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: "rgba(255, 255, 255, 0.05)", 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              borderRadius: "10px",
              cursor: "pointer", 
              color: "#94a3b8",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f8fafc"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensaje de anonimato */}
        <div
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#d1fae5",
            lineHeight: "1.5",
            display: "flex",
            gap: "10px",
            alignItems: "center"
          }}
        >
          <ShieldCheck size={18} style={{ color: "#34d399", flexShrink: 0 }} />
          <span>Este reporte es <strong>100% anónimo</strong>. Solo guardaremos la ubicación geográfica y la descripción del incidente.</span>
        </div>

        <form
          onSubmit={manejarEnvio}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          {/* Tipo de incidente */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px", color: "#e2e8f0" }}>Tipo de Incidente:</label>
            <select
              value={tipoIncidente}
              onChange={(e) => setTipoIncidente(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "10px",
                fontSize: "14px",
                width: "100%",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="robo">Robo / Asalto</option>
              <option value="vandalismo">Vandalismo</option>
              <option value="alumbrado">Fallo de Alumbrado</option>
              <option value="sospechoso">Actividad Sospechosa</option>
            </select>
          </div>

          {/* Descripción */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px", color: "#e2e8f0" }}>Descripción detallada (Opcional):</label>
            <textarea
              rows="3"
              placeholder="Ej. Dos sujetos con vestimenta oscura merodeando en motocicleta..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "10px",
                fontSize: "14px",
                width: "100%",
                resize: "none",
                outline: "none"
              }}
            />
          </div>

          {/* Botones de acción */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-premium btn-secondary"
              style={{
                padding: "12px 20px",
                fontSize: "14px"
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-premium btn-danger"
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "700"
              }}
            >
              Enviar Reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalReporte;
