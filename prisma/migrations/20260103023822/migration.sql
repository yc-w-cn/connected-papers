/*
  Warnings:

  - You are about to drop the column `status` on the `ArxivPaper` table. All the data in the column will be lost.

*/
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
    "arxivDataStatus" TEXT NOT NULL DEFAULT 'pending',
    "arxivDataFetchedAt" DATETIME,
    "referencesStatus" TEXT NOT NULL DEFAULT 'pending',
    "referencesFetchedAt" DATETIME,
    "citationsStatus" TEXT NOT NULL DEFAULT 'pending',
    "citationsFetchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ArxivPaper" ("abstract", "arxivDataFetchedAt", "arxivId", "arxivUrl", "citationsFetchedAt", "citationsStatus", "comment", "createdAt", "doi", "id", "journalRef", "license", "primaryCategory", "publishedDate", "referencesFetchedAt", "referencesStatus", "title", "updatedAt", "updatedAtArxiv") SELECT "abstract", "arxivDataFetchedAt", "arxivId", "arxivUrl", "citationsFetchedAt", "citationsStatus", "comment", "createdAt", "doi", "id", "journalRef", "license", "primaryCategory", "publishedDate", "referencesFetchedAt", "referencesStatus", "title", "updatedAt", "updatedAtArxiv" FROM "ArxivPaper";
DROP TABLE "ArxivPaper";
ALTER TABLE "new_ArxivPaper" RENAME TO "ArxivPaper";
CREATE UNIQUE INDEX "ArxivPaper_arxivId_key" ON "ArxivPaper"("arxivId");
CREATE INDEX "ArxivPaper_arxivId_idx" ON "ArxivPaper"("arxivId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
