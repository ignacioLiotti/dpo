-- Populate reference tables for obras

-- Insert predefined values for reparticiones
INSERT INTO "reparticiones" ("id", "nombre") VALUES
  (1, 'Dirección de Arquitectura'),
  (2, 'Dirección de Vivienda'),
  (3, 'Dirección de Vialidad'),
  (4, 'Dirección de Hidráulica')
ON CONFLICT (id) DO NOTHING;

-- Insert predefined values for areas
INSERT INTO "areas" ("id", "nombre") VALUES
  (1, 'Construcciones'),
  (2, 'Proyectos'),
  (3, 'Inspecciones'),
  (4, 'Administración')
ON CONFLICT (id) DO NOTHING;

-- Insert predefined values for tipos_obra
INSERT INTO "tipos_obra" ("id", "nombre") VALUES
  (1, 'Obra Nueva'),
  (2, 'Refacción'),
  (3, 'Ampliación'),
  (4, 'Restauración'),
  (5, 'Infraestructura Vial'),
  (6, 'Infraestructura Hidráulica')
ON CONFLICT (id) DO NOTHING;

-- Reset the sequences to start after our predefined values
SELECT setval('reparticiones_id_seq', 4, true);
SELECT setval('areas_id_seq', 4, true);
SELECT setval('tipos_obra_id_seq', 6, true);
