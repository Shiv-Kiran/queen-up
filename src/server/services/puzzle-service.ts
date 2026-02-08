import {
  DEFAULT_PUZZLE_TYPE,
  PrismaPuzzleRepository,
  type PuzzleRepository,
} from "@/server/repositories/puzzle-repository";
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

  async getPuzzleSolutionById(id: number): Promise<Set<string> | null> {
    const record = await this.repository.findById(id);
    if (!record) {
      return null;
    }

    return new Set(record.puzzleData.solution.map(toKey));
  }
}
