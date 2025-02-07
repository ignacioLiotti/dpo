CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);


INSERT INTO tags (id, name) VALUES
  (1, ''),
  (2, 'VIGUETAS Y LADRILLOS'),
  (3, 'MATERIALES ELECTRICOS'),
  (4, 'Cajas metálicas'),
  (5, 'Caños de acero semipesado'),
  (6, 'Caño de acero liviano'),
  (7, 'Cable Envainado Tipo Taller'),
  (8, 'Conectores de acero inoxidable'),
  (9, 'Curva de acero semipesado'),
  (10, 'Caños de P.V.C. rígido'),
  (11, 'Cajas de acero p/ tablero secundario'),
  (12, 'Lámparas incandescentes claras'),
  (13, 'Llaves de embutir'),
  (14, 'Terminal para cable'),
  (15, 'Cable subterráneo'),
  (16, 'Cable subterráneo de 4x25 mm2'),
  (17, 'Disyuntores diferenciales'),
  (18, 'LlavesTérmicas'),
  (19, 'Plafones o listones'),
  (20, 'HERRAJES'),
  (21, 'MATERIALES CAÑERIA CLOACAL Y AGUA'),
  (22, 'MATERIALES SANITARIOS'),
  (23, 'ARTEFACTOS P/BAÑOS DISCAPACITADOS MOTORES'),
  (24, 'BRONCERIA'),
  (25, 'FIBRO CEMENTO F°C°'),
  (26, 'HIERRO GALVANIZADO H°G°'),
  (27, 'BUJE DE REDUCCION GALVANIZADO'),
  (28, 'BUJE DE REDUCCION GALVANIZADO 1 1/4" x 3/4"'),
  (29, 'HIERRO FUNDIDO FºFº'),
  (30, 'CAÑOS Y PIEZAS DE H°C° PARA DESAGÜES CLOACALES Y PLUVIALES'),
  (31, 'CAÑO DE H°C°'),
  (32, 'CAÑOS PARA DRENAJE'),
  (33, 'Ramal HºCº A 90° en "T"'),
  (34, 'CURVA HºCº A 45°'),
  (35, 'CURVA HºCº A 90°'),
  (36, 'CODO HºCº A 90°'),
  (37, 'CODO HºCº A 90° CON BASE'),
  (38, 'REDUCCION'),
  (39, 'DESENGRASADOR'),
  (40, 'TAPAS CON MARCOS'),
  (41, 'CAMARA DE INSPECCION'),
  (42, 'PROL. P/CAMARA SEPTICA'),
  (43, 'CAÑOS Y PIEZAS DE P.V.C. PARA INSTALACIONES SANITARIAS Y PLUVIALES'),
  (44, 'CANALETA Y ACCESORIOS DE P.V.C.'),
  (45, 'CAÑO DE POLIPROPILENO P/AGUA'),
  (46, 'CAÑO DE P.V.C. P/CLOACA Y VENTILACION'),
  (47, 'ACCESORIOS DE P.V.C. P/CLOACA Y VENTILACION'),
  (48, 'CODO DE 90º CON BASE tipo RAMAT'),
  (49, 'RAMAL A 90º tipo RAMAT'),
  (50, 'RAMAL A 45º tipo RAMAT'),
  (51, 'REDUCCIONES tipo RAMAT'),
  (52, 'CAÑO CAMARA tipo RAMAT'),
  (53, 'CURVA A 90º tipo RAMAT+C543'),
  (54, 'CODO DE 90º tipo RAMAT'),
  (55, 'PILETA DE PATIO'),
  (56, 'SOMBRERETE'),
  (57, 'ACCESORIOS DE POLIPROPILENO P/AGUA'),
  (58, 'VARIOS'),
  (59, 'MATERIALES DE EQUIPO DE BOMBEO'),
  (60, 'ADHESIVOS Y SELLADORES'),
  (61, 'AGREGADO GRUESO'),
  (62, 'AGREGADO LIVIANO'),
  (63, 'AISLACION'),
  (64, 'ALAMBRE - HIERRO - CLAVOS'),
  (65, 'CIELORRASOS'),
  (66, 'REVESTIMIENTOS'),
  (67, 'HIDROFUGOS'),
  (68, 'GAS'),
  (69, 'CUBIERTAS'),
  (70, 'Chapa de cobre'),
  (71, 'MADERAS'),
  (72, 'VIDRIOS'),
  (73, 'PISOS'),
  (74, 'Laja San Luis Negra'),
  (75, 'ZOCALOS'),
  (76, 'CARPINTERIA DE MADERA Y METALICA (CHAPA Hº Y ALUMINIO)'),
  (77, 'MORTEROS Y HORMIGONES'),
  (78, 'PINTURAS'),
  (79, 'Sellador de poros p/madera .- Lata x 1L 1ra marca 1ra calidad'),
  (80, 'CHAPAS DE POLICARBONATOS'),
  (81, 'ELEMENTOS PARA EXTINCION DE INCENDIOS'),
  (82, 'CAÑERIA PARA GAS'),
  (83, 'TUBOS, PERFILES Y PLANCHUELAS'),
  (84, 'DEMOLICION Y RETIROS'),
  (85, 'MOVIMIENTO DE SUELOS'),
  (86, 'HORMIGON ARMADO'),
  (87, 'MAMPOSTERIA'),
  (88, 'REVOQUES'),
  (89, 'CAPAS AISLADORAS'),
  (90, 'CONTRAPISO'),
  (91, 'REVESTIMIENTO'),
  (92, 'UMBRALES, ESCALONES Y CORDONES'),
  (93, 'PINTURA'),
  (94, 'C U B I E R T A S'),
  (95, 'INSTALACION SANITARIA'),
  (96, 'INSTALACION ELÉCTRICA'),
  (97, 'CARPINTERÍA'),
  (98, 'INFRAESTRUCTURA'),
  (99, 'RED DISTRIBUIDORA DE AGUA POTABLE'),
  (100, 'RED COLECTORA CLOACAL'),
  (101, 'RED CONEXIÓN ELÉCTRICA'),
  (102, 'OBRAS VIALES'),
  (103, 'INSTALACION CONTRA INCENDIO'),
  (104, 'INSTALACIONES DE GAS'),
  (105, 'INSTALACION DE AIRE ACONDICIONADO'),
  (106, 'Extractor de aire en pared 3/4 HP monof. - prov. y colocación');


