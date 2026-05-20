-- 1. Destruimos la base de datos vieja para limpiar los errores previos
DROP DATABASE IF EXISTS mapa_inseguridad;

-- 2. Creamos la base de datos desde cero y la usamos
CREATE DATABASE mapa_inseguridad;
USE mapa_inseguridad;

-- 3. Tabla Administrador
CREATE TABLE Administrador (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL
);

-- 4. Tabla Tipo_Incidente
CREATE TABLE Tipo_Incidente (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    color_mapa VARCHAR(20) DEFAULT 'red',
    intensidad_huella INT DEFAULT 1
);

-- 5. Tabla Reporte (¡Ahora sí funcionarán las llaves foráneas!)
CREATE TABLE Reporte (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo INT NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', 
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_admin_moderador INT,
    FOREIGN KEY (id_tipo) REFERENCES Tipo_Incidente(id_tipo),
    FOREIGN KEY (id_admin_moderador) REFERENCES Administrador(id_admin)
);

-- 6. Tabla Suscripcion_Alerta
CREATE TABLE Suscripcion_Alerta (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    correo_notificacion VARCHAR(100) NOT NULL,
    latitud_zona DECIMAL(10,8) NOT NULL,
    longitud_zona DECIMAL(11,8) NOT NULL,
    radio_cobertura_metros INT DEFAULT 500
);

-- 7. Insertamos los datos de prueba
INSERT INTO Administrador (correo, contrasena) 
VALUES ('admin@tuproyecto.com', '123456');

INSERT INTO Tipo_Incidente (nombre, color_mapa, intensidad_huella) VALUES 
('Robo / Asalto', 'red', 3),
('Vandalismo', 'orange', 2),
('Fallo de Alumbrado', 'gray', 1),
('Actividad Sospechosa', 'purple', 1);

-- 8. Tabla Configuracion_Mapa (CU 8)
CREATE TABLE Configuracion_Mapa (
    id_config INT PRIMARY KEY DEFAULT 1,
    radio_puntos INT DEFAULT 500,
    desenfoque_puntos INT DEFAULT 15,
    opacidad_puntos DECIMAL(3,2) DEFAULT 0.15,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertamos la configuración por defecto
INSERT INTO Configuracion_Mapa (id_config, radio_puntos, desenfoque_puntos, opacidad_puntos) 
VALUES (1, 500, 15, 0.15)
ON DUPLICATE KEY UPDATE id_config=1;

-- 9. Tabla Directorio_Emergencia (CU 12)
CREATE TABLE Directorio_Emergencia (
    id_contacto INT AUTO_INCREMENT PRIMARY KEY,
    institucion VARCHAR(100) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    prioridad INT DEFAULT 1
);

INSERT INTO Directorio_Emergencia (institucion, numero, prioridad) VALUES 
('Emergencias (General)', '911', 1),
('Policía Municipal', '060', 2),
('Cruz Roja', '065', 3),
('Bomberos', '068', 4);