import { generateQueensPuzzle } from "@/features/queens/engine/puzzle-generator";
import { createSolutionHash } from "@/features/queens/services/puzzle-signature";
import { PrismaPuzzleRepository } from "@/server/repositories/puzzle-repository";
import { PuzzleService } from "@/server/services/puzzle-service";

export type GenerateAndStoreOptions = {
  count: number;
  seedStart?: number;
  maxAttemptsPerPuzzle?: number;
};

export type GenerateAndStoreResult = {
  created: number;
  puzzleIds: number[];
};

export async function generateAndStoreQueensPuzzles(
  options: GenerateAndStoreOptions,
): Promise<GenerateAndStoreResult> {
  const repository = new PrismaPuzzleRepository();
  const service = new PuzzleService(repository);

  const puzzleIds: number[] = [];
  const desired = Math.max(1, options.count);
  const seedStart = options.seedStart ?? Date.now();
  const maxAttemptsPerPuzzle = options.maxAttemptsPerPuzzle ?? 1800;
  const maxOuterAttempts = desired * 1200;

  let created = 0;
  let outerAttempts = 0;

  while (created < desired && outerAttempts < maxOuterAttempts) {
    const seed = seedStart + outerAttempts;
    outerAttempts += 1;

    const generated = generateQueensPuzzle({
      seed,
      maxAttempts: maxAttemptsPerPuzzle,
    });
    const solutionHash = createSolutionHash(generated.puzzleData.solution);
    const duplicate = await repository.existsBySolutionHash(solutionHash);
    if (duplicate) {
      continue;
    }

    try {
      const createdPuzzle = await service.createPuzzle({
        puzzleData: generated.puzzleData,
        solutionHash,
        difficulty: generated.difficulty,
      });
      puzzleIds.push(createdPuzzle.id);
      created += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      if (message.includes("Unique constraint failed")) {
        continue;
      }

      throw error;
    }
  }

  if (created < desired) {
    throw new Error(`Generated ${created} of ${desired} requested puzzles.`);
  }

  return {
    created,
    puzzleIds,
  };
}
