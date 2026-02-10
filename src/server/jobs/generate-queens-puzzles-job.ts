import {
  generateQueensPuzzle,
  type PuzzleDifficultyHeuristic,
} from "@/features/queens/engine/puzzle-generator";
import { createSolutionHash } from "@/features/queens/services/puzzle-signature";
import { PrismaPuzzleRepository } from "@/server/repositories/puzzle-repository";
import { PuzzleService } from "@/server/services/puzzle-service";
import type {
  PuzzleDifficultyLevel,
  QueensPuzzleData,
} from "@/types/puzzle";

export type GenerateAndStoreOptions = {
  count: number;
  seedStart?: number;
  maxAttemptsPerPuzzle?: number;
  maxOuterAttempts?: number;
};

export type GenerateAndStoreResult = {
  created: number;
  puzzleIds: number[];
  puzzles: Array<{
    id: number;
    seed: number;
    attemptsUsed: number;
    solutionHash: string;
    difficulty: PuzzleDifficultyLevel;
    difficultyHeuristic: PuzzleDifficultyHeuristic;
    puzzleData: QueensPuzzleData;
  }>;
  stats: {
    seedsTried: number;
    skippedAttemptFailures: number;
    skippedDuplicateHashes: number;
    maxAttemptsPerPuzzle: number;
    maxOuterAttempts: number;
  };
};

export class PuzzleGenerationJobError extends Error {
  constructor(
    message: string,
    public readonly details: GenerateAndStoreResult,
  ) {
    super(message);
    this.name = "PuzzleGenerationJobError";
  }
}

export async function generateAndStoreQueensPuzzles(
  options: GenerateAndStoreOptions,
): Promise<GenerateAndStoreResult> {
  const repository = new PrismaPuzzleRepository();
  const service = new PuzzleService(repository);

  const puzzleIds: number[] = [];
  const puzzles: GenerateAndStoreResult["puzzles"] = [];
  const desired = Math.max(1, options.count);
  const seedStart = options.seedStart ?? Date.now();
  const maxAttemptsPerPuzzle = options.maxAttemptsPerPuzzle ?? 1800;
  const maxOuterAttempts = options.maxOuterAttempts ?? desired * 1200;

  let created = 0;
  let outerAttempts = 0;
  let skippedAttemptFailures = 0;
  let skippedDuplicateHashes = 0;

  while (created < desired && outerAttempts < maxOuterAttempts) {
    const seed = seedStart + outerAttempts;
    outerAttempts += 1;

    let generated;
    try {
      generated = generateQueensPuzzle({
        seed,
        maxAttempts: maxAttemptsPerPuzzle,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Unable to generate unique puzzle")) {
        skippedAttemptFailures += 1;
        continue;
      }

      throw error;
    }

    const solutionHash = createSolutionHash(generated.puzzleData.solution);
    const duplicate = await repository.existsBySolutionHash(solutionHash);
    if (duplicate) {
      skippedDuplicateHashes += 1;
      continue;
    }

    try {
      const createdPuzzle = await service.createPuzzle({
        puzzleData: generated.puzzleData,
        solutionHash,
        difficulty: generated.difficulty,
      });
      puzzleIds.push(createdPuzzle.id);
      puzzles.push({
        id: createdPuzzle.id,
        seed,
        attemptsUsed: generated.attemptsUsed,
        solutionHash,
        difficulty: generated.difficulty,
        difficultyHeuristic: generated.difficultyHeuristic,
        puzzleData: generated.puzzleData,
      });
      created += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      if (message.includes("Unique constraint failed")) {
        skippedDuplicateHashes += 1;
        continue;
      }

      throw error;
    }
  }

  const result: GenerateAndStoreResult = {
    created,
    puzzleIds,
    puzzles,
    stats: {
      seedsTried: outerAttempts,
      skippedAttemptFailures,
      skippedDuplicateHashes,
      maxAttemptsPerPuzzle,
      maxOuterAttempts,
    },
  };

  if (created < desired) {
    throw new PuzzleGenerationJobError(
      `Generated ${created} of ${desired} requested puzzles.`,
      result,
    );
  }

  return result;
}
