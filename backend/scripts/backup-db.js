const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

async function generarBackup() {
  console.log("==========================================");
  console.log("   GENERADOR DE BACKUP (MAPA DE CALOR)    ");
  console.log("==========================================");
  console.log("Conectando a la base de datos configurada en .env...\n");

  try {
    // 1. Obtener todas las tablas
    const [tablasRows] = await pool.query("SHOW TABLES");
    if (tablasRows.length === 0) {
      console.log("No se encontraron tablas en la base de datos.");
      process.exit(0);
    }

    const nombreColumna = Object.keys(tablasRows[0])[0];
    const tablas = tablasRows.map((fila) => fila[nombreColumna]);

    console.log(`Tablas detectadas (${tablas.length}): ${tablas.join(", ")}\n`);

    let sqlCompleto = `-- =====================================================\n`;
    sqlCompleto += `-- BACKUP DE BASE DE DATOS: mapa_inseguridad\n`;
    sqlCompleto += `-- FECHA: ${new Date().toISOString()}\n`;
    sqlCompleto += `-- =====================================================\n\n`;
    sqlCompleto += `CREATE DATABASE IF NOT EXISTS \`mapa_inseguridad\`;\n`;
    sqlCompleto += `USE \`mapa_inseguridad\`;\n\n`;
    sqlCompleto += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const tabla of tablas) {
      console.log(`Extrayendo estructura y datos de: ${tabla}...`);

      // 2. Estructura (CREATE TABLE)
      const [createRows] = await pool.query(`SHOW CREATE TABLE \`${tabla}\``);
      const createTableSql = createRows[0]["Create Table"];

      sqlCompleto += `-- -----------------------------------------------------\n`;
      sqlCompleto += `-- Estructura de tabla para: \`${tabla}\`\n`;
      sqlCompleto += `-- -----------------------------------------------------\n`;
      sqlCompleto += `DROP TABLE IF EXISTS \`${tabla}\`;\n`;
      sqlCompleto += `${createTableSql};\n\n`;

      // 3. Datos (INSERT INTO)
      const [filas] = await pool.query(`SELECT * FROM \`${tabla}\``);

      if (filas.length > 0) {
        sqlCompleto += `-- Volcado de datos para: \`${tabla}\` (${filas.length} registros)\n`;

        for (const fila of filas) {
          const columnas = Object.keys(fila).map((c) => `\`${c}\``).join(", ");
          const valores = Object.values(fila).map((val) => {
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number" || typeof val === "boolean") return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
            // Escapar comillas y caracteres especiales
            const limpio = String(val).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
              switch (char) {
                case "\0": return "\\0";
                case "\x08": return "\\b";
                case "\x09": return "\\t";
                case "\x1a": return "\\z";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                  return "\\" + char;
                default:
                  return char;
              }
            });
            return `'${limpio}'`;
          }).join(", ");

          sqlCompleto += `INSERT INTO \`${tabla}\` (${columnas}) VALUES (${valores});\n`;
        }
        sqlCompleto += `\n`;
      }
    }

    sqlCompleto += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlCompleto += `-- FIN DEL BACKUP\n`;

    const rutaSalida = path.join(__dirname, "..", `backup_${new Date().toISOString().slice(0, 10)}.sql`);
    fs.writeFileSync(rutaSalida, sqlCompleto, "utf8");

    console.log("\n==========================================");
    console.log("   ¡BACKUP GENERADO EXITOSAMENTE!");
    console.log("==========================================");
    console.log(`Archivo guardado en: ${rutaSalida}`);
    console.log("Puedes importar este archivo en tu MySQL/MariaDB/XAMPP local.");

  } catch (error) {
    console.error("\nError generando el backup:", error);
  } finally {
    await pool.end();
  }
}

generarBackup();
