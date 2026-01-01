-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArxivPaper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arxivId" TEXT NOT NULL,
    "arxivUrl" TEXT NOT NULL,
    "title" TEXT,
    "abstract" TEXT,
    "publishedDate" TEXT,
    "primaryCategory" TEXT,
    "license" TEXT,
    "updatedAtArxiv" TEXT,
    "comment" TEXT,
    "journalRef" TEXT,
    "doi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" DATETIME,
    "referencesFetched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ArxivPaper" ("abstract", "arxivId", "arxivUrl", "comment", "createdAt", "doi", "id", "journalRef", "license", "primaryCategory", "processedAt", "publishedDate", "status", "title", "updatedAt", "updatedAtArxiv") SELECT "abstract", "arxivId", "arxivUrl", "comment", "createdAt", "doi", "id", "journalRef", "license", "primaryCategory", "processedAt", "publishedDate", "status", "title", "updatedAt", "updatedAtArxiv" FROM "ArxivPaper";
DROP TABLE "ArxivPaper";
ALTER TABLE "new_ArxivPaper" RENAME TO "ArxivPaper";
CREATE UNIQUE INDEX "ArxivPaper_arxivId_key" ON "ArxivPaper"("arxivId");
CREATE INDEX "ArxivPaper_arxivId_idx" ON "ArxivPaper"("arxivId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
