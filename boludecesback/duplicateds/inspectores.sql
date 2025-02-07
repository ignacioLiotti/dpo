-- phpMyAdmin SQL Dump
-- version 2.10.3
-- http://www.phpmyadmin.net
-- 
-- Servidor: localhost
-- Tiempo de generación: 24-12-2024 a las 12:09:37
-- Versión del servidor: 5.0.51
-- Versión de PHP: 5.2.6

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

-- 
-- Base de datos: `obras`
-- 

-- --------------------------------------------------------

-- 
-- Estructura de tabla para la tabla `inspectores`
-- 

CREATE TABLE `inspectores` (
  `IdInspectores` int(11) NOT NULL auto_increment,
  `Tratamiento` varchar(10) default NULL,
  `Apellido` varchar(50) default NULL,
  `Nombres` varchar(50) default NULL,
  `Campo1` varchar(50) default NULL,
  `Dirección` varchar(50) default NULL,
  `Teléfono` varchar(50) default NULL,
  `Inspector` tinyint(4) default NULL,
  PRIMARY KEY  (`IdInspectores`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=50 ;

-- 
-- Volcar la base de datos para la tabla `inspectores`
-- 

INSERT INTO `inspectores` VALUES (1, 'Arq°', 'Gutierrez', 'César A.', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (2, 'MMO', 'Giorgetti', 'Armando Daniel', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (3, 'MMO.', 'Valdéz', 'Roberto', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (4, 'Ing°', 'Castañeda', 'Jorge C.', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (5, 'Arq°', 'Villarroel', 'José', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (6, 'Ing°', 'Putallaz', 'Jorge E.', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (7, 'MMO.', 'Santín', 'Guillermo', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (8, 'Arq°', 'Maidana', 'Domingo', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (9, 'Ing°', 'Gómez', 'Francisco', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (10, 'Arq°', 'Manzolillo', 'Iris', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (11, 'Ing Elect°', 'Sanchez', 'Luis A.', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (12, 'Arq°', 'Esquivel', 'Norma A.', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (13, 'Arq°', 'Arietti', 'Carlos S.', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (14, 'Arq°', 'Ledesma', 'Miguel A.', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (15, 'Arq°', 'Matzner', 'José Luis', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (16, 'Arq°', 'Ojeda', 'Francisco', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (17, 'Arq°', 'Arqué', 'Juan Carlos', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (18, 'Arq°', 'Gómez', 'Víctor', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (19, 'Arq°', 'Gómez', 'Gustavo', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (20, 'Ing° Elect', 'Sanchez L.', 'Ernesto', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (21, 'Arq°', 'De Llano', 'Julián', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (22, 'Arq°', 'Perrotta', 'Griselda', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (23, 'Arq°', 'Somazzi', 'G. Aldo', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (24, 'Ninguno', NULL, NULL, NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (25, 'Arq°', 'Nicolosi', 'Sandra', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (26, 'Ing°', 'Esquivel', 'Jose F.', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (27, 'Arq°', 'Gómez', 'Rut N.', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (28, 'Arq°', 'S. Verdún', 'F. Luciano', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (29, 'Arq°', 'Brites', 'Miguel A.', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (30, 'Arq°', 'G. Samela', 'Carlos A.', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (31, 'Arq°', 'Godoy', 'Ma. De los Angeles', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (32, 'Arq°', 'Vigay', 'Carolina', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (33, 'Arq°', 'Echavarria', 'Sebastián', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (35, 'Ing°', 'Bravo', 'C. Javier', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (36, 'Arq°', 'Almirón', 'Néstor Rodolfo', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (37, 'Arq°', 'S. Verdun', 'Luciano', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (38, 'Ing°', 'Flores', 'Ana Isabel', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (39, 'Arq°', 'Saintotte', 'Soledad', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (40, 'Ing° Elect', 'Canteros', 'Sebastián', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (41, 'MMO', 'Sanchez', 'Roberto', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (42, 'Arq°', 'Bianchi', 'J. Diego', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (43, 'Arq°', 'Casaro', 'Juan', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (44, 'Ing.', 'Roa', 'Alejandro', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (45, 'Ing.', 'Flores', 'Martha M.', NULL, NULL, NULL, 1);
INSERT INTO `inspectores` VALUES (46, 'Ing.', 'Aguirre', 'Cesar Nestor', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (47, 'Arq.', 'Esteche Vivoda', 'Malvina', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (48, 'Arq.', 'Caceres Forastier', 'Lautaro', NULL, NULL, NULL, 0);
INSERT INTO `inspectores` VALUES (49, 'Arq.', 'Lopez', 'Emanuel', NULL, NULL, NULL, 0);
