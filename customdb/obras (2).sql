-- phpMyAdmin SQL Dump
-- version 2.10.3
-- http://www.phpmyadmin.net
-- 
-- Servidor: localhost
-- Tiempo de generación: 24-12-2024 a las 12:09:34
-- Versión del servidor: 5.0.51
-- Versión de PHP: 5.2.6

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

-- 
-- Base de datos: `obras`
-- 

-- --------------------------------------------------------

-- 
-- Estructura de tabla para la tabla `empresas`
-- 

CREATE TABLE `empresas` (
  `IdEmpresa` int(11) NOT NULL auto_increment,
  `Nombreempresa` varchar(50) default NULL,
  `Responsable` varchar(50) default NULL,
  `Dirección` varchar(50) default NULL,
  `Telefono` varchar(255) default NULL,
  `Cuit` varchar(255) default NULL,
  `Observaciones` varchar(255) default NULL,
  PRIMARY KEY  (`IdEmpresa`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=147 ;

-- 
-- Volcar la base de datos para la tabla `empresas`
-- 

INSERT INTO `empresas` VALUES (1, 'ACIFA S.R.L.', NULL, 'Av. Sarmiento N° 1856', '436441', NULL, NULL);
INSERT INTO `empresas` VALUES (2, 'EM.AR.CO S.A.', 'Ing. Javier Darío Flier', 'Pellegrini N° 1239', '422932', NULL, NULL);
INSERT INTO `empresas` VALUES (3, 'MIGUEL A. ROMA Const.', 'Ing. Alfredo Roma', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (4, 'NODARCO S.R.L.', 'Ing. Alfredo Le Vraux', 'Belgrano N° 330', '436483', NULL, NULL);
INSERT INTO `empresas` VALUES (5, 'AZ S.A.', 'Ing. Marcelo Mendez', 'Jujuy N° 1240 2° Piso', '428317', NULL, NULL);
INSERT INTO `empresas` VALUES (6, 'EDIFICADORA CORRENTINA S.A.', 'Ing. Augusto Abelenda', 'Gdor. Lagraña N° 151', '431959', NULL, NULL);
INSERT INTO `empresas` VALUES (7, 'CONSTRUSERV S.R.L.', 'Ing. Elvio R. Ramirez', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (8, 'PROAS ING. S.R.L.', 'Ing. Horacio Zaninovich', 'Alberdi 2002 - Ctes', '3794421636', '30-66968838-1', NULL);
INSERT INTO `empresas` VALUES (9, 'CARBO S.A.', 'Ing. Carlos M. Botello', 'San Martín N° 1260 1° Piso', '443449', NULL, NULL);
INSERT INTO `empresas` VALUES (10, 'Ing. ORLANDO PETERSON', 'Ing. Orlando J.M. Peterson', 'Junin N° 1336 Of. 213', '426236', NULL, NULL);
INSERT INTO `empresas` VALUES (11, 'Arq. CARLOS MIGUEL SEGOVIA', 'Arq. Carlos M. Segovia', 'San Luis N° 1270', '4430380', '20-07830942-4', NULL);
INSERT INTO `empresas` VALUES (12, 'Ing. MARIO CARZINO', 'Ing. Mario H. Carzino', 'San Lorenzo N° 2502', '0', NULL, NULL);
INSERT INTO `empresas` VALUES (13, 'MEGA Const.', 'Ing. Juan J. M. Carbajal', 'Santa Catalina N° 2040', '0', NULL, NULL);
INSERT INTO `empresas` VALUES (14, 'ALFA Const.', 'Ing. Arturo Dieringer', 'Thames N° 1570', '451143', '20-10567199-8', NULL);
INSERT INTO `empresas` VALUES (15, 'Ing. ARNALDO JORGE GILI', 'Ing. Arnaldo Jorge Gili', 'P. Martinez N° 2475', '425905', NULL, NULL);
INSERT INTO `empresas` VALUES (16, 'ANSA S.A.', 'Ing. Francisco J. Anzola', 'Av. Gdor Pujol N° 2449 3° Dto.11', '433756', NULL, NULL);
INSERT INTO `empresas` VALUES (17, 'Ing. LUIS MONZON PANDO', 'Ing. Luis Monzon Pando', 'Don Bosco N° 1318 2° B', '0', NULL, NULL);
INSERT INTO `empresas` VALUES (18, 'S.R. & Asociados', 'Ing. Raúl Ernesto Schiavi', 'San Martín N° 307', '423481', NULL, NULL);
INSERT INTO `empresas` VALUES (19, 'CONSTRUMAR S.A.', 'Ing. Sergio B. Sottile', 'Godoy Cruz N° 1540', '4473900-4473999', '30-66969503-5', NULL);
INSERT INTO `empresas` VALUES (20, 'D.R. Const.', 'Arq. Juan J. del Rio', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (21, 'Arq. ANIBAL MONZON GRAMAJO', 'Arq. Ramirez', 'Don Bosco N° 1318', '434014', NULL, NULL);
INSERT INTO `empresas` VALUES (22, 'GINSA S.A.', 'Ing. Francisco Arjol', 'Av. Colón N° 539', '4421121-4426686', '30-63666667-6', 'ginsasa@gmail.com');
INSERT INTO `empresas` VALUES (23, 'Ing. IFRAN JOSE', 'Ing. Ifrán José', 'Francia N° 1649', '0', NULL, NULL);
INSERT INTO `empresas` VALUES (24, 'Ing. FRANCISCO M. CRUZ', 'Ing. Francisco M. Cruz', 'Rivadavia N° 1084', '426132', '20-13516322-9', NULL);
INSERT INTO `empresas` VALUES (25, 'JU.VIC. Constructora', 'Ing. Marcelo Valdéz', 'Lamadrid N° 845', '4426375', '20-13516395-4', NULL);
INSERT INTO `empresas` VALUES (26, 'LICON Constructora', 'Ing. Jorge R. Guarilla', 'Av. Sta. Rosa N° 1719', '461644', NULL, NULL);
INSERT INTO `empresas` VALUES (27, 'MECAR Construcciones', 'Alicia Cristina Meana Carbajal', 'Sta. Catalina N° 2040', '443105', '27-20939100-2', NULL);
INSERT INTO `empresas` VALUES (28, 'NORCON', 'Ing. Julio Talavera', 'Tucuman 658', '430020-430083', '30-51767383-4', NULL);
INSERT INTO `empresas` VALUES (29, 'ZICON S.R.L.', 'Ing. Guillermo D. Zaninovich', 'Entre Rios N° 1438', '421036', '30-68802484-2', NULL);
INSERT INTO `empresas` VALUES (30, 'ARCA S.A.', 'Arq. Gustavo Rosello (h)', 'Av. Ferre 1800 - Mercedes', '0', '30-51878612-8', NULL);
INSERT INTO `empresas` VALUES (31, 'Ing. GERMAN A. CUNDOM', 'Ing. German A. Cundom', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (32, 'Daniel Meana OBRAS CIVILES', 'Ing. Daniel A. Meana', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (33, 'MACRO Construcciones', 'Carmon Cristina Prado', 'Pje. Fariña 2138', '0', '27-13517788-7', NULL);
INSERT INTO `empresas` VALUES (34, 'CUATRO CAMINOS S.R.L.', 'Arq. Mario Raúl Ramirez', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (35, 'MORENO, ENRIQUE FABIAN', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (36, 'ALBORNOZ, Mario Hector', 'Arq. Mario H. Albornoz', NULL, '0', '20-13837552-9', NULL);
INSERT INTO `empresas` VALUES (37, 'JEVI S.A.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (38, 'Arq. Carlos R. Agazzani', 'Arq. Carlos R. Agazzani', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (39, 'EMSA S.A.', 'Arq. Jose Luis Ricatti', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (40, 'R.G.M. Construcciones', 'Ing. Julio J. H. Talavera', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (41, 'Timbó S.R.L.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (42, 'INGPORT S.R.L.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (43, 'SAIACH Construcciones S.A.', NULL, 'Bolivar 660', '0379-4421118', '30-58418895-9', NULL);
INSERT INTO `empresas` VALUES (44, 'Arq° Maria del Carmen Languasco', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (45, 'Brunel Constr.', 'Raúl H. Brunel', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (46, 'Hector Osvaldo Romero', 'Ing. Hector O. Romero', 'Junin 2335', '0', '20-16853006-5', NULL);
INSERT INTO `empresas` VALUES (47, 'Ing. Nelson E. Lértora', 'Ing. Nelson E. Lértora', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (48, 'Ing. Daniel Alfredo Meana', 'Ing. Daniel Alfredo Meana', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (49, 'CILEA SRL', 'Ing. Marcelo Luis Blanco (a)', 'Irigoyen 1853 5to. "A"', NULL, '30-70955808-7', NULL);
INSERT INTO `empresas` VALUES (50, 'Ing. Antonio L. Martín', 'Ing. Antonio L. Martín', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (51, 'Elizalde Construcciones', 'Arq. Diego Correa Zelaya', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (52, 'ARQUISA S.R.L.', 'Arq. Silvia Mabel Fiat', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (53, 'D&C de Analía Silvano', 'Arq. Analia Silvano', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (54, 'CO.AL.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (55, 'Ing. Horacio Argañaraz', 'Ing. Horacio Argañaraz', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (56, 'CARMA SRL', 'Ing. José A. Marturé', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (57, 'CANALES S.A.', 'Lorenza Marta casco', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (58, 'Arq. Jorge Nicanor Gomez', 'Arq. Jorge Nicanor Gomez', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (59, 'Ing. Eduardo Romero Gentile', 'Ing. Eduardo Romero Gentile', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (60, 'Ing. Mario Alberto Poupard', 'Ing. Mario Alberto Poupard', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (61, 'Ing. Fernando Pipán', 'Ing. Fernando Pipán', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (62, 'Quito Caballero Construcciones', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (63, 'VERGES S.A.', 'Ing. Pablo Enrique Verges', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (64, 'Mejores Hospitales S.A.', 'Ing. Alberto Jorge Piso', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (65, 'MAV Construcciones', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (66, 'D.M. Construcciones S.A.', 'hola', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (67, 'José Francisco Moreno', 'Ing. José F. Moreno', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (68, 'Electrofuturo S.R.L.', 'Ing. Jorge A. Petriette', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (69, 'Ing. Ricardo Dimas Cantero', 'Ing. Ricardo Dimas Cantero', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (70, 'Consecor S.R.L.', 'Arq. Jorge Nicanor Gomez', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (71, 'Del Rio Construcciones', 'Arq. Juan Jose Del Rio', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (72, 'Alta Gracia Construcciones', 'Jose Arnaldo Kunze', 'Junin 2389 7mo "D"', '0', '20-27064455-5', NULL);
INSERT INTO `empresas` VALUES (73, 'J.V. Construcciones S.R.L.', 'Arq. Gustavo Santarosa', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (74, 'STECON S.R.L.', 'Julio C. Stefani', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (75, 'Ing° Emilio Guillermo Sticchi', 'Ing° Emilio G. Sticchi', 'Moreno 4811', '4456801', '30-71203587-7', 'datos de ute S&P');
INSERT INTO `empresas` VALUES (76, 'Ing. Elvio R. Ramírez Const.', 'Ing. Elvio R. Ramírez', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (77, 'Argentina Constr.', 'Ing. Martin Antonio Luis', 'Independencia 3224', '0', '30-71021145-7', NULL);
INSERT INTO `empresas` VALUES (78, 'A.J.R. Construcciones', 'MMO Antonio Jose Ruidiaz', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (79, 'ALCEPA S.A', 'Ing. Alejandro Paterlini', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (80, 'ZINARQ', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (81, 'Arq° Carlos Rugnon', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (82, 'Nexo Obras y Servicios S.A.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (83, 'Construnor S.R.L.', 'Arq. Esteban Joulia', 'Ayacucho 2963', '0', '30-71139118-1', NULL);
INSERT INTO `empresas` VALUES (84, 'Chacabuco S.R.L.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (85, 'Ing. Marcelo Valdéz', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (86, 'Talez S.R.L.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (87, 'Ing. Artigas Const.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (88, 'Parras Walter D.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (89, 'Ingenieria y Servicios', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (90, 'Lecon', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (91, 'FMC Constructora', 'Ing. Francisco Mariano Cruz', 'Rivadavia 1084', '3794426132', '30-71046874-1', NULL);
INSERT INTO `empresas` VALUES (92, 'GEC S.A.', 'Ing. Jose Alejandro Carbajal', 'Santa Cruz del Sud 2800', '0', '30-70877197-6', NULL);
INSERT INTO `empresas` VALUES (93, 'Arq. THOM, Alejandro', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (94, 'Ing° Abraham Tayar', 'Ing. Abraham Antonio Tayar', 'San Juan 1037', '4438327', '20-22018077-9', NULL);
INSERT INTO `empresas` VALUES (95, 'Ing° Jorge Bernal', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (96, 'Miguel Antonio ORTEGA', NULL, 'Las Heras 840', '0', '20-20676737-6', NULL);
INSERT INTO `empresas` VALUES (97, 'Arena', 'Sr. Rodolfo J. Saade', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (98, 'Dasernic', 'Gustavo cardozo', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (99, 'Ing. Raul Duarte', 'Ing. Raul Alejandro Duarte', 'Colombia 1150', NULL, '20-22019942-9', NULL);
INSERT INTO `empresas` VALUES (100, 'BOAKNIN SALVADOR', 'Ing. R. Armoa', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (101, 'Horminor', 'Juan Ramón Bernachea', 'Ruta Prov N° 5 Km 2', '3794639855', '20-23396247-4', NULL);
INSERT INTO `empresas` VALUES (102, 'DC Construcciones', 'Arq. Arnaldi Alberto Daniel', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (103, 'Towada Construcciones', 'Walter Daniel Tomsich', NULL, '0', '20-18022614-2', NULL);
INSERT INTO `empresas` VALUES (104, 'Ing. Luis Walter Quijano', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (105, 'D.F. Construcciones', 'Dario Fisman', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (106, 'Constructora Roca S.R.L.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (107, 'Ing. Gomez Enriquez Jose A.', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (108, 'J.M.G. S.R.L.', 'Juan Manuel Giguer Mollevi', 'Av. Maipú km 6,5', '0', '30-71163620-6', NULL);
INSERT INTO `empresas` VALUES (109, 'Arq. Hugo Daniel Sosa', NULL, NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (110, 'Arq° Luisa Esther Acevedo', 'Arq° Luisa Esther Acevedo', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (111, 'HAR.CEM.HAR.SRL', 'Sr. Matias Harispe', NULL, '0', NULL, NULL);
INSERT INTO `empresas` VALUES (112, 'D.J.B. S.R.L.', NULL, '9 de Julio 2049 1P Dpto 3', '3786154615112', '30-71127784-2', NULL);
INSERT INTO `empresas` VALUES (113, 'TAYAR Construcc.', 'Ing. Abraham Antonio Tayar', 'San Juan 1037', '4438327', '20-22018077-9', NULL);
INSERT INTO `empresas` VALUES (114, 'Rentamaq S.R.L', 'Ricardo Alberto Danuzzo', 'San Martin 1942', '0', NULL, NULL);
INSERT INTO `empresas` VALUES (115, 'C.R.A. Construcciones', 'Ciro Rodolfo Alarcón', 'Las Heras 1427', '3794803380', '20-17618455-9', NULL);
INSERT INTO `empresas` VALUES (116, 'GENERGIA S.A', 'Sr. Pedro Nicolas Belcastro', 'Jujuy 848', '3794468600', '30-68800761-1', NULL);
INSERT INTO `empresas` VALUES (117, 'Ing. Hugo R. Sanchez', 'Ing. Hugo R. Sanchez', 'Rio Limay 2871', NULL, '20-16219535-3', NULL);
INSERT INTO `empresas` VALUES (118, 'OLIVEROS, Juan manuel', 'OLIVEROS, Juan manuel', 'Corrientes 1146 - Goya', NULL, '20-23903260-6', NULL);
INSERT INTO `empresas` VALUES (119, 'Pilares SRL', 'Miguel Alejandro Irigoyen', 'Salta 885 2do A', NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (120, 'Proyectos y Estudios Especiales', 'Ing. Fabian A. Schvartzer', 'Pellegrini 982', NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (121, 'OLIVA, Ruben Omar', NULL, 'Alberdi 1375', NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (122, 'MONPAN S.R.L.', 'Ing. Luis Monzon Pando', 'Las Heras 1677', NULL, '30-71067450-3', NULL);
INSERT INTO `empresas` VALUES (123, 'HITO S.A.', 'Carlos Edgar Majul', 'Tucuman 1391', NULL, '30-60935474-3', NULL);
INSERT INTO `empresas` VALUES (124, 'SEIMAC S.A.', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (125, 'San Antonio Servicios', 'Mario Domingo Aratto', 'Reconquista 635 - Esquina', NULL, '20-13647270-5', NULL);
INSERT INTO `empresas` VALUES (126, 'GARUPA S.R.L.', 'Agr. Cataldo Catapano', 'Ruta 12 Km 1021', NULL, '30-67005679-8', NULL);
INSERT INTO `empresas` VALUES (127, 'Piragine Luis Ariel Const.', 'Piragine, Luis Ariel', 'Cordiba 523', NULL, '20-22019683-7', NULL);
INSERT INTO `empresas` VALUES (128, 'Ing. Jorge A. Petriette', 'Ing. Jorge A. Petriette', 'Avda. La Argentina 2020', '4444044', '20-14376242-5', 'Electrofuturo');
INSERT INTO `empresas` VALUES (129, 'Ceramica Norte S.A.', 'Ramon W. Gomez de Oliveira', 'Armenia 4194', NULL, '30-56604171-1', NULL);
INSERT INTO `empresas` VALUES (130, 'Reino Natural S.R.L.', 'Maria Silvina Acevedo Oliver', NULL, NULL, '30-71340340-3', 'Segovia');
INSERT INTO `empresas` VALUES (131, 'CEMAR S.A.', 'Ing. Gladis Miriam Requena', NULL, NULL, '30-61308828-4', NULL);
INSERT INTO `empresas` VALUES (132, 'Ninguna', 'Ciro Rodolfo Alarcón', 'Las Heras 1427', '3794803380', NULL, NULL);
INSERT INTO `empresas` VALUES (133, 'Ninguna', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (134, 'Ing. Roberto  Armoa', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (135, 'Construquen S.R.L.', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (136, 'AKARANDU', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (137, 'RI.OS. MAQ', 'Ana Virginia silva', NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (138, 'Ing. Guillermo A. Zamudio', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (139, 'Traverso, Fernando Antonio', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (140, 'LUIS WALTER QUIJANO', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (141, 'TyN Constructora', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (142, 'SETA Ingenieria S.A.', NULL, NULL, NULL, '30-71461810-1', NULL);
INSERT INTO `empresas` VALUES (143, 'Comercializadora del NEA', 'Fernando García Sarmiento', 'Paraguay 766 PB', NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (144, 'Irupe Construcciones', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (145, 'Cavercon S.A', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `empresas` VALUES (146, 'Electro-Rural S.R.L.', 'Liliana Beatriz Wetzel', NULL, NULL, '30-71233268-5', NULL);
