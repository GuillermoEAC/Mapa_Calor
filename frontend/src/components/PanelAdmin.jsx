import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from "react-leaflet";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  RefreshCw,
  ExternalLink,
  Search,
  CheckSquare,
  Square,
  Map as MapIcon,
  EyeOff,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import "leaflet/dist/leaflet.css";

const TIPOS_COLORES = {
  "Robo / Asalto": { bg: "rgba(239, 68, 68, 0.14)", text: "#ef4444", border: "rgba(239, 68, 68, 0.35)", hex: "#ef4444" },
  "Vandalismo": { bg: "rgba(249, 115, 22, 0.14)", text: "#f97316", border: "rgba(249, 115, 22, 0.35)", hex: "#f97316" },
  "Fallo de Alumbrado": { bg: "rgba(234, 179, 8, 0.14)", text: "#eab308", border: "rgba(234, 179, 8, 0.35)", hex: "#eab308" },
  "Actividad Sospechosa": { bg: "rgba(139, 92, 246, 0.14)", text: "#a855f7", border: "rgba(139, 92, 246, 0.35)", hex: "#8b5cf6" },
  "Acoso / Zona Insegura": { bg: "rgba(236, 72, 153, 0.14)", text: "#ec4899", border: "rgba(236, 72, 153, 0.35)", hex: "#ec4899" },
  "Fuga de Agua": { bg: "rgba(14, 165, 233, 0.14)", text: "#0ea5e9", border: "rgba(14, 165, 233, 0.35)", hex: "#0ea5e9" },
  "Accidente Vehicular": { bg: "rgba(6, 182, 212, 0.14)", text: "#06b6d4", border: "rgba(6, 182, 212, 0.35)", hex: "#06b6d4" },
  "Incendio / Quema": { bg: "rgba(234, 88, 12, 0.14)", text: "#ea580c", border: "rgba(234, 88, 12, 0.35)", hex: "#ea580c" },
  "Fuga de Gas": { bg: "rgba(202, 138, 4, 0.14)", text: "#ca8a04", border: "rgba(202, 138, 4, 0.35)", hex: "#eab308" },
};

const CAPAS_MINIMAPA = {
  hibrido: {
    nombre: "Satélite + Calles",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    oscuro: false,
  },
  oscuro: {
    nombre: "Oscuro",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    oscuro: true,
  },
  calles: {
    nombre: "Calles",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    oscuro: false,
  },
};

const ControladorMiniMapa = ({ reporteActivo, modoOscuro }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (modoOscuro) {
      container.classList.add("mapa-modo-oscuro");
    } else {
      container.classList.remove("mapa-modo-oscuro");
    }
  }, [map, modoOscuro]);

  useEffect(() => {
    if (reporteActivo && reporteActivo.latitud && reporteActivo.longitud) {
      map.flyTo([Number(reporteActivo.latitud), Number(reporteActivo.longitud)], 16, {
        duration: 0.45,
      });
    }
  }, [map, reporteActivo]);

  return null;
};

