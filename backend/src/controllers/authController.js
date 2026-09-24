const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_cambiar_en_produccion";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "8h";

const loginAdmin = async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ success: false, error: "Usuario y contraseña son requeridos" });
  }

  try {
    const [filas] = await pool.query(
      "SELECT * FROM Administrador WHERE correo = ?",
      [usuario],
    );

    if (filas.length === 0) {
      return res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
    }

    const admin = filas[0];
    const contrasenaValida = await bcrypt.compare(password, admin.contrasena);

    if (!contrasenaValida) {
      return res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: admin.id_admin, correo: admin.correo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({
      success: true,
      mensaje: "Bienvenido Administrador",
      token,
    });
  } catch (error) {
    console.error("[AUTH] Error en login:", error);
    res.status(500).json({ success: false, error: "Error al consultar la BD" });
  }
};

/**
 * Utilidad para hashear una contraseña (usar al crear/actualizar admins).
 * Ejemplo: node -e "require('./src/controllers/authController').hashPassword('miPassword123')"
 */
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(plainPassword, salt);
  console.log(`Hash generado: ${hash}`);
  return hash;
};

module.exports = { loginAdmin, hashPassword };
