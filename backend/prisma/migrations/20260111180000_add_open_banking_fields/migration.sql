-- Add Open Banking fields to Account model
ALTER TABLE "accounts" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "accounts" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "accounts" ADD COLUMN "tokenExpiresAt" DATETIME;
ALTER TABLE "accounts" ADD COLUMN "syncError" TEXT;
ALTER TABLE "accounts" ADD COLUMN "metadata" TEXT; -- JSON field for provider-specific data