import React, { useState, useMemo, useCallback, Suspense } from "react";
import MapaInteractivo from "./components/MapaInteractivo";
import ModalReporte from "./components/ModalReporte";
import LoginAdmin from "./components/LoginAdmin";
import DirectorioEmergencia from "./components/DirectorioEmergencia";
import { Shield, AlertTriangle, ArrowLeft, BarChart3, Settings, PhoneCall, ListFilter, History, Bell, Download, LogOut, Moon, Sun } from "lucide-react";
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
  const [temaAdmin, setTemaAdmin] = useState(() => {
    const guardado = localStorage.getItem("tema_admin");
    return guardado === "claro" ? "claro" : "noche";
  });
  const [adminAutenticado, setAdminAutenticado] = useState(false);
  const [tokenJWT, setTokenJWT] = useState(null);

  // Sincronizar el tema (Noche Oliva / Modo Claro) en todo el sistema (:root)
  React.useEffect(() => {
    document.documentElement.setAttribute("data-tema", temaAdmin);
    localStorage.setItem("tema_admin", temaAdmin);
  }, [temaAdmin]);

  const cambiarTemaGlobal = useCallback((nuevoTema) => {
    setTemaAdmin(nuevoTema);
  }, []);

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

  // CU-11: Parsear parámetros de URL una sola vez para mantener referencia estable
  const compartirParams = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has("lat")
      ? {
        lat: parseFloat(urlParams.get("lat")),
        lng: parseFloat(urlParams.get("lng")),
        zoom: parseInt(urlParams.get("zoom") || "13"),
        filtro: urlParams.get("filtro") || "todos",
      }
      : null;
  }, []);

  const manejarClickReportar = useCallback(() => {
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
        () => {
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
  }, []);

  const manejarClickMapa = useCallback((coordenadas) => {
    setUbicacionUsuario(coordenadas);
    setModalAbierto(true);
  }, []);

  const manejarEnvioReporte = useCallback(async (datos) => {
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
    } catch {
      alert("No se pudo conectar con el servidor.");
    }
  }, []);

  const cerrarModalReporte = useCallback(() => setModalAbierto(false), []);
  const cerrarEmergencias = useCallback(() => setEmergenciasAbierto(false), []);
  const cerrarAlertas = useCallback(() => setAlertasAbierto(false), []);

  // ── Callback de login exitoso: guarda el token JWT ──
  const manejarLoginExitoso = useCallback((token) => {
    setTokenJWT(token);
    setAdminAutenticado(true);
  }, []);

  // ── Cerrar sesión: limpiar token ──
  const cerrarSesion = useCallback(() => {
    setTokenJWT(null);
    setAdminAutenticado(false);
    window.history.pushState({}, '', '/');
    setVistaActual("mapa");
  }, []);

  if (vistaActual === "admin") {
    if (!adminAutenticado) {
      return (
        <LoginAdmin
          onLoginSuccess={manejarLoginExitoso}
          onCancelar={() => { window.history.pushState({}, '', '/'); setVistaActual("mapa"); }}
        />
      );
    }

    const SECCIONES_ADMIN = [
      { id: "moderacion", label: "Moderación", desc: "Revisión y validación de reportes entrantes", icon: ListFilter },
      { id: "estadisticas", label: "Estadísticas", desc: "Métricas operativas y patrones de incidencia", icon: BarChart3 },
      { id: "historico", label: "Historial", desc: "Archivo general y mapa de densidad histórica", icon: History },
      { id: "config", label: "Configuración", desc: "Parámetros técnicos del mapa de calor", icon: Settings },
      { id: "exportar", label: "Exportar CSV", desc: "Descarga de registros para hojas de cálculo", icon: Download },
    ];
    const MODOS_APARIENCIA = [
      { id: "noche", icon: Moon },
      { id: "claro", icon: Sun },
    ];
    const infoSeccion = SECCIONES_ADMIN.find((s) => s.id === seccionAdmin) || SECCIONES_ADMIN[0];

    const cambiarTemaAdmin = cambiarTemaGlobal;

    return (
      <div className="admin-layout" data-tema={temaAdmin}>
        {/* Área principal a la izquierda */}
        <div className="admin-main-wrap">
          <header className="admin-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--adm-text)" }}>
                {infoSeccion.label}
              </span>
              <span style={{ color: "var(--adm-border)" }}>/</span>
              <span style={{ fontSize: "12.5px", color: "var(--adm-muted)" }}>
                {infoSeccion.desc}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--adm-muted)" }}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "var(--adm-accent)",
                  display: "inline-block",
                }}
              />
              <span>Panel de Control Activo</span>
            </div>
          </header>

          <main className="admin-content-scroll">
            <div className="animate-fade-in" style={{ maxWidth: "1520px", margin: "0 auto" }}>
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

        {/* Menú lateral a la DERECHA (igual que el menú del mapa principal) */}
        <aside className="admin-sidebar">
          <div>
            {/* Cabecera del Menú Derecho */}
            <div
              style={{
                padding: "16px 16px 14px 16px",
                borderBottom: "1px solid var(--adm-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px",
                    background: "var(--adm-accent-bg)",
                    border: "1px solid var(--adm-accent-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--adm-accent)",
                  }}
                >
                  <Shield size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--adm-text)", lineHeight: 1.2 }}>
                    Administración
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                    Los Mochis • Monitoreo
                  </div>
                </div>
              </div>
            </div>

            {/* Navegación principal */}
            <div style={{ padding: "14px 10px 6px 10px" }}>
              <div
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "var(--adm-muted)",
                  padding: "0 8px 8px 8px",
                }}
              >
                Secciones
              </div>
              <nav className="admin-sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {SECCIONES_ADMIN.map((tab) => {
                  const activo = seccionAdmin === tab.id;
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSeccionAdmin(tab.id)}
                      className={`admin-nav-btn ${activo ? "activo" : ""}`}
                    >
                      <IconComponent size={15} color={activo ? "var(--adm-accent)" : "var(--adm-muted)"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Selector de Apariencia: Noche (Oliva) / Modo Claro */}
            <div style={{ padding: "14px 12px 6px 12px" }}>
              <div
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "var(--adm-muted)",
                  marginBottom: "8px",
                  paddingLeft: "4px",
                }}
              >
                Apariencia
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  background: "var(--adm-bg)",
                  padding: "4px",
                  borderRadius: "8px",
                  border: "1px solid var(--adm-border)",
                }}
              >
                {MODOS_APARIENCIA.map((m) => {
                  const esActivo = temaAdmin === m.id;
                  const IconoModo = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => cambiarTemaAdmin(m.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "7px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: esActivo ? 700 : 500,
                        cursor: "pointer",
                        background: esActivo ? "var(--adm-accent-bg)" : "transparent",
                        color: esActivo ? "var(--adm-accent)" : "var(--adm-muted)",
                        border: esActivo
                          ? "1px solid var(--adm-accent-border)"
                          : "1px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <IconoModo size={13} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pie del Menú Derecho: Volver al mapa y Cerrar sesión */}
          <div
            style={{
              padding: "12px 10px",
              borderTop: "1px solid var(--adm-border)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <button
              onClick={() => {
                window.history.pushState({}, "", "/");
                setVistaActual("mapa");
              }}
              className="admin-nav-btn"
              style={{
                color: "var(--adm-text)",
                backgroundColor: "var(--adm-card)",
                borderColor: "var(--adm-border)",
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={15} color="var(--adm-accent)" />
              <span>Volver al Mapa</span>
            </button>

            <button
              onClick={cerrarSesion}
              className="admin-nav-btn"
              style={{ color: "#ef4444" }}
            >
              <LogOut size={15} color="#ef4444" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", backgroundColor: "var(--bg-deep)" }}>
      {/* ── LOGO Y TÍTULO FLOTANTE (Esquina superior izquierda - Sin barra de header) ── */}
      <div className="glass-panel animate-fade-in hud-titulo">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "var(--adm-accent-bg)",
            border: "1px solid var(--adm-accent-border)",
            color: "var(--adm-accent)",
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
              color: "var(--adm-text)",
              lineHeight: "1.2",
            }}
          >
            Mapa de Inseguridad
          </h1>
          <span className="hud-subtitulo" style={{ fontSize: "11px", color: "var(--adm-muted)", fontWeight: 500 }}>
            Los Mochis • Monitoreo Ciudadano
          </span>
        </div>
      </div>

      {/* ── BOTONES DE ACCIÓN FLOTANTES (Esquina superior derecha) ── */}
      <div className="animate-fade-in hud-acciones">
        <button
          onClick={() => cambiarTemaGlobal(temaAdmin === "noche" ? "claro" : "noche")}
          className="btn-action"
          title={temaAdmin === "noche" ? "Cambiar a Modo Claro" : "Cambiar a Modo Noche (Oliva)"}
        >
          {temaAdmin === "noche" ? <Sun size={15} color="var(--adm-accent)" /> : <Moon size={15} color="var(--adm-accent)" />}
          <span className="hide-mobile">{temaAdmin === "noche" ? "Modo Claro" : "Noche"}</span>
        </button>
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
      <div className="hud-fab-wrap">
        <button
          onClick={manejarClickReportar}
          className="btn-fab-reportar animate-fade-in"
          title="Reportar nuevo incidente en tu ubicación"
        >
          <AlertTriangle size={18} />
          <span>Reportar Incidente</span>
        </button>
      </div>

      <ModalReporte isOpen={modalAbierto} onClose={cerrarModalReporte} onSubmit={manejarEnvioReporte} ubicacion={ubicacionUsuario} />
      <DirectorioEmergencia isOpen={emergenciasAbierto} onClose={cerrarEmergencias} />
      <Suspense fallback={null}>
        <SuscripcionAlerta isOpen={alertasAbierto} onClose={cerrarAlertas} />
      </Suspense>
    </div>
  );
}

export default App;
