import { BOARD_SIZE } from "@/features/queens/model/constants";
import { generateBaseQueenSolution } from "@/features/queens/engine/base-solution-generator";
import {
  createSeededRandom,
  shuffle,
  type RandomSource,
} from "@/features/queens/engine/random";
import { generateRegionGridFromSolution } from "@/features/queens/engine/region-generator";
import { countSolutions } from "@/features/queens/engine/solver";
import type {
  PuzzleDifficultyLevel,
  QueenPosition,
  QueensPuzzleData,
} from "@/types/puzzle";

export type GeneratePuzzleOptions = {
  seed?: number;
  maxAttempts?: number;
  minClues?: number;
};

export type GeneratedPuzzleResult = {
  puzzleData: QueensPuzzleData;
  difficulty: PuzzleDifficultyLevel;
};

export function generateQueensPuzzle(
  options: GeneratePuzzleOptions = {},
): GeneratedPuzzleResult {
  const maxAttempts = options.maxAttempts ?? 300;
  const minClues = options.minClues ?? 3;
  const random = options.seed !== undefined ? createSeededRandom(options.seed) : Math.random;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const solution = generateBaseQueenSolution(random);
    if (!solution) {
      continue;
    }

    const regionGrid = generateRegionGridFromSolution(solution, random);
    if (!regionGrid) {
      continue;
    }

    const revealedQueens = minimizeRevealedQueens(regionGrid, solution, minClues, random);
    const uniqueCount = countSolutions(regionGrid, revealedQueens, { maxSolutions: 2, random });
    if (uniqueCount !== 1) {
      continue;
    }

    return {
      puzzleData: {
        size: BOARD_SIZE,
        regionGrid,
        revealedQueens,
        solution,
        generatedAt: new Date().toISOString(),
      },
      difficulty: inferDifficulty(revealedQueens.length),
    };
  }

  throw new Error(`Unable to generate unique puzzle after ${maxAttempts} attempts.`);
}

function minimizeRevealedQueens(
  regionGrid: number[][],
  solution: QueenPosition[],
  minClues: number,
  random: RandomSource,
): QueenPosition[] {
  let current = [...solution];
  const candidates = shuffle([...solution], random);

  while (candidates.length > 0 && current.length > minClues) {
    const candidate = candidates.pop();
    if (!candidate) {
      break;
    }

    const next = current.filter(
      (queen) => queen.row !== candidate.row || queen.col !== candidate.col,
    );
    if (next.length < minClues) {
      continue;
    }

    const solutionCount = countSolutions(regionGrid, next, {
      maxSolutions: 2,
      random,
    });

    if (solutionCount === 1) {
      current = next;
    }
  }

  return current.sort((a, b) => a.row - b.row);
}

function inferDifficulty(revealedCount: number): PuzzleDifficultyLevel {
  if (revealedCount <= 3) {
    return "HARD";
  }
  if (revealedCount <= 5) {
    return "MEDIUM";
  }
  return "EASY";
}
