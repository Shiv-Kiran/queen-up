import { generateAndStoreQueensPuzzles } from "../src/server/jobs/generate-queens-puzzles-job";

function utcDateSeed(date: Date): number {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return Number.parseInt(`${year}${month}${day}`, 10);
}

async function main() {
  const seed = utcDateSeed(new Date());

  const result = await generateAndStoreQueensPuzzles({
    count: 1,
    seedStart: seed,
  });

  console.log(`Created daily puzzle id ${result.puzzleIds[0]}.`);
}

main().catch((error) => {
  console.error("Failed to generate daily puzzle.");
  console.error(error);
  process.exit(1);
});
