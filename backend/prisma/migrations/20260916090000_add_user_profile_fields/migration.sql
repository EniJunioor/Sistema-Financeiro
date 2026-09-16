-- AlterTable: campos de perfil do usuário
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "birthDate" DATETIME;
ALTER TABLE "users" ADD COLUMN "address" TEXT;
ALTER TABLE "users" ADD COLUMN "city" TEXT;
ALTER TABLE "users" ADD COLUMN "state" TEXT;
ALTER TABLE "users" ADD COLUMN "zipCode" TEXT;
ALTER TABLE "users" ADD COLUMN "bio" TEXT;

-- Preferências do usuário (JSON): idioma, moeda, tema, notificações
ALTER TABLE "users" ADD COLUMN "preferences" TEXT;
