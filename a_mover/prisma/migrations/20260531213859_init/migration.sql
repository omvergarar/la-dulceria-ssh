-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `direccion` VARCHAR(300) NULL,
    `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clientes_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `precio` DECIMAL(12, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `categoria` VARCHAR(80) NOT NULL,
    `imagen_url` VARCHAR(500) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `estado` ENUM('pendiente', 'pagado', 'enviado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `referencia_pago` VARCHAR(200) NULL,
    `direccion_envio` VARCHAR(300) NULL,
    `notas` VARCHAR(500) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_orden` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orden_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ordenes` ADD CONSTRAINT `ordenes_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_orden` ADD CONSTRAINT `detalles_orden_orden_id_fkey` FOREIGN KEY (`orden_id`) REFERENCES `ordenes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_orden` ADD CONSTRAINT `detalles_orden_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
