import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import {
  DEFAULT_TAG_NAMES,
  OFFICIAL_DEADLINES,
  PARIS_TIMEZONE,
  PILLARS,
} from "../lib/constants";
import { normalizeMemberRole } from "../lib/authz";

const prisma = new PrismaClient();

type UserSeedInput = {
  email: string;
  name: string;
  role: string;
  teamName: string | null;
  whatsAppNumber: string | null;
  displayRole: string | null;
  mediaOutlet: string | null;
};

const CONFERENCE_SURVEYS = Array.from({ length: 7 }, (_, index) => ({
  conferenceNumber: index + 1,
  title: `Conference ${index + 1} Satisfaction Survey`,
  description: "Rate the conference quality, usefulness, and facilitation.",
}));

const CONFERENCE_SURVEY_QUESTIONS = [
  {
    prompt: "How satisfied are you with this conference overall?",
    questionType: "rating",
    required: true,
    orderIndex: 1,
  },
  {
    prompt: "How useful were the insights for your simulation strategy?",
    questionType: "rating",
    required: true,
    orderIndex: 2,
  },
  {
    prompt: "What should be improved for the next conference?",
    questionType: "text",
    required: false,
    orderIndex: 3,
  },
] as const;

const DISCERNMENT_TEMPLATE_TITLE = "Discernment Progression Questionnaire";
const DISCERNMENT_QUESTIONS = [
  "I identify the most reliable information quickly.",
  "I can distinguish signal from noise when new information appears.",
  "I choose relevant stakeholders for my objectives.",
  "I adapt my position with a coherent strategy.",
  "I build alliances that improve negotiation outcomes.",
  "I reassess alliances when context changes.",
] as const;

async function seedInitialNews(eventId: string, authorId: string) {
  const existing = await prisma.newsPost.count({
    where: { eventId, status: "published" },
  });

  if (existing > 0) {
    return;
  }

  const now = Date.now();
  await prisma.newsPost.createMany({
    data: [
      {
        eventId,
        authorId,
        title: "Ceasefire monitoring mission launched",
        body:
          "Delegations approved a coordinated observer mission while bilateral talks continue in parallel. Security and humanitarian access remain priority tracks.",
        status: "published",
        publishedAt: new Date(now - 20 * 60 * 1000),
      },
      {
        eventId,
        authorId,
        title: "Emergency energy package enters final vote window",
        body:
          "Policy negotiators converged on a compromise text. Final amendments are expected before the parliamentary close.",
        status: "published",
        publishedAt: new Date(now - 60 * 60 * 1000),
      },
      {
        eventId,
        authorId,
        title: "Digital governance framework moves to review",
        body:
          "Leaders requested an accelerated review cycle after delegates reported broad alignment across regional blocs.",
        status: "published",
        publishedAt: new Date(now - 2 * 60 * 60 * 1000),
      },
    ],
  });
}

async function seedConferenceSurveys(eventId: string, createdById: string | null) {
  for (const surveySeed of CONFERENCE_SURVEYS) {
    const survey = await prisma.conferenceSurvey.upsert({
      where: {
        eventId_conferenceNumber: {
          eventId,
          conferenceNumber: surveySeed.conferenceNumber,
        },
      },
      update: {
        title: surveySeed.title,
        description: surveySeed.description,
        isPublished: true,
        createdById,
      },
      create: {
        eventId,
        createdById,
        conferenceNumber: surveySeed.conferenceNumber,
        title: surveySeed.title,
        description: surveySeed.description,
        isPublished: true,
      },
    });

    const questionCount = await prisma.conferenceSurveyQuestion.count({
      where: { surveyId: survey.id },
    });

    if (questionCount === 0) {
      await prisma.conferenceSurveyQuestion.createMany({
        data: CONFERENCE_SURVEY_QUESTIONS.map((question) => ({
          surveyId: survey.id,
          prompt: question.prompt,
          questionType: question.questionType,
          required: question.required,
          orderIndex: question.orderIndex,
        })),
      });
    }
  }
}

async function seedDiscernmentTemplateAndWaves(
  eventId: string,
  createdById: string | null,
  eventStartDate: Date,
) {
  const template = await prisma.discernmentTemplate.upsert({
    where: {
      eventId_title: {
        eventId,
        title: DISCERNMENT_TEMPLATE_TITLE,
      },
    },
    update: {
      description: "Repeated wave questionnaire to track student discernment progression.",
      questionsJson: DISCERNMENT_QUESTIONS,
      createdById,
    },
    create: {
      eventId,
      createdById,
      title: DISCERNMENT_TEMPLATE_TITLE,
      description: "Repeated wave questionnaire to track student discernment progression.",
      questionsJson: DISCERNMENT_QUESTIONS,
    },
  });

  const intervalDays = Math.max(1, Number(process.env.SURVEY_WAVE_INTERVAL_DAYS ?? "15"));

  for (const orderIndex of [1, 2, 3]) {
    const opensAt = DateTime.fromJSDate(eventStartDate)
      .plus({ days: (orderIndex - 1) * intervalDays })
      .toJSDate();
    const closesAt = DateTime.fromJSDate(opensAt).plus({ days: intervalDays - 1 }).toJSDate();

    await prisma.discernmentWave.upsert({
      where: {
        eventId_orderIndex: {
          eventId,
          orderIndex,
        },
      },
      update: {
        templateId: template.id,
        label: orderIndex === 1 ? "Wave T0" : `Wave T+${(orderIndex - 1) * intervalDays}d`,
        opensAt,
        closesAt,
      },
      create: {
        eventId,
        templateId: template.id,
        label: orderIndex === 1 ? "Wave T0" : `Wave T+${(orderIndex - 1) * intervalDays}d`,
        orderIndex,
        opensAt,
        closesAt,
      },
    });
  }
}

