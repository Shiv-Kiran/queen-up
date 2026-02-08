import { BOARD_SIZE } from "@/features/queens/model/constants";
import {
  createSeededRandom,
} from "@/features/queens/engine/random";
import { generateRandomRegionGrid } from "@/features/queens/engine/region-generator";
import { countSolutions, solvePuzzle } from "@/features/queens/engine/solver";
import type {
  PuzzleDifficultyLevel,
  QueensPuzzleData,
} from "@/types/puzzle";

export type GeneratePuzzleOptions = {
  seed?: number;
  maxAttempts?: number;
};

export type GeneratedPuzzleResult = {
  puzzleData: QueensPuzzleData;
  difficulty: PuzzleDifficultyLevel;
};

export function generateQueensPuzzle(
  options: GeneratePuzzleOptions = {},
): GeneratedPuzzleResult {
  const maxAttempts = options.maxAttempts ?? 1800;
  const random = options.seed !== undefined ? createSeededRandom(options.seed) : Math.random;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const regionGrid = generateRandomRegionGrid(random);
    if (!regionGrid) {
      continue;
    }

    // v1 product rule: no pre-revealed queens, uniqueness is from region layout alone.
    const uniqueCount = countSolutions(regionGrid, [], { maxSolutions: 2, random });
    if (uniqueCount !== 1) {
      continue;
    }

    const solution = solvePuzzle(regionGrid, [], { random });
    if (!solution) {
      continue;
    }

    return {
      puzzleData: {
        size: BOARD_SIZE,
        regionGrid,
        revealedQueens: [],
        solution,
        generatedAt: new Date().toISOString(),
      },
      difficulty: inferDifficulty(),
    };
  }

  throw new Error(`Unable to generate unique puzzle after ${maxAttempts} attempts.`);
}

function inferDifficulty(): PuzzleDifficultyLevel {
  return "HARD";
}
