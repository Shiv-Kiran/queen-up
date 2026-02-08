import { BOARD_SIZE, REGION_COUNT } from "@/features/queens/model/constants";
import type { QueenPosition, RegionGrid } from "@/types/puzzle";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export function isInsideBoard(row: number, col: number, size = BOARD_SIZE): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

export function areAdjacent(a: QueenPosition, b: QueenPosition): boolean {
  if (a.row === b.row && a.col === b.col) {
    return false;
  }

  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
}

export function isValidPlacement(params: {
  row: number;
  col: number;
  placedQueens: QueenPosition[];
  regionGrid: RegionGrid;
}): boolean {
  const { row, col, placedQueens, regionGrid } = params;
  if (!isInsideBoard(row, col)) {
    return false;
  }

  const regionId = regionGrid[row][col];
  return placedQueens.every((queen) => {
    if (queen.col === col) {
      return false;
    }

    if (regionGrid[queen.row][queen.col] === regionId) {
      return false;
    }

    if (areAdjacent(queen, { row, col })) {
      return false;
    }

    return true;
  });
}

export function validateRegionGrid(
  regionGrid: RegionGrid,
  size = BOARD_SIZE,
  regionCount = REGION_COUNT,
): ValidationResult {
  const errors: string[] = [];
  if (regionGrid.length !== size) {
    errors.push(`Region grid must have ${size} rows.`);
    return { isValid: false, errors };
  }

  for (const [rowIndex, row] of regionGrid.entries()) {
    if (row.length !== size) {
      errors.push(`Row ${rowIndex} must have ${size} columns.`);
      return { isValid: false, errors };
    }
  }

  const regionCells = new Map<number, QueenPosition[]>();
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const regionId = regionGrid[row][col];
      if (!Number.isInteger(regionId) || regionId < 0 || regionId >= regionCount) {
        errors.push(`Invalid region id ${regionId} at (${row}, ${col}).`);
        continue;
      }

      const cells = regionCells.get(regionId) ?? [];
      cells.push({ row, col });
      regionCells.set(regionId, cells);
    }
  }

  if (regionCells.size !== regionCount) {
    errors.push(`Expected ${regionCount} regions, found ${regionCells.size}.`);
    return { isValid: false, errors };
  }

  for (const [regionId, cells] of regionCells) {
    if (!isRegionConnected(regionGrid, regionId, cells[0], size)) {
      errors.push(`Region ${regionId} is not connected.`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePartialQueens(
  queens: QueenPosition[],
  regionGrid: RegionGrid,
): ValidationResult {
  const errors: string[] = [];
  const rows = new Set<number>();
  const cols = new Set<number>();
  const regions = new Set<number>();

  for (const queen of queens) {
    if (!isInsideBoard(queen.row, queen.col, regionGrid.length)) {
      errors.push(`Queen at (${queen.row}, ${queen.col}) is outside board.`);
      continue;
    }

    if (rows.has(queen.row)) {
      errors.push(`Duplicate row ${queen.row}.`);
    }
    rows.add(queen.row);

    if (cols.has(queen.col)) {
      errors.push(`Duplicate column ${queen.col}.`);
    }
    cols.add(queen.col);

    const region = regionGrid[queen.row][queen.col];
    if (regions.has(region)) {
      errors.push(`Duplicate region ${region}.`);
    }
    regions.add(region);
  }

  for (let i = 0; i < queens.length; i += 1) {
    for (let j = i + 1; j < queens.length; j += 1) {
      if (areAdjacent(queens[i], queens[j])) {
        errors.push(
          `Adjacent queens at (${queens[i].row}, ${queens[i].col}) and (${queens[j].row}, ${queens[j].col}).`,
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateCompleteQueens(
  queens: QueenPosition[],
  regionGrid: RegionGrid,
  size = BOARD_SIZE,
): ValidationResult {
  const partial = validatePartialQueens(queens, regionGrid);
  const errors = [...partial.errors];

  if (queens.length !== size) {
    errors.push(`Expected exactly ${size} queens, found ${queens.length}.`);
  }

  if (new Set(queens.map((queen) => queen.row)).size !== size) {
    errors.push("Each row must contain exactly one queen.");
  }

  if (new Set(queens.map((queen) => queen.col)).size !== size) {
    errors.push("Each column must contain exactly one queen.");
  }

  if (new Set(queens.map((queen) => regionGrid[queen.row][queen.col])).size !== size) {
    errors.push("Each region must contain exactly one queen.");
  }

  return { isValid: errors.length === 0, errors };
}

function isRegionConnected(
  regionGrid: RegionGrid,
  regionId: number,
  start: QueenPosition,
  size: number,
): boolean {
  const seen = new Set<string>();
  const queue: QueenPosition[] = [start];

  while (queue.length > 0) {
    const cell = queue.shift();
    if (!cell) {
      continue;
    }

    const key = `${cell.row}:${cell.col}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const neighbors = [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ];

    for (const neighbor of neighbors) {
      if (!isInsideBoard(neighbor.row, neighbor.col, size)) {
        continue;
      }
      if (regionGrid[neighbor.row][neighbor.col] !== regionId) {
        continue;
      }

      queue.push(neighbor);
    }
  }

  let total = 0;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (regionGrid[row][col] === regionId) {
        total += 1;
      }
    }
  }

  return seen.size === total;
}
