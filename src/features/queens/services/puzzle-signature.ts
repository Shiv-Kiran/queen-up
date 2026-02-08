import { createHash } from "node:crypto";
import type { QueenPosition, QueensPuzzleData } from "@/types/puzzle";

export function createPuzzleSignature(puzzleData: QueensPuzzleData): string {
  const payload = JSON.stringify({
    size: puzzleData.size,
    regionGrid: puzzleData.regionGrid,
    solution: puzzleData.solution,
  });

  return createHash("sha256").update(payload).digest("hex");
}

export function createSolutionHash(solution: QueenPosition[]): string {
  const canonical = [...solution]
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map((cell) => `${cell.row}:${cell.col}`)
    .join("|");

  return createHash("sha256").update(canonical).digest("hex");
}
