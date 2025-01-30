-- CreateTable
CREATE TABLE `certificadosObraMensuales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `presupuestoId` INTEGER NOT NULL,
    `documentoJson` JSON NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `certificadoAnteriorId` INTEGER NULL,

    UNIQUE INDEX `certificadosObraMensuales_certificadoAnteriorId_key`(`certificadoAnteriorId`),
    INDEX `certificadosObraMensuales_presupuestoId_idx`(`presupuestoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `certificadosObraMensuales` ADD CONSTRAINT `certificadosObraMensuales_presupuestoId_fkey` FOREIGN KEY (`presupuestoId`) REFERENCES `presupuestos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificadosObraMensuales` ADD CONSTRAINT `certificadosObraMensuales_certificadoAnteriorId_fkey` FOREIGN KEY (`certificadoAnteriorId`) REFERENCES `certificadosObraMensuales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
