/*
  Warnings:

  - You are about to drop the column `price_date` on the `prices` table. All the data in the column will be lost.
  - Added the required column `priceDate` to the `prices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `prices` DROP COLUMN `price_date`,
    ADD COLUMN `priceDate` DATETIME(3) NOT NULL;
