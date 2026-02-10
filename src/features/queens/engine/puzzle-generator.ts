import { BOARD_SIZE } from "@/features/queens/model/constants";
import {
  createSeededRandom,
} from "@/features/queens/engine/random";
import { generateRandomRegionGrid } from "@/features/queens/engine/region-generator";
import { countSolutions, solvePuzzle } from "@/features/queens/engine/solver";
import type {
  PuzzleDifficultyLevel,
  QueenPosition,
  RegionGrid,
  QueensPuzzleData,
} from "@/types/puzzle";

export type GeneratePuzzleOptions = {
  seed?: number;
  maxAttempts?: number;
};

export type PuzzleDifficultyHeuristic = {
  score: number;
  averageChoicesPerRow: number;
  forcedRows: number;
  sizeVariance: number;
  boundaryComplexity: number;
};

export type GeneratedPuzzleResult = {
  puzzleData: QueensPuzzleData;
  difficulty: PuzzleDifficultyLevel;
  attemptsUsed: number;
  difficultyHeuristic: PuzzleDifficultyHeuristic;
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
    const difficultyHeuristic = computeDifficultyHeuristic(regionGrid, solution);

    return {
      puzzleData: {
        size: BOARD_SIZE,
        regionGrid,
        revealedQueens: [],
        solution,
        generatedAt: new Date().toISOString(),
      },
      difficulty: inferDifficulty(difficultyHeuristic.score),
      attemptsUsed: attempt + 1,
      difficultyHeuristic,
    };
  }

  throw new Error(`Unable to generate unique puzzle after ${maxAttempts} attempts.`);
}

function inferDifficulty(score: number): PuzzleDifficultyLevel {
  if (score <= 38) {
    return "EASY";
  }
  if (score <= 64) {
    return "MEDIUM";
  }
  return "HARD";
}

function computeDifficultyHeuristic(
  regionGrid: RegionGrid,
  solution: QueenPosition[],
): PuzzleDifficultyHeuristic {
  const sizes = new Array<number>(BOARD_SIZE).fill(0);
  let boundaryEdges = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const region = regionGrid[row][col];
      sizes[region] += 1;

      if (row > 0 && regionGrid[row - 1][col] !== region) {
        boundaryEdges += 1;
      }
      if (col > 0 && regionGrid[row][col - 1] !== region) {
        boundaryEdges += 1;
      }
    }
  }

  const meanSize = BOARD_SIZE;
  const variance =
    sizes.reduce((sum, value) => {
      const diff = value - meanSize;
      return sum + diff * diff;
    }, 0) / sizes.length;

  const sizeVariance = Math.min(variance / 10, 10);
  const boundaryComplexity = Math.min(boundaryEdges / 36, 10);

  const choicesByRow = getChoicesByRow(regionGrid, solution);
  const averageChoicesPerRow =
    choicesByRow.reduce((sum, value) => sum + value, 0) / choicesByRow.length;
  const forcedRows = choicesByRow.filter((value) => value <= 2).length;

  const scoreRaw =
    20 +
    averageChoicesPerRow * 10 +
    boundaryComplexity * 2.2 +
    sizeVariance * 1.6 -
    forcedRows * 3.2;

  const score = clamp(Math.round(scoreRaw), 5, 95);

  return {
    score,
    averageChoicesPerRow: round2(averageChoicesPerRow),
    forcedRows,
    sizeVariance: round2(sizeVariance),
    boundaryComplexity: round2(boundaryComplexity),
  };
}

function getChoicesByRow(regionGrid: RegionGrid, solution: QueenPosition[]): number[] {
  const usedCols = new Set<number>();
  const usedRegions = new Set<number>();
  const byRow = [...solution].sort((a, b) => a.row - b.row);
  const choices: number[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let validChoices = 0;
    const previousSolutionCol = row > 0 ? byRow[row - 1]?.col ?? -1 : -1;

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const region = regionGrid[row][col];
      if (usedCols.has(col) || usedRegions.has(region)) {
        continue;
      }

      if (row > 0 && previousSolutionCol !== -1 && Math.abs(previousSolutionCol - col) <= 1) {
        continue;
      }

      validChoices += 1;
    }

    choices.push(validChoices);
    const queen = byRow[row];
    if (queen) {
      usedCols.add(queen.col);
      usedRegions.add(regionGrid[queen.row][queen.col]);
    }
  }

  return choices;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
