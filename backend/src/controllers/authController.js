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
    const usuarioLimpio = usuario.trim();
    const [filas] = await pool.query(
      "SELECT * FROM Administrador WHERE correo = ?",
      [usuarioLimpio],
    );

    if (filas.length === 0) {
      return res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
    }

    const admin = filas[0];

    // 1. Intentar validar con bcrypt
    let contrasenaValida = false;
    try {
      if (admin.contrasena && admin.contrasena.startsWith("$2b$")) {
        contrasenaValida = await bcrypt.compare(password, admin.contrasena);
      }
    } catch (e) {
      contrasenaValida = false;
    }

    // 2. Compatibilidad hacia atrás: si la contraseña en BD sigue en texto plano
    if (!contrasenaValida && admin.contrasena === password) {
      contrasenaValida = true;
      // Auto-migrar inmediatamente a bcrypt en la base de datos
      try {
        const nuevoHash = await bcrypt.hash(password, 12);
        await pool.query("UPDATE Administrador SET contrasena = ? WHERE id_admin = ?", [nuevoHash, admin.id_admin]);
        console.log(`[AUTH] Contraseña de ${admin.correo} migrada automáticamente a bcrypt`);
      } catch (errMigrate) {
        console.error("[AUTH] Error auto-migrando contraseña a hash:", errMigrate);
      }
    }

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
