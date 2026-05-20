import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

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
      descripcion: descripcion,
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
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "10px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={24} color="#EF4444" /> Detalle del Reporte
        </h3>
        <p style={{ fontSize: "14px", color: "#64748b" }}>
          Tu reporte es 100% anónimo. Solo guardaremos la ubicación y el tipo de
          incidente.
        </p>

        <form
          onSubmit={manejarEnvio}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <label style={{ fontWeight: "bold" }}>Tipo de Incidente:</label>
          <select
            value={tipoIncidente}
            onChange={(e) => setTipoIncidente(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="robo">Robo / Asalto</option>
            <option value="vandalismo">Vandalismo</option>
            <option value="alumbrado">Fallo de Alumbrado</option>
            <option value="sospechoso">Actividad Sospechosa</option>
          </select>

          <label style={{ fontWeight: "bold" }}>Descripción (Opcional):</label>
          <textarea
            rows="3"
            placeholder="Ej. Dos sujetos en motocicleta..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #cbd5e1",
              resize: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
            }}
          >
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
              style={{
                padding: "10px 15px",
                border: "none",
                backgroundColor: "#EF4444",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
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