CREATE TABLE element_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    element_id INT NOT NULL,
    table_name ENUM('materiales', 'indices', 'items', 'jornales') NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_element_tag (element_id, table_name, tag_id)
);


-- Create temporary table for materials
CREATE TEMPORARY TABLE temp_material_tags (
  material_id INT,
  tag_id INT
);

-- Insert mappings for materials
INSERT INTO temp_material_tags (material_id, tag_id)
SELECT DISTINCT id, 
  CASE 
    WHEN id <= 12 THEN 3  -- MATERIALES ELECTRICOS
    WHEN id BETWEEN 13 AND 15 THEN 13  -- LLAVES
    WHEN id BETWEEN 16 AND 18 THEN 17  -- DISYUNTORES
    ELSE 105  -- Default tag
  END
FROM materiales;

-- Insert valid relationships for materials with conflict resolution
INSERT INTO element_tags (element_id, table_name, tag_id)
SELECT DISTINCT t.material_id, 'materiales', t.tag_id
FROM temp_material_tags t
WHERE EXISTS (SELECT 1 FROM materiales m WHERE m.id = t.material_id)
  AND EXISTS (SELECT 1 FROM tags tag WHERE tag.id = t.tag_id)
ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id);

-- Cleanup
DROP TEMPORARY TABLE temp_material_tags;

-- Create temporary table for indices
CREATE TEMPORARY TABLE temp_index_tags (
  index_id INT,
  tag_id INT
);

-- Insert mappings for indices
INSERT INTO temp_index_tags (index_id, tag_id)
SELECT DISTINCT id, 
  CASE 
    WHEN id <= 10 THEN 21  -- ECONOMIC INDICES
    ELSE 105  -- Default tag
  END
FROM indices;

-- Insert valid relationships for indices with conflict resolution
INSERT INTO element_tags (element_id, table_name, tag_id)
SELECT DISTINCT t.index_id, 'indices', t.tag_id
FROM temp_index_tags t
WHERE EXISTS (SELECT 1 FROM indices i WHERE i.id = t.index_id)
  AND EXISTS (SELECT 1 FROM tags tag WHERE tag.id = t.tag_id)
ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id);

-- Cleanup
DROP TEMPORARY TABLE temp_index_tags;

-- Create temporary table for items
CREATE TEMPORARY TABLE temp_item_tags (
  item_id INT,
  tag_id INT
);

-- Insert mappings for items
INSERT INTO temp_item_tags (item_id, tag_id)
SELECT DISTINCT id, 
  CASE 
    WHEN id <= 50 THEN 46  -- BUILDING ITEMS
    ELSE 105  -- Default tag
  END
FROM items;

-- Insert valid relationships for items with conflict resolution
INSERT INTO element_tags (element_id, table_name, tag_id)
SELECT DISTINCT t.item_id, 'items', t.tag_id
FROM temp_item_tags t
WHERE EXISTS (SELECT 1 FROM items i WHERE i.id = t.item_id)
  AND EXISTS (SELECT 1 FROM tags tag WHERE tag.id = t.tag_id)
ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id);

-- Cleanup
DROP TEMPORARY TABLE temp_item_tags;

-- Create temporary table for jornales
CREATE TEMPORARY TABLE temp_jornal_tags (
  jornal_id INT,
  tag_id INT
);

-- Insert mappings for jornales
INSERT INTO temp_jornal_tags (jornal_id, tag_id)
SELECT DISTINCT id, 
  CASE 
    WHEN id <= 5 THEN 88  -- LABOR
    ELSE 105  -- Default tag
  END
FROM jornales;

-- Insert valid relationships for jornales with conflict resolution
INSERT INTO element_tags (element_id, table_name, tag_id)
SELECT DISTINCT t.jornal_id, 'jornales', t.tag_id
FROM temp_jornal_tags t
WHERE EXISTS (SELECT 1 FROM jornales j WHERE j.id = t.jornal_id)
  AND EXISTS (SELECT 1 FROM tags tag WHERE tag.id = t.tag_id)
ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id);

-- Cleanup
DROP TEMPORARY TABLE temp_jornal_tags;
