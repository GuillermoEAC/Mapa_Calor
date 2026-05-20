import React, { useState, useEffect } from "react";
import { Phone, ShieldAlert, X } from "lucide-react";

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
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        backgroundColor: "white",
        width: "90%",
        maxWidth: "450px",
        borderRadius: "16px",
        padding: "25px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "#EF4444" }}>
            <ShieldAlert /> Números de Emergencia
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {contactos.map((contacto) => (
            <a 
              key={contacto.id_contacto}
              href={`tel:${contacto.numero}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                backgroundColor: "#F8FAFC",
                borderRadius: "10px",
                textDecoration: "none",
                color: "#1E293B",
                border: "1px solid #E2E8F0",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <div>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>{contacto.institucion}</div>
                <div style={{ color: "#3B82F6", fontWeight: "600", fontSize: "18px" }}>{contacto.numero}</div>
              </div>
              <div style={{ backgroundColor: "#3B82F6", padding: "10px", borderRadius: "50%", color: "white" }}>
                <Phone size={20} fill="white" />
              </div>
            </a>
          ))}
        </div>

        <p style={{ marginTop: "20px", fontSize: "12px", color: "#94A3B8", textAlign: "center" }}>
          Haz clic en cualquier número para llamar directamente desde tu dispositivo.
        </p>
      </div>
    </div>
  );
};

export default DirectorioEmergencia;