async function main() {
  for (const pillar of PILLARS) {
    await prisma.pillar.upsert({
      where: { slug: pillar.slug },
      update: { name: pillar.name },
      create: {
        name: pillar.name,
        slug: pillar.slug,
      },
    });
  }

  for (const tagName of DEFAULT_TAG_NAMES) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }

  for (const deadline of OFFICIAL_DEADLINES) {
    const datetimeCet = DateTime.fromISO(deadline.isoParis, {
      zone: PARIS_TIMEZONE,
    })
      .toUTC()
      .toJSDate();

    await prisma.officialDeadline.upsert({
      where: { orderIndex: deadline.orderIndex },
      update: {
        title: deadline.title,
        datetimeCet,
      },
      create: {
        title: deadline.title,
        datetimeCet,
        orderIndex: deadline.orderIndex,
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "whatsapp" },
    update: {},
    create: {
      key: "whatsapp",
      valueJson: {
        numbers: [],
        metaToken: "",
        metaPhoneNumberId: "",
        enabled: false,
      },
    },
  });

  // --- WAR ROOM SEEDING ---
  const eventId = "cm0simuvaction0000event2026";
  await prisma.event.upsert({
    where: { id: eventId },
    update: {},
    create: {
      id: eventId,
      name: "SimuVaction 2026",
      year: 2026,
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-03-15T00:00:00Z"),
    },
  });

  // Dynamic CSV Parsing & Seeding
  const csvPath = path.join(process.cwd(), "members.csv");
  const csvData = fs.readFileSync(csvPath, "utf8");
  const [headerLine, ...rawRows] = csvData.trim().split(/\r?\n/);

  const header = headerLine.split(",").map((column) => column.trim().toLowerCase());
  const getHeaderIndex = (label: string) => header.indexOf(label.toLowerCase());

  const colIndex = {
    familyName: getHeaderIndex("Family Name"),
    preferredName: getHeaderIndex("Preferred Name"),
    email: getHeaderIndex("email address"),
    whatsApp: getHeaderIndex("WHATSAPP phone"),
    role: getHeaderIndex("Role"),
    displayRole: getHeaderIndex("Display Role"),
    mediaOutlet: getHeaderIndex("Media Outlet"),
  } as const;

  const readCol = (columns: string[], index: number) =>
    index >= 0 ? (columns[index]?.trim() ?? "") : "";

  const defaultPassword = "1234";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Parse rows into users data with a header-based mapping.
  const usersToSeed: UserSeedInput[] = [];
  const teamsToCreate = new Set<string>();

  for (const row of rawRows) {
    if (!row.trim()) continue;
    const cols = row.split(",");
    const email = readCol(cols, colIndex.email).toLowerCase();
    const firstName = readCol(cols, colIndex.preferredName);
    const lastName = readCol(cols, colIndex.familyName);
    const name = `${firstName} ${lastName}`;
    const roleOrTeam = readCol(cols, colIndex.role);
    const whatsAppNumber = readCol(cols, colIndex.whatsApp) || null;
    const displayRole = readCol(cols, colIndex.displayRole) || null;
    const mediaOutlet = readCol(cols, colIndex.mediaOutlet) || null;
    const normalizedRole = normalizeMemberRole(roleOrTeam);
    const dbRole = normalizedRole.role;
    const teamName: string | null = normalizedRole.teamName;

    if (teamName) teamsToCreate.add(teamName);

    usersToSeed.push({
      email,
      name,
      role: dbRole,
      teamName,
      whatsAppNumber,
      displayRole,
      mediaOutlet,
    });
  }

  // Create Teams
  const teamMap = new Map<string, string>();
  for (const tName of teamsToCreate) {
    const code = tName.substring(0, 3).toUpperCase();
    const team = await prisma.team.upsert({
      where: { eventId_countryCode: { eventId, countryCode: code } },
      update: { countryName: tName },
      create: {
        eventId,
        countryCode: code,
        countryName: tName,
      },
    });
    teamMap.set(tName, team.id);
  }

  // Create Users
  for (const u of usersToSeed) {
    if (!u.email) continue;
    const teamId = u.teamName ? teamMap.get(u.teamName) : null;

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        teamId,
        whatsAppNumber: u.whatsAppNumber,
        displayRole: u.displayRole,
        mediaOutlet: u.mediaOutlet,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        teamId,
        eventId,
        hashedPassword,
        mustChangePassword: true,
        whatsAppNumber: u.whatsAppNumber,
        displayRole: u.displayRole,
        mediaOutlet: u.mediaOutlet,
      },
    });
  }

  const ownerUser =
    (await prisma.user.findFirst({
      where: { eventId, role: { in: ["leader", "admin", "game_master"] } },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.user.findFirst({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    }));

  if (ownerUser) {
    const globalRoomName = "Global Assembly";
    const existingRoom = await prisma.chatRoom.findFirst({
      where: { eventId, roomType: "global", name: globalRoomName },
    });

    if (!existingRoom) {
      await prisma.chatRoom.create({
        data: {
          eventId,
          name: globalRoomName,
          roomType: "global",
          createdById: ownerUser.id,
          memberships: {
            create: [{ userId: ownerUser.id, role: "owner" }],
          },
        },
      });
    }

    await seedInitialNews(eventId, ownerUser.id);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { startDate: true },
  });

  if (event) {
    await seedConferenceSurveys(eventId, ownerUser?.id ?? null);
    await seedDiscernmentTemplateAndWaves(eventId, ownerUser?.id ?? null, event.startDate);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
