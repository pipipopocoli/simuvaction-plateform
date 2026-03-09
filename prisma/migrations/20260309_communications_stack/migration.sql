-- AlterTable
ALTER TABLE "User"
ADD COLUMN "preferredTimeZone" TEXT;

-- AlterTable
ALTER TABLE "ChatRoom"
ADD COLUMN "recipientMode" TEXT NOT NULL DEFAULT 'group',
ADD COLUMN "topic" TEXT;

-- AlterTable
ALTER TABLE "MeetingRequest"
ALTER COLUMN "targetUserId" DROP NOT NULL,
ADD COLUMN "meetingSessionId" TEXT,
ADD COLUMN "recipientMode" TEXT NOT NULL DEFAULT 'individual',
ADD COLUMN "attendeeUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "targetLabel" TEXT,
ADD COLUMN "organizerTimeZone" TEXT,
ADD COLUMN "googleMeetRequested" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EventDocument"
ADD COLUMN "fileName" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "fileSizeBytes" INTEGER;

-- CreateTable
CREATE TABLE "MeetingSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "chatRoomId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "organizerTimeZone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "videoRoomName" TEXT NOT NULL,
    "googleMeetUrl" TEXT,
    "googleCalendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "meetingSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'attendee',
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("meetingSessionId","userId")
);

-- CreateTable
CREATE TABLE "PressConference" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "organizerTimeZone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "videoRoomName" TEXT NOT NULL,
    "googleMeetUrl" TEXT,
    "googleCalendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressConference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressConferenceParticipant" (
    "pressConferenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'speaker',
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "PressConferenceParticipant_pkey" PRIMARY KEY ("pressConferenceId","userId")
);

-- CreateTable
CREATE TABLE "TeamLibraryItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'file',
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamLibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleCalendarConnection" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountEmail" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenType" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingRequest_meetingSessionId_key" ON "MeetingRequest"("meetingSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingSession_chatRoomId_key" ON "MeetingSession"("chatRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingSession_videoRoomName_key" ON "MeetingSession"("videoRoomName");

-- CreateIndex
CREATE INDEX "MeetingSession_eventId_status_scheduledStartAt_idx" ON "MeetingSession"("eventId", "status", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "MeetingSession_organizerId_scheduledStartAt_idx" ON "MeetingSession"("organizerId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "MeetingParticipant_userId_idx" ON "MeetingParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PressConference_videoRoomName_key" ON "PressConference"("videoRoomName");

-- CreateIndex
CREATE INDEX "PressConference_eventId_status_scheduledStartAt_idx" ON "PressConference"("eventId", "status", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "PressConference_createdById_scheduledStartAt_idx" ON "PressConference"("createdById", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "PressConferenceParticipant_userId_idx" ON "PressConferenceParticipant"("userId");

-- CreateIndex
CREATE INDEX "TeamLibraryItem_eventId_teamId_createdAt_idx" ON "TeamLibraryItem"("eventId", "teamId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TeamLibraryItem_createdById_createdAt_idx" ON "TeamLibraryItem"("createdById", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarConnection_userId_key" ON "GoogleCalendarConnection"("userId");

-- CreateIndex
CREATE INDEX "GoogleCalendarConnection_eventId_createdAt_idx" ON "GoogleCalendarConnection"("eventId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_meetingSessionId_fkey" FOREIGN KEY ("meetingSessionId") REFERENCES "MeetingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSession" ADD CONSTRAINT "MeetingSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSession" ADD CONSTRAINT "MeetingSession_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSession" ADD CONSTRAINT "MeetingSession_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingSessionId_fkey" FOREIGN KEY ("meetingSessionId") REFERENCES "MeetingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressConference" ADD CONSTRAINT "PressConference_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressConference" ADD CONSTRAINT "PressConference_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressConferenceParticipant" ADD CONSTRAINT "PressConferenceParticipant_pressConferenceId_fkey" FOREIGN KEY ("pressConferenceId") REFERENCES "PressConference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressConferenceParticipant" ADD CONSTRAINT "PressConferenceParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLibraryItem" ADD CONSTRAINT "TeamLibraryItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLibraryItem" ADD CONSTRAINT "TeamLibraryItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLibraryItem" ADD CONSTRAINT "TeamLibraryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleCalendarConnection" ADD CONSTRAINT "GoogleCalendarConnection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleCalendarConnection" ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
