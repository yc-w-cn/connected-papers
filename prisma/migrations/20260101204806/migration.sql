/*
  Warnings:

  - You are about to drop the `Paper` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Paper_arxivId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Paper";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ArxivPaper" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ArxivAuthorName" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "affiliation" TEXT,
    "arxivPaperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArxivAuthorName_arxivPaperId_fkey" FOREIGN KEY ("arxivPaperId") REFERENCES "ArxivPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArxivCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "arxivPaperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArxivCategory_arxivPaperId_fkey" FOREIGN KEY ("arxivPaperId") REFERENCES "ArxivPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemanticScholarPaper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperId" TEXT NOT NULL,
    "url" TEXT,
    "citationCount" INTEGER,
    "influentialCitationCount" INTEGER,
    "openAccessPdfUrl" TEXT,
    "publicationTypes" TEXT,
    "arxivPaperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SemanticScholarPaper_arxivPaperId_fkey" FOREIGN KEY ("arxivPaperId") REFERENCES "ArxivPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemanticScholarAuthor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT,
    "name" TEXT NOT NULL,
    "arxivPaperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemanticScholarAuthor_arxivPaperId_fkey" FOREIGN KEY ("arxivPaperId") REFERENCES "SemanticScholarPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemanticScholarFieldOfStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "category" TEXT,
    "arxivPaperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemanticScholarFieldOfStudy_arxivPaperId_fkey" FOREIGN KEY ("arxivPaperId") REFERENCES "SemanticScholarPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemanticScholarVenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venue" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "arxivPaperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemanticScholarVenue_arxivPaperId_fkey" FOREIGN KEY ("arxivPaperId") REFERENCES "SemanticScholarPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reference_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ArxivPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "ArxivPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reference" ("createdAt", "id", "paperId", "referenceId") SELECT "createdAt", "id", "paperId", "referenceId" FROM "Reference";
DROP TABLE "Reference";
ALTER TABLE "new_Reference" RENAME TO "Reference";
CREATE INDEX "Reference_paperId_idx" ON "Reference"("paperId");
CREATE INDEX "Reference_referenceId_idx" ON "Reference"("referenceId");
CREATE UNIQUE INDEX "Reference_paperId_referenceId_key" ON "Reference"("paperId", "referenceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ArxivPaper_arxivId_key" ON "ArxivPaper"("arxivId");

-- CreateIndex
CREATE INDEX "ArxivPaper_arxivId_idx" ON "ArxivPaper"("arxivId");

-- CreateIndex
CREATE INDEX "ArxivAuthorName_arxivPaperId_idx" ON "ArxivAuthorName"("arxivPaperId");

-- CreateIndex
CREATE INDEX "ArxivCategory_arxivPaperId_idx" ON "ArxivCategory"("arxivPaperId");

-- CreateIndex
CREATE UNIQUE INDEX "SemanticScholarPaper_paperId_key" ON "SemanticScholarPaper"("paperId");

-- CreateIndex
CREATE UNIQUE INDEX "SemanticScholarPaper_arxivPaperId_key" ON "SemanticScholarPaper"("arxivPaperId");

-- CreateIndex
CREATE INDEX "SemanticScholarPaper_arxivPaperId_idx" ON "SemanticScholarPaper"("arxivPaperId");

-- CreateIndex
CREATE INDEX "SemanticScholarPaper_paperId_idx" ON "SemanticScholarPaper"("paperId");

-- CreateIndex
CREATE INDEX "SemanticScholarAuthor_arxivPaperId_idx" ON "SemanticScholarAuthor"("arxivPaperId");

-- CreateIndex
CREATE INDEX "SemanticScholarAuthor_authorId_idx" ON "SemanticScholarAuthor"("authorId");

-- CreateIndex
CREATE INDEX "SemanticScholarFieldOfStudy_arxivPaperId_idx" ON "SemanticScholarFieldOfStudy"("arxivPaperId");

-- CreateIndex
CREATE INDEX "SemanticScholarFieldOfStudy_field_idx" ON "SemanticScholarFieldOfStudy"("field");

-- CreateIndex
CREATE UNIQUE INDEX "SemanticScholarVenue_arxivPaperId_key" ON "SemanticScholarVenue"("arxivPaperId");

-- CreateIndex
CREATE INDEX "SemanticScholarVenue_arxivPaperId_idx" ON "SemanticScholarVenue"("arxivPaperId");
