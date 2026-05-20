// ─────────────────────────────────────────────────────────────────────────────
// Tests de Configuración del Mapa y Directorio de Emergencia (CU-8, CU-12)
// ─────────────────────────────────────────────────────────────────────────────

const { hacerRequest, assert, assertEqual, seccion } = require("./helpers");

async function testConfig() {
  seccion("CONFIG — Configuración del Mapa (CU-8)");

  // Test 1: Obtener configuración actual
  {
    const { status, cuerpo } = await hacerRequest("/config");
    assertEqual(status, 200, "GET /config retorna 200");
    assert(cuerpo.radio_puntos !== undefined, "Configuración tiene radio_puntos");
    assert(cuerpo.opacidad_puntos !== undefined, "Configuración tiene opacidad_puntos");
    assert(cuerpo.desenfoque_puntos !== undefined, "Configuración tiene desenfoque_puntos");
  }

  // Test 2: Actualizar configuración
  {
    const nuevaConfig = { radio: 800, desenfoque: 20, opacidad: 0.25 };
    const { status, cuerpo } = await hacerRequest("/config", {
      method: "PUT",
      body: JSON.stringify(nuevaConfig),
    });
    assertEqual(status, 200, "PUT /config retorna 200 al actualizar");
    assert(
      cuerpo.mensaje && cuerpo.mensaje.includes("actualizada"),
      "PUT /config confirma la actualización"
    );
  }

  // Test 3: Verificar que la configuración se guardó
  {
    const { status, cuerpo } = await hacerRequest("/config");
    assertEqual(status, 200, "GET /config después de actualizar retorna 200");
    assertEqual(cuerpo.radio_puntos, 800, "Radio se actualizó a 800");
    assertEqual(parseFloat(cuerpo.opacidad_puntos), 0.25, "Opacidad se actualizó a 0.25");
  }

  // Test 4: Restaurar configuración original
  {
    const { status } = await hacerRequest("/config", {
      method: "PUT",
      body: JSON.stringify({ radio: 500, desenfoque: 15, opacidad: 0.15 }),
    });
    assertEqual(status, 200, "Restaurar configuración original exitoso");
  }

  // ─────────────────────────────────────────────────────────────────────────
  seccion("CONFIG — Directorio de Emergencia (CU-12)");

  // Test 5: Obtener directorio de emergencia
  {
    const { status, cuerpo } = await hacerRequest("/emergencias");
    assertEqual(status, 200, "GET /emergencias retorna 200");
    assert(Array.isArray(cuerpo), "Directorio retorna un array");
    assert(cuerpo.length > 0, "Directorio tiene al menos un contacto");
    assert(
      cuerpo[0].institucion !== undefined,
      "Cada contacto tiene campo 'institucion'"
    );
    assert(
      cuerpo[0].numero !== undefined,
      "Cada contacto tiene campo 'numero'"
    );
    assert(
      cuerpo[0].prioridad !== undefined,
      "Cada contacto tiene campo 'prioridad'"
    );
  }

  // Test 6: Verificar que están ordenados por prioridad
  {
    const { cuerpo } = await hacerRequest("/emergencias");
    let ordenCorrecto = true;
    for (let i = 1; i < cuerpo.length; i++) {
      if (cuerpo[i].prioridad < cuerpo[i - 1].prioridad) {
        ordenCorrecto = false;
        break;
      }
    }
    assert(ordenCorrecto, "Directorio está ordenado por prioridad ascendente");
  }
}

module.exports = testConfig;
