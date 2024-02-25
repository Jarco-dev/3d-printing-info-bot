-- CreateTable
CREATE TABLE `Filaments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Nozzles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand` VARCHAR(191) NOT NULL,
    `material` VARCHAR(191) NOT NULL,
    `diameter` DECIMAL(65, 30) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FilamentPurgeVolumes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fromFilamentId` INTEGER NOT NULL,
    `toFilamentId` INTEGER NOT NULL,
    `nozzleId` INTEGER NOT NULL,
    `volume` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FilamentPurgeVolumes` ADD CONSTRAINT `FilamentPurgeVolumes_fromFilamentId_fkey` FOREIGN KEY (`fromFilamentId`) REFERENCES `Filaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FilamentPurgeVolumes` ADD CONSTRAINT `FilamentPurgeVolumes_toFilamentId_fkey` FOREIGN KEY (`toFilamentId`) REFERENCES `Filaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FilamentPurgeVolumes` ADD CONSTRAINT `FilamentPurgeVolumes_nozzleId_fkey` FOREIGN KEY (`nozzleId`) REFERENCES `Nozzles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
