-- CreateTable
CREATE TABLE `prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` INTEGER NOT NULL,
    `price_date` DATETIME(3) NOT NULL,
    `price` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cod` VARCHAR(255) NULL,
    `name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(255) NULL,
    `category` VARCHAR(255) NULL,
    `type` VARCHAR(255) NULL,
    `origin_table` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presupuestos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `obraId` INTEGER NOT NULL,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mediciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `presupuestoId` INTEGER NOT NULL,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NULL,
    `montoContrato` DOUBLE NULL,
    `inaugurada` SMALLINT NULL,
    `plazo` INTEGER NULL,
    `Fecha de Contrato` DATETIME(3) NULL,
    `Fecha de Inicio` DATETIME(3) NULL,
    `Fecha de Finalización` DATETIME(3) NULL,
    `fechaLicitacion` DATETIME(3) NULL,
    `data` JSON NOT NULL,

    UNIQUE INDEX `NombreObra`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `NumCertificado` VARCHAR(50) NULL,
    `Monto` DOUBLE NULL,
    `MesCertificado` DATETIME(3) NULL,
    `data` JSON NOT NULL,
    `IdObras` INTEGER NULL,
    `IdEmpresa` INTEGER NULL,
    `FechaLiq` DATETIME(3) NULL,
    `FechaIng` DATETIME(3) NULL,
    `pagado` SMALLINT NULL,
    `netoapagar` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prices` ADD CONSTRAINT `prices_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `presupuestos` ADD CONSTRAINT `presupuestos_obraId_fkey` FOREIGN KEY (`obraId`) REFERENCES `obras`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mediciones` ADD CONSTRAINT `mediciones_presupuestoId_fkey` FOREIGN KEY (`presupuestoId`) REFERENCES `presupuestos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificaciones` ADD CONSTRAINT `certificaciones_IdObras_fkey` FOREIGN KEY (`IdObras`) REFERENCES `obras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
