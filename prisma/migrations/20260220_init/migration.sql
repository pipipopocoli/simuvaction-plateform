-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NEW', 'DOING', 'DONE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LibraryItemType" AS ENUM ('SOURCE', 'DRAFT');

-- CreateTable
CREATE TABLE "Pillar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCard" (
    "id" TEXT NOT NULL,
    "pillarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'NEW',
    "deadline" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTag" (
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("taskId","tagId")
);

-- CreateTable
CREATE TABLE "ChecklistSection" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttachmentLink" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "libraryItemId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "AttachmentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryItem" (
    "id" TEXT NOT NULL,
    "type" "LibraryItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tags" TEXT[],
    "pillarId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialDeadline" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "datetimeCet" TIMESTAMP(3) NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "OfficialDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "weekStartCet" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markdownSummary" TEXT NOT NULL,
    "itemsJson" JSONB NOT NULL,

    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "datetimeCet" TIMESTAMP(3) NOT NULL,
    "agendaTaskIdsJson" JSONB NOT NULL,
    "optionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassphraseAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,

    CONSTRAINT "PassphraseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pillar_slug_key" ON "Pillar"("slug");

-- CreateIndex
CREATE INDEX "TaskCard_pillarId_status_orderIndex_idx" ON "TaskCard"("pillarId", "status", "orderIndex");

-- CreateIndex
CREATE INDEX "TaskCard_deadline_idx" ON "TaskCard"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "TaskTag_tagId_idx" ON "TaskTag"("tagId");

-- CreateIndex
CREATE INDEX "ChecklistSection_taskId_orderIndex_idx" ON "ChecklistSection"("taskId", "orderIndex");

-- CreateIndex
CREATE INDEX "ChecklistItem_sectionId_orderIndex_idx" ON "ChecklistItem"("sectionId", "orderIndex");

-- CreateIndex
CREATE INDEX "AttachmentLink_taskId_idx" ON "AttachmentLink"("taskId");

-- CreateIndex
CREATE INDEX "AttachmentLink_libraryItemId_idx" ON "AttachmentLink"("libraryItemId");

-- CreateIndex
CREATE INDEX "LibraryItem_type_idx" ON "LibraryItem"("type");

-- CreateIndex
CREATE INDEX "LibraryItem_pillarId_idx" ON "LibraryItem"("pillarId");

-- CreateIndex
CREATE INDEX "LibraryItem_taskId_idx" ON "LibraryItem"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialDeadline_orderIndex_key" ON "OfficialDeadline"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlan_weekStartCet_key" ON "WeeklyPlan"("weekStartCet");

-- CreateIndex
CREATE INDEX "Meeting_datetimeCet_idx" ON "Meeting"("datetimeCet");

-- CreateIndex
CREATE INDEX "PassphraseAttempt_ipHash_attemptedAt_idx" ON "PassphraseAttempt"("ipHash", "attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- AddForeignKey
ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistSection" ADD CONSTRAINT "ChecklistSection_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ChecklistSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentLink" ADD CONSTRAINT "AttachmentLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentLink" ADD CONSTRAINT "AttachmentLink_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

