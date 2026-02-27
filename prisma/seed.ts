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
