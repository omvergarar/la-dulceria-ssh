-- AlterTable
ALTER TABLE `ordenes` ADD COLUMN `codigo_promo` VARCHAR(50) NULL,
    ADD COLUMN `descuento_aplicado` DECIMAL(12, 2) NULL;

-- CreateTable
CREATE TABLE `fotos_producto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `producto_id` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resenas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `ciudad` VARCHAR(100) NULL,
    `texto` TEXT NOT NULL,
    `estrellas` INTEGER NOT NULL,
    `aprobada` BOOLEAN NOT NULL DEFAULT false,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codigos_usados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `codigo` VARCHAR(50) NOT NULL,
    `usado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `codigos_usados_cliente_id_codigo_key`(`cliente_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fotos_producto` ADD CONSTRAINT `fotos_producto_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `codigos_usados` ADD CONSTRAINT `codigos_usados_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
