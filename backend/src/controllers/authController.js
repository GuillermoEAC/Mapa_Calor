const pool = require("../config/db");

const loginAdmin = async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const [filas] = await pool.query(
      "SELECT * FROM Administrador WHERE correo = ? AND contrasena = ?",
      [usuario, password],
    );
    if (filas.length > 0) {
      res.json({ success: true, mensaje: "Bienvenido Administrador" });
    } else {
      res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Error al consultar la BD" });
  }
};

module.exports = { loginAdmin };
