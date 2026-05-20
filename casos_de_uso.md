# Casos de Uso - Sistema Mapa de Calor

## Caso de Uso 6: Consulta de estadísticas de inseguridad
**No. y nombre:** 6. Consulta de estadísticas de inseguridad
**Actor(es):** Administrador
**Descripción:** Visualización de gráficos y métricas generadas a partir de la concentración de reportes.
**Pre-Condiciones:** El sistema debe tener datos suficientes para generar tendencias.
**Flujo básico:**
1. El usuario accede a la sección de estadísticas.
2. El sistema presenta gráficos de barras o pastel mostrando los tipos de incidentes más comunes y los horarios de mayor riesgo.
**Post-Condiciones:** El sistema arroja las estadísticas de los incidentes más concurridos.

---

## Caso de Uso 8: Configuración de parámetros del mapa de calor
**No. y nombre:** 8. Configuración de parámetros del mapa de calor
**Actor(es):** Administrador
**Descripción:** Modificación de los valores matemáticos y visuales que definen cómo se renderiza el mapa (radio de influencia de cada punto, intensidad de los colores, opacidad).
**Pre-Condiciones:** El administrador debe tener acceso al panel de configuración del sistema.
**Flujo básico:**
1. Ingresa a la configuración visual del mapa.
2. Ajusta el “radio” y desenfoque de los puntos generados por Leaflet.js.
3. El sistema guarda la configuración y actualiza la vista en tiempo real para todos los usuarios.
**Flujo alternativo:**
3.1. El sistema sufre una desconexión lo que impide que este guarde los datos ingresados.
**Post-Condiciones:** Nueva configuración para la visualización del mapa.

---

## Caso de Uso 9: Depurar datos caducos
**No. y nombre:** 9. Depurar datos caducos
**Actor(es):** Sistema
**Descripción:** Proceso automático que disminuye el "peso" visual de un reporte conforme pasa el tiempo, para que el mapa refleje la situación actual y no un histórico saturado.
**Pre-Condiciones:** El servidor debe tener una tarea programada (cron job) activa.
**Flujo básico:**
1. El sistema ejecuta una revisión periódica de la base de datos.
2. Identifica reportes con más de “x” días de antigüedad.
3. Cambia el estado del reporte a “Historico” para que ya no sume intensidad al mapa de calor principal.
**Flujo alternativo:**
1.1. La revisión automática falla y esta solo elimina los datos mas no los pasa a histórico.
**Post-Condiciones:** El sistema guarda todo perfectamente para hacer una “limpia” del mapa de calor.

---

## Caso de Uso 10: Validar integridad de coordenadas
**No. y nombre:** 10. Validar integridad de coordenadas
**Actor(es):** Sistema
**Descripción:** Asegura que las coordenadas recibidas estén dentro de los límites geográficos válidos (por ejemplo, dentro de tu ciudad o país) para evitar datos basura.
**Pre-Condiciones:** El sistema recibe un payload con datos de un nuevo reporte.
**Flujo básico:**
1. El sistema recibe latitud y longitud.
2. Verifica que las coordenadas caigan dentro del polígono de la ciudad analizada.
3. Si son válidas, permite el guardado; si no, rechaza la petición.
**Flujo alternativo:**
3.1 La validación del sistema falla.
3.2 Se termina por colar un reporte con las coordenadas erróneas.
**Post-Condiciones:** El funcionamiento de la validación funciona correctamente.

---

## Caso de Uso 12: Consultar directorio de emergencia
**No. y nombre:** 12. Consultar directorio de emergencia
**Actor(es):** Usuario
**Descripción:** Acceso rápido a los números de emergencia locales (policía, cruz roja, bomberos) directamente desde la plataforma.
**Pre-Condiciones:** Ninguna.
**Flujo básico:**
1. El usuario hace clic en el botón de “Emergencias” en la interfaz.
2. El sistema despliega una lista de contactos oficiales de la zona para que el ciudadano puede llamar de inmediato en caso de estar en peligro.
**Post-Condiciones:** Ninguna.
