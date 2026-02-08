import { beforeAll, describe, expect, it } from "vitest";
import { validateCompleteQueens, validateRegionGrid } from "@/features/queens/engine/constraints";
import { generateQueensPuzzle } from "@/features/queens/engine/puzzle-generator";
import { countSolutions } from "@/features/queens/engine/solver";

let generated: ReturnType<typeof generateQueensPuzzle>;

beforeAll(() => {
  generated = generatePuzzleFromSeedRange();
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

  it("enforces unique solution from revealed clues", () => {
    const { puzzleData } = generated;
    const solutionCount = countSolutions(puzzleData.regionGrid, puzzleData.revealedQueens, {
      maxSolutions: 2,
    });

    expect(solutionCount).toBe(1);
  });
});

function generatePuzzleFromSeedRange() {
  let lastError: unknown;
  for (let seed = 1; seed <= 200; seed += 1) {
    try {
      return generateQueensPuzzle({
        seed,
        maxAttempts: 120,
        minClues: 3,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Could not generate test puzzle from seed range: ${String(lastError)}`);
}
