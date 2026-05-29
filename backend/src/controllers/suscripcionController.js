const pool = require("../config/db");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

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

// ─────────────────────────────────────────────────────────────────────────────
// Crear suscripción (con verificación por correo)
// ─────────────────────────────────────────────────────────────────────────────
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
    // Verificar si ya existe una suscripción pendiente (no verificada) con este correo
    const [existentes] = await pool.query(
      "SELECT * FROM Suscripcion_Alerta WHERE correo_notificacion = ? AND verificado = FALSE",
      [correo_notificacion]
    );

    // Si ya hay una pendiente, eliminarla para que pueda re-intentar
    if (existentes.length > 0) {
      await pool.query(
        "DELETE FROM Suscripcion_Alerta WHERE correo_notificacion = ? AND verificado = FALSE",
        [correo_notificacion]
      );
      console.log(`[DEBUG Suscripcion] Eliminada suscripción pendiente anterior para ${correo_notificacion}`);
    }

    // Verificar si ya tiene una suscripción VERIFICADA activa
    const [verificadas] = await pool.query(
      "SELECT * FROM Suscripcion_Alerta WHERE correo_notificacion = ? AND verificado = TRUE",
      [correo_notificacion]
    );

    if (verificadas.length > 0) {
      return res.status(409).json({ 
        error: "Este correo ya tiene una suscripción activa y verificada. Si deseas cambiar tu zona, primero desuscríbete desde el enlace en cualquier correo de alerta." 
      });
    }

    // Generar token único de verificación
    const token = uuidv4();

    // Guardar suscripción como NO verificada
    const [resultado] = await pool.query(
      "INSERT INTO Suscripcion_Alerta (correo_notificacion, latitud_zona, longitud_zona, radio_cobertura_metros, verificado, token_verificacion) VALUES (?, ?, ?, ?, FALSE, ?)",
      [correo_notificacion, latitud_zona, longitud_zona, radio_cobertura_metros, token]
    );

    console.log(`[DEBUG Suscripcion] Suscripción creada con ID ${resultado.insertId}, token: ${token}`);

    // Enviar correo de verificación/bienvenida
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const enlaceVerificacion = `${backendUrl}/api/suscripciones/verificar/${token}`;

    const transportador = await obtenerTransportador();

    if (transportador) {
      const remitente = process.env.SMTP_USER 
        ? `"Mapa de Inseguridad" <${process.env.SMTP_USER}>` 
        : '"Mapa de Inseguridad" <alertas@mapainseguridad.org>';

      const mailOptions = {
        from: remitente,
        to: correo_notificacion,
        subject: "Confirma tu suscripción - Mapa de Inseguridad",
        html: `
          <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 16px; background-color: #0b0f19; color: #f8fafc; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Mapa de Inseguridad</h1>
              <span style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 5px;">Monitoreo Colaborativo Ciudadano</span>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 25px; text-align: center;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(124, 58, 237, 0.2); border: 2px solid #7c3aed; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 22px; font-weight: 800; color: #a78bfa;">ALERTA</span>
              </div>
              <h2 style="color: #ddd6fe; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">¡Bienvenido al Sistema de Alertas!</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                Hemos recibido tu solicitud para recibir alertas de seguridad en un radio de <strong style="color: #a78bfa;">${radio_cobertura_metros} metros</strong> de tu ubicación actual.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #e2e8f0; line-height: 1.6;">
                Para activar tu suscripción y confirmar que este correo te pertenece, haz clic en el siguiente botón:
              </p>
              <a href="${enlaceVerificacion}" 
                 style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                Confirmar mi suscripción
              </a>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #e2e8f0;">¿Qué pasa si no confirmas?</strong>
              </p>
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Si no confirmas tu correo, la suscripción no se activará y no recibirás alertas. Esto protege tu privacidad y evita suscripciones no autorizadas.
              </p>
            </div>

            <p style="font-size: 12px; color: #475569; line-height: 1.5; margin-bottom: 8px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:
            </p>
            <p style="font-size: 11px; color: #7c3aed; word-break: break-all; margin: 0 0 20px 0;">
              ${enlaceVerificacion}
            </p>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 4px 0;">Si no solicitaste esta suscripción, simplemente ignora este correo.</p>
              <p style="margin: 0;">Este mensaje se ha enviado de forma automática y confidencial.</p>
            </div>
          </div>
        `
      };

      transportador.sendMail(mailOptions)
        .then((info) => {
          if (!process.env.SMTP_USER) {
            console.log(`[SMTP VERIFICACIÓN] Email de prueba enviado. URL de previsualización: ${nodemailer.getTestMessageUrl(info)}`);
          } else {
            console.log(`[SMTP VERIFICACIÓN] Correo de verificación enviado a ${correo_notificacion}`);
          }
        })
        .catch((err) => {
          console.error(`[SMTP ERROR] No se pudo enviar el correo de verificación a ${correo_notificacion}:`, err);
        });
    }

    res.status(201).json({ 
      mensaje: "Te hemos enviado un correo de verificación. Revisa tu bandeja de entrada (y spam) para confirmar tu suscripción.",
      id: resultado.insertId,
      requiere_verificacion: true
    });

  } catch (error) {
    console.error("[ERROR Suscripcion] Error al crear la suscripción:", error);
    res.status(500).json({ error: "Error al crear la suscripción" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Verificar correo electrónico mediante token
// ─────────────────────────────────────────────────────────────────────────────
const verificarCorreo = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send(generarPaginaHTML("Error", "Token de verificación no proporcionado.", false));
  }

  try {
    // Buscar la suscripción con ese token
    const [suscripciones] = await pool.query(
      "SELECT * FROM Suscripcion_Alerta WHERE token_verificacion = ?",
      [token]
    );

    if (suscripciones.length === 0) {
      return res.status(404).send(generarPaginaHTML(
        "Enlace inválido",
        "Este enlace de verificación no existe o ya fue utilizado. Si necesitas suscribirte nuevamente, visita la plataforma.",
        false
      ));
    }

    const suscripcion = suscripciones[0];

    if (suscripcion.verificado) {
      return res.status(200).send(generarPaginaHTML(
        "Ya verificado",
        `Tu correo <strong>${suscripcion.correo_notificacion}</strong> ya fue verificado anteriormente. Ya estás recibiendo alertas en tu zona.`,
        true
      ));
    }

    // Activar la suscripción
    await pool.query(
      "UPDATE Suscripcion_Alerta SET verificado = TRUE WHERE token_verificacion = ?",
      [token]
    );

    console.log(`[VERIFICACIÓN] Correo verificado exitosamente: ${suscripcion.correo_notificacion}`);

    return res.status(200).send(generarPaginaHTML(
      "¡Correo verificado!",
      `Tu correo <strong>${suscripcion.correo_notificacion}</strong> ha sido verificado correctamente. A partir de ahora recibirás alertas de seguridad en un radio de <strong>${suscripcion.radio_cobertura_metros} metros</strong> de tu ubicación registrada.`,
      true
    ));

  } catch (error) {
    console.error("[ERROR Verificación] Error al verificar el correo:", error);
    return res.status(500).send(generarPaginaHTML(
      "Error del servidor",
      "Ocurrió un error al procesar tu verificación. Inténtalo de nuevo más tarde.",
      false
    ));
  }
};

// Genera la página HTML que ve el usuario al hacer clic en el enlace del correo
const generarPaginaHTML = (titulo, mensaje, exito) => {
  const color = exito ? "#10b981" : "#ef4444";
  const icono = exito ? "✅" : "❌";
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titulo} - Mapa de Inseguridad</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0b0f19;
          color: #f8fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 20px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: ${exito ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 36px;
        }
        h1 {
          font-size: 24px;
          font-weight: 800;
          color: ${color};
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }
        p {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        p strong { color: #e2e8f0; }
        .footer {
          font-size: 12px;
          color: #475569;
          border-top: 1px solid #334155;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${icono}</div>
        <h1>${titulo}</h1>
        <p>${mensaje}</p>
        <p class="footer">Puedes cerrar esta pestaña. — Mapa de Inseguridad</p>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────────────────────────────────
// Obtener suscripciones
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Eliminar suscripción
// ─────────────────────────────────────────────────────────────────────────────
const eliminarSuscripcion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM Suscripcion_Alerta WHERE id_alerta = ?", [id]);
    res.json({ mensaje: "Suscripción eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la suscripción" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Función interna: verificar alertas cercanas y enviar correos
// SOLO envía a suscripciones VERIFICADAS
// ─────────────────────────────────────────────────────────────────────────────
const verificarAlertasCercanas = async (latReporte, lngReporte, idReporte) => {
  try {
    // Solo obtener suscripciones VERIFICADAS
    const [suscripciones] = await pool.query(
      "SELECT * FROM Suscripcion_Alerta WHERE verificado = TRUE"
    );
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
  verificarCorreo,
};
