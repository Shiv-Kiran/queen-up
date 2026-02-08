import { describe, expect, it } from "vitest";
import {
  isValidPlacement,
  validateCompleteQueens,
  validatePartialQueens,
  validateRegionGrid,
} from "@/features/queens/engine/constraints";
import {
  countSolutions,
  solvePuzzle,
} from "@/features/queens/engine/solver";
import type { QueenPosition, RegionGrid } from "@/types/puzzle";

const blockRegionGrid: RegionGrid = [
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
];

describe("queens constraints", () => {
  it("validates a legal region grid", () => {
    const result = validateRegionGrid(blockRegionGrid);
    expect(result.isValid).toBe(true);
  });

  it("rejects adjacent placement", () => {
    const placed: QueenPosition[] = [{ row: 2, col: 2 }];
    const legal = isValidPlacement({
      row: 3,
      col: 3,
      placedQueens: placed,
      regionGrid: blockRegionGrid,
    });

    expect(legal).toBe(false);
  });

  it("rejects invalid partial constraints", () => {
    const partial: QueenPosition[] = [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ];

    const result = validatePartialQueens(partial, blockRegionGrid);
    expect(result.isValid).toBe(false);
  });
});

describe("queens solver", () => {
  it("finds at least one complete solution", () => {
    const solution = solvePuzzle(blockRegionGrid);
    expect(solution).not.toBeNull();
    expect(solution).toHaveLength(9);

    const complete = validateCompleteQueens(solution ?? [], blockRegionGrid);
    expect(complete.isValid).toBe(true);
  });

  it("counts one solution for full revealed clues", () => {
    const solution = solvePuzzle(blockRegionGrid);
    expect(solution).not.toBeNull();

    const count = countSolutions(blockRegionGrid, solution ?? [], {
      maxSolutions: 2,
    });
    expect(count).toBe(1);
  });

  it("returns zero solutions for contradictory clues", () => {
    const clues: QueenPosition[] = [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ];

    const count = countSolutions(blockRegionGrid, clues, {
      maxSolutions: 2,
    });
    expect(count).toBe(0);
  });
});
