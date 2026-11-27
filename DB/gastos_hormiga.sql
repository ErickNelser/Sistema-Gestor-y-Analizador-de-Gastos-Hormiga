CREATE DATABASE IF NOT EXISTS gastos_hormiga;
USE gastos_hormiga;

-- Tablas
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    es_hormiga BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS palabras_clave (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    palabra VARCHAR(50) NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    fecha DATE NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    es_hormiga BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS metas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    monto_objetivo DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Datos iniciales
INSERT INTO usuarios (id, nombre) VALUES (1, 'Usuario Principal');

INSERT INTO categorias (id, nombre, es_hormiga) VALUES
(1, 'Salteñas y Snacks', TRUE),
(2, 'Dulces', TRUE),
(3, 'Bebidas', TRUE),
(4, 'Taxi', TRUE),
(5, 'Recargas', TRUE),
(6, 'Pasajes', FALSE),
(7, 'Almuerzo', FALSE),
(8, 'Otros', FALSE);

INSERT INTO palabras_clave (categoria_id, palabra) VALUES
(1, 'saltena'), (1, 'tucumana'), (1, 'cunape'), (1, 'empanada'),
(2, 'chocolate'), (2, 'dulce'), (2, 'helado'), (2, 'chicle'),
(3, 'cafe'), (3, 'cafecito'), (3, 'te'), (3, 'soda'), (3, 'gaseosa'), (3, 'jugo'),
(4, 'taxi'),
(5, 'recarga'),
(6, 'pasaje'), (6, 'trufi'), (6, 'micro'),
(7, 'almuerzo'), (7, 'comida');

-- Usuario API con permisos desde la VM Backend (192.168.56.11) y cualquier red (%)
CREATE USER IF NOT EXISTS 'api'@'192.168.56.11' IDENTIFIED BY 'api123';
GRANT ALL PRIVILEGES ON gastos_hormiga.* TO 'api'@'192.168.56.11';

CREATE USER IF NOT EXISTS 'api'@'192.168.56.%' IDENTIFIED BY 'api123';
GRANT ALL PRIVILEGES ON gastos_hormiga.* TO 'api'@'192.168.56.%';

-- Permitir desde cualquier host (%) para no volver a tener problemas al cambiar de Wi-Fi
CREATE USER IF NOT EXISTS 'api'@'%' IDENTIFIED BY 'api123';
GRANT ALL PRIVILEGES ON gastos_hormiga.* TO 'api'@'%';

CREATE USER IF NOT EXISTS 'api'@'localhost' IDENTIFIED BY 'api123';
GRANT ALL PRIVILEGES ON gastos_hormiga.* TO 'api'@'localhost';

FLUSH PRIVILEGES;