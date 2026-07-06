-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('FA', 'EN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredLanguage" "PreferredLanguage";
