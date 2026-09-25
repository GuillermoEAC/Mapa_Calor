import React, { useState, Suspense } from "react";
import MapaInteractivo from "./components/MapaInteractivo";
import ModalReporte from "./components/ModalReporte";
import LoginAdmin from "./components/LoginAdmin";
import DirectorioEmergencia from "./components/DirectorioEmergencia";
import { Shield, AlertTriangle, ArrowLeft, BarChart3, Settings, PhoneCall, ListFilter, History, Bell, Download } from "lucide-react";
import { API_BASE_URL } from "./config";

// ── Lazy loading: componentes del admin solo se cargan si el usuario accede a /admin ──
const PanelAdmin = React.lazy(() => import("./components/PanelAdmin"));
const Estadisticas = React.lazy(() => import("./components/Estadisticas"));
const ConfiguracionMapa = React.lazy(() => import("./components/ConfiguracionMapa"));
const HistoricoReportes = React.lazy(() => import("./components/HistoricoReportes"));
const ExportarReportes = React.lazy(() => import("./components/ExportarReportes"));
const SuscripcionAlerta = React.lazy(() => import("./components/SuscripcionAlerta"));

// ── Spinner de carga para Suspense ──
const LoadingSpinner = () => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#94a3b8",
    fontSize: "14px",
    gap: "10px",
  }}>
    <div style={{
      width: "20px",
      height: "20px",
      border: "2px solid #334155",
      borderTop: "2px solid #3b82f6",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    Cargando...
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [emergenciasAbierto, setEmergenciasAbierto] = useState(false);
  const [alertasAbierto, setAlertasAbierto] = useState(false);
  const [vistaActual, setVistaActual] = useState(
    window.location.pathname === "/admin" ? "admin" : "mapa"
  ); // mapa, admin
  const [seccionAdmin, setSeccionAdmin] = useState("moderacion"); // moderacion, estadisticas, config, historico, exportar
  const [adminAutenticado, setAdminAutenticado] = useState(false);
  const [tokenJWT, setTokenJWT] = useState(null);

  // Acceso rápido de administrador mediante combinación de teclas (Ctrl + Alt + A)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setVistaActual((prev) => (prev === "admin" ? "mapa" : "admin"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // CU-11: Parsear parámetros de URL para compartir vista del mapa
  const urlParams = new URLSearchParams(window.location.search);
  const compartirParams = urlParams.has('lat') ? {
    lat: parseFloat(urlParams.get('lat')),
    lng: parseFloat(urlParams.get('lng')),
    zoom: parseInt(urlParams.get('zoom') || '13'),
    filtro: urlParams.get('filtro') || 'todos'
  } : null;

  const manejarClickReportar = () => {
    // Límites geográficos de Los Mochis y ejidos aledaños (~25km radio)
    const LIMITES = { latMin: 25.50, latMax: 26.10, lngMin: -109.30, lngMax: -108.70 };
    const centroLosMochis = [25.7904, -108.9858];

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const { latitude, longitude } = posicion.coords;
          
          // Si el GPS está fuera de cobertura, usar el centro del mapa
          if (
            latitude < LIMITES.latMin || latitude > LIMITES.latMax ||
            longitude < LIMITES.lngMin || longitude > LIMITES.lngMax
          ) {
            alert("Tu ubicación GPS está fuera del área de cobertura de la aplicación. Haz clic en el mapa para seleccionar el punto exacto donde ocurrió el incidente.");
            setUbicacionUsuario(centroLosMochis);
            setModalAbierto(true);
          } else {
            setUbicacionUsuario([latitude, longitude]);
            setModalAbierto(true);
          }
        },
        (error) => {
          alert("No pudimos obtener tu ubicación. Haz clic en el mapa para seleccionar el punto del incidente.");
          setUbicacionUsuario(centroLosMochis);
          setModalAbierto(true);
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalización. Haz clic en el mapa para seleccionar el punto del incidente.");
      setUbicacionUsuario(centroLosMochis);
      setModalAbierto(true);
    }
  };

  const manejarClickMapa = (coordenadas) => {
    setUbicacionUsuario(coordenadas);
    setModalAbierto(true);
  };

  const manejarEnvioReporte = async (datos) => {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/reportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        alert("Reporte enviado a moderacion. Gracias por tu colaboracion ciudadana.");
        setModalAbierto(false);
        setUbicacionUsuario(null);
      } else {
        alert(resultado.error || "Hubo un problema al guardar el reporte.");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    }
  };

  // ── Callback de login exitoso: guarda el token JWT ──
  const manejarLoginExitoso = (token) => {
    setTokenJWT(token);
    setAdminAutenticado(true);
  };

  // ── Cerrar sesión: limpiar token ──
  const cerrarSesion = () => {
    setTokenJWT(null);
    setAdminAutenticado(false);
    window.history.pushState({}, '', '/');
    setVistaActual("mapa");
  };

  if (vistaActual === "admin") {
    if (!adminAutenticado) {
      return (
        <LoginAdmin
          onLoginSuccess={manejarLoginExitoso}
          onCancelar={() => { window.history.pushState({}, '', '/'); setVistaActual("mapa"); }}
        />
      );
    }

    return (
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-deep)" }}>
        <header className="glass-panel" style={{ margin: "16px 20px 0 20px", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1000 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button 
              onClick={() => { window.history.pushState({}, '', '/'); setVistaActual("mapa"); }} 
              className="btn-action"
              style={{ padding: "8px 16px" }}
            >
              <ArrowLeft size={16} /> Volver al Mapa
            </button>
            <nav style={{ display: "flex", gap: "6px" }}>
              <button 
                onClick={() => setSeccionAdmin("moderacion")}
                className={`btn-action ${seccionAdmin === "moderacion" ? "btn-primary" : ""}`}
              >
                <ListFilter size={15} /> Moderación
              </button>
              <button 
                onClick={() => setSeccionAdmin("estadisticas")}
                className={`btn-action ${seccionAdmin === "estadisticas" ? "btn-primary" : ""}`}
              >
                <BarChart3 size={15} /> Estadísticas
              </button>
              <button 
                onClick={() => setSeccionAdmin("config")}
                className={`btn-action ${seccionAdmin === "config" ? "btn-primary" : ""}`}
              >
                <Settings size={15} /> Configuración
              </button>
              <button 
                onClick={() => setSeccionAdmin("historico")}
                className={`btn-action ${seccionAdmin === "historico" ? "btn-primary" : ""}`}
              >
                <History size={15} /> Historial
              </button>
              <button 
                onClick={() => setSeccionAdmin("exportar")}
                className={`btn-action ${seccionAdmin === "exportar" ? "btn-primary" : ""}`}
              >
                <Download size={15} /> Exportar
              </button>
            </nav>
          </div>
          <button 
            onClick={cerrarSesion} 
            className="btn-action"
            style={{ background: "rgba(244, 63, 94, 0.15)", borderColor: "rgba(244, 63, 94, 0.3)", color: "#f43f5e" }}
          >
            Cerrar Sesión
          </button>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px", backgroundColor: "var(--bg-deep)" }}>
          <div className="animate-fade-in" style={{ height: "100%" }}>
            <Suspense fallback={<LoadingSpinner />}>
              {seccionAdmin === "moderacion" && <PanelAdmin token={tokenJWT} />}
              {seccionAdmin === "estadisticas" && <Estadisticas token={tokenJWT} />}
              {seccionAdmin === "config" && <ConfiguracionMapa token={tokenJWT} />}
              {seccionAdmin === "historico" && <HistoricoReportes token={tokenJWT} />}
              {seccionAdmin === "exportar" && <ExportarReportes token={tokenJWT} />}
            </Suspense>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-deep)" }}>
      {/* ── LOGO Y TÍTULO FLOTANTE (Esquina superior izquierda - Sin barra de header) ── */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          position: "absolute",
          top: "18px",
          left: "20px",
          zIndex: 1000,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#ffffff",
          }}
        >
          <Shield size={18} />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "-0.3px",
              color: "#ffffff",
              lineHeight: "1.2",
            }}
          >
            Mapa de Inseguridad
          </h1>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
            Los Mochis • Monitoreo Ciudadano
          </span>
        </div>
      </div>

      {/* ── BOTONES DE ACCIÓN FLOTANTES (Esquina superior derecha) ── */}
      <div
        className="animate-fade-in"
        style={{
          position: "absolute",
          top: "18px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <button 
          onClick={() => setAlertasAbierto(true)} 
          className="btn-action"
          title="Alertas de Zona por correo"
        >
          <Bell size={15} />
          <span className="hide-mobile">Alertas</span>
        </button>
        <button 
          onClick={() => setEmergenciasAbierto(true)} 
          className="btn-action"
          title="Directorio de Números de Emergencia"
        >
          <PhoneCall size={15} />
          <span className="hide-mobile">Emergencias 911</span>
        </button>
      </div>

      {/* ── MAPA A PANTALLA COMPLETA ── */}
      <main style={{ width: "100%", height: "100%" }}>
        <MapaInteractivo
          ubicacionTemporal={ubicacionUsuario}
          onMapClick={manejarClickMapa}
          compartirParams={compartirParams}
        />
      </main>

      {/* ── BOTÓN FLOTANTE DESTACADO (FAB) "+ Reportar Incidente" ── */}
      <div
        style={{
          position: "absolute",
          bottom: "26px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
        }}
      >
        <button 
          onClick={manejarClickReportar} 
          className="btn-fab-reportar animate-fade-in"
          title="Reportar nuevo incidente en tu ubicación"
        >
          <AlertTriangle size={18} />
          <span>Reportar Incidente</span>
        </button>
      </div>

      <ModalReporte isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSubmit={manejarEnvioReporte} ubicacion={ubicacionUsuario} />
      <DirectorioEmergencia isOpen={emergenciasAbierto} onClose={() => setEmergenciasAbierto(false)} />
      <Suspense fallback={null}>
        <SuscripcionAlerta isOpen={alertasAbierto} onClose={() => setAlertasAbierto(false)} />
      </Suspense>
    </div>
  );
}

export default App;