const formatearFechaHoraDMA = (fecha) => {
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const PanelAdmin = ({ token }) => {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoIds, setProcesandoIds] = useState([]);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  // Selección múltiple y reporte activo en el mini-mapa
  const [seleccionados, setSeleccionados] = useState([]);
  const [reporteInspeccionId, setReporteInspeccionId] = useState(null);
  const [mostrarMiniMapa, setMostrarMiniMapa] = useState(true);
  const [capaMiniMapa, setCapaMiniMapa] = useState("hibrido");

  const cargarReportes = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const datos = await respuesta.json();
      const lista = Array.isArray(datos) ? datos : [];
      setReportes(lista);
      setSeleccionados([]);
      if (lista.length > 0) {
        setReporteInspeccionId((prev) =>
          lista.some((r) => r.id_reporte === prev) ? prev : lista[0].id_reporte
        );
      } else {
        setReporteInspeccionId(null);
      }
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const conteoPorTipo = useMemo(() => {
    const mapa = {};
    reportes.forEach((r) => {
      const t = r.tipo_incidente || "Otro";
      mapa[t] = (mapa[t] || 0) + 1;
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [reportes]);

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((r) => {
      if (filtroTipo !== "TODOS" && r.tipo_incidente !== filtroTipo) {
        return false;
      }
      if (busqueda.trim() !== "") {
        const q = busqueda.toLowerCase();
        const matchId = String(r.id_reporte).includes(q);
        const matchDesc = (r.descripcion || "").toLowerCase().includes(q);
        const matchTipo = (r.tipo_incidente || "").toLowerCase().includes(q);
        const matchCoord = `${r.latitud},${r.longitud}`.includes(q);
        return matchId || matchDesc || matchTipo || matchCoord;
      }
      return true;
    });
  }, [reportes, filtroTipo, busqueda]);

  const reporteActivo = useMemo(() => {
    if (!reportesFiltrados.length) return null;
    return (
      reportesFiltrados.find((r) => r.id_reporte === reporteInspeccionId) ||
      reportesFiltrados[0]
    );
  }, [reportesFiltrados, reporteInspeccionId]);

  const cambiarEstado = async (id, estado) => {
    setProcesandoIds((prev) => [...prev, id]);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/reportes/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nuevo_estado: estado }),
      });

      if (resp.ok) {
        setReportes((prev) => prev.filter((r) => r.id_reporte !== id));
        setSeleccionados((prev) => prev.filter((selId) => selId !== id));
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    } finally {
      setProcesandoIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const cambiarEstadoEnLote = async (estado) => {
    if (seleccionados.length === 0) return;
    const idsAProcesar = [...seleccionados];
    setProcesandoIds((prev) => [...new Set([...prev, ...idsAProcesar])]);

    try {
      await Promise.all(
        idsAProcesar.map((id) =>
          fetch(`${API_BASE_URL}/api/reportes/${id}/estado`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ nuevo_estado: estado }),
          })
        )
      );
      setReportes((prev) => prev.filter((r) => !idsAProcesar.includes(r.id_reporte)));
      setSeleccionados([]);
    } catch (error) {
      console.error("Error en acción por lote:", error);
    } finally {
      setProcesandoIds((prev) => prev.filter((id) => !idsAProcesar.includes(id)));
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const todosVisiblesSeleccionados =
    reportesFiltrados.length > 0 &&
    reportesFiltrados.every((r) => seleccionados.includes(r.id_reporte));

  const toggleSeleccionarTodos = () => {
    if (todosVisiblesSeleccionados) {
      const visiblesIds = new Set(reportesFiltrados.map((r) => r.id_reporte));
      setSeleccionados((prev) => prev.filter((id) => !visiblesIds.has(id)));
    } else {
      const nuevosIds = reportesFiltrados.map((r) => r.id_reporte);
      setSeleccionados((prev) => [...new Set([...prev, ...nuevosIds])]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Barra superior de herramientas */}
      <div
        className="admin-card"
        style={{
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px", maxWidth: "420px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={14}
              color="var(--adm-muted)"
              style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Buscar por #ID, descripción o coordenadas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 12px 7px 32px",
                fontSize: "12.5px",
                borderRadius: "6px",
                backgroundColor: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                color: "var(--adm-text)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "var(--adm-card-alt)",
              border: "1px solid var(--adm-border)",
              padding: "6px 12px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "var(--adm-muted)" }}>Pendientes:</span>
            <strong style={{ color: reportes.length > 0 ? "var(--adm-accent)" : "#10b981", fontSize: "13px" }}>
              {reportes.length}
            </strong>
          </div>

          <button
            onClick={() => setMostrarMiniMapa((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              background: mostrarMiniMapa ? "var(--adm-accent-bg)" : "var(--adm-card-alt)",
              border: mostrarMiniMapa ? "1px solid var(--adm-accent-border)" : "1px solid var(--adm-border)",
              borderRadius: "6px",
              color: mostrarMiniMapa ? "var(--adm-accent)" : "var(--adm-text)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {mostrarMiniMapa ? <EyeOff size={13} /> : <MapIcon size={13} />}
            <span>{mostrarMiniMapa ? "Ocultar Mapa" : "Mostrar Mapa"}</span>
          </button>

          <button
            onClick={cargarReportes}
            disabled={cargando}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              background: "var(--adm-card-alt)",
              border: "1px solid var(--adm-border)",
              borderRadius: "6px",
              color: "var(--adm-text)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: cargando ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={13} style={{ animation: cargando ? "spin 0.8s linear infinite" : "none" }} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros rápidos por categoría */}
      {reportes.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "2px",
          }}
        >
          <button
            onClick={() => setFiltroTipo("TODOS")}
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: filtroTipo === "TODOS" ? 700 : 500,
              cursor: "pointer",
              background: filtroTipo === "TODOS" ? "var(--adm-accent-bg)" : "var(--adm-card)",
              color: filtroTipo === "TODOS" ? "var(--adm-accent)" : "var(--adm-muted)",
              border: filtroTipo === "TODOS" ? "1px solid var(--adm-accent-border)" : "1px solid var(--adm-border)",
              whiteSpace: "nowrap",
            }}
          >
            Todos ({reportes.length})
          </button>

          {conteoPorTipo.map(([tipo, cantidad]) => {
            const activo = filtroTipo === tipo;
            const colorInfo = TIPOS_COLORES[tipo];
            return (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(activo ? "TODOS" : tipo)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 11px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: activo ? 700 : 500,
                  cursor: "pointer",
                  background: activo ? "var(--adm-accent-bg)" : "var(--adm-card)",
                  color: activo ? "var(--adm-accent)" : "var(--adm-muted)",
                  border: activo ? "1px solid var(--adm-accent-border)" : "1px solid var(--adm-border)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: colorInfo?.hex || "#a1a1aa",
                  }}
                />
                <span>{tipo}</span>
                <span style={{ opacity: 0.75, fontSize: "11px" }}>({cantidad})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Barra de Acciones en Lote */}
      {seleccionados.length > 0 && (
        <div
          className="admin-card animate-fade-in"
          style={{
            padding: "10px 16px",
            background: "var(--adm-card-alt)",
            borderColor: "var(--adm-accent-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px" }}>
            <span
              style={{
                background: "var(--adm-accent)",
                color: "#111111",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {seleccionados.length}
            </span>
            <span style={{ color: "var(--adm-text)", fontWeight: 600 }}>
              reportes seleccionados para acción rápida
            </span>
            <button
              onClick={() => setSeleccionados([])}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--adm-muted)",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Desmarcar todos
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => cambiarEstadoEnLote("APROBADO")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: "#059669",
                border: "1px solid #10b981",
                color: "#ffffff",
              }}
            >
              <CheckCircle2 size={13} />
              <span>Aprobar seleccionados ({seleccionados.length})</span>
            </button>

            <button
              onClick={() => cambiarEstadoEnLote("RECHAZADO")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: "#be123c",
                border: "1px solid #f43f5e",
                color: "#ffffff",
              }}
            >
              <XCircle size={13} />
              <span>Rechazar seleccionados ({seleccionados.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Cuerpo principal: Mini-Mapa a la Izquierda + Tabla a la Derecha (junto al menú derecho) */}
      {cargando && reportes.length === 0 ? (
        <div className="admin-card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--adm-muted)" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid var(--adm-border)",
              borderTop: "2px solid var(--adm-accent)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px auto",
            }}
          />
          <span style={{ fontSize: "13px" }}>Cargando cola de moderación...</span>
        </div>
      ) : reportes.length === 0 ? (
        <div
          className="admin-card"
          style={{
            padding: "48px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.14)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--adm-text)" }}>
            Cola de moderación al día
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--adm-muted)", maxWidth: "400px" }}>
            No hay reportes pendientes de revisión en este momento.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mostrarMiniMapa ? "380px minmax(0, 1fr)" : "1fr",
            gap: "14px",
            alignItems: "start",
          }}
        >
          {/* Columna Izquierda: Mini-Mapa Integrado de Inspección */}
          {mostrarMiniMapa && reporteActivo && (
            <div className="admin-card" style={{ overflow: "hidden", position: "sticky", top: "0" }}>
              <div
                style={{
                  padding: "11px 14px",
                  borderBottom: "1px solid var(--adm-border)",
                  background: "var(--adm-card-alt)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <MapPin size={14} color="var(--adm-accent)" />
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--adm-text)" }}>
                    Ubicación #{reporteActivo.id_reporte}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "4px" }}>
                  {Object.entries(CAPAS_MINIMAPA).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setCapaMiniMapa(key)}
                      style={{
                        padding: "3px 7px",
                        borderRadius: "4px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: capaMiniMapa === key ? "var(--adm-accent-bg)" : "transparent",
                        color: capaMiniMapa === key ? "var(--adm-accent)" : "var(--adm-muted)",
                        border:
                          capaMiniMapa === key
                            ? "1px solid var(--adm-accent-border)"
                            : "1px solid transparent",
                      }}
                    >
                      {info.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visor Leaflet */}
              <div style={{ height: "265px", width: "100%", position: "relative", background: "#09090b" }}>
                <MapContainer
                  center={[Number(reporteActivo.latitud), Number(reporteActivo.longitud)]}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <ControladorMiniMapa
                    reporteActivo={reporteActivo}
                    modoOscuro={CAPAS_MINIMAPA[capaMiniMapa].oscuro}
                  />
                  <TileLayer
                    key={capaMiniMapa}
                    url={CAPAS_MINIMAPA[capaMiniMapa].url}
                    maxZoom={20}
                  />

                  <Circle
                    center={[Number(reporteActivo.latitud), Number(reporteActivo.longitud)]}
                    radius={85}
                    pathOptions={{
                      color: TIPOS_COLORES[reporteActivo.tipo_incidente]?.hex || "#f59e0b",
                      fillColor: TIPOS_COLORES[reporteActivo.tipo_incidente]?.hex || "#f59e0b",
                      fillOpacity: 0.18,
                      weight: 1.5,
                    }}
                  />

                  {reportesFiltrados.map((r) => {
                    const activo = r.id_reporte === reporteActivo.id_reporte;
                    const colorHex = TIPOS_COLORES[r.tipo_incidente]?.hex || "#f59e0b";
                    return (
                      <CircleMarker
                        key={r.id_reporte}
                        center={[Number(r.latitud), Number(r.longitud)]}
                        radius={activo ? 8 : 5}
                        eventHandlers={{
                          click: () => setReporteInspeccionId(r.id_reporte),
                        }}
                        pathOptions={{
                          color: "#ffffff",
                          weight: activo ? 2.5 : 1,
                          fillColor: colorHex,
                          fillOpacity: activo ? 1 : 0.7,
                        }}
                      />
                    );
                  })}
                </MapContainer>
              </div>

              {/* Ficha inferior del reporte activo */}
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    className="admin-badge"
                    style={{
                      backgroundColor: TIPOS_COLORES[reporteActivo.tipo_incidente]?.bg || "var(--adm-card-alt)",
                      color: TIPOS_COLORES[reporteActivo.tipo_incidente]?.text || "var(--adm-text)",
                      border: `1px solid ${TIPOS_COLORES[reporteActivo.tipo_incidente]?.border || "var(--adm-border)"}`,
                    }}
                  >
                    {reporteActivo.tipo_incidente}
                  </span>

                  <a
                    href={`https://www.google.com/maps?q=${reporteActivo.latitud},${reporteActivo.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--adm-muted)",
                      fontSize: "11.5px",
                      textDecoration: "none",
                    }}
                  >
                    <span>
                      {Number(reporteActivo.latitud).toFixed(5)}, {Number(reporteActivo.longitud).toFixed(5)}
                    </span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div
                  style={{
                    background: "var(--adm-card-alt)",
                    border: "1px solid var(--adm-border)",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "12.5px",
                    color: "var(--adm-text)",
                    lineHeight: 1.45,
                    minHeight: "52px",
                  }}
                >
                  {reporteActivo.descripcion ? (
                    `"${reporteActivo.descripcion}"`
                  ) : (
                    <span style={{ color: "var(--adm-muted)", fontStyle: "italic" }}>
                      El ciudadano no incluyó descripción escrita.
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "4px" }}>
                  <button
                    onClick={() => cambiarEstado(reporteActivo.id_reporte, "APROBADO")}
                    disabled={procesandoIds.includes(reporteActivo.id_reporte)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "#059669",
                      border: "1px solid #10b981",
                      color: "#ffffff",
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Aprobar #{reporteActivo.id_reporte}</span>
                  </button>

                  <button
                    onClick={() => cambiarEstado(reporteActivo.id_reporte, "RECHAZADO")}
                    disabled={procesandoIds.includes(reporteActivo.id_reporte)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "#be123c",
                      border: "1px solid #f43f5e",
                      color: "#ffffff",
                    }}
                  >
                    <XCircle size={14} />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Columna Derecha (Centro): Tabla de Reportes */}
          <div className="admin-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 230px)" }}>
              <table className="admin-table">
                <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
                  <tr>
                    <th style={{ width: "36px", textAlign: "center", padding: "11px 8px 11px 14px" }}>
                      <button
                        onClick={toggleSeleccionarTodos}
                        title="Seleccionar todos los visibles"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: todosVisiblesSeleccionados ? "var(--adm-accent)" : "var(--adm-muted)",
                          cursor: "pointer",
                          display: "inline-flex",
                          padding: 0,
                        }}
                      >
                        {todosVisiblesSeleccionados ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </th>
                    <th style={{ width: "64px" }}>ID</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: "right", paddingRight: "16px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "36px 16px", color: "var(--adm-muted)" }}>
                        No hay reportes que coincidan con el filtro actual.
                      </td>
                    </tr>
                  ) : (
                    reportesFiltrados.map((rep) => {
                      const estiloBadge = TIPOS_COLORES[rep.tipo_incidente] || {
                        bg: "var(--adm-card-alt)",
                        text: "var(--adm-text)",
                        border: "var(--adm-border)",
                      };
                      const estaProcesando = procesandoIds.includes(rep.id_reporte);
                      const estaMarcado = seleccionados.includes(rep.id_reporte);
                      const esInspeccionado = reporteActivo?.id_reporte === rep.id_reporte;

                      return (
                        <tr
                          key={rep.id_reporte}
                          onClick={() => setReporteInspeccionId(rep.id_reporte)}
                          className={esInspeccionado ? "fila-seleccionada" : ""}
                          style={{
                            opacity: estaProcesando ? 0.45 : 1,
                            cursor: "pointer",
                          }}
                        >
                          <td
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSeleccion(rep.id_reporte);
                            }}
                            style={{ textAlign: "center", padding: "11px 8px 11px 14px" }}
                          >
                            <button
                              style={{
                                background: "transparent",
                                border: "none",
                                color: estaMarcado ? "var(--adm-accent)" : "var(--adm-muted)",
                                cursor: "pointer",
                                display: "inline-flex",
                                padding: 0,
                              }}
                            >
                              {estaMarcado ? <CheckSquare size={15} /> : <Square size={15} />}
                            </button>
                          </td>
                          <td style={{ color: "var(--adm-muted)", fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>
                            #{rep.id_reporte}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <span
                              className="admin-badge"
                              style={{
                                backgroundColor: estiloBadge.bg,
                                color: estiloBadge.text,
                                border: `1px solid ${estiloBadge.border}`,
                              }}
                            >
                              {rep.tipo_incidente}
                            </span>
                          </td>
                          <td style={{ maxWidth: "260px" }}>
                            {rep.descripcion ? (
                              <span
                                style={{
                                  color: "var(--adm-text)",
                                  fontSize: "12.5px",
                                  lineHeight: 1.35,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {rep.descripcion}
                              </span>
                            ) : (
                              <span style={{ color: "var(--adm-muted)", fontSize: "12px", opacity: 0.7 }}>
                                Sin descripción
                              </span>
                            )}
                          </td>
                          <td style={{ whiteSpace: "nowrap", color: "var(--adm-muted)", fontSize: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Clock size={12} color="var(--adm-muted)" />
                              <span>{formatearFechaHoraDMA(rep.fecha_registro)}</span>
                            </div>
                          </td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            style={{ textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }}
                          >
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => cambiarEstado(rep.id_reporte, "APROBADO")}
                                disabled={estaProcesando}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "5px 10px",
                                  borderRadius: "5px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: estaProcesando ? "wait" : "pointer",
                                  background: "rgba(16, 185, 129, 0.14)",
                                  border: "1px solid rgba(16, 185, 129, 0.35)",
                                  color: "#10b981",
                                }}
                              >
                                <CheckCircle2 size={13} />
                                <span>Aprobar</span>
                              </button>

                              <button
                                onClick={() => cambiarEstado(rep.id_reporte, "RECHAZADO")}
                                disabled={estaProcesando}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "5px 10px",
                                  borderRadius: "5px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: estaProcesando ? "wait" : "pointer",
                                  background: "rgba(244, 63, 94, 0.14)",
                                  border: "1px solid rgba(244, 63, 94, 0.35)",
                                  color: "#f43f5e",
                                }}
                              >
                                <XCircle size={13} />
                                <span>Rechazar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdmin;
