import { BOARD_SIZE, REGION_COUNT } from "@/features/queens/model/constants";
import {
  randomInt,
  shuffle,
  type RandomSource,
} from "@/features/queens/engine/random";
import { validateRegionGrid } from "@/features/queens/engine/constraints";
import type { QueenPosition, RegionGrid } from "@/types/puzzle";

type Cell = {
  row: number;
  col: number;
};

export function generateRegionGridFromSolution(
  solution: QueenPosition[],
  random: RandomSource = Math.random,
): RegionGrid | null {
  const targets = buildRegionTargets(REGION_COUNT, BOARD_SIZE * BOARD_SIZE, 6, 12, random);
  const grid: RegionGrid = Array.from({ length: BOARD_SIZE }, () =>
    Array<number>(BOARD_SIZE).fill(-1),
  );
  const regionCells: Cell[][] = Array.from({ length: REGION_COUNT }, () => []);

  for (let regionId = 0; regionId < REGION_COUNT; regionId += 1) {
    const queen = solution[regionId];
    if (!queen) {
      return null;
    }

    grid[queen.row][queen.col] = regionId;
    regionCells[regionId].push(queen);
  }

  let unassigned = BOARD_SIZE * BOARD_SIZE - REGION_COUNT;
  while (unassigned > 0) {
    let progress = false;
    const order = shuffle(
      Array.from({ length: REGION_COUNT }, (_, index) => index),
      random,
    );

    for (const regionId of order) {
      if (regionCells[regionId].length >= targets[regionId]) {
        continue;
      }

      const candidates = collectNeighborCandidates(grid, regionCells[regionId]);
      if (candidates.length === 0) {
        continue;
      }

      const chosen = candidates[randomInt(random, 0, candidates.length - 1)];
      grid[chosen.row][chosen.col] = regionId;
      regionCells[regionId].push(chosen);
      unassigned -= 1;
      progress = true;
    }

    if (!progress) {
      const fallback = fillOneUnassignedCell(grid, random);
      if (!fallback) {
        return null;
      }
      const { cell, regionId } = fallback;
      grid[cell.row][cell.col] = regionId;
      regionCells[regionId].push(cell);
      unassigned -= 1;
    }
  }

  const validity = validateRegionGrid(grid);
  return validity.isValid ? grid : null;
}

function buildRegionTargets(
  regionCount: number,
  totalCells: number,
  minSize: number,
  maxSize: number,
  random: RandomSource,
): number[] {
  const targets = Array<number>(regionCount).fill(minSize);
  let remaining = totalCells - minSize * regionCount;
  const capacities = Array<number>(regionCount).fill(maxSize - minSize);

  while (remaining > 0) {
    const eligible = capacities
      .map((capacity, index) => ({ capacity, index }))
      .filter((entry) => entry.capacity > 0);
    if (eligible.length === 0) {
      break;
    }

    const pick = eligible[randomInt(random, 0, eligible.length - 1)].index;
    targets[pick] += 1;
    capacities[pick] -= 1;
    remaining -= 1;
  }

  while (remaining > 0) {
    const pick = randomInt(random, 0, regionCount - 1);
    targets[pick] += 1;
    remaining -= 1;
  }

  return targets;
}

function collectNeighborCandidates(grid: RegionGrid, cells: Cell[]): Cell[] {
  const seen = new Set<string>();
  const candidates: Cell[] = [];

  for (const cell of cells) {
    const neighbors = [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ];

    for (const neighbor of neighbors) {
      if (!isInside(neighbor.row, neighbor.col)) {
        continue;
      }
      if (grid[neighbor.row][neighbor.col] !== -1) {
        continue;
      }

      const key = `${neighbor.row}:${neighbor.col}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      candidates.push(neighbor);
    }
  }

  return candidates;
}

function fillOneUnassignedCell(
  grid: RegionGrid,
  random: RandomSource,
): { cell: Cell; regionId: number } | null {
  const options: Array<{ cell: Cell; regionIds: number[] }> = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (grid[row][col] !== -1) {
        continue;
      }

      const regionIds = adjacentRegions(grid, row, col);
      if (regionIds.length === 0) {
        continue;
      }

      options.push({
        cell: { row, col },
        regionIds,
      });
    }
  }

  if (options.length === 0) {
    return null;
  }

  const option = options[randomInt(random, 0, options.length - 1)];
  const regionId = option.regionIds[randomInt(random, 0, option.regionIds.length - 1)];
  return { cell: option.cell, regionId };
}

function adjacentRegions(grid: RegionGrid, row: number, col: number): number[] {
  const ids = new Set<number>();
  const neighbors = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];

  for (const neighbor of neighbors) {
    if (!isInside(neighbor.row, neighbor.col)) {
      continue;
    }

    const region = grid[neighbor.row][neighbor.col];
    if (region !== -1) {
      ids.add(region);
    }
  }

  return Array.from(ids);
}

function isInside(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}
