import React, { useState } from "react";
import MapaInteractivo from "./components/MapaInteractivo";
import ModalReporte from "./components/ModalReporte";
import PanelAdmin from "./components/PanelAdmin";
import LoginAdmin from "./components/LoginAdmin";
import Estadisticas from "./components/Estadisticas";
import ConfiguracionMapa from "./components/ConfiguracionMapa";
import DirectorioEmergencia from "./components/DirectorioEmergencia";
import HistoricoReportes from "./components/HistoricoReportes";
import SuscripcionAlerta from "./components/SuscripcionAlerta";
import ExportarReportes from "./components/ExportarReportes";
import { Shield, AlertTriangle, ArrowLeft, BarChart3, Settings, PhoneCall, ListFilter, History, Bell, Download } from "lucide-react";

function App() {
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [emergenciasAbierto, setEmergenciasAbierto] = useState(false);
  const [alertasAbierto, setAlertasAbierto] = useState(false);
  const [vistaActual, setVistaActual] = useState("mapa"); // mapa, admin
  const [seccionAdmin, setSeccionAdmin] = useState("moderacion"); // moderacion, estadisticas, config, historico, exportar
  const [adminAutenticado, setAdminAutenticado] = useState(false);

  // CU-11: Parsear parámetros de URL para compartir vista del mapa
  const urlParams = new URLSearchParams(window.location.search);
  const compartirParams = urlParams.has('lat') ? {
    lat: parseFloat(urlParams.get('lat')),
    lng: parseFloat(urlParams.get('lng')),
    zoom: parseInt(urlParams.get('zoom') || '13'),
    filtro: urlParams.get('filtro') || 'todos'
  } : null;

  const manejarClickReportar = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const { latitude, longitude } = posicion.coords;
          setUbicacionUsuario([latitude, longitude]);
          setModalAbierto(true);
        },
        (error) =>
          alert("No pudimos obtener tu ubicación. Por favor, asegura de darle permisos al navegador.")
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
    }
  };

  const manejarClickMapa = (coordenadas) => {
    setUbicacionUsuario(coordenadas);
    setModalAbierto(true);
  };

  const manejarEnvioReporte = async (datos) => {
    try {
      const respuesta = await fetch("http://localhost:3000/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (respuesta.ok) {
        alert("Reporte enviado a moderacion. Gracias por tu colaboracion ciudadana.");
        setModalAbierto(false);
        setUbicacionUsuario(null);
      } else {
        alert("Hubo un problema al guardar el reporte.");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    }
  };

  if (vistaActual === "admin") {
    if (!adminAutenticado) {
      return (
        <LoginAdmin
          onLoginSuccess={() => setAdminAutenticado(true)}
          onCancelar={() => setVistaActual("mapa")}
        />
      );
    }

    return (
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
        <header style={{ backgroundColor: "#1E293B", padding: "10px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "15px" }}>
            <button onClick={() => setVistaActual("mapa")} style={{ padding: "8px 15px", cursor: "pointer", borderRadius: "5px", border: "none", display: "flex", alignItems: "center", gap: "5px" }}>
              <ArrowLeft size={16} /> Volver al Mapa
            </button>
            <nav style={{ display: "flex", gap: "5px" }}>
              <button 
                onClick={() => setSeccionAdmin("moderacion")}
                style={{ backgroundColor: seccionAdmin === "moderacion" ? "#3B82F6" : "transparent", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <ListFilter size={16} /> Moderación
              </button>
              <button 
                onClick={() => setSeccionAdmin("estadisticas")}
                style={{ backgroundColor: seccionAdmin === "estadisticas" ? "#3B82F6" : "transparent", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <BarChart3 size={16} /> Estadísticas
              </button>
              <button 
                onClick={() => setSeccionAdmin("config")}
                style={{ backgroundColor: seccionAdmin === "config" ? "#3B82F6" : "transparent", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <Settings size={16} /> Configuración
              </button>
              <button 
                onClick={() => setSeccionAdmin("historico")}
                style={{ backgroundColor: seccionAdmin === "historico" ? "#3B82F6" : "transparent", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <History size={16} /> Historial
              </button>
              <button 
                onClick={() => setSeccionAdmin("exportar")}
                style={{ backgroundColor: seccionAdmin === "exportar" ? "#3B82F6" : "transparent", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <Download size={16} /> Exportar
              </button>
            </nav>
          </div>
          <button onClick={() => setAdminAutenticado(false)} style={{ backgroundColor: "#EF4444", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}>
            Cerrar Sesión
          </button>
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>
          {seccionAdmin === "moderacion" && <PanelAdmin />}
          {seccionAdmin === "estadisticas" && <Estadisticas />}
          {seccionAdmin === "config" && <ConfiguracionMapa />}
          {seccionAdmin === "historico" && <HistoricoReportes />}
          {seccionAdmin === "exportar" && <ExportarReportes />}
        </main>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <header style={{ backgroundColor: "#1E293B", color: "white", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", zIndex: 1000 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "24px" }}>Mapa de Inseguridad</h1>
          <button onClick={() => setVistaActual("admin")} style={{ backgroundColor: "#3B82F6", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={16} /> Panel Admin
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setAlertasAbierto(true)} style={{ backgroundColor: "#8B5CF6", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={20} /> Alertas de Zona
          </button>
          <button onClick={() => setEmergenciasAbierto(true)} style={{ backgroundColor: "#FFA500", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <PhoneCall size={20} /> Emergencias
          </button>
          <button onClick={manejarClickReportar} style={{ backgroundColor: "#EF4444", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={20} /> Reportar Incidente
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", width: "100vw" }}>
        <MapaInteractivo ubicacionTemporal={ubicacionUsuario} onMapClick={manejarClickMapa} compartirParams={compartirParams} />
      </main>

      <ModalReporte isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSubmit={manejarEnvioReporte} ubicacion={ubicacionUsuario} />
      <DirectorioEmergencia isOpen={emergenciasAbierto} onClose={() => setEmergenciasAbierto(false)} />
      <SuscripcionAlerta isOpen={alertasAbierto} onClose={() => setAlertasAbierto(false)} />
    </div>
  );
}

export default App;
