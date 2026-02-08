import { BOARD_SIZE } from "@/features/queens/model/constants";
import { shuffle, type RandomSource } from "@/features/queens/engine/random";
import type { QueenPosition } from "@/types/puzzle";

export function generateBaseQueenSolution(random: RandomSource = Math.random): QueenPosition[] | null {
  const usedCols = new Array<boolean>(BOARD_SIZE).fill(false);
  const colsByRow = new Array<number>(BOARD_SIZE).fill(-1);

  const solved = backtrack(0, colsByRow, usedCols, random);
  if (!solved) {
    return null;
  }

  return colsByRow.map((col, row) => ({ row, col }));
}

function backtrack(
  row: number,
  colsByRow: number[],
  usedCols: boolean[],
  random: RandomSource,
): boolean {
  if (row === BOARD_SIZE) {
    return true;
  }

  const candidates = shuffle(
    Array.from({ length: BOARD_SIZE }, (_, index) => index),
    random,
  );
  for (const col of candidates) {
    if (usedCols[col]) {
      continue;
    }

    if (row > 0) {
      const prevCol = colsByRow[row - 1];
      if (Math.abs(prevCol - col) <= 1) {
        continue;
      }
    }

    colsByRow[row] = col;
    usedCols[col] = true;

    if (backtrack(row + 1, colsByRow, usedCols, random)) {
      return true;
    }

    colsByRow[row] = -1;
    usedCols[col] = false;
  }

  return false;
}
