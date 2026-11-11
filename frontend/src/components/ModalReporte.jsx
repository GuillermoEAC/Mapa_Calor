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
        backgroundColor: "rgba(8, 12, 24, 0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "20px"
      }}
    >
      <div
        className="glass-panel animate-modal"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "28px",
          position: "relative",
          borderRadius: "16px",
          background: "var(--adm-card)",
          border: "1px solid var(--adm-border)",
          color: "var(--adm-text)",
        }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ 
            margin: 0, 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            color: "var(--adm-text)",
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

        {/* Mensaje de anonimato */}
        <div
          style={{
            backgroundColor: "var(--adm-accent-bg)",
            border: "1px solid var(--adm-accent-border)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--adm-text)",
            lineHeight: "1.5",
            display: "flex",
            gap: "10px",
            alignItems: "center"
          }}
        >
          <ShieldCheck size={18} style={{ color: "var(--adm-accent)", flexShrink: 0 }} />
          <span>Este reporte es <strong>100% anónimo</strong>. Solo guardaremos la ubicación geográfica y la descripción del incidente.</span>
        </div>

        <form
          onSubmit={manejarEnvio}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          {/* Tipo de incidente */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px", color: "var(--adm-text)" }}>Tipo de Incidente:</label>
            <select
              value={tipoIncidente}
              onChange={(e) => setTipoIncidente(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
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
              <option value="acoso">Acoso / Zona Insegura</option>
              <option value="fuga_agua">Fuga de Agua / Drenaje</option>
              <option value="accidente">Accidente Vehicular</option>
              <option value="incendio">Incendio / Quema de Maleza</option>
              <option value="fuga_gas">Fuga de Gas</option>
            </select>
          </div>

          {/* Descripción */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px", color: "var(--adm-text)" }}>Descripción detallada (Opcional):</label>
            <textarea
              rows="3"
              placeholder="Ej. Dos sujetos con vestimenta oscura merodeando en motocicleta..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
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
              className="btn-premium btn-danger"
              style={{
                padding: "11px 24px",
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
