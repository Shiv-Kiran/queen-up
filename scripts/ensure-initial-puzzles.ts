import { generateAndStoreQueensPuzzles } from "../src/server/jobs/generate-queens-puzzles-job";
import { PrismaPuzzleRepository } from "../src/server/repositories/puzzle-repository";

const DEFAULT_TARGET = 30;

async function main() {
  const targetArg = process.argv[2];
  const parsedTarget = targetArg ? Number.parseInt(targetArg, 10) : DEFAULT_TARGET;
  const target = Number.isNaN(parsedTarget) ? DEFAULT_TARGET : parsedTarget;

  const repository = new PrismaPuzzleRepository();
  const existing = await repository.countByType();
  const missing = Math.max(0, target - existing);

  if (missing === 0) {
    console.log(`Already have ${existing} puzzles. No generation required.`);
    return;
  }

  const result = await generateAndStoreQueensPuzzles({
    count: missing,
    seedStart: Date.now(),
  });

  console.log(
    `Created ${result.created} puzzle(s). Total target ${target} satisfied.`,
  );
}

main().catch((error) => {
  console.error("Failed to ensure initial puzzle set.");
  console.error(error);
  process.exit(1);
});
