import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";
import {
  DEFAULT_TAG_NAMES,
  OFFICIAL_DEADLINES,
  PARIS_TIMEZONE,
  PILLARS,
} from "../lib/constants";

const prisma = new PrismaClient();

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

  // Create Teams
  const franceTeam = await prisma.team.upsert({
    where: { eventId_countryCode: { eventId, countryCode: "FRA" } },
    update: {},
    create: {
      eventId,
      countryCode: "FRA",
      countryName: "France",
    },
  });

  const brazilTeam = await prisma.team.upsert({
    where: { eventId_countryCode: { eventId, countryCode: "BRA" } },
    update: {},
    create: {
      eventId,
      countryCode: "BRA",
      countryName: "Brazil",
    },
  });

  // Create Users
  const usersToSeed = [
    { email: "leader@simuvaction.com", name: "Admin Leader", role: "leader", teamId: null },
    { email: "journaliste@simuvaction.com", name: "Journaliste Principal", role: "journalist", teamId: null },
    { email: "lobbyist@simuvaction.com", name: "Lobbyist", role: "lobbyist", teamId: null },
    { email: "delegue.france@simuvaction.com", name: "Délégué France", role: "delegate", teamId: franceTeam.id },
    { email: "delegue.brazil@simuvaction.com", name: "Délégué Brazil", role: "delegate", teamId: brazilTeam.id },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        teamId: u.teamId,
        eventId,
      },
    });
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
