const pool = require("../config/db");

// CU 8: Configuración del Mapa
const obtenerConfiguracion = async (req, res) => {
  try {
    const [filas] = await pool.query("SELECT * FROM Configuracion_Mapa WHERE id_config = 1");
    res.json(filas[0]);
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
    res.json({ mensaje: "Configuración actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar configuración" });
  }
};

// CU 12: Directorio de Emergencia
const obtenerDirectorio = async (req, res) => {
  try {
    const [filas] = await pool.query("SELECT * FROM Directorio_Emergencia ORDER BY prioridad ASC");
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
