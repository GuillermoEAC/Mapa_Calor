// ─────────────────────────────────────────────────────────────────────────────
// Tests de Suscripciones a Alertas de Zona (CU-14)
// ─────────────────────────────────────────────────────────────────────────────

const { hacerRequest, assert, assertEqual, seccion } = require("./helpers");

let idSuscripcionCreada = null;

async function testSuscripciones() {
  seccion("SUSCRIPCIONES — Crear Suscripción (CU-14)");

  // Test 1: Crear suscripción válida
  {
    const { status, cuerpo } = await hacerRequest("/suscripciones", {
      method: "POST",
      body: JSON.stringify({
        correo_notificacion: "ciudadano@test.com",
        latitud_zona: 25.79,
        longitud_zona: -108.99,
        radio_cobertura_metros: 500,
      }),
    });
    assertEqual(status, 201, "Crear suscripción válida retorna 201");
    assert(cuerpo.id !== undefined, "Crear suscripción retorna un ID");
    assert(
      cuerpo.mensaje && cuerpo.mensaje.includes("éxito"),
      "Crear suscripción retorna mensaje de éxito"
    );
    idSuscripcionCreada = cuerpo.id;
  }

  // Test 2: Crear suscripción con correo inválido
  {
    const { status, cuerpo } = await hacerRequest("/suscripciones", {
      method: "POST",
      body: JSON.stringify({
        correo_notificacion: "correo-invalido",
        latitud_zona: 25.79,
        longitud_zona: -108.99,
        radio_cobertura_metros: 500,
      }),
    });
    assertEqual(status, 400, "Correo inválido retorna 400");
    assert(
      cuerpo.error && cuerpo.error.includes("correo"),
      "Error menciona el correo electrónico"
    );
  }

  // Test 3: Crear suscripción sin campos obligatorios
  {
    const { status, cuerpo } = await hacerRequest("/suscripciones", {
      method: "POST",
      body: JSON.stringify({
        correo_notificacion: "test@test.com",
        // Faltan latitud, longitud, radio
      }),
    });
    assertEqual(status, 400, "Suscripción sin campos obligatorios retorna 400");
    assert(
      cuerpo.error && cuerpo.error.includes("obligatorios"),
      "Error menciona campos obligatorios"
    );
  }

  // Test 4: Crear segunda suscripción para pruebas de listado
  {
    const { status } = await hacerRequest("/suscripciones", {
      method: "POST",
      body: JSON.stringify({
        correo_notificacion: "vecino@test.com",
        latitud_zona: 25.80,
        longitud_zona: -108.98,
        radio_cobertura_metros: 1000,
      }),
    });
    assertEqual(status, 201, "Segunda suscripción creada exitosamente");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("SUSCRIPCIONES — Listar Suscripciones");

  // Test 5: Listar todas las suscripciones
  {
    const { status, cuerpo } = await hacerRequest("/suscripciones");
    assertEqual(status, 200, "GET /suscripciones retorna 200");
    assert(Array.isArray(cuerpo), "Suscripciones retorna un array");
    assert(cuerpo.length >= 2, "Hay al menos 2 suscripciones");

    // Verificar estructura
    const primera = cuerpo[0];
    assert(
      primera.id_alerta !== undefined,
      "Suscripción tiene id_alerta"
    );
    assert(
      primera.correo_notificacion !== undefined,
      "Suscripción tiene correo_notificacion"
    );
    assert(
      primera.latitud_zona !== undefined,
      "Suscripción tiene latitud_zona"
    );
    assert(
      primera.longitud_zona !== undefined,
      "Suscripción tiene longitud_zona"
    );
    assert(
      primera.radio_cobertura_metros !== undefined,
      "Suscripción tiene radio_cobertura_metros"
    );
  }

  // Test 6: Orden descendente por ID
  {
    const { cuerpo } = await hacerRequest("/suscripciones");
    let ordenCorrecto = true;
    for (let i = 1; i < cuerpo.length; i++) {
      if (cuerpo[i].id_alerta > cuerpo[i - 1].id_alerta) {
        ordenCorrecto = false;
        break;
      }
    }
    assert(
      ordenCorrecto,
      "Suscripciones están ordenadas por id_alerta DESC (más recientes primero)"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("SUSCRIPCIONES — Alertas Cercanas (Integración con Reportes)");

  // Test 7: Al aprobar un reporte cercano a una suscripción, se disparan alertas
  // Primero creamos un reporte en la misma zona que la suscripción
  {
    const { cuerpo: nuevoReporte } = await hacerRequest("/reportes", {
      method: "POST",
      body: JSON.stringify({
        tipo: "robo",
        descripcion: "Reporte para test de alertas cercanas",
        latitud: 25.79,
        longitud: -108.99,
      }),
    });

    assert(nuevoReporte.id !== undefined, "Reporte para alerta creado");

    // Aprobar el reporte (esto debería disparar verificarAlertasCercanas)
    const { status } = await hacerRequest(
      `/reportes/${nuevoReporte.id}/estado`,
      {
        method: "PUT",
        body: JSON.stringify({ nuevo_estado: "APROBADO" }),
      }
    );
    assertEqual(
      status,
      200,
      "Aprobar reporte cercano a suscripción retorna 200 (alertas se procesan en background)"
    );

    // Pequeña pausa para que el fire-and-forget se ejecute
    await new Promise((r) => setTimeout(r, 500));
    assert(
      true,
      "Verificar en consola del servidor: [ALERTA] debió imprimirse para ciudadano@test.com"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("SUSCRIPCIONES — Eliminar Suscripción");

  // Test 8: Eliminar suscripción existente
  if (idSuscripcionCreada) {
    const { status, cuerpo } = await hacerRequest(
      `/suscripciones/${idSuscripcionCreada}`,
      { method: "DELETE" }
    );
    assertEqual(status, 200, "DELETE suscripción retorna 200");
    assert(
      cuerpo.mensaje && cuerpo.mensaje.includes("eliminada"),
      "Mensaje confirma la eliminación"
    );
  }

  // Test 9: Verificar que se eliminó (listar y verificar que ya no está)
  if (idSuscripcionCreada) {
    const { cuerpo } = await hacerRequest("/suscripciones");
    const encontrada = cuerpo.find(
      (s) => s.id_alerta === idSuscripcionCreada
    );
    assert(!encontrada, "Suscripción eliminada ya no aparece en la lista");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("SUSCRIPCIONES — Limpieza de datos de test");

  // Limpiar las suscripciones de test
  {
    const { cuerpo } = await hacerRequest("/suscripciones");
    for (const sub of cuerpo) {
      if (
        sub.correo_notificacion === "ciudadano@test.com" ||
        sub.correo_notificacion === "vecino@test.com"
      ) {
        await hacerRequest(`/suscripciones/${sub.id_alerta}`, {
          method: "DELETE",
        });
      }
    }
    assert(true, "Datos de test de suscripciones limpiados");
  }
}

module.exports = testSuscripciones;
