ALTER TABLE "EventDocument"
ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "SocialPost" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "teamId" TEXT,
    "body" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "_DocumentTargets" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentTargets_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX IF NOT EXISTS "SocialPost_eventId_createdAt_idx"
ON "SocialPost"("eventId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "SocialPost_authorId_idx"
ON "SocialPost"("authorId");

CREATE INDEX IF NOT EXISTS "_DocumentTargets_B_index"
ON "_DocumentTargets"("B");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SocialPost_eventId_fkey'
    ) THEN
        ALTER TABLE "SocialPost"
        ADD CONSTRAINT "SocialPost_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SocialPost_authorId_fkey'
    ) THEN
        ALTER TABLE "SocialPost"
        ADD CONSTRAINT "SocialPost_authorId_fkey"
        FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SocialPost_teamId_fkey'
    ) THEN
        ALTER TABLE "SocialPost"
        ADD CONSTRAINT "SocialPost_teamId_fkey"
        FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_DocumentTargets_A_fkey'
    ) THEN
        ALTER TABLE "_DocumentTargets"
        ADD CONSTRAINT "_DocumentTargets_A_fkey"
        FOREIGN KEY ("A") REFERENCES "EventDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_DocumentTargets_B_fkey'
    ) THEN
        ALTER TABLE "_DocumentTargets"
        ADD CONSTRAINT "_DocumentTargets_B_fkey"
        FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
