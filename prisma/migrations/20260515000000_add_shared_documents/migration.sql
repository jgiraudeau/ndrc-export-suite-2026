ALTER TABLE "SavedDocument" ADD COLUMN "theme" TEXT;
ALTER TABLE "SavedDocument" ADD COLUMN "classId" TEXT;
ALTER TABLE "SavedDocument" ADD COLUMN "sharedWithStudents" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SavedDocument" ADD CONSTRAINT "SavedDocument_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
