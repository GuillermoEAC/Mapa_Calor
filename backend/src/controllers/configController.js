const pool = require("../config/db");

// Caché en memoria para evitar consultas repetidas a tablas estáticas
let configCache = null;
let configCacheTime = 0;
let directorioCache = null;
let directorioCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// CU 8: Configuración del Mapa
const obtenerConfiguracion = async (req, res) => {
  try {
    const ahora = Date.now();
    if (configCache && ahora - configCacheTime < CACHE_TTL_MS) {
      res.set("Cache-Control", "public, max-age=60");
      return res.json(configCache);
    }

    const [filas] = await pool.query("SELECT * FROM Configuracion_Mapa WHERE id_config = 1");
    configCache = filas[0] || { id_config: 1, radio_puntos: 500, desenfoque_puntos: 15, opacidad_puntos: 0.15 };
    configCacheTime = ahora;

    res.set("Cache-Control", "public, max-age=60");
    res.json(configCache);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener configuración" });
  }
};

const actualizarConfiguracion = async (req, res) => {
  const { radio, desenfoque, opacidad } = req.body;
  try {
    await pool.query(
      "UPDATE Configuracion_Mapa SET radio_puntos = ?, desenfoque_puntos = ?, opacidad_puntos = ? WHERE id_config = 1",
      [radio, desenfoque, opacidad]
    );
    // Invalidar caché inmediatamente para que el mapa refleje los nuevos valores
    configCache = null;
    configCacheTime = 0;

    res.json({ mensaje: "Configuración actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar configuración" });
  }
};

// CU 12: Directorio de Emergencia
const obtenerDirectorio = async (req, res) => {
  try {
    const ahora = Date.now();
    if (directorioCache && ahora - directorioCacheTime < CACHE_TTL_MS) {
      res.set("Cache-Control", "public, max-age=300");
      return res.json(directorioCache);
    }

    const [filas] = await pool.query("SELECT * FROM Directorio_Emergencia ORDER BY prioridad ASC");
    directorioCache = filas;
    directorioCacheTime = ahora;

    res.set("Cache-Control", "public, max-age=300");
    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener directorio" });
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerDirectorio,
};
