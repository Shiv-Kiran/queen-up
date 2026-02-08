import { createHash } from "node:crypto";
import type { QueensPuzzleData } from "@/types/puzzle";

export function createPuzzleSignature(puzzleData: QueensPuzzleData): string {
  const payload = JSON.stringify({
    size: puzzleData.size,
    regionGrid: puzzleData.regionGrid,
    solution: puzzleData.solution,
  });

  return createHash("sha256").update(payload).digest("hex");
}
