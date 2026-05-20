import React, { useState, useEffect } from "react";
import { Phone, ShieldAlert, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CU-12: Directorio de Emergencia con UI Glassmorphic Premium
// ─────────────────────────────────────────────────────────────────────────────
const DirectorioEmergencia = ({ isOpen, onClose }) => {
  const [contactos, setContactos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetch("http://localhost:3000/api/emergencias")
        .then(res => res.json())
        .then(data => setContactos(data))
        .catch(err => console.error("Error al cargar directorio:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(8, 12, 24, 0.75)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      padding: "20px"
    }}>
      <div 
        className="glass-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "30px",
          position: "relative",
          background: "linear-gradient(135deg, rgba(30, 20, 20, 0.45) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.08)"
        }}
      >
        {/* Glow decorativo de fondo */}
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "150px",
          height: "150px",
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)",
          zIndex: -1,
          pointerEvents: "none"
        }} />

        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ 
            margin: 0, 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            color: "#f8fafc",
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
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
              boxShadow: "0 4px 15px rgba(220, 38, 38, 0.35)",
              color: "white"
            }}>
              <ShieldAlert size={20} />
            </span>
            Directorio de Emergencia
          </h2>
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
                background: "rgba(30, 41, 59, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "14px",
                textDecoration: "none",
                color: "#f8fafc",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "rgba(30, 41, 59, 0.7)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "rgba(30, 41, 59, 0.45)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <div style={{ fontWeight: "600", fontSize: "15px", color: "#e2e8f0" }}>{contacto.institucion}</div>
                <div style={{ color: "#3b82f6", fontWeight: "800", fontSize: "20px", marginTop: "4px", letterSpacing: "0.5px" }}>{contacto.numero}</div>
              </div>
              <div style={{ 
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
                width: "42px",
                height: "42px",
                borderRadius: "12px", 
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(29, 78, 216, 0.3)"
              }}>
                <Phone size={18} fill="white" />
              </div>
            </a>
          ))}
        </div>

        <p style={{ marginTop: "24px", fontSize: "12.5px", color: "#64748b", textAlign: "center", lineHeight: "1.5" }}>
          Haz clic en cualquier contacto para realizar la llamada de forma directa desde tu dispositivo móvil.
        </p>
      </div>
    </div>
  );
};

export default DirectorioEmergencia;
