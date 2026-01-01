-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reference_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Paper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Reference_paperId_idx" ON "Reference"("paperId");

-- CreateIndex
CREATE INDEX "Reference_referenceId_idx" ON "Reference"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_paperId_referenceId_key" ON "Reference"("paperId", "referenceId");
