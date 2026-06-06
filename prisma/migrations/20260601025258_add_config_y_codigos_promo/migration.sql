-- CreateTable
CREATE TABLE `config_tienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `banner_activo` BOOLEAN NOT NULL DEFAULT true,
    `codigo_promo` VARCHAR(50) NOT NULL DEFAULT 'DULCE15',
    `descuento_porcentaje` INTEGER NOT NULL DEFAULT 15,
    `envio_gratis_desde` INTEGER NOT NULL DEFAULT 120000,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codigos_promo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descuento` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `descripcion` VARCHAR(200) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `codigos_promo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
