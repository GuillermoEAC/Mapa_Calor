// ─────────────────────────────────────────────────────────────────────────────
// Helpers compartidos para todos los tests
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000/api";

// Colores para la consola
const VERDE = "\x1b[32m";
const ROJO = "\x1b[31m";
const AMARILLO = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let totalTests = 0;
let pasados = 0;
let fallidos = 0;
const errores = [];

async function hacerRequest(ruta, opciones = {}) {
  const url = ruta.startsWith("http") ? ruta : `${BASE_URL}${ruta}`;
  const respuesta = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opciones.headers },
    ...opciones,
  });

  let cuerpo;
  const contentType = respuesta.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) {
    cuerpo = await respuesta.text();
  } else {
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = await respuesta.text();
    }
  }

  return { status: respuesta.status, cuerpo, headers: respuesta.headers };
}

function assert(condicion, mensaje) {
  totalTests++;
  if (condicion) {
    pasados++;
    console.log(`  ${VERDE}[OK]${RESET} ${mensaje}`);
  } else {
    fallidos++;
    errores.push(mensaje);
    console.log(`  ${ROJO}[FALLO]${RESET} ${mensaje}`);
  }
}

function assertEqual(actual, esperado, mensaje) {
  totalTests++;
  if (actual === esperado) {
    pasados++;
    console.log(`  ${VERDE}[OK]${RESET} ${mensaje}`);
  } else {
    fallidos++;
    const detalle = `${mensaje} (esperado: ${esperado}, obtenido: ${actual})`;
    errores.push(detalle);
    console.log(`  ${ROJO}[FALLO]${RESET} ${detalle}`);
  }
}

function seccion(nombre) {
  console.log(`\n${CYAN}${BOLD}=== ${nombre} ===${RESET}`);
}

function resumen() {
  console.log(`\n${BOLD}=======================================${RESET}`);
  console.log(`${BOLD}  RESUMEN DE TESTS${RESET}`);
  console.log(`${BOLD}=======================================${RESET}`);
  console.log(`  Total:   ${totalTests}`);
  console.log(`  ${VERDE}Pasados: ${pasados}${RESET}`);
  console.log(`  ${ROJO}Fallidos: ${fallidos}${RESET}`);

  if (errores.length > 0) {
    console.log(`\n${ROJO}${BOLD}  Tests fallidos:${RESET}`);
    errores.forEach((e) => console.log(`    ${ROJO}* ${e}${RESET}`));
  }

  console.log(`${BOLD}=======================================${RESET}\n`);
  return { totalTests, pasados, fallidos };
}

function resetContadores() {
  totalTests = 0;
  pasados = 0;
  fallidos = 0;
  errores.length = 0;
}

module.exports = {
  BASE_URL,
  hacerRequest,
  assert,
  assertEqual,
  seccion,
  resumen,
  resetContadores,
  VERDE,
  ROJO,
  AMARILLO,
  CYAN,
  RESET,
  BOLD,
};
