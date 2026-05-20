import React, { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";

const ConfiguracionMapa = () => {
  const [config, setConfig] = useState({
    radio: 500,
    desenfoque: 15,
    opacidad: 0.15
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const respuesta = await fetch("http://localhost:3000/api/config");
        const datos = await respuesta.json();
        setConfig({
          radio: datos.radio_puntos,
          desenfoque: datos.desenfoque_puntos,
          opacidad: parseFloat(datos.opacidad_puntos)
        });
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      }
    };
    cargarConfig();
  }, []);

  const manejarGuardar = async () => {
    setGuardando(true);
    try {
      await fetch("http://localhost:3000/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      alert("Configuración guardada. El mapa se actualizará para todos los usuarios.");
    } catch (error) {
      alert("Error al guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1E293B" }}>
        <Settings /> Configuración Visual del Mapa (CU 8)
      </h2>
      <p style={{ color: "#64748B", marginBottom: "30px" }}>
        Ajusta cómo se ven los puntos de calor en el mapa interactivo. Estos cambios afectan a todos los ciudadanos.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "25px", backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
            Radio de Influencia: <span style={{ color: "#3B82F6" }}>{config.radio} metros</span>
          </label>
          <input 
            type="range" min="100" max="2000" step="50"
            value={config.radio}
            onChange={(e) => setConfig({...config, radio: parseInt(e.target.value)})}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
            Intensidad / Opacidad: <span style={{ color: "#3B82F6" }}>{(config.opacidad * 100).toFixed(0)}%</span>
          </label>
          <input 
            type="range" min="0.05" max="0.8" step="0.05"
            value={config.opacidad}
            onChange={(e) => setConfig({...config, opacidad: parseFloat(e.target.value)})}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>

        <button 
          onClick={manejarGuardar}
          disabled={guardando}
          style={{
            backgroundColor: "#3B82F6",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginTop: "10px"
          }}
        >
          {guardando ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
};

export default ConfiguracionMapa;
