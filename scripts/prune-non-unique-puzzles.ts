import { getPrismaClient } from "../src/server/db/client";
import { countSolutions } from "../src/features/queens/engine/solver";
import type { QueensPuzzleData } from "../src/types/puzzle";

type PruneOptions = {
  apply: boolean;
};

type PruneResult = {
  total: number;
  nonUnique: number;
  deleted: number;
  ids: number[];
};

async function pruneNonUniquePuzzles(options: PruneOptions): Promise<PruneResult> {
  const prisma = getPrismaClient();
  const rows = await prisma.puzzle.findMany({
    orderBy: { id: "asc" },
    select: { id: true, puzzleData: true },
  });

  const ids: number[] = [];
  for (const row of rows) {
    const data = JSON.parse(row.puzzleData) as QueensPuzzleData;
    const solutionCount = countSolutions(data.regionGrid, data.revealedQueens, {
      maxSolutions: 2,
    });
    if (solutionCount !== 1) {
      ids.push(row.id);
    }
  }

  let deleted = 0;
  if (options.apply && ids.length > 0) {
    await prisma.leaderboardScore.deleteMany({
      where: { puzzleId: { in: ids } },
    });
    const deletedRows = await prisma.puzzle.deleteMany({
      where: { id: { in: ids } },
    });
    deleted = deletedRows.count;
  }

  return {
    total: rows.length,
    nonUnique: ids.length,
    deleted,
    ids,
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const result = await pruneNonUniquePuzzles({ apply });

  console.log(`total=${result.total}`);
  console.log(`nonUnique=${result.nonUnique}`);
  if (result.nonUnique > 0) {
    console.log(`ids=${result.ids.join(",")}`);
  }

  if (!apply) {
    console.log("Dry run only. Use --apply to delete non-unique puzzles.");
    return;
  }

  console.log(`deleted=${result.deleted}`);
}

main()
  .catch((error) => {
    console.error("Failed to prune non-unique puzzles.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  });
