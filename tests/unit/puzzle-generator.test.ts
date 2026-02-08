import { beforeAll, describe, expect, it } from "vitest";
import { validateCompleteQueens, validateRegionGrid } from "@/features/queens/engine/constraints";
import { generateQueensPuzzle } from "@/features/queens/engine/puzzle-generator";
import { countSolutions } from "@/features/queens/engine/solver";

let generated: ReturnType<typeof generateQueensPuzzle>;

beforeAll(() => {
  generated = generateQueensPuzzle({
    seed: 1,
    maxAttempts: 1800,
  });
});

describe("puzzle generator", () => {
  it("creates a valid connected region grid", () => {
    const { puzzleData } = generated;
    const validation = validateRegionGrid(puzzleData.regionGrid);
    expect(validation.isValid).toBe(true);
  });

  it("creates a valid full solution placement", () => {
    const { puzzleData } = generated;
    const validation = validateCompleteQueens(puzzleData.solution, puzzleData.regionGrid);
    expect(validation.isValid).toBe(true);
  });

  it("enforces unique solution with zero prefilled queens", () => {
    const { puzzleData } = generated;
    expect(puzzleData.revealedQueens).toHaveLength(0);

    const solutionCount = countSolutions(puzzleData.regionGrid, [], {
      maxSolutions: 2,
    });

    expect(solutionCount).toBe(1);
  });
});
