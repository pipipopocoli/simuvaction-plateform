-- AlterTable
ALTER TABLE "User"
ADD COLUMN "whatsAppNumber" TEXT,
ADD COLUMN "xUrl" TEXT,
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "positionPaperUrl" TEXT,
ADD COLUMN "positionPaperSummary" TEXT;

-- AlterTable
ALTER TABLE "ChatRoom"
ADD COLUMN "directPairKey" TEXT;

-- CreateTable
CREATE TABLE "MeetingRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "requesterTeamId" TEXT,
    "targetTeamId" TEXT,
    "chatRoomId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "proposedStartAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledStartAt" TIMESTAMP(3),
    "responseNote" TEXT,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_directPairKey_key" ON "ChatRoom"("directPairKey");

-- CreateIndex
CREATE INDEX "MeetingRequest_eventId_status_proposedStartAt_idx" ON "MeetingRequest"("eventId", "status", "proposedStartAt");

-- CreateIndex
CREATE INDEX "MeetingRequest_targetUserId_status_idx" ON "MeetingRequest"("targetUserId", "status");

-- CreateIndex
CREATE INDEX "MeetingRequest_requesterId_createdAt_idx" ON "MeetingRequest"("requesterId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_requesterTeamId_fkey" FOREIGN KEY ("requesterTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_targetTeamId_fkey" FOREIGN KEY ("targetTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
