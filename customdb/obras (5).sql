-- phpMyAdmin SQL Dump
-- version 2.10.3
-- http://www.phpmyadmin.net
-- 
-- Servidor: localhost
-- Tiempo de generación: 24-12-2024 a las 12:09:44
-- Versión del servidor: 5.0.51
-- Versión de PHP: 5.2.6

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

-- 
-- Base de datos: `obras`
-- 

-- --------------------------------------------------------

-- 
-- Estructura de tabla para la tabla `proyectistas`
-- 

CREATE TABLE `proyectistas` (
  `IdProyectista` int(11) NOT NULL auto_increment,
  `Tratamiento` varchar(10) default NULL,
  `Apellido` varchar(50) default NULL,
  `Nombres` varchar(50) default NULL,
  `Campo1` varchar(50) default NULL,
  `Dirección` varchar(50) default NULL,
  `Teléfono` varchar(50) default NULL,
  `Inspector` tinyint(4) default NULL,
  PRIMARY KEY  (`IdProyectista`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=63 ;

-- 
-- Volcar la base de datos para la tabla `proyectistas`
-- 

INSERT INTO `proyectistas` VALUES (1, 'Arq°', 'Gutierrez', 'César A.', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (2, 'MMO', 'Giorgetti', 'Armando Daniel', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (3, 'MMO', 'Valdéz', 'Roberto', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (4, 'Ing°', 'Castañeda', 'Jorge C.', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (5, 'Arq°', 'Villarroel', 'José', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (6, 'Ing°', 'Putallaz', 'Jorge E.', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (7, 'MMO', 'Santín', 'Guillermo', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (8, 'Arq°', 'Maidana', 'Domingo', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (9, 'Ing°', 'Gómez', 'Francisco', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (10, 'Arq°', 'Manzolillo', 'Iris', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (11, 'Ing Elect°', 'Sanchez', 'Luis Alberto', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (12, 'Arq°', 'Esquivel', 'Norma A.', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (13, 'Arq°', 'Arietti', 'Carlos S.', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (14, 'Arq°', 'Ledesma', 'Miguel A.', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (15, 'Arq°', 'Matzner', 'José Luis', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (16, 'Arq°', 'Ojeda', 'Francisco', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (17, 'Arq°', 'Arqué', 'Juan Carlos', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (18, 'Arq°', 'Gómez', 'Víctor', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (19, 'Arq°', 'Gómez', 'Gustavo', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (20, 'Ing° Elect', 'Sanchez L.', 'Ernesto', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (21, 'Ninguno', 'Ninguno', NULL, NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (22, 'Arq°', 'Somazzi', 'G. Aldo', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (23, 'Arq°', 'Segovia', 'Analía V.', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (24, 'Arq°', 'S. Verdún', 'F. Luciano', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (25, 'Arq°', 'Picciochi Rios', 'Maria Luciana', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (26, 'Ing°', 'Canteros', 'Sebastián', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (27, 'Arq°', 'De Llano', 'Julián', NULL, NULL, NULL, 1);
INSERT INTO `proyectistas` VALUES (28, 'Arq°', 'Ramìrez', 'J. Javier', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (29, 'Arq°', 'Brest', 'Diego', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (30, 'Arq°', 'Vigay', 'Carolina', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (31, 'Arq°', 'Echavarria', 'Sebastian', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (32, 'Arq°', 'Diaz', 'Carola', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (33, 'Arq°', 'Saintotte', 'Soledad', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (34, 'Arq°', 'Bianchi', 'J. Diego', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (35, 'Arq°', 'Torres', 'Silvia', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (36, 'Ing°', 'Bravo', 'Javier', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (37, 'Arq°', 'Casaro', 'Juan', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (38, 'Arq°', 'Nicolosi', 'Sandra', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (39, 'Ing°', 'Esquivel', 'José', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (40, 'Arq°', 'G. Samela', 'Carlos A.', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (41, 'Arq°', 'Almirón', 'Néstor Rodolfo', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (42, 'Arq°', 'Gomez', 'Rut N.', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (43, 'Mmo', 'Murcia', 'Manuel', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (44, 'Arq°', 'Gonzalez', 'E. German', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (45, 'Arq°', 'Godoy', 'Ma. De los Angeles', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (46, 'Arq°', 'Otazú', 'María Inés', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (47, NULL, 'Externo', NULL, NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (48, 'Arq', 'Barrientos', 'Dardo', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (49, 'Ing°', 'Godoy', 'Adrian Benito', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (50, 'Arq°', 'Cardozo', 'Jorge', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (51, 'Arq°', 'Galvez', 'Daniel', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (52, 'Arq.', 'Britez', 'Miguel', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (53, 'Arq°', 'Roibón', 'Milagros', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (54, 'Arq.', 'Esteche Vivoda', 'Malvina', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (55, 'Arq.', 'Mendiondo', 'Soledad', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (56, 'Ing.', 'Roa', 'Alejandro', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (57, 'Ing.', 'Flores', 'Marta', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (58, 'Arq', 'Rodriguez', 'Noelia', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (59, 'Arq', 'Iribarren', 'Alejandro', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (60, 'Arq°', 'Caceres Forastier', 'Lautaro', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (61, 'Arq', 'Ojeda', 'Milagro', NULL, NULL, NULL, 0);
INSERT INTO `proyectistas` VALUES (62, 'Arq', 'Lopez', 'Emanuel', NULL, NULL, NULL, 0);
