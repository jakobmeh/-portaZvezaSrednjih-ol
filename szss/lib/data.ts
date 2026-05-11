import "server-only";

import { ApprovalStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { calculateKnockoutStandings, getTournamentStatus } from "./utils";

export async function getDashboardData(userId: string) {
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const [notifications, tournaments, teams, announcements, myRegistrations, schoolmates, followedTournaments] =
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
      prisma.tournamentFollower.findMany({
        where: { userId },
        include: {
          tournament: {
            include: {
              organizer: true,
              registrations: true,
              matches: {
                where: { status: { in: ["UPCOMING", "LIVE"] } },
                include: { homeTeam: true, awayTeam: true },
                orderBy: { scheduledAt: "asc" },
                take: 3,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
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

  const myOrganized = currentUser.role === "ADMIN" || currentUser.isPro
    ? await prisma.tournament.findMany({
        where: { organizerId: userId },
        include: {
          registrations: true,
          matches: { where: { status: "UPCOMING" }, orderBy: { scheduledAt: "asc" }, take: 3 },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const stats = {
    tournaments: upcoming.length,
    joined: myRegistrations.length,
    teams: teams.length,
    schoolmates,
    pendingNotifications: notifications.filter((item) => !item.isRead).length,
  };

  return { currentUser, notifications, upcoming, teams, announcements, myRegistrations, stats, followedTournaments, myOrganized };
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
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
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

export async function getMatchesForTournament(tournamentId: string) {
  return prisma.match.findMany({
    where: { tournamentId },
    include: {
      homeTeam: { select: { id: true, name: true, schoolName: true } },
      awayTeam: { select: { id: true, name: true, schoolName: true } },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getLeaderboardData(sport?: string) {
  const allCompleted = await prisma.tournament.findMany({
    where: { isCompleted: true },
    select: { id: true, sport: true },
  });

  const availableSports = [...new Set(allCompleted.map((t) => t.sport))].sort();
  const filteredIds = allCompleted.filter((t) => !sport || t.sport === sport).map((t) => t.id);

  if (filteredIds.length === 0) {
    return { teamStats: [], schoolStats: [], recentMatches: [], availableSports };
  }

  const [completedTournaments, recentMatches] = await Promise.all([
    prisma.tournament.findMany({
      where: { id: { in: filteredIds } },
      include: {
        matches: {
          where: { status: "FINISHED" },
          include: {
            homeTeam: { select: { id: true, name: true, schoolName: true } },
            awayTeam: { select: { id: true, name: true, schoolName: true } },
          },
          orderBy: [{ round: "asc" }, { scheduledAt: "asc" }, { createdAt: "asc" }],
        },
        registrations: {
          include: { team: { select: { id: true, name: true, schoolName: true } } },
        },
      },
    }),
    prisma.match.findMany({
      where: { status: "FINISHED", tournamentId: { in: filteredIds } },
      include: {
        homeTeam: { select: { name: true, schoolName: true } },
        awayTeam: { select: { name: true, schoolName: true } },
        tournament: { select: { title: true, sport: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  type TeamStat = {
    id: string;
    name: string;
    schoolName: string;
    sport: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    tournamentCount: number;
  };

  const stats = new Map<string, TeamStat>();

  function ensureTeam(team: { id: string; name: string; schoolName: string }, tournamentSport: string) {
    if (!stats.has(team.id)) {
      stats.set(team.id, {
        id: team.id,
        name: team.name,
        schoolName: team.schoolName,
        sport: tournamentSport,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        tournamentCount: 0,
      });
    }
    return stats.get(team.id)!;
  }

  for (const tournament of completedTournaments) {
    const countedTeams = new Set<string>();

    if (tournament.format === "KNOCKOUT") {
      const teamsById = new Map<string, { id: string; name: string; schoolName: string }>();
      for (const registration of tournament.registrations) teamsById.set(registration.team.id, registration.team);
      for (const match of tournament.matches) {
        teamsById.set(match.homeTeam.id, match.homeTeam);
        teamsById.set(match.awayTeam.id, match.awayTeam);
      }

      const rows = calculateKnockoutStandings(
        tournament.matches.map((match) => ({
          homeTeamId: match.homeTeamId,
          homeTeam: match.homeTeam,
          awayTeamId: match.awayTeamId,
          awayTeam: match.awayTeam,
          scoreHome: match.scoreHome,
          scoreAway: match.scoreAway,
          status: match.status,
          round: match.round,
          group: match.group,
        })),
      );

      for (const row of rows) {
        const team = teamsById.get(row.teamId);
        if (!team) continue;
        const stat = ensureTeam(team, tournament.sport);
        stat.played += row.played;
        stat.wins += row.wins;
        stat.draws += row.draws;
        stat.losses += row.losses;
        stat.goalsFor += row.goalsFor;
        stat.goalsAgainst += row.goalsAgainst;
        stat.points += row.points;
        countedTeams.add(team.id);
      }
    } else {
      for (const match of tournament.matches) {
        if (match.scoreHome === null || match.scoreAway === null) continue;
        const home = ensureTeam(match.homeTeam, tournament.sport);
        const away = ensureTeam(match.awayTeam, tournament.sport);

        home.played++;
        away.played++;
        home.goalsFor += match.scoreHome;
        home.goalsAgainst += match.scoreAway;
        away.goalsFor += match.scoreAway;
        away.goalsAgainst += match.scoreHome;

        if (match.scoreHome > match.scoreAway) {
          home.wins++;
          home.points += 3;
          away.losses++;
        } else if (match.scoreHome < match.scoreAway) {
          away.wins++;
          away.points += 3;
          home.losses++;
        } else {
          home.draws++;
          away.draws++;
          home.points += 1;
          away.points += 1;
        }

        countedTeams.add(home.id);
        countedTeams.add(away.id);
      }
    }

    for (const teamId of countedTeams) {
      const stat = stats.get(teamId);
      if (stat) stat.tournamentCount++;
    }
  }

  const teamStats = Array.from(stats.values())
    .map((team) => ({ ...team, goalDiff: team.goalsFor - team.goalsAgainst }))
    .filter((t) => t.played > 0)
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.goalDiff - a.goalDiff)
    .slice(0, 50);

  const schoolMap = new Map<string, { school: string; wins: number; points: number; played: number }>();
  for (const t of teamStats) {
    const s = schoolMap.get(t.schoolName) ?? { school: t.schoolName, wins: 0, points: 0, played: 0 };
    s.wins += t.wins;
    s.points += t.points;
    s.played += t.played;
    schoolMap.set(t.schoolName, s);
  }

  return {
    teamStats,
    schoolStats: Array.from(schoolMap.values()).sort((a, b) => b.points - a.points).slice(0, 20),
    recentMatches,
    availableSports,
  };
}

async function getLeaderboardDataOld(sport?: string) {
  // Vsi zaključeni turnirji za seznam športov
  const allCompleted = await prisma.tournament.findMany({
    where: { isCompleted: true },
    select: { id: true, sport: true },
  });

  const availableSports = [...new Set(allCompleted.map((t) => t.sport))].sort();

  // Zaključeni turnirji filtrirani po izbranem športu
  const filteredIds = allCompleted
    .filter((t) => !sport || t.sport === sport)
    .map((t) => t.id);

  if (filteredIds.length === 0) {
    return { teamStats: [], schoolStats: [], recentMatches: [], availableSports };
  }

  const [topTeams, recentMatches] = await Promise.all([
    prisma.team.findMany({
      include: {
        homeMatches: {
          where: { status: "FINISHED", tournamentId: { in: filteredIds } },
          select: { scoreHome: true, scoreAway: true },
        },
        awayMatches: {
          where: { status: "FINISHED", tournamentId: { in: filteredIds } },
          select: { scoreHome: true, scoreAway: true },
        },
        _count: { select: { registrations: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.match.findMany({
      where: { status: "FINISHED", tournamentId: { in: filteredIds } },
      include: {
        homeTeam: { select: { name: true, schoolName: true } },
        awayTeam: { select: { name: true, schoolName: true } },
        tournament: { select: { title: true, sport: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const teamStats = topTeams
    .map((team) => {
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

      for (const m of team.homeMatches) {
        if (m.scoreHome === null || m.scoreAway === null) continue;
        goalsFor += m.scoreHome;
        goalsAgainst += m.scoreAway;
        if (m.scoreHome > m.scoreAway) wins++;
        else if (m.scoreHome === m.scoreAway) draws++;
        else losses++;
      }
      for (const m of team.awayMatches) {
        if (m.scoreHome === null || m.scoreAway === null) continue;
        goalsFor += m.scoreAway;
        goalsAgainst += m.scoreHome;
        if (m.scoreAway > m.scoreHome) wins++;
        else if (m.scoreAway === m.scoreHome) draws++;
        else losses++;
      }

      const played = wins + draws + losses;
      const points = wins * 3 + draws;
      return {
        id: team.id,
        name: team.name,
        schoolName: team.schoolName,
        sport: (team as any).sport ?? "",
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        points,
        tournamentCount: team._count.registrations,
      };
    })
    .filter((t) => t.played > 0)
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.goalDiff - a.goalDiff)
    .slice(0, 50);

  const schoolMap = new Map<string, { school: string; wins: number; points: number; played: number }>();
  for (const t of teamStats) {
    const s = schoolMap.get(t.schoolName) ?? { school: t.schoolName, wins: 0, points: 0, played: 0 };
    s.wins += t.wins;
    s.points += t.points;
    s.played += t.played;
    schoolMap.set(t.schoolName, s);
  }

  return {
    teamStats,
    schoolStats: Array.from(schoolMap.values()).sort((a, b) => b.points - a.points).slice(0, 20),
    recentMatches,
    availableSports,
  };
}

export async function getAdminLicenses() {
  return (prisma.schoolLicense as any).findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getSchoolLicense(schoolName: string) {
  return (prisma.schoolLicense as any).findUnique({
    where: { schoolName },
  });
}
