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

const prisma = new PrismaClient();

type UserSeedInput = {
  email: string;
  name: string;
  role: string;
  teamName: string | null;
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
  const csvPath = path.join(process.cwd(), 'members.csv');
  const csvData = fs.readFileSync(csvPath, 'utf8');
  const rows = csvData.trim().split('\n').slice(1); // Skip header

  const defaultPassword = "1234";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Parse rows into users data
  // Cols: Sort, Family Name, Preferred Name, Gender, email address, WHATSAPP phone, Timezone, Role
  const usersToSeed: UserSeedInput[] = [];
  const teamsToCreate = new Set<string>();

  for (const row of rows) {
    if (!row.trim()) continue;
    const cols = row.split(',');
    const email = cols[4]?.trim().toLowerCase();
    const firstName = cols[2]?.trim();
    const lastName = cols[1]?.trim();
    const name = `${firstName} ${lastName}`;
    const roleOrTeam = cols[7]?.trim();

    let dbRole = "delegate";
    let teamName: string | null = roleOrTeam;

    if (roleOrTeam === "Secretariat / Leadership") {
      dbRole = "leader";
      teamName = null;
    } else if (roleOrTeam === "Journaliste") {
      dbRole = "journalist";
      teamName = null;
    } else if (roleOrTeam === "Admin" || roleOrTeam === "System Admin") {
      dbRole = "admin";
      teamName = null;
    }

    if (teamName) teamsToCreate.add(teamName);

    usersToSeed.push({
      email,
      name,
      role: dbRole,
      teamName, // temporary link to fetch DB ID later
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
        teamId
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        teamId,
        eventId,
        hashedPassword,
        mustChangePassword: true,
      },
    });
  }

  const ownerUser =
    (await prisma.user.findFirst({
      where: { eventId, role: { in: ["leader", "admin"] } },
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
