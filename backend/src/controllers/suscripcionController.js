const pool = require("../config/db");

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

const crearSuscripcion = async (req, res) => {
  const { correo_notificacion, latitud_zona, longitud_zona, radio_cobertura_metros } = req.body;

  // Validaciones
  if (!correo_notificacion || !latitud_zona || !longitud_zona || !radio_cobertura_metros) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo_notificacion)) {
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

// Función interna (no es endpoint) — verifica alertas cercanas a un reporte
const verificarAlertasCercanas = async (latReporte, lngReporte) => {
  try {
    const [suscripciones] = await pool.query("SELECT * FROM Suscripcion_Alerta");
    let alertasEnviadas = 0;

    for (const sub of suscripciones) {
      const distancia = calcularDistancia(
        latReporte, lngReporte,
        sub.latitud_zona, sub.longitud_zona
      );

      if (distancia <= sub.radio_cobertura_metros) {
        console.log(`[ALERTA] Notificación enviada a ${sub.correo_notificacion} - Nuevo incidente a ${Math.round(distancia)}m de su zona suscrita`);
        alertasEnviadas++;
      }
    }

    return alertasEnviadas;
  } catch (error) {
    console.error("[ALERTA] Error al verificar alertas cercanas:", error);
    return 0;
  }
};

module.exports = {
  crearSuscripcion,
  obtenerSuscripciones,
  eliminarSuscripcion,
  verificarAlertasCercanas,
};
