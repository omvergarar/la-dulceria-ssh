-- CreateTable
CREATE TABLE `temas_color` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `primary` VARCHAR(20) NOT NULL,
    `primary_dark` VARCHAR(20) NOT NULL,
    `primary_deeper` VARCHAR(20) NOT NULL,
    `accent` VARCHAR(20) NOT NULL,
    `accent_dark` VARCHAR(20) NOT NULL,
    `text_dark` VARCHAR(20) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tema_activo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL DEFAULT 'Original',
    `primary` VARCHAR(20) NOT NULL DEFAULT '#fbddf9',
    `primary_dark` VARCHAR(20) NOT NULL DEFAULT '#f5bef2',
    `primary_deeper` VARCHAR(20) NOT NULL DEFAULT '#e89ee4',
    `accent` VARCHAR(20) NOT NULL DEFAULT '#c96bc4',
    `accent_dark` VARCHAR(20) NOT NULL DEFAULT '#a3509e',
    `text_dark` VARCHAR(20) NOT NULL DEFAULT '#2d1a2b',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
