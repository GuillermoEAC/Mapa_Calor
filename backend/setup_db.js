const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function runSetup() {
  console.log("Iniciando la configuración de la base de datos para el Sistema de Mapa de Calor...");

  // Leemos las credenciales desde el .env
  const dbConfig = {
    host: (process.env.DB_HOST || "localhost").trim(),
    user: (process.env.DB_USER || "root").trim(),
    password: (process.env.DB_PASSWORD || "root").trim(),
    multipleStatements: true // Permitir múltiples statements en una sola consulta
  };

  console.log(`Conectando al servidor MySQL en ${dbConfig.host} como usuario '${dbConfig.user}'...`);
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("¡Conexión establecida con éxito!");
  } catch (error) {
    console.error("Error al conectar a MySQL. Por favor, asegúrate de que MySQL esté ejecutándose y que tus credenciales en el archivo .env sean correctas.");
    console.error("Detalle del error:", error.message);
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, "BD.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo BD.sql en la ruta: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    console.log("Leyendo BD.sql...");

    console.log("Ejecutando todo el script SQL en la base de datos...");
    await connection.query(sqlContent);

    console.log("\n¡Felicidades! La base de datos 'mapa_inseguridad' y todas sus tablas han sido creadas e inicializadas correctamente con datos de prueba.");
  } catch (error) {
    console.error("\nOcurrió un error durante la configuración de la base de datos:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSetup();
