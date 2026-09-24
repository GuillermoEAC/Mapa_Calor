/**
 * Valida que las variables de entorno obligatorias estén presentes al arrancar.
 * Detiene el proceso con mensaje descriptivo si falta alguna.
 */
const validateEnv = () => {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n❌ Variables de entorno faltantes: ${missing.join(", ")}`);
    console.error("   Asegúrate de tener un archivo .env con estas variables configuradas.\n");
    process.exit(1);
  }

  // Advertencias para variables opcionales pero recomendadas en producción
  if (process.env.NODE_ENV === "production") {
    const recommended = ["JWT_SECRET", "FRONTEND_URL", "BACKEND_URL"];
    const missingRecommended = recommended.filter((key) => !process.env[key]);
    if (missingRecommended.length > 0) {
      console.warn(`⚠️  Variables recomendadas en producción no configuradas: ${missingRecommended.join(", ")}`);
    }
  }
};

module.exports = validateEnv;
