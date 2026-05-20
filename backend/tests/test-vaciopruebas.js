const testEmailAlert = async () => {
  const email = "vaciopruebas@gmail.com";
  const centerLat = 25.7904;
  const centerLng = -108.9858;
  const radius = 1000; // 1km
  
  // Coordenadas del reporte cercano (aprox. 140 metros de distancia)
  const reportLat = 25.7915;
  const reportLng = -108.9865;

  console.log(`[TEST] 1. Registrando suscripción para: ${email} en (${centerLat}, ${centerLng}) con radio ${radius}m...`);
  
  const subRes = await fetch("http://localhost:3000/api/suscripciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      correo_notificacion: email,
      latitud_zona: centerLat,
      longitud_zona: centerLng,
      radio_cobertura_metros: radius
    })
  });
  
  const subData = await subRes.json();
  console.log("[TEST] Respuesta de Suscripción:", subRes.status, subData);
  
  if (!subRes.ok) {
    console.error("[TEST] Error al registrar suscripción. Terminando.");
    return;
  }
  
  const subId = subData.id;

  console.log(`\n[TEST] 2. Creando reporte cercano en (${reportLat}, ${reportLng})...`);
  const reportRes = await fetch("http://localhost:3000/api/reportes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "robo",
      descripcion: "Incidente de prueba para vaciopruebas@gmail.com",
      latitud: reportLat,
      longitud: reportLng
    })
  });
  
  const reportData = await reportRes.json();
  console.log("[TEST] Respuesta de Creación de Reporte:", reportRes.status, reportData);
  
  if (!reportRes.ok) {
    console.error("[TEST] Error al crear reporte. Terminando.");
    return;
  }
  
  const reportId = reportData.id;

  console.log(`\n[TEST] 3. Aprobando reporte ID ${reportId} para disparar la alerta por correo...`);
  const approveRes = await fetch(`http://localhost:3000/api/reportes/${reportId}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nuevo_estado: "APROBADO"
    })
  });
  
  const approveData = await approveRes.json();
  console.log("[TEST] Respuesta de Aprobación:", approveRes.status, approveData);

  console.log("\n[TEST] 4. Esperando 3 segundos para que se complete el envío del correo...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log("\n[TEST] 5. Limpiando suscripción de prueba para no acumular basura...");
  const deleteRes = await fetch(`http://localhost:3000/api/suscripciones/${subId}`, {
    method: "DELETE"
  });
  const deleteData = await deleteRes.json();
  console.log("[TEST] Respuesta de Eliminación de Suscripción:", deleteRes.status, deleteData);
  
  console.log("\n[TEST] Pruebas finalizadas. Por favor revisa los logs de la terminal del servidor para comprobar la entrega!");
};

testEmailAlert().catch(err => console.error("[TEST ERROR]", err));
