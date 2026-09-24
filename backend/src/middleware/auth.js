const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticación JWT.
 * Verifica que el token enviado en el header Authorization sea válido.
 * Protege todas las rutas de administración.
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticación requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_cambiar_en_produccion");
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expirado, inicia sesión nuevamente" });
    }
    return res.status(403).json({ error: "Token inválido" });
  }
};

module.exports = verificarToken;
