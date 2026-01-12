-- CreateTable
CREATE TABLE "anomaly_alerts" (
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
    CONSTRAINT "anomaly_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "anomaly_alerts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE SET NULL
);

-- CreateTable
CREATE TABLE "user_behavior_profiles" (
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
    CONSTRAINT "user_behavior_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "ml_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "accuracy" REAL,
    "trainedAt" DATETIME NOT NULL,
    "dataPoints" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ml_models_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "fcm_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fcm_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "anomaly_alerts_userId_idx" ON "anomaly_alerts"("userId");

-- CreateIndex
CREATE INDEX "anomaly_alerts_type_idx" ON "anomaly_alerts"("type");

-- CreateIndex
CREATE INDEX "anomaly_alerts_severity_idx" ON "anomaly_alerts"("severity");

-- CreateIndex
CREATE INDEX "anomaly_alerts_createdAt_idx" ON "anomaly_alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_behavior_profiles_userId_key" ON "user_behavior_profiles"("userId");

-- CreateIndex
CREATE INDEX "ml_models_userId_idx" ON "ml_models"("userId");

-- CreateIndex
CREATE INDEX "ml_models_isActive_idx" ON "ml_models"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "fcm_tokens_token_key" ON "fcm_tokens"("token");

-- CreateIndex
CREATE INDEX "fcm_tokens_userId_idx" ON "fcm_tokens"("userId");

-- CreateIndex
CREATE INDEX "fcm_tokens_isActive_idx" ON "fcm_tokens"("isActive");