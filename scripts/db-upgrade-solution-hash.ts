import { createSolutionHash } from "../src/features/queens/services/puzzle-signature";
import { prisma } from "../src/server/db/client";
import type { QueensPuzzleData } from "../src/types/puzzle";

type TableInfoRow = {
  name: string;
};

type PuzzleRow = {
  id: number;
  puzzleData: string;
  solutionHash: string | null;
};

async function main() {
  const columns = (await prisma.$queryRawUnsafe(
    "PRAGMA table_info('Puzzle')",
  )) as TableInfoRow[];
  const hasSolutionHash = columns.some((column) => column.name === "solutionHash");

  if (!hasSolutionHash) {
    await prisma.$executeRawUnsafe("ALTER TABLE Puzzle ADD COLUMN solutionHash TEXT");
  }

  const rows = (await prisma.$queryRawUnsafe(
    "SELECT id, puzzleData, solutionHash FROM Puzzle",
  )) as PuzzleRow[];

  for (const row of rows) {
    if (typeof row.solutionHash === "string" && row.solutionHash.length > 0) {
      continue;
    }

    const puzzleData = JSON.parse(row.puzzleData) as QueensPuzzleData;
    const hash = createSolutionHash(puzzleData.solution);
    await prisma.$executeRawUnsafe(
      "UPDATE Puzzle SET solutionHash = ? WHERE id = ?",
      hash,
      row.id,
    );
  }

  await prisma.$executeRawUnsafe(
    "CREATE UNIQUE INDEX IF NOT EXISTS Puzzle_solutionHash_key ON Puzzle (solutionHash)",
  );

  console.log("Puzzle solution hash migration complete.");
}

main()
  .catch((error) => {
    console.error("Failed to upgrade solution hash column.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
