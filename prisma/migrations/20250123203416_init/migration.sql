-- CreateTable
CREATE TABLE `certificaciones` (
    `IdCertificado` INTEGER NOT NULL AUTO_INCREMENT,
    `NumCertificado` VARCHAR(50) NULL,
    `Monto` DOUBLE NULL,
    `MesCertificado` DATETIME(0) NULL,
    `IdObras` INTEGER NULL,
    `IdTipos` INTEGER NULL,
    `IdEmpresa` INTEGER NULL,
    `FechaLiq` DATETIME(0) NULL,
    `FechaIng` DATETIME(0) NULL,
    `pagado` TINYINT NULL,
    `netoapagar` DOUBLE NULL,
    `numexpte` VARCHAR(255) NULL,
    `provisorio` TINYINT NULL,
    `verificado` TINYINT NULL,
    `numexpte2` INTEGER NULL,
    `ubicacion` INTEGER NULL,
    `recibidofyh_1` DATETIME(0) NULL,
    `recibidofyh_2` DATETIME(0) NULL,
    `recibidofyh_3` DATETIME(0) NULL,
    `recibidofyh_4` DATETIME(0) NULL,
    `recibidofyh_5` DATETIME(0) NULL,
    `recibido_1` TINYINT NULL,
    `recibido_2` TINYINT NULL,
    `recibido_3` TINYINT NULL,
    `recibido_4` TINYINT NULL,
    `recibido_5` TINYINT NULL,
    `IdTipos2` VARCHAR(255) NULL,
    `redetnum` VARCHAR(255) NULL,
    `adicnum` VARCHAR(255) NULL,

    INDEX `IdEmpresa`(`IdEmpresa`),
    INDEX `IdObra`(`IdObras`),
    INDEX `IdTipos`(`IdTipos`),
    INDEX `NumCertificado`(`NumCertificado`),
    INDEX `ObrasCertificaciones`(`IdObras`),
    INDEX `IdTipos2`(`IdTipos2`),
    PRIMARY KEY (`IdCertificado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresas` (
    `IdEmpresa` INTEGER NOT NULL AUTO_INCREMENT,
    `Nombreempresa` VARCHAR(50) NULL,
    `Responsable` VARCHAR(50) NULL,
    `Dirección` VARCHAR(50) NULL,
    `Telefono` VARCHAR(255) NULL,
    `Cuit` VARCHAR(255) NULL,
    `Observaciones` VARCHAR(255) NULL,
    `mail` VARCHAR(255) NULL,
    `cfce` DATETIME(0) NULL,
    `cfcv` DATETIME(0) NULL,
    `cfcp` DATETIME(0) NULL,
    `pass` VARCHAR(255) NULL,
    `user` VARCHAR(255) NULL,

    PRIMARY KEY (`IdEmpresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspectores` (
    `IdInspectores` INTEGER NOT NULL AUTO_INCREMENT,
    `Tratamiento` VARCHAR(10) NULL,
    `Apellido` VARCHAR(50) NULL,
    `Nombres` VARCHAR(50) NULL,
    `proye` INTEGER NULL,
    `Teléfono` VARCHAR(50) NULL,
    `Inspector` TINYINT NULL,

    PRIMARY KEY (`IdInspectores`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obras` (
    `IdObras` INTEGER NOT NULL AUTO_INCREMENT,
    `NombreObra` VARCHAR(200) NULL,
    `Norma_Legal` VARCHAR(50) NULL,
    `Norma_Legal2` VARCHAR(50) NULL,
    `Monto_Contrato` DOUBLE NULL,
    `IdEmpresa` INTEGER NULL,
    `IdInspectores` INTEGER NULL,
    `IdReparticion` INTEGER NULL,
    `IdAvance` INTEGER NULL,
    `Plazo` INTEGER NULL,
    `IdModalidad` INTEGER NULL,
    `IdLocalidad` INTEGER NULL,
    `IdAreas` INTEGER NULL,
    `Fecha de Contrato` DATETIME(0) NULL,
    `Fecha de Inicio` DATETIME(0) NULL,
    `Fecha de Finalización` DATETIME(0) NULL,
    `Memoria Desc` LONGTEXT NULL,
    `Codigo Meta` VARCHAR(50) NULL,
    `Departamento` INTEGER NULL,
    `Monto_Adicional_1` DOUBLE NULL,
    `Plazo_Adicional1` INTEGER NULL,
    `Final_adicional1` DATETIME(0) NULL,
    `Monto_Adicional_2` DOUBLE NULL,
    `Plazo_Adicional2` INTEGER NULL,
    `Final_adicional2` DATETIME(0) NULL,
    `Plazo_Adicional3` INTEGER NULL,
    `Final_adicional3` DATETIME(0) NULL,
    `IdProyectista` INTEGER NULL,
    `Norma1` VARCHAR(50) NULL,
    `Norma2` VARCHAR(50) NULL,
    `Norma3` VARCHAR(50) NULL,
    `Amp_Cont1` VARCHAR(50) NULL,
    `Amp_Cont2` VARCHAR(50) NULL,
    `Observaciones` LONGTEXT NULL,
    `Monto_Adicional_3` DOUBLE NULL,
    `Amp_Cont3` VARCHAR(50) NULL,
    `Redet_monto_1` DOUBLE NULL,
    `Redet_monto_2` DOUBLE NULL,
    `Redet_monto_3` DOUBLE NULL,
    `Redet_norma_1` VARCHAR(50) NULL,
    `Redet_norma_2` VARCHAR(50) NULL,
    `Redet_norma_3` VARCHAR(50) NULL,
    `Redet_monto_4` DOUBLE NULL,
    `Redet_monto_5` DOUBLE NULL,
    `Redet_monto_6` DOUBLE NULL,
    `Redet_norma_4` INTEGER NULL,
    `Redet_norma_5` INTEGER NULL,
    `Redet_norma_6` INTEGER NULL,
    `Redet_norma_01` INTEGER NULL,
    `Redet_norma_02` INTEGER NULL,
    `Redet_norma_03` INTEGER NULL,
    `redet1` VARCHAR(255) NULL,
    `redet2` VARCHAR(255) NULL,
    `redet3` VARCHAR(255) NULL,
    `redet4` VARCHAR(255) NULL,
    `redet5` VARCHAR(255) NULL,
    `redet6` VARCHAR(255) NULL,
    `basicoredet1` VARCHAR(255) NULL,
    `basicoredet2` VARCHAR(255) NULL,
    `basicoredet3` VARCHAR(255) NULL,
    `basicoredet4` VARCHAR(255) NULL,
    `basicoredet5` VARCHAR(255) NULL,
    `basicoredet6` VARCHAR(255) NULL,
    `Proyecto` TINYINT NULL,
    `AñoTerminada` INTEGER NULL,
    `Expte` VARCHAR(255) NULL,
    `Expte2` INTEGER NULL,
    `pliego` TINYINT NULL,
    `basico` VARCHAR(255) NULL,
    `prioridad` TINYINT NULL,
    `fuenteO` INTEGER NULL,
    `Edificio` INTEGER NULL,
    `pptoof` DOUBLE NULL,
    `3p` TINYINT NULL,
    `Fechalicit` DATETIME(0) NULL,
    `ResponsableProy` VARCHAR(255) NULL,
    `Fechapliego` DATETIME(0) NULL,
    `Fechaelevado` DATETIME(0) NULL,
    `NormaARP` VARCHAR(255) NULL,
    `NormaARD` VARCHAR(255) NULL,
    `fechaARP` DATETIME(0) NULL,
    `fechaARD` DATETIME(0) NULL,
    `NormaARPA1` VARCHAR(255) NULL,
    `NormaARDA1` VARCHAR(255) NULL,
    `fechaARPA1` DATETIME(0) NULL,
    `fechaARDA1` DATETIME(0) NULL,
    `NormaARPA2` VARCHAR(255) NULL,
    `NormaARDA2` VARCHAR(255) NULL,
    `fechaARPA2` DATETIME(0) NULL,
    `fechaARDA2` DATETIME(0) NULL,
    `NormaARPA3` VARCHAR(255) NULL,
    `NormaARDA3` VARCHAR(255) NULL,
    `fechaARPA3` DATETIME(0) NULL,
    `fechaARDA3` DATETIME(0) NULL,
    `inaugurada` TINYINT NULL,
    `ainaugurar` TINYINT NULL,
    `fechainaugur` DATETIME(0) NULL,
    `noinaugur` TINYINT NULL,
    `observ3%` VARCHAR(255) NULL,
    `numlic` VARCHAR(255) NULL,
    `asociado1` INTEGER NULL,
    `asociado2` INTEGER NULL,
    `calculista` INTEGER NULL,
    `computista` INTEGER NULL,
    `dibujante1` INTEGER NULL,
    `dibujante2` INTEGER NULL,
    `IdEstad` INTEGER NULL,
    `pptador` INTEGER NULL,
    `fechainicio` DATETIME(0) NULL,
    `fechafin` DATETIME(0) NULL,
    `fechaelevdir` DATETIME(0) NULL,
    `IdEsc` INTEGER NULL,
    `tareas` VARCHAR(255) NULL,
    `IdObj` INTEGER NULL,
    `observproy` VARCHAR(255) NULL,
    `solic1` INTEGER NULL,
    `solic2` INTEGER NULL,
    `Idproceso` INTEGER NULL,
    `refm2` INTEGER NULL,
    `ampm2` INTEGER NULL,
    `normaadju` VARCHAR(255) NULL,
    `normalicit` VARCHAR(255) NULL,
    `fecha1` DATETIME(0) NULL,
    `fecha2` DATETIME(0) NULL,
    `fecha3` DATETIME(0) NULL,
    `fecha4` DATETIME(0) NULL,
    `fecha5` DATETIME(0) NULL,
    `fecha6` DATETIME(0) NULL,
    `datospoliza` LONGTEXT NULL,
    `onm2` INTEGER NULL,
    `codigoSIG` INTEGER NULL,
    `%avanceproy` INTEGER NULL,
    `MemAdic1` LONGTEXT NULL,
    `MemAdic2` LONGTEXT NULL,
    `MemAdic3` LONGTEXT NULL,
    `polizanum` VARCHAR(255) NULL,
    `polizaemp` VARCHAR(255) NULL,
    `polizamonto` DOUBLE NULL,
    `clasificacion` INTEGER NULL,
    `fecha7` DATETIME(0) NULL,
    `fecha8` DATETIME(0) NULL,
    `fecha9` DATETIME(0) NULL,
    `caratula` TINYINT NULL,
    `presupuesto` TINYINT NULL,
    `drive` TINYINT NULL,
    `obserpliego` LONGTEXT NULL,
    `IdProg` INTEGER NULL,
    `autor1` VARCHAR(255) NULL,
    `autor2` VARCHAR(255) NULL,
    `autor3` VARCHAR(255) NULL,
    `autor4` VARCHAR(255) NULL,
    `autor5` VARCHAR(255) NULL,
    `autor6` VARCHAR(255) NULL,
    `autor7` VARCHAR(255) NULL,
    `autor8` VARCHAR(255) NULL,
    `autor9` VARCHAR(255) NULL,
    `autor10` VARCHAR(255) NULL,
    `autor11` VARCHAR(255) NULL,
    `autor12` VARCHAR(255) NULL,
    `link1` VARCHAR(50) NULL,
    `link2` VARCHAR(50) NULL,
    `ordenanza1` VARCHAR(50) NULL,
    `ordenanza2` VARCHAR(50) NULL,
    `progresoplanif` INTEGER NULL,
    `Redet_monto_7` DOUBLE NULL,
    `Redet_monto_8` DOUBLE NULL,
    `Redet_monto_9` DOUBLE NULL,
    `Redet_norma_7` VARCHAR(50) NULL,
    `Redet_norma_8` VARCHAR(50) NULL,
    `Redet_norma_9` VARCHAR(50) NULL,
    `Redet_monto_10` DOUBLE NULL,
    `Redet_monto_11` DOUBLE NULL,
    `Redet_monto_12` DOUBLE NULL,
    `Redet_norma_10` INTEGER NULL,
    `Redet_norma_11` INTEGER NULL,
    `Redet_norma_12` INTEGER NULL,
    `basicoredet7` VARCHAR(255) NULL,
    `basicoredet8` VARCHAR(255) NULL,
    `basicoredet9` VARCHAR(255) NULL,
    `basicoredet10` VARCHAR(255) NULL,
    `basicoredet11` VARCHAR(255) NULL,
    `basicoredet12` VARCHAR(255) NULL,
    `redet7` VARCHAR(255) NULL,
    `redet8` VARCHAR(255) NULL,
    `redet9` VARCHAR(255) NULL,
    `redet10` VARCHAR(255) NULL,
    `redet11` VARCHAR(255) NULL,
    `redet12` VARCHAR(255) NULL,
    `Adic_norma_1` INTEGER NULL,
    `Adic_norma_2` INTEGER NULL,
    `Adic_norma_3` INTEGER NULL,
    `Adic_norma_4` INTEGER NULL,
    `ARP_norma_1` INTEGER NULL,
    `ARD_norma_1` INTEGER NULL,
    `AP_norma_1` INTEGER NULL,
    `AP_norma_2` INTEGER NULL,
    `AP_norma_3` INTEGER NULL,
    `AP_norma_4` INTEGER NULL,
    `Monto_Adicional_4` DOUBLE NULL,
    `Plazo_Adicional4` INTEGER NULL,
    `Final_adicional4` DATETIME(0) NULL,
    `Amp_Cont4` VARCHAR(50) NULL,
    `MemAdic4` LONGTEXT NULL,
    `ARPA_expte_4` INTEGER NULL,
    `ARDA_expte_4` INTEGER NULL,
    `NormaARPA4` VARCHAR(255) NULL,
    `NormaARDA4` VARCHAR(255) NULL,
    `fechaARPA4` DATETIME(0) NULL,
    `fechaARDA4` DATETIME(0) NULL,
    `Norma4` VARCHAR(50) NULL,
    `ARPA_expte_3` INTEGER NULL,
    `ARDA_expte_3` INTEGER NULL,
    `ARPA_expte_2` INTEGER NULL,
    `ARDA_expte_2` INTEGER NULL,
    `ARPA_expte_1` INTEGER NULL,
    `ARDA_expte_1` INTEGER NULL,
    `3pr1` TINYINT NULL,
    `3pr2` TINYINT NULL,
    `3pr3` TINYINT NULL,
    `3pr4` TINYINT NULL,
    `3pr5` TINYINT NULL,
    `3pr6` TINYINT NULL,
    `3pr7` TINYINT NULL,
    `3pr8` TINYINT NULL,
    `3pr9` TINYINT NULL,
    `3pr10` TINYINT NULL,
    `3pr11` TINYINT NULL,
    `3pr12` TINYINT NULL,
    `IdRepresentante` INTEGER NULL,
    `ARPA_expte_0` INTEGER NULL,
    `ARDA_expte_0` INTEGER NULL,
    `pptotope` TINYINT NULL,

    UNIQUE INDEX `NombreObra`(`NombreObra`),
    INDEX `EmpresasObras`(`IdEmpresa`),
    INDEX `IdAreas`(`IdAreas`),
    INDEX `IdAvance`(`IdAvance`),
    INDEX `IdEmpresa`(`IdEmpresa`),
    INDEX `IdInspector`(`IdInspectores`),
    INDEX `IdLocalidad`(`IdLocalidad`),
    INDEX `IdModalidad`(`IdModalidad`),
    INDEX `IdReparticion`(`IdReparticion`),
    INDEX `Proyectista`(`IdProyectista`),
    INDEX `IdEsc`(`IdEsc`),
    INDEX `IdEstad`(`IdEstad`),
    INDEX `IdInspectores`(`IdRepresentante`),
    INDEX `Idproceso`(`Idproceso`),
    PRIMARY KEY (`IdObras`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proyectistas` (
    `IdProyectista` INTEGER NOT NULL AUTO_INCREMENT,
    `Tratamiento` VARCHAR(10) NULL,
    `Apellido` VARCHAR(50) NULL,
    `Nombres` VARCHAR(50) NULL,
    `Profesion` VARCHAR(50) NULL,
    `Dirección` VARCHAR(50) NULL,
    `Teléfono` VARCHAR(50) NULL,
    `Inspector` TINYINT NULL,
    `DNI` INTEGER NULL,
    `observaciones` LONGTEXT NULL,
    `mail` VARCHAR(255) NULL,
    `dependencia` INTEGER NULL,

    PRIMARY KEY (`IdProyectista`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `labor_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jornal_id` INTEGER NOT NULL,
    `daily_rate` DECIMAL(10, 2) NOT NULL,
    `hourly_rate` DECIMAL(10, 2) NOT NULL,
    `valid_from` DATE NOT NULL,
    `valid_to` DATE NULL,

    INDEX `jornal_id`(`jornal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `index_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `index_id` INTEGER NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `valid_from` DATE NOT NULL,
    `valid_to` DATE NULL,

    INDEX `index_id`(`index_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `indices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) NULL,

    UNIQUE INDEX `code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `valid_from` DATE NOT NULL,
    `valid_to` DATE NULL,

    INDEX `item_id`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) NULL,

    UNIQUE INDEX `code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jornales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `material_id` INTEGER NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `valid_from` DATE NOT NULL,
    `valid_to` DATE NULL,

    INDEX `material_id`(`material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materiales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) NULL,

    UNIQUE INDEX `code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `element_tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `element_id` INTEGER NOT NULL,
    `table_name` ENUM('materiales', 'indices', 'items', 'jornales') NOT NULL,
    `tag_id` INTEGER NOT NULL,

    INDEX `tag_id`(`tag_id`),
    UNIQUE INDEX `unique_element_tag`(`element_id`, `table_name`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas` (
    `IdAreas` INTEGER NOT NULL AUTO_INCREMENT,
    `Areas` VARCHAR(50) NULL,

    INDEX `IdArea`(`Areas`),
    PRIMARY KEY (`IdAreas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avance` (
    `IdAvance` INTEGER NOT NULL AUTO_INCREMENT,
    `Estado` VARCHAR(50) NULL,
    `descripcion` VARCHAR(255) NULL,

    PRIMARY KEY (`IdAvance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clasificacion` (
    `IdClasif` INTEGER NOT NULL AUTO_INCREMENT,
    `clasif` VARCHAR(255) NULL,

    PRIMARY KEY (`IdClasif`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comercios` (
    `IdComercio` INTEGER NOT NULL AUTO_INCREMENT,
    `Nombrecomercio` VARCHAR(50) NULL,
    `Responsable` VARCHAR(50) NULL,
    `Dirección` VARCHAR(50) NULL,
    `Telefono` VARCHAR(255) NULL,
    `Cuit` VARCHAR(255) NULL,
    `Observaciones` VARCHAR(255) NULL,

    PRIMARY KEY (`IdComercio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dependencias` (
    `IdDep` INTEGER NOT NULL AUTO_INCREMENT,
    `dependencia` VARCHAR(255) NULL,
    `dep` VARCHAR(255) NULL,

    PRIMARY KEY (`IdDep`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dptos` (
    `IdDptos` INTEGER NOT NULL AUTO_INCREMENT,
    `Departamentos` VARCHAR(50) NULL,
    `abrev` VARCHAR(255) NULL,

    UNIQUE INDEX `Departamentos`(`Departamentos`),
    PRIMARY KEY (`IdDptos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `edificios` (
    `IdEsc` INTEGER NOT NULL AUTO_INCREMENT,
    `acceso` VARCHAR(255) NULL,
    `Numero` INTEGER NULL,
    `Adrema` VARCHAR(255) NULL,
    `propiedad` VARCHAR(255) NULL,
    `lat` VARCHAR(10) NULL,
    `lng` VARCHAR(10) NULL,
    `Nombre` VARCHAR(50) NULL,
    `IdDptos` INTEGER NULL,
    `IdLocalidad` INTEGER NULL,
    `estadoconserv` VARCHAR(255) NULL,
    `Superficie` DOUBLE NULL,
    `dirlote` VARCHAR(255) NULL,
    `Extras` LONGTEXT NULL,
    `Observaciones` LONGTEXT NULL,
    `Dirección` VARCHAR(255) NULL,
    `Convenio` VARCHAR(255) NULL,
    `Categoría` VARCHAR(255) NULL,
    `IdFuncio` INTEGER NULL,
    `Distancia` INTEGER NULL,
    `Instespec` VARCHAR(255) NULL,
    `Añoconst` VARCHAR(255) NULL,
    `Director` VARCHAR(255) NULL,
    `dirmanzana` VARCHAR(255) NULL,
    `dirnum` VARCHAR(255) NULL,
    `Insctomo` VARCHAR(255) NULL,
    `Inscfolio` VARCHAR(255) NULL,
    `Caraconst` VARCHAR(255) NULL,
    `Inscaño` INTEGER NULL,
    `Empresaejec` VARCHAR(255) NULL,
    `Autor` VARCHAR(255) NULL,
    `FotoEmp` VARCHAR(255) NULL,
    `Foto1` VARCHAR(255) NULL,
    `Foto2` VARCHAR(255) NULL,
    `Foto3` VARCHAR(255) NULL,
    `Img1` VARCHAR(255) NULL,
    `mensura` VARCHAR(255) NULL,
    `otros datos` VARCHAR(255) NULL,
    `frente` DOUBLE NULL,
    `fondo` DOUBLE NULL,

    INDEX `Nombre`(`Nombre`),
    INDEX `iddptos`(`IdDptos`),
    PRIMARY KEY (`IdEsc`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estados` (
    `Idestad` INTEGER NOT NULL AUTO_INCREMENT,
    `estado` VARCHAR(255) NULL,

    PRIMARY KEY (`Idestad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuentes` (
    `IdFuente` INTEGER NOT NULL AUTO_INCREMENT,
    `fuente` VARCHAR(255) NULL,

    PRIMARY KEY (`IdFuente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcion` (
    `IdFuncio` INTEGER NOT NULL AUTO_INCREMENT,
    `funcion` VARCHAR(50) NULL,

    PRIMARY KEY (`IdFuncio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `informes` (
    `IdInforme` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(0) NULL,
    `IdObras` INTEGER NULL,
    `informe` VARCHAR(200) NULL,

    PRIMARY KEY (`IdInforme`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iniciadores` (
    `IdInic` INTEGER NOT NULL AUTO_INCREMENT,
    `iniciador` VARCHAR(255) NULL,
    `IdEmpresa` INTEGER NULL,

    UNIQUE INDEX `iniciador`(`iniciador`),
    INDEX `IdEmpresa`(`IdEmpresa`),
    PRIMARY KEY (`IdInic`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `localidades` (
    `IdLocalidad` INTEGER NOT NULL AUTO_INCREMENT,
    `Localidad` VARCHAR(50) NULL,
    `IdDptos` INTEGER NULL,
    `Categoría` INTEGER NULL,
    `Población` INTEGER NULL,
    `intendente` VARCHAR(255) NULL,
    `codpostal` VARCHAR(255) NULL,
    `Datos` VARCHAR(255) NULL,
    `abrevloc` VARCHAR(255) NULL,

    UNIQUE INDEX `Localidad`(`Localidad`),
    INDEX `iddptos`(`IdDptos`),
    PRIMARY KEY (`IdLocalidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modalidad` (
    `IdModalidad` INTEGER NOT NULL AUTO_INCREMENT,
    `Tipo` VARCHAR(50) NULL,

    PRIMARY KEY (`IdModalidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_trabajo` (
    `IdPlan` INTEGER NOT NULL AUTO_INCREMENT,
    `IdObras` INTEGER NULL,
    `Mes 1` DATETIME(0) NULL,
    `Montos 1` DOUBLE NULL,
    `P_ de Trabajo_1` DOUBLE NULL,

    INDEX `IdObras`(`IdObras`),
    PRIMARY KEY (`IdPlan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procesos` (
    `Idproceso` INTEGER NOT NULL AUTO_INCREMENT,
    `proceso` VARCHAR(255) NULL,

    PRIMARY KEY (`Idproceso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programas` (
    `IdProg` INTEGER NOT NULL AUTO_INCREMENT,
    `Denominacion` VARCHAR(255) NULL,

    PRIMARY KEY (`IdProg`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repartici├│n` (
    `IdReparticion` INTEGER NOT NULL AUTO_INCREMENT,
    `NombreRepartici├│n` VARCHAR(50) NULL,

    PRIMARY KEY (`IdReparticion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `representantes` (
    `IdRep` INTEGER NOT NULL AUTO_INCREMENT,
    `TratRep` VARCHAR(255) NULL,
    `ApellidoRep` VARCHAR(255) NULL,
    `NombresRep` VARCHAR(255) NULL,
    `DNIRep` VARCHAR(255) NULL,
    `Mat` VARCHAR(255) NULL,

    PRIMARY KEY (`IdRep`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rubros` (
    `IdRubro` INTEGER NOT NULL AUTO_INCREMENT,
    `Rubro` VARCHAR(50) NULL,
    `comentario` VARCHAR(255) NULL,

    INDEX `IdArea`(`Rubro`),
    PRIMARY KEY (`IdRubro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipocertificados` (
    `IdTipos` INTEGER NOT NULL AUTO_INCREMENT,
    `tipocertificado` VARCHAR(50) NULL,

    PRIMARY KEY (`IdTipos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipocomprobante` (
    `IdCompro` INTEGER NOT NULL AUTO_INCREMENT,
    `compro` VARCHAR(50) NULL,
    `comentario` VARCHAR(255) NULL,

    INDEX `IdArea`(`compro`),
    PRIMARY KEY (`IdCompro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `IdUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `Login` VARCHAR(255) NULL,
    `pass` VARCHAR(255) NULL,
    `Id_acceso` INTEGER NULL,
    `usuario` VARCHAR(255) NULL,
    `identif` VARCHAR(255) NULL,
    `IdDep` INTEGER NULL,

    INDEX `identif`(`identif`),
    PRIMARY KEY (`IdUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repartición` (
    `IdReparticion` INTEGER NOT NULL AUTO_INCREMENT,
    `NombreRepartición` VARCHAR(50) NULL,

    PRIMARY KEY (`IdReparticion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presupuestos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` JSON NOT NULL,
    `obraId` INTEGER NOT NULL,

    INDEX `obraId`(`obraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `labor_rates` ADD CONSTRAINT `labor_rates_ibfk_1` FOREIGN KEY (`jornal_id`) REFERENCES `jornales`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `index_values` ADD CONSTRAINT `index_values_ibfk_1` FOREIGN KEY (`index_id`) REFERENCES `indices`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `item_prices` ADD CONSTRAINT `item_prices_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `material_prices` ADD CONSTRAINT `material_prices_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materiales`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `element_tags` ADD CONSTRAINT `element_tags_ibfk_1` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `presupuestos` ADD CONSTRAINT `presupuestos_obraId_fkey` FOREIGN KEY (`obraId`) REFERENCES `obras`(`IdObras`) ON DELETE RESTRICT ON UPDATE CASCADE;
