-- CreateTable
CREATE TABLE "VisitorSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "userId" TEXT,
    "sessionKey" TEXT NOT NULL,
    "consentStatus" TEXT NOT NULL DEFAULT 'unknown',
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "policyVersion" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "referrer" TEXT,
    "dwellMs" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "consentStatus" TEXT NOT NULL,
    "analyticsEnabled" BOOLEAN NOT NULL,
    "policyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConferenceSurvey" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT,
    "conferenceNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConferenceSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConferenceSurveyQuestion" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConferenceSurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConferenceSurveyResponse" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answersJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConferenceSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscernmentTemplate" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscernmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscernmentWave" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscernmentWave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscernmentResponse" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answersJson" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscernmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_sessionKey_key" ON "VisitorSession"("sessionKey");

-- CreateIndex
CREATE INDEX "VisitorSession_eventId_createdAt_idx" ON "VisitorSession"("eventId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "VisitorSession_userId_createdAt_idx" ON "VisitorSession"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "VisitorEvent_eventId_createdAt_idx" ON "VisitorEvent"("eventId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "VisitorEvent_sessionId_createdAt_idx" ON "VisitorEvent"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "VisitorEvent_userId_createdAt_idx" ON "VisitorEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ConsentLog_eventId_createdAt_idx" ON "ConsentLog"("eventId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ConsentLog_sessionId_createdAt_idx" ON "ConsentLog"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ConferenceSurvey_eventId_conferenceNumber_key" ON "ConferenceSurvey"("eventId", "conferenceNumber");

-- CreateIndex
CREATE INDEX "ConferenceSurvey_eventId_isPublished_conferenceNumber_idx" ON "ConferenceSurvey"("eventId", "isPublished", "conferenceNumber");

-- CreateIndex
CREATE INDEX "ConferenceSurveyQuestion_surveyId_orderIndex_idx" ON "ConferenceSurveyQuestion"("surveyId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ConferenceSurveyResponse_surveyId_userId_key" ON "ConferenceSurveyResponse"("surveyId", "userId");

-- CreateIndex
CREATE INDEX "ConferenceSurveyResponse_eventId_createdAt_idx" ON "ConferenceSurveyResponse"("eventId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DiscernmentTemplate_eventId_title_key" ON "DiscernmentTemplate"("eventId", "title");

-- CreateIndex
CREATE INDEX "DiscernmentTemplate_eventId_createdAt_idx" ON "DiscernmentTemplate"("eventId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DiscernmentWave_eventId_orderIndex_key" ON "DiscernmentWave"("eventId", "orderIndex");

-- CreateIndex
CREATE INDEX "DiscernmentWave_eventId_opensAt_closesAt_idx" ON "DiscernmentWave"("eventId", "opensAt", "closesAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscernmentResponse_waveId_userId_key" ON "DiscernmentResponse"("waveId", "userId");

-- CreateIndex
CREATE INDEX "DiscernmentResponse_eventId_createdAt_idx" ON "DiscernmentResponse"("eventId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorEvent" ADD CONSTRAINT "VisitorEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorEvent" ADD CONSTRAINT "VisitorEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorEvent" ADD CONSTRAINT "VisitorEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceSurvey" ADD CONSTRAINT "ConferenceSurvey_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceSurvey" ADD CONSTRAINT "ConferenceSurvey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceSurveyQuestion" ADD CONSTRAINT "ConferenceSurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "ConferenceSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceSurveyResponse" ADD CONSTRAINT "ConferenceSurveyResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceSurveyResponse" ADD CONSTRAINT "ConferenceSurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "ConferenceSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceSurveyResponse" ADD CONSTRAINT "ConferenceSurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscernmentTemplate" ADD CONSTRAINT "DiscernmentTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscernmentTemplate" ADD CONSTRAINT "DiscernmentTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscernmentWave" ADD CONSTRAINT "DiscernmentWave_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscernmentWave" ADD CONSTRAINT "DiscernmentWave_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DiscernmentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscernmentResponse" ADD CONSTRAINT "DiscernmentResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscernmentResponse" ADD CONSTRAINT "DiscernmentResponse_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "DiscernmentWave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscernmentResponse" ADD CONSTRAINT "DiscernmentResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
