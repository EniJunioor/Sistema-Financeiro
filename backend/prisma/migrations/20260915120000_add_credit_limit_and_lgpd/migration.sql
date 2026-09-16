-- AlterTable: limite de crédito para contas do tipo credit_card
ALTER TABLE "accounts" ADD COLUMN "creditLimit" DECIMAL;

-- AlterTable: marca de anonimização LGPD
ALTER TABLE "users" ADD COLUMN "anonymizedAt" DATETIME;

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "purpose" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "format" TEXT NOT NULL DEFAULT 'json',
    "payload" TEXT,
    "sizeBytes" INTEGER,
    "error" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "data_export_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_deletion_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "error" TEXT,
    CONSTRAINT "data_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "consent_records_userId_idx" ON "consent_records"("userId");
CREATE INDEX "consent_records_type_idx" ON "consent_records"("type");
CREATE INDEX "consent_records_createdAt_idx" ON "consent_records"("createdAt");
CREATE INDEX "data_export_requests_userId_idx" ON "data_export_requests"("userId");
CREATE INDEX "data_export_requests_status_idx" ON "data_export_requests"("status");
CREATE INDEX "data_deletion_requests_userId_idx" ON "data_deletion_requests"("userId");
CREATE INDEX "data_deletion_requests_status_idx" ON "data_deletion_requests"("status");
CREATE INDEX "data_deletion_requests_scheduledFor_idx" ON "data_deletion_requests"("scheduledFor");
