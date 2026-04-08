import "server-only";

import { ApprovalStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { getTournamentStatus } from "./utils";

export async function getDashboardData(userId: string) {
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const [notifications, tournaments, teams, announcements, myRegistrations, schoolmates] =
    await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.tournament.findMany({
        include: {
          organizer: true,
          registrations: {
            include: { team: true },
          },
        },
        orderBy: { date: "asc" },
        take: 4,
      }),
      prisma.team.findMany({
        where: {
          OR: [{ createdById: userId }, { players: { some: { userId } } }],
        },
        include: { players: true, registrations: true },
        distinct: ["id"],
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.tournamentRegistration.findMany({
        where: { userId },
        include: {
          tournament: {
            include: { organizer: true, registrations: true },
          },
          team: true,
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.user.count({
        where: {
          schoolName: currentUser.schoolName,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      }),
    ]);

  const upcoming = tournaments.map((tournament) => ({
    ...tournament,
    status: getTournamentStatus({
      date: tournament.date,
      maxTeams: tournament.maxTeams,
      registeredTeams: tournament.registrations.length,
    }),
  }));

  const stats = {
    tournaments: upcoming.length,
    joined: myRegistrations.length,
    teams: teams.length,
    schoolmates,
    pendingNotifications: notifications.filter((item) => !item.isRead).length,
  };

  return { currentUser, notifications, upcoming, teams, announcements, myRegistrations, stats };
}

export async function getTournamentList(filters: {
  q?: string;
  sport?: string;
  status?: string;
}) {
  const tournaments = await prisma.tournament.findMany({
    where: {
      AND: [
        filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { description: { contains: filters.q, mode: "insensitive" } },
                { location: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {},
        filters.sport ? { sport: filters.sport } : {},
      ],
    },
    include: {
      organizer: true,
      registrations: {
        include: { team: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const mapped = tournaments
    .map((tournament) => ({
      ...tournament,
      status: getTournamentStatus({
        date: tournament.date,
        maxTeams: tournament.maxTeams,
        registeredTeams: tournament.registrations.length,
      }),
    }))
    .filter((tournament) =>
      filters.status ? tournament.status.toLowerCase() === filters.status.toLowerCase() : true,
    );

  const sports = [...new Set(tournaments.map((item) => item.sport))];

  return { tournaments: mapped, sports };
}

export async function getTournamentDetails(slug: string) {
  return prisma.tournament.findUnique({
    where: { slug },
    include: {
      organizer: true,
      registrations: {
        include: {
          team: {
            include: { players: { include: { user: true } } },
          },
          user: true,
        },
        orderBy: { createdAt: "asc" },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
      },
      messages: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getTeamsForUser(userId: string) {
  return prisma.team.findMany({
    where: {
      OR: [{ createdById: userId }, { players: { some: { userId } } }],
    },
    include: {
      createdBy: true,
      players: {
        include: {
          user: true,
        },
      },
      registrations: {
        include: {
          tournament: true,
        },
      },
    },
    distinct: ["id"],
    orderBy: { createdAt: "desc" },
  });
}

export async function getSchoolData(userId: string) {
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const [schoolUsers, schoolTeams] = await Promise.all([
    prisma.user.findMany({
      where: {
        schoolName: currentUser.schoolName,
        approvalStatus: ApprovalStatus.APPROVED,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.team.findMany({
      where: {
        schoolName: currentUser.schoolName,
      },
      include: {
        createdBy: true,
        players: {
          include: {
            user: true,
          },
        },
        registrations: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { currentUser, schoolUsers, schoolTeams };
}

export async function getAdminData() {
  const [pendingUsers, tournaments, users] = await Promise.all([
    prisma.user.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tournament.findMany({
      include: {
        organizer: true,
        registrations: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return { pendingUsers, tournaments, users };
}
