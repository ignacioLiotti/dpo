DROP TABLE IF EXISTS prices;
DROP TABLE IF EXISTS items;

CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cod VARCHAR(255) NOT NULL,
    publicar VARCHAR(255) DEFAULT NULL,
    item_name VARCHAR(255) NOT NULL,
    unid VARCHAR(255) DEFAULT NULL,
    category VARCHAR(255) DEFAULT NULL,     
    origin_table VARCHAR(255) DEFAULT NULL  
);

CREATE TABLE prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    price_date DATE NOT NULL,
    price DOUBLE DEFAULT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

INSERT INTO items (cod, publicar, item_name, unid, category, origin_table)
SELECT
  m.Cod,
  CAST(m.publicar AS CHAR),
  m.material AS item_name,
  m.unid,
  'VIGUETAS Y LADRILLOS' AS category,  
  'materiales' AS origin_table
FROM materiales m
WHERE m.cod IS NOT NULL
  AND m.material IS NOT NULL
  AND m.cod <> '2';  
INSERT INTO items (cod, publicar, item_name, unid, category, origin_table)
SELECT
  i.Cod,
  CAST(i.publicar AS CHAR),
  i.INDICE AS item_name,
  i.unid,
  'INDICES CATEGORY' AS category,
  'indices'
FROM indices i
WHERE i.cod IS NOT NULL
  AND i.INDICE IS NOT NULL
  AND i.INDICE NOT LIKE '%(some category phrase)%';

INSERT INTO items (cod, publicar, item_name, unid, category, origin_table)
SELECT
  itm.Cod,
  CAST(itm.publicar AS CHAR),
  itm.Item AS item_name,
  itm.unid,
  'ITEMS MAIN' AS category,
  'item'
FROM item itm
WHERE itm.cod IS NOT NULL
  AND itm.Item IS NOT NULL
;
INSERT INTO items (cod, publicar, item_name, unid, category, origin_table)
SELECT
  CAST(j.cod AS CHAR) AS cod,
  CAST(j.publicar AS CHAR),
  j.obrero AS item_name,
  NULL AS unid,      
  'JORNAL' AS category,
  'jornales'
FROM jornales j
WHERE j.cod IS NOT NULL
  AND j.obrero IS NOT NULL
;


INSERT INTO prices (item_id, price_date, price)
SELECT i.id,
       DATE('2009-01-01') AS price_date,
       m.`ene-09`
FROM materiales m
JOIN items i 
    ON i.cod = m.Cod
   AND i.origin_table = 'materiales'
WHERE m.`ene-09` IS NOT NULL;

INSERT INTO prices (item_id, price_date, price)
SELECT i.id,
       DATE('2009-02-01') AS price_date,
       m.`feb-09`
FROM materiales m
JOIN items i 
    ON i.cod = m.Cod
   AND i.origin_table = 'materiales'
WHERE m.`feb-09` IS NOT NULL;

INSERT INTO prices (item_id, price_date, price)
SELECT i.id,
       DATE('2009-03-01'),
       m.`mar-09`
FROM materiales m
JOIN items i
    ON i.cod = m.Cod
   AND i.origin_table = 'materiales'
WHERE m.`mar-09` IS NOT NULL;

INSERT INTO prices (item_id, price_date, price)
SELECT i.id,
       DATE('2009-01-01') AS price_date,
       idx.`ene-09`
FROM indices idx
JOIN items i
    ON i.cod = idx.Cod
   AND i.origin_table = 'indices'
WHERE idx.`ene-09` IS NOT NULL;

INSERT INTO prices (item_id, price_date, price)
SELECT i.id,
       DATE('2009-01-01'),
       it.`ene-09`
FROM item it
JOIN items i
    ON i.cod = it.Cod
   AND i.origin_table = 'item'
WHERE it.`ene-09` IS NOT NULL;

INSERT INTO prices (item_id, price_date, price)
SELECT i.id,
       DATE('2015-01-01') AS price_date,
       j.`ene-15d`
FROM jornales j
JOIN items i
    ON i.cod = CAST(j.cod AS CHAR)
   AND i.origin_table = 'jornales'
WHERE j.`ene-15d` IS NOT NULL;

INSERT INTO prices (item_id, price_date, price)
SELECT i.id,
       DATE('2015-01-01') AS price_date, 
       j.`ene-15h`
FROM jornales j
JOIN items i
    ON i.cod = CAST(j.cod AS CHAR)
   AND i.origin_table = 'jornales'
WHERE j.`ene-15h` IS NOT NULL;