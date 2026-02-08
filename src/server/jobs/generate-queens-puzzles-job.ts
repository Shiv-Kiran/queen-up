import { generateQueensPuzzle } from "@/features/queens/engine/puzzle-generator";
import { createPuzzleSignature } from "@/features/queens/services/puzzle-signature";
import { PrismaPuzzleRepository } from "@/server/repositories/puzzle-repository";
import { PuzzleService } from "@/server/services/puzzle-service";

export type GenerateAndStoreOptions = {
  count: number;
  minClues?: number;
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
  const existing = await repository.listByType({
    limit: 100000,
  });
  const knownSignatures = new Set(existing.map((row) => createPuzzleSignature(row.puzzleData)));

  const puzzleIds: number[] = [];
  const desired = Math.max(1, options.count);
  const seedStart = options.seedStart ?? Date.now();
  const minClues = options.minClues ?? 3;
  const maxAttemptsPerPuzzle = options.maxAttemptsPerPuzzle ?? 300;
  const maxOuterAttempts = desired * 300;

  let created = 0;
  let outerAttempts = 0;

  while (created < desired && outerAttempts < maxOuterAttempts) {
    const seed = seedStart + outerAttempts;
    outerAttempts += 1;

    const generated = generateQueensPuzzle({
      seed,
      minClues,
      maxAttempts: maxAttemptsPerPuzzle,
    });
    const signature = createPuzzleSignature(generated.puzzleData);
    if (knownSignatures.has(signature)) {
      continue;
    }

    const createdPuzzle = await service.createPuzzle({
      puzzleData: generated.puzzleData,
      difficulty: generated.difficulty,
    });
    knownSignatures.add(signature);
    puzzleIds.push(createdPuzzle.id);
    created += 1;
  }

  if (created < desired) {
    throw new Error(`Generated ${created} of ${desired} requested puzzles.`);
  }

  return {
    created,
    puzzleIds,
  };
}
