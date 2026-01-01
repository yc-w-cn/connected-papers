-- CreateTable
CREATE TABLE "NetworkRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestUrl" TEXT NOT NULL,
    "requestMethod" TEXT NOT NULL DEFAULT 'GET',
    "requestBody" TEXT,
    "requestHeaders" TEXT,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "responseHeaders" TEXT,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "source" TEXT NOT NULL,
    "arxivPaperId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "NetworkRequest_source_idx" ON "NetworkRequest"("source");

-- CreateIndex
CREATE INDEX "NetworkRequest_arxivPaperId_idx" ON "NetworkRequest"("arxivPaperId");

-- CreateIndex
CREATE INDEX "NetworkRequest_createdAt_idx" ON "NetworkRequest"("createdAt");
