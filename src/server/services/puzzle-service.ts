import {
  DEFAULT_PUZZLE_TYPE,
  PrismaPuzzleRepository,
  type PuzzleRepository,
} from "@/server/repositories/puzzle-repository";
import { validateCompleteQueens } from "@/features/queens/engine/constraints";
import type {
  PuzzleDifficultyLevel,
  QueensPuzzleData,
  QueensPuzzlePublicData,
  QueenPosition,
} from "@/types/puzzle";

export type PuzzleWithPosition = {
  id: number;
  index: number;
  total: number;
  difficulty: PuzzleDifficultyLevel | null;
  createdAt: string;
  puzzle: QueensPuzzlePublicData;
};

export type PuzzleSummary = {
  id: number;
  index: number;
  difficulty: PuzzleDifficultyLevel | null;
  createdAt: string;
};

export type SubmissionValidation = {
  found: boolean;
  valid: boolean;
  errors: string[];
};

function stripSolution(data: QueensPuzzleData): QueensPuzzlePublicData {
  return {
    size: data.size,
    regionGrid: data.regionGrid,
    revealedQueens: data.revealedQueens,
    generatedAt: data.generatedAt,
  };
}

function toKey(position: QueenPosition): string {
  return `${position.row}:${position.col}`;
}

export class PuzzleService {
  constructor(private readonly repository: PuzzleRepository = new PrismaPuzzleRepository()) {}

  async createPuzzle(params: {
    puzzleData: QueensPuzzleData;
    difficulty?: PuzzleDifficultyLevel | null;
  }) {
    return this.repository.create({
      puzzleType: DEFAULT_PUZZLE_TYPE,
      puzzleData: params.puzzleData,
      difficulty: params.difficulty ?? null,
    });
  }

  async getPuzzleByIndex(index: number): Promise<PuzzleWithPosition | null> {
    const total = await this.repository.countByType(DEFAULT_PUZZLE_TYPE);
    if (total === 0) {
      return null;
    }

    const clampedIndex = Math.max(1, Math.min(index, total));
    const record = await this.repository.findByIndex(clampedIndex, DEFAULT_PUZZLE_TYPE);
    if (!record) {
      return null;
    }

    return {
      id: record.id,
      index: clampedIndex,
      total,
      difficulty: record.difficulty,
      createdAt: record.createdAt.toISOString(),
      puzzle: stripSolution(record.puzzleData),
    };
  }

  async listPuzzleSummaries(limit = 1000): Promise<{
    total: number;
    items: PuzzleSummary[];
  }> {
    const rows = await this.repository.listByType({
      puzzleType: DEFAULT_PUZZLE_TYPE,
      limit,
    });

    return {
      total: rows.length,
      items: rows.map((row, idx) => ({
        id: row.id,
        index: idx + 1,
        difficulty: row.difficulty,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async validateSubmission(
    puzzleId: number,
    queens: QueenPosition[],
  ): Promise<SubmissionValidation> {
    const record = await this.repository.findById(puzzleId);
    if (!record) {
      return {
        found: false,
        valid: false,
        errors: ["Puzzle not found."],
      };
    }

    const structural = validateCompleteQueens(
      queens,
      record.puzzleData.regionGrid,
      record.puzzleData.size,
    );
    if (!structural.isValid) {
      return {
        found: true,
        valid: false,
        errors: structural.errors,
      };
    }

    const expected = new Set(record.puzzleData.solution.map(toKey));
    const submitted = new Set(queens.map(toKey));
    const solved =
      expected.size === submitted.size &&
      Array.from(submitted).every((value) => expected.has(value));

    return {
      found: true,
      valid: solved,
      errors: solved
        ? []
        : ["Placement is valid by constraints but does not match puzzle solution."],
    };
  }

  async getPuzzleSolutionById(id: number): Promise<Set<string> | null> {
    const record = await this.repository.findById(id);
    if (!record) {
      return null;
    }

    return new Set(record.puzzleData.solution.map(toKey));
  }
}
