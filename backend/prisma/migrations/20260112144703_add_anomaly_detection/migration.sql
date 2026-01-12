-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_anomaly_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" DATETIME,
    CONSTRAINT "anomaly_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "anomaly_alerts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_anomaly_alerts" ("acknowledgedAt", "createdAt", "details", "id", "isAcknowledged", "message", "severity", "title", "transactionId", "type", "userId") SELECT "acknowledgedAt", "createdAt", "details", "id", "isAcknowledged", "message", "severity", "title", "transactionId", "type", "userId" FROM "anomaly_alerts";
DROP TABLE "anomaly_alerts";
ALTER TABLE "new_anomaly_alerts" RENAME TO "anomaly_alerts";
CREATE INDEX "anomaly_alerts_userId_idx" ON "anomaly_alerts"("userId");
CREATE INDEX "anomaly_alerts_type_idx" ON "anomaly_alerts"("type");
CREATE INDEX "anomaly_alerts_severity_idx" ON "anomaly_alerts"("severity");
CREATE INDEX "anomaly_alerts_createdAt_idx" ON "anomaly_alerts"("createdAt");
CREATE TABLE "new_fcm_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fcm_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_fcm_tokens" ("createdAt", "deviceInfo", "id", "isActive", "token", "updatedAt", "userId") SELECT "createdAt", "deviceInfo", "id", "isActive", "token", "updatedAt", "userId" FROM "fcm_tokens";
DROP TABLE "fcm_tokens";
ALTER TABLE "new_fcm_tokens" RENAME TO "fcm_tokens";
CREATE UNIQUE INDEX "fcm_tokens_token_key" ON "fcm_tokens"("token");
CREATE INDEX "fcm_tokens_userId_idx" ON "fcm_tokens"("userId");
CREATE INDEX "fcm_tokens_isActive_idx" ON "fcm_tokens"("isActive");
CREATE TABLE "new_ml_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "accuracy" REAL,
    "trainedAt" DATETIME NOT NULL,
    "dataPoints" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ml_models_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ml_models" ("accuracy", "createdAt", "dataPoints", "id", "isActive", "modelType", "parameters", "trainedAt", "userId") SELECT "accuracy", "createdAt", "dataPoints", "id", "isActive", "modelType", "parameters", "trainedAt", "userId" FROM "ml_models";
DROP TABLE "ml_models";
ALTER TABLE "new_ml_models" RENAME TO "ml_models";
CREATE INDEX "ml_models_userId_idx" ON "ml_models"("userId");
CREATE INDEX "ml_models_isActive_idx" ON "ml_models"("isActive");
CREATE TABLE "new_user_behavior_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "averageTransactionAmount" REAL NOT NULL,
    "medianTransactionAmount" REAL NOT NULL,
    "standardDeviation" REAL NOT NULL,
    "commonMerchants" TEXT,
    "commonLocations" TEXT,
    "commonCategories" TEXT,
    "typicalTransactionTimes" TEXT,
    "weeklyPattern" TEXT,
    "monthlySpendingPattern" TEXT,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_behavior_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_behavior_profiles" ("averageTransactionAmount", "commonCategories", "commonLocations", "commonMerchants", "createdAt", "id", "lastUpdated", "medianTransactionAmount", "monthlySpendingPattern", "standardDeviation", "typicalTransactionTimes", "updatedAt", "userId", "weeklyPattern") SELECT "averageTransactionAmount", "commonCategories", "commonLocations", "commonMerchants", "createdAt", "id", "lastUpdated", "medianTransactionAmount", "monthlySpendingPattern", "standardDeviation", "typicalTransactionTimes", "updatedAt", "userId", "weeklyPattern" FROM "user_behavior_profiles";
DROP TABLE "user_behavior_profiles";
ALTER TABLE "new_user_behavior_profiles" RENAME TO "user_behavior_profiles";
CREATE UNIQUE INDEX "user_behavior_profiles_userId_key" ON "user_behavior_profiles"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
