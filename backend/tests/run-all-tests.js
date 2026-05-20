// ─────────────────────────────────────────────────────────────────────────────
// Runner Principal — Ejecuta todos los tests del Sistema Mapa de Calor
// Uso: node tests/run-all-tests.js
// Prerrequisito: El servidor backend debe estar corriendo en localhost:3000
// ─────────────────────────────────────────────────────────────────────────────

const { seccion, resumen, VERDE, ROJO, CYAN, BOLD, RESET, AMARILLO } = require("./helpers");

const testAuth = require("./auth.test");
const testConfig = require("./config.test");
const testReportes = require("./reportes.test");
const testSuscripciones = require("./suscripciones.test");

async function verificarConexion() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/config");
    if (!respuesta.ok) throw new Error("Servidor respondió con error");
    return true;
  } catch {
    return false;
  }
}

async function ejecutarTodos() {
  console.log(`\n${BOLD}+-----------------------------------------------------------+${RESET}`);
  console.log(`${BOLD}|   TESTS DEL SISTEMA MAPA DE CALOR DE INSEGURIDAD         |${RESET}`);
  console.log(`${BOLD}|   Ejecutando suite completa de pruebas de integración     |${RESET}`);
  console.log(`${BOLD}+-----------------------------------------------------------+${RESET}`);

  // Verificar conexión con el servidor
  console.log(`\n${AMARILLO}[i] Verificando conexión con el servidor...${RESET}`);
  const conectado = await verificarConexion();
  if (!conectado) {
    console.log(`\n${ROJO}${BOLD}[ERR] ERROR: No se pudo conectar al servidor en http://localhost:3000${RESET}`);
    console.log(`${ROJO}   Asegúrate de que el backend esté corriendo con: npm run dev${RESET}\n`);
    process.exit(1);
  }
  console.log(`${VERDE}[OK] Servidor conectado exitosamente${RESET}`);

  const inicio = Date.now();

  try {
    // 1. Tests de Autenticación
    await testAuth();

    // 2. Tests de Configuración y Directorio de Emergencia
    await testConfig();

    // 3. Tests de Reportes (el más extenso)
    await testReportes();

    // 4. Tests de Suscripciones y Alertas
    await testSuscripciones();

  } catch (error) {
    console.log(`\n${ROJO}${BOLD}[ERR] ERROR FATAL durante la ejecución de tests:${RESET}`);
    console.log(`${ROJO}   ${error.message}${RESET}`);
    console.log(`${ROJO}   ${error.stack}${RESET}\n`);
  }

  const duracion = ((Date.now() - inicio) / 1000).toFixed(2);

  // Resumen final
  const resultado = resumen();
  console.log(`  ${CYAN}Tiempo total: ${duracion}s${RESET}`);
  console.log(``);

  // Exit code basado en resultados
  if (resultado.fallidos > 0) {
    process.exit(1);
  }
  process.exit(0);
}

ejecutarTodos();
