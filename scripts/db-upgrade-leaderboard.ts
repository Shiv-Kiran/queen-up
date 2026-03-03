import { getPrismaClient } from "../src/server/db/client";

type TableNameRow = {
  name: string;
};

async function main() {
  const prisma = getPrismaClient();
  const tables = (await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table'",
  )) as TableNameRow[];
  const hasLeaderboard = tables.some((table) => table.name === "LeaderboardScore");

  if (!hasLeaderboard) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE LeaderboardScore (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        puzzleId INTEGER NOT NULL,
        seconds INTEGER NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (puzzleId) REFERENCES Puzzle(id) ON DELETE CASCADE
      )
    `);
  }

  await prisma.$executeRawUnsafe(
    "CREATE INDEX IF NOT EXISTS LeaderboardScore_seconds_createdAt_idx ON LeaderboardScore (seconds, createdAt)",
  );
  await prisma.$executeRawUnsafe(
    "CREATE INDEX IF NOT EXISTS LeaderboardScore_puzzleId_seconds_idx ON LeaderboardScore (puzzleId, seconds)",
  );

  console.log("Leaderboard table migration complete.");
}

main()
  .catch((error) => {
    console.error("Failed to upgrade leaderboard table.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  });
