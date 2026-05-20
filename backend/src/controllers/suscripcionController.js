const pool = require("../config/db");
const nodemailer = require("nodemailer");

// Fórmula de Haversine para calcular distancia entre dos coordenadas (en metros)
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Configuración dinámica del transportador SMTP (SMTP real con fallback a cuenta de pruebas Ethereal)
const obtenerTransportador = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (user && pass) {
    return nodemailer.createTransport({
      host: host || "smtp.gmail.com",
      port: port,
      secure: secure,
      auth: { user, pass }
    });
  }

  // Fallback a Ethereal Email para pruebas locales seguras y fluidas
  try {
    const cuentaPruebas = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: cuentaPruebas.smtp.host,
      port: cuentaPruebas.smtp.port,
      secure: cuentaPruebas.smtp.secure,
      auth: {
        user: cuentaPruebas.user,
        pass: cuentaPruebas.pass
      }
    });
  } catch (error) {
    console.error("[SMTP] Error al configurar el transportador de pruebas:", error);
    return null;
  }
};

const crearSuscripcion = async (req, res) => {
  console.log("[DEBUG Suscripcion] Body recibido:", req.body);
  const { correo_notificacion, latitud_zona, longitud_zona, radio_cobertura_metros } = req.body;

  // Validaciones
  if (!correo_notificacion || !latitud_zona || !longitud_zona || !radio_cobertura_metros) {
    console.log("[DEBUG Suscripcion] Faltan campos obligatorios");
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo_notificacion)) {
    console.log("[DEBUG Suscripcion] Correo inválido:", correo_notificacion);
    return res.status(400).json({ error: "Formato de correo electrónico inválido" });
  }

  try {
    const [resultado] = await pool.query(
      "INSERT INTO Suscripcion_Alerta (correo_notificacion, latitud_zona, longitud_zona, radio_cobertura_metros) VALUES (?, ?, ?, ?)",
      [correo_notificacion, latitud_zona, longitud_zona, radio_cobertura_metros]
    );
    res.status(201).json({ mensaje: "Suscripción creada con éxito", id: resultado.insertId });
  } catch (error) {
    res.status(500).json({ error: "Error al crear la suscripción" });
  }
};

const obtenerSuscripciones = async (req, res) => {
  try {
    const [suscripciones] = await pool.query(
      "SELECT * FROM Suscripcion_Alerta ORDER BY id_alerta DESC"
    );
    res.json(suscripciones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las suscripciones" });
  }
};

const eliminarSuscripcion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM Suscripcion_Alerta WHERE id_alerta = ?", [id]);
    res.json({ mensaje: "Suscripción eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la suscripción" });
  }
};

// Función interna que verifica alertas cercanas y despacha los correos electrónicos
const verificarAlertasCercanas = async (latReporte, lngReporte, idReporte) => {
  try {
    const [suscripciones] = await pool.query("SELECT * FROM Suscripcion_Alerta");
    if (suscripciones.length === 0) return 0;

    // Obtener información detallada del reporte para enriquecer el correo
    let tipoIncidente = "Incidente de seguridad verificado";
    let descripcionReporte = "No se ha provisto una descripción adicional para este reporte.";

    if (idReporte) {
      const [detalles] = await pool.query(`
        SELECT r.descripcion, t.nombre as tipo_nombre 
        FROM Reporte r
        JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
        WHERE r.id_reporte = ?
      `, [idReporte]);

      if (detalles.length > 0) {
        tipoIncidente = detalles[0].tipo_nombre;
        descripcionReporte = detalles[0].descripcion || "No se ha provisto una descripción adicional para este reporte.";
      }
    }

    const transportador = await obtenerTransportador();
    let alertasEnviadas = 0;

    for (const sub of suscripciones) {
      const distancia = calcularDistancia(
        latReporte, lngReporte,
        sub.latitud_zona, sub.longitud_zona
      );

      if (distancia <= sub.radio_cobertura_metros) {
        console.log(`[ALERTA] Enviando alerta por correo a: ${sub.correo_notificacion} (Distancia: ${Math.round(distancia)}m)`);

        if (transportador) {
          const remitente = process.env.SMTP_USER 
            ? `"Mapa de Inseguridad" <${process.env.SMTP_USER}>` 
            : '"Mapa de Inseguridad" <alertas@mapainseguridad.org>';

          const mailOptions = {
            from: remitente,
            to: sub.correo_notificacion,
            subject: `Alerta de Seguridad: Incidente reportado en tu area de cobertura`,
            html: `
              <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 16px; background-color: #0b0f19; color: #f8fafc; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Mapa de Inseguridad</h1>
                  <span style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 5px;">Monitoreo Colaborativo Ciudadano</span>
                </div>
                
                <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                  <h2 style="color: #fca5a5; font-size: 17px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">ALERTA DE SEGURIDAD DETECTADA</h2>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #e2e8f0;"><strong>Tipo de Incidente:</strong> ${tipoIncidente}</p>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #e2e8f0;"><strong>Proximidad a tu zona registrada:</strong> Aproximadamente a ${Math.round(distancia)} metros</p>
                  <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                    <p style="margin: 0; font-size: 14px; color: #cbd5e1; font-style: italic;"><strong>Descripcion provista:</strong> "${descripcionReporte}"</p>
                  </div>
                </div>
                
                <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 25px;">
                  Recibes esta notificacion porque registraste tu correo para recibir alertas en un radio de <strong>${sub.radio_cobertura_metros} metros</strong> de tu ubicacion. Te aconsejamos tomar las precauciones necesarias y evitar transitar por la zona reportada en este momento.
                </p>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
                  <p style="margin: 0 0 4px 0;">Este mensaje se ha enviado de forma automatica y confidencial. Por favor no respondas a esta direccion.</p>
                  <p style="margin: 0;">Puedes revocar tu suscripcion a estas alertas ingresando a la plataforma en cualquier momento.</p>
                </div>
              </div>
            `
          };

          transportador.sendMail(mailOptions)
            .then((info) => {
              if (!process.env.SMTP_USER) {
                console.log(`[SMTP ALERTA] Email de prueba enviado con exito. URL de previsualizacion: ${nodemailer.getTestMessageUrl(info)}`);
              } else {
                console.log(`[SMTP ALERTA] Correo real entregado exitosamente a ${sub.correo_notificacion}`);
              }
            })
            .catch((err) => {
              console.error(`[SMTP ERROR] No se pudo enviar el correo de alerta a ${sub.correo_notificacion}:`, err);
            });
        }
        
        alertasEnviadas++;
      }
    }

    return alertasEnviadas;
  } catch (error) {
    console.error("[ALERTA ERROR] Error durante la ejecucion de alertas cercanas:", error);
    return 0;
  }
};

module.exports = {
  crearSuscripcion,
  obtenerSuscripciones,
  eliminarSuscripcion,
  verificarAlertasCercanas,
};
