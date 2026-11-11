import React, { useState, useEffect } from "react";
import { Phone, ShieldAlert, X } from "lucide-react";
import { API_BASE_URL } from "../config";

// Caché en memoria para no volver a pedir el directorio cada vez que se abre el modal
let contactosCache = null;

// ─────────────────────────────────────────────────────────────────────────────
// CU-12: Directorio de Emergencia con UI Glassmorphic Premium
// ─────────────────────────────────────────────────────────────────────────────
const DirectorioEmergencia = ({ isOpen, onClose }) => {
  const [contactos, setContactos] = useState(contactosCache || []);

  useEffect(() => {
    if (isOpen && !contactosCache) {
      fetch(`${API_BASE_URL}/api/emergencias`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            contactosCache = data;
            setContactos(data);
          }
        })
        .catch(err => console.error("Error al cargar directorio:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(8, 12, 24, 0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      padding: "20px"
    }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ 
            margin: 0, 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            color: "var(--adm-text)",
            fontSize: "21px",
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
              <ShieldAlert size={20} />
            </span>
            Directorio de Emergencia
          </h2>
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

        {/* Contactos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {contactos.map((contacto) => (
            <a 
              key={contacto.id_contacto}
              href={`tel:${contacto.numero}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                background: "var(--adm-card-alt)",
                border: "1px solid var(--adm-border)",
                borderRadius: "12px",
                textDecoration: "none",
                color: "var(--adm-text)",
                transition: "all 0.2s ease"
              }}
            >
              <div>
                <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--adm-text)" }}>{contacto.institucion}</div>
                <div style={{ color: "var(--adm-accent)", fontWeight: "800", fontSize: "20px", marginTop: "4px", letterSpacing: "0.5px" }}>{contacto.numero}</div>
              </div>
              <div style={{ 
                background: "#059669", 
                width: "42px",
                height: "42px",
                borderRadius: "8px", 
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Phone size={18} fill="white" />
              </div>
            </a>
          ))}
        </div>

        <p style={{ marginTop: "24px", fontSize: "12.5px", color: "var(--adm-muted)", textAlign: "center", lineHeight: "1.5" }}>
          Haz clic en cualquier contacto para realizar la llamada de forma directa desde tu dispositivo móvil.
        </p>
      </div>
    </div>
  );
};

export default DirectorioEmergencia;
