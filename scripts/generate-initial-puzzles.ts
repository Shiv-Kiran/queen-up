import { generateAndStoreQueensPuzzles } from "../src/server/jobs/generate-queens-puzzles-job";

const DEFAULT_COUNT = 30;

async function main() {
  const countArg = process.argv[2];
  const parsedCount = countArg ? Number.parseInt(countArg, 10) : DEFAULT_COUNT;
  const count = Number.isNaN(parsedCount) ? DEFAULT_COUNT : parsedCount;

  const result = await generateAndStoreQueensPuzzles({
    count,
    seedStart: Date.now(),
  });

  console.log(
    `Created ${result.created} puzzle(s). IDs: ${result.puzzleIds.join(", ")}`,
  );
}

main().catch((error) => {
  console.error("Failed to generate initial puzzles.");
  console.error(error);
  process.exit(1);
});
