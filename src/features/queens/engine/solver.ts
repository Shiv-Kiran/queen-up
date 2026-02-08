import { BOARD_SIZE } from "@/features/queens/model/constants";
import {
  validatePartialQueens,
  validateRegionGrid,
} from "@/features/queens/engine/constraints";
import type { QueenPosition, RegionGrid } from "@/types/puzzle";

export type SolveOptions = {
  maxSolutions?: number;
  random?: () => number;
};

type SearchState = {
  queensByRow: number[];
  usedCols: boolean[];
  usedRegions: boolean[];
  prefilledByRow: Array<number | null>;
};

export function solvePuzzle(
  regionGrid: RegionGrid,
  prefilledQueens: QueenPosition[] = [],
  options: SolveOptions = {},
): QueenPosition[] | null {
  const solutions: QueenPosition[][] = [];
  searchSolutions(regionGrid, prefilledQueens, {
    maxSolutions: 1,
    random: options.random ?? Math.random,
  }, solutions);

  return solutions[0] ?? null;
}

export function countSolutions(
  regionGrid: RegionGrid,
  prefilledQueens: QueenPosition[] = [],
  options: SolveOptions = {},
): number {
  const maxSolutions = options.maxSolutions ?? 2;
  const solutions: QueenPosition[][] = [];
  searchSolutions(regionGrid, prefilledQueens, {
    maxSolutions,
    random: options.random ?? Math.random,
  }, solutions);

  return solutions.length;
}

function searchSolutions(
  regionGrid: RegionGrid,
  prefilledQueens: QueenPosition[],
  options: Required<SolveOptions>,
  solutions: QueenPosition[][],
) {
  const gridValidation = validateRegionGrid(regionGrid, BOARD_SIZE, BOARD_SIZE);
  if (!gridValidation.isValid) {
    return;
  }

  const partialValidation = validatePartialQueens(prefilledQueens, regionGrid);
  if (!partialValidation.isValid) {
    return;
  }

  const state = initializeState(prefilledQueens);
  if (!state) {
    return;
  }

  backtrackByRow(regionGrid, 0, state, solutions, options.maxSolutions, options.random);
}

function initializeState(prefilledQueens: QueenPosition[]): SearchState | null {
  const queensByRow = new Array<number>(BOARD_SIZE).fill(-1);
  const usedCols = new Array<boolean>(BOARD_SIZE).fill(false);
  const usedRegions = new Array<boolean>(BOARD_SIZE).fill(false);
  const prefilledByRow: Array<number | null> = new Array<number | null>(BOARD_SIZE).fill(null);

  for (const queen of prefilledQueens) {
    if (prefilledByRow[queen.row] !== null) {
      return null;
    }

    prefilledByRow[queen.row] = queen.col;
  }

  return {
    queensByRow,
    usedCols,
    usedRegions,
    prefilledByRow,
  };
}

function backtrackByRow(
  regionGrid: RegionGrid,
  row: number,
  state: SearchState,
  solutions: QueenPosition[][],
  maxSolutions: number,
  random: () => number,
) {
  if (solutions.length >= maxSolutions) {
    return;
  }

  if (row === BOARD_SIZE) {
    solutions.push(toPositions(state.queensByRow));
    return;
  }

  const prefilledCol = state.prefilledByRow[row];
  const candidates =
    prefilledCol !== null ? [prefilledCol] : shuffledColumns(BOARD_SIZE, random);

  for (const col of candidates) {
    const region = regionGrid[row][col];
    if (state.usedCols[col] || state.usedRegions[region]) {
      continue;
    }

    if (row > 0) {
      const previousCol = state.queensByRow[row - 1];
      if (previousCol !== -1 && Math.abs(previousCol - col) <= 1) {
        continue;
      }
    }

    state.queensByRow[row] = col;
    state.usedCols[col] = true;
    state.usedRegions[region] = true;

    backtrackByRow(regionGrid, row + 1, state, solutions, maxSolutions, random);

    state.queensByRow[row] = -1;
    state.usedCols[col] = false;
    state.usedRegions[region] = false;
  }
}

function shuffledColumns(size: number, random: () => number): number[] {
  const cols = Array.from({ length: size }, (_, index) => index);
  for (let i = cols.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = cols[i];
    cols[i] = cols[j];
    cols[j] = tmp;
  }

  return cols;
}

function toPositions(queensByRow: number[]): QueenPosition[] {
  return queensByRow.map((col, row) => ({ row, col }));
}
