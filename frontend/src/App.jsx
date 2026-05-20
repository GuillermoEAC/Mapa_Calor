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
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#0f172a" }}>
        <header className="glass-header" style={{ padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1000 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
            <button 
              onClick={() => setVistaActual("mapa")} 
              className="btn-premium btn-secondary"
              style={{ padding: "10px 18px", fontSize: "14px" }}
            >
              <ArrowLeft size={16} /> Volver al Mapa
            </button>
            <nav style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setSeccionAdmin("moderacion")}
                className={`btn-premium ${seccionAdmin === "moderacion" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 18px", fontSize: "14px" }}
              >
                <ListFilter size={16} /> Moderación
              </button>
              <button 
                onClick={() => setSeccionAdmin("estadisticas")}
                className={`btn-premium ${seccionAdmin === "estadisticas" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 18px", fontSize: "14px" }}
              >
                <BarChart3 size={16} /> Estadísticas
              </button>
              <button 
                onClick={() => setSeccionAdmin("config")}
                className={`btn-premium ${seccionAdmin === "config" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 18px", fontSize: "14px" }}
              >
                <Settings size={16} /> Configuración
              </button>
              <button 
                onClick={() => setSeccionAdmin("historico")}
                className={`btn-premium ${seccionAdmin === "historico" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 18px", fontSize: "14px" }}
              >
                <History size={16} /> Historial
              </button>
              <button 
                onClick={() => setSeccionAdmin("exportar")}
                className={`btn-premium ${seccionAdmin === "exportar" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 18px", fontSize: "14px" }}
              >
                <Download size={16} /> Exportar
              </button>
            </nav>
          </div>
          <button 
            onClick={() => setAdminAutenticado(false)} 
            className="btn-premium btn-danger"
            style={{ padding: "10px 18px", fontSize: "14px" }}
          >
            Cerrar Sesión
          </button>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px", backgroundColor: "#0f172a" }}>
          <div className="animate-fade-in" style={{ height: "100%" }}>
            {seccionAdmin === "moderacion" && <PanelAdmin />}
            {seccionAdmin === "estadisticas" && <Estadisticas />}
            {seccionAdmin === "config" && <ConfiguracionMapa />}
            {seccionAdmin === "historico" && <HistoricoReportes />}
            {seccionAdmin === "exportar" && <ExportarReportes />}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#0b0f19" }}>
      <header className="glass-header" style={{ padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1000, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)", position: "relative" }}>
        {/* Glow sutil en el header */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "10%",
          width: "300px",
          height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)",
          pointerEvents: "none"
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
          {/* Logo Premium */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%)",
              boxShadow: "0 0 25px rgba(139, 92, 246, 0.35)",
              color: "white"
            }}>
              <Shield size={22} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: "24px", 
                fontWeight: 900, 
                letterSpacing: "-0.75px",
                background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: "1.1"
              }}>
                Mapa de Inseguridad
              </h1>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.8px", marginTop: "3px" }}>
                Monitoreo Colaborativo
              </span>
            </div>
          </div>

          <button 
            onClick={() => setVistaActual("admin")} 
            className="btn-premium btn-secondary"
            style={{ padding: "8px 16px", fontSize: "13px", height: "36px" }}
          >
            <Shield size={14} /> Panel Admin
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            onClick={() => setAlertasAbierto(true)} 
            className="btn-premium btn-purple"
            style={{ padding: "11px 22px", fontSize: "14px", height: "42px" }}
          >
            <Bell size={16} /> Alertas de Zona
          </button>
          <button 
            onClick={() => setEmergenciasAbierto(true)} 
            className="btn-premium btn-warning"
            style={{ padding: "11px 22px", fontSize: "14px", height: "42px" }}
          >
            <PhoneCall size={16} /> Emergencias
          </button>
          <button 
            onClick={manejarClickReportar} 
            className="btn-premium btn-danger pulse-glow"
            style={{ padding: "11px 24px", fontSize: "14px", height: "42px", fontWeight: "700" }}
          >
            <AlertTriangle size={16} /> Reportar Incidente
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", width: "100vw", overflow: "hidden" }}>
        <MapaInteractivo ubicacionTemporal={ubicacionUsuario} onMapClick={manejarClickMapa} compartirParams={compartirParams} />
      </main>

      <ModalReporte isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSubmit={manejarEnvioReporte} ubicacion={ubicacionUsuario} />
      <DirectorioEmergencia isOpen={emergenciasAbierto} onClose={() => setEmergenciasAbierto(false)} />
      <SuscripcionAlerta isOpen={alertasAbierto} onClose={() => setAlertasAbierto(false)} />
    </div>
  );
}

export default App;
