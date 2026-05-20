// ─────────────────────────────────────────────────────────────────────────────
// Tests de Reportes (CU-1 a CU-10, CU-7, CU-15)
// Cubre: Crear, Validar coordenadas, Pendientes, Aprobar, Rechazar,
//        Aprobados, Todos, Estadísticas, Histórico, Exportar CSV
// ─────────────────────────────────────────────────────────────────────────────

const { hacerRequest, assert, assertEqual, seccion } = require("./helpers");

let idReporteCreado = null;

async function testReportes() {
  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Crear Reporte (CU Ciudadano)");

  // Test 1: Crear reporte válido dentro de Los Mochis
  {
    const { status, cuerpo } = await hacerRequest("/reportes", {
      method: "POST",
      body: JSON.stringify({
        tipo: "robo",
        descripcion: "Test automatizado - reporte de prueba",
        latitud: 25.79,
        longitud: -108.99,
      }),
    });
    assertEqual(status, 201, "Crear reporte válido retorna 201");
    assert(cuerpo.id !== undefined, "Crear reporte retorna un ID");
    assert(
      cuerpo.mensaje && cuerpo.mensaje.includes("éxito"),
      "Crear reporte retorna mensaje de éxito"
    );
    idReporteCreado = cuerpo.id;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Validación de Coordenadas (CU-10)");

  // Test 2: Rechazar reporte fuera de Los Mochis
  {
    const { status, cuerpo } = await hacerRequest("/reportes", {
      method: "POST",
      body: JSON.stringify({
        tipo: "vandalismo",
        descripcion: "Fuera de rango",
        latitud: 40.0,
        longitud: -74.0,
      }),
    });
    assertEqual(
      status,
      400,
      "Reporte fuera de Los Mochis retorna 400"
    );
    assert(
      cuerpo.error && cuerpo.error.includes("límites"),
      "Error menciona los límites geográficos"
    );
  }

  // Test 3: Rechazar reporte en el borde inferior de los límites
  {
    const { status } = await hacerRequest("/reportes", {
      method: "POST",
      body: JSON.stringify({
        tipo: "robo",
        descripcion: "Borde sur",
        latitud: 25.69,
        longitud: -108.95,
      }),
    });
    assertEqual(status, 400, "Reporte justo fuera del límite sur retorna 400");
  }

  // Test 4: Crear reporte sin descripción (es opcional)
  {
    const { status, cuerpo } = await hacerRequest("/reportes", {
      method: "POST",
      body: JSON.stringify({
        tipo: "alumbrado",
        latitud: 25.80,
        longitud: -109.0,
      }),
    });
    assertEqual(status, 201, "Reporte sin descripción se crea exitosamente (201)");
    // Limpiar: guardar para uso posterior
  }

  // Test 5: Crear reporte con cada tipo de incidente
  {
    const tipos = ["robo", "vandalismo", "alumbrado", "sospechoso"];
    for (const tipo of tipos) {
      const { status } = await hacerRequest("/reportes", {
        method: "POST",
        body: JSON.stringify({
          tipo,
          descripcion: `Test de tipo ${tipo}`,
          latitud: 25.79,
          longitud: -108.98,
        }),
      });
      assertEqual(status, 201, `Reporte tipo '${tipo}' se crea exitosamente`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Obtener Pendientes (CU Moderación)");

  // Test 6: Lista de pendientes
  {
    const { status, cuerpo } = await hacerRequest("/reportes/pendientes");
    assertEqual(status, 200, "GET /pendientes retorna 200");
    assert(Array.isArray(cuerpo), "Pendientes retorna un array");
    assert(cuerpo.length > 0, "Hay al menos un reporte pendiente");

    // Verificar la estructura de datos
    const primer = cuerpo[0];
    assert(primer.id_reporte !== undefined, "Reporte tiene id_reporte");
    assert(primer.tipo_incidente !== undefined, "Reporte tiene tipo_incidente");
    assert(primer.latitud !== undefined, "Reporte tiene latitud");
    assert(primer.longitud !== undefined, "Reporte tiene longitud");
    assert(primer.fecha_registro !== undefined, "Reporte tiene fecha_registro");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Aprobar y Rechazar (CU Moderación)");

  // Test 7: Aprobar un reporte
  if (idReporteCreado) {
    const { status, cuerpo } = await hacerRequest(
      `/reportes/${idReporteCreado}/estado`,
      {
        method: "PUT",
        body: JSON.stringify({ nuevo_estado: "APROBADO" }),
      }
    );
    assertEqual(status, 200, "Aprobar reporte retorna 200");
    assert(
      cuerpo.mensaje && cuerpo.mensaje.includes("APROBADO"),
      "Mensaje confirma la aprobación"
    );
  }

  // Test 8: Rechazar un reporte (creamos uno nuevo para esto)
  {
    const { cuerpo: nuevo } = await hacerRequest("/reportes", {
      method: "POST",
      body: JSON.stringify({
        tipo: "sospechoso",
        descripcion: "Reporte para rechazar",
        latitud: 25.79,
        longitud: -108.99,
      }),
    });

    const { status, cuerpo } = await hacerRequest(
      `/reportes/${nuevo.id}/estado`,
      {
        method: "PUT",
        body: JSON.stringify({ nuevo_estado: "RECHAZADO" }),
      }
    );
    assertEqual(status, 200, "Rechazar reporte retorna 200");
    assert(
      cuerpo.mensaje && cuerpo.mensaje.includes("RECHAZADO"),
      "Mensaje confirma el rechazo"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Obtener Aprobados (CU Mapa)");

  // Test 9: Lista de aprobados para el mapa
  {
    const { status, cuerpo } = await hacerRequest("/reportes/aprobados");
    assertEqual(status, 200, "GET /aprobados retorna 200");
    assert(Array.isArray(cuerpo), "Aprobados retorna un array");
    assert(cuerpo.length > 0, "Hay al menos un reporte aprobado");
    assert(cuerpo[0].latitud !== undefined, "Aprobado tiene latitud");
    assert(cuerpo[0].longitud !== undefined, "Aprobado tiene longitud");
    assert(cuerpo[0].id_tipo !== undefined, "Aprobado tiene id_tipo");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Obtener Todos");

  // Test 10: Lista de todos los reportes
  {
    const { status, cuerpo } = await hacerRequest("/reportes/todos");
    assertEqual(status, 200, "GET /todos retorna 200");
    assert(cuerpo.total !== undefined, "Respuesta incluye total");
    assert(Array.isArray(cuerpo.reportes), "Respuesta incluye array de reportes");
    assert(cuerpo.total > 0, "Hay al menos un reporte en la BD");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Estadísticas (CU-6)");

  // Test 11: Obtener estadísticas
  {
    const { status, cuerpo } = await hacerRequest("/reportes/estadisticas");
    assertEqual(status, 200, "GET /estadisticas retorna 200");
    assert(Array.isArray(cuerpo.porTipo), "Estadísticas incluyen porTipo como array");
    assert(Array.isArray(cuerpo.porHora), "Estadísticas incluyen porHora como array");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Histórico (CU-15)");

  // Test 12: Obtener histórico
  {
    const { status, cuerpo } = await hacerRequest("/reportes/historico");
    assertEqual(status, 200, "GET /historico retorna 200");
    assert(Array.isArray(cuerpo), "Histórico retorna un array");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  seccion("REPORTES — Exportar CSV (CU-7)");

  // Test 13: Exportar todos los reportes como CSV
  {
    const { status, cuerpo, headers } = await hacerRequest(
      "/reportes/exportar"
    );
    assertEqual(status, 200, "GET /exportar retorna 200");
    const contentType = headers.get("content-type");
    assert(
      contentType && contentType.includes("text/csv"),
      "Content-Type es text/csv"
    );
    assert(typeof cuerpo === "string", "Cuerpo es texto (CSV)");
    assert(
      cuerpo.includes("ID,Tipo Incidente"),
      "CSV contiene los encabezados correctos"
    );
    assert(cuerpo.includes("Robo"), "CSV contiene datos de reportes");
  }

  // Test 14: Exportar con filtro de estado
  {
    const { status, cuerpo } = await hacerRequest(
      "/reportes/exportar?estado=APROBADO"
    );
    assertEqual(status, 200, "GET /exportar?estado=APROBADO retorna 200");
    assert(typeof cuerpo === "string", "CSV filtrado es texto");
    // Verificar que todas las filas son APROBADO (excluir encabezado)
    const filas = cuerpo.trim().split("\n").slice(1);
    if (filas.length > 0) {
      const todasAprobadas = filas.every((fila) => fila.includes("APROBADO"));
      assert(todasAprobadas, "Todas las filas exportadas tienen estado APROBADO");
    }
  }

  // Test 15: Exportar con filtro de tipo
  {
    const { status, cuerpo } = await hacerRequest(
      "/reportes/exportar?tipo=1"
    );
    assertEqual(status, 200, "GET /exportar?tipo=1 retorna 200");
    const filas = cuerpo.trim().split("\n").slice(1);
    if (filas.length > 0) {
      const todasRobo = filas.every((fila) => fila.includes("Robo"));
      assert(todasRobo, "Todas las filas exportadas con tipo=1 son de tipo Robo");
    }
  }

  // Test 16: Exportar con filtros combinados
  {
    const { status } = await hacerRequest(
      "/reportes/exportar?estado=APROBADO&tipo=1"
    );
    assertEqual(
      status,
      200,
      "GET /exportar con filtros combinados retorna 200"
    );
  }
}

module.exports = testReportes;
