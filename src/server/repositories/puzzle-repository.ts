import {
  type LeaderboardScore as PrismaLeaderboardScore,
  type Puzzle as PrismaPuzzle,
} from "@prisma/client";
import { getPrismaClient } from "@/server/db/client";
import type {
  PuzzleDifficultyLevel,
  PuzzleRecord,
  PuzzleTypeName,
  QueensPuzzleData,
} from "@/types/puzzle";

export const DEFAULT_PUZZLE_TYPE: PuzzleTypeName = "QUEENS_9X9";

export type CreatePuzzleInput = {
  puzzleType?: PuzzleTypeName;
  puzzleData: QueensPuzzleData;
  solutionHash: string;
  difficulty?: PuzzleDifficultyLevel | null;
};

export type LeaderboardScoreRecord = {
  id: number;
  puzzleId: number;
  seconds: number;
  createdAt: Date;
};

export type PuzzleRepository = {
  create(input: CreatePuzzleInput): Promise<PuzzleRecord>;
  countByType(puzzleType?: PuzzleTypeName): Promise<number>;
  existsBySolutionHash(solutionHash: string): Promise<boolean>;
  findById(id: number): Promise<PuzzleRecord | null>;
  findIndexById(id: number, puzzleType?: PuzzleTypeName): Promise<number | null>;
  findByIndex(index: number, puzzleType?: PuzzleTypeName): Promise<PuzzleRecord | null>;
  listByType(params?: { puzzleType?: PuzzleTypeName; limit?: number }): Promise<PuzzleRecord[]>;
  createLeaderboardScore(input: {
    puzzleId: number;
    seconds: number;
  }): Promise<LeaderboardScoreRecord>;
  listTopLeaderboardScores(limit?: number): Promise<LeaderboardScoreRecord[]>;
  listTopLeaderboardScoresByPuzzleId(
    puzzleId: number,
    limit?: number,
  ): Promise<LeaderboardScoreRecord[]>;
};

function toPuzzleRecord(model: PrismaPuzzle): PuzzleRecord {
  return {
    id: model.id,
    puzzleType: model.puzzleType as PuzzleTypeName,
    puzzleData: JSON.parse(model.puzzleData) as QueensPuzzleData,
    solutionHash: model.solutionHash,
    createdAt: model.createdAt,
    difficulty: model.difficulty as PuzzleDifficultyLevel | null,
  };
}

function toLeaderboardScoreRecord(model: PrismaLeaderboardScore): LeaderboardScoreRecord {
  return {
    id: model.id,
    puzzleId: model.puzzleId,
    seconds: model.seconds,
    createdAt: model.createdAt,
  };
}

export class PrismaPuzzleRepository implements PuzzleRepository {
  async create(input: CreatePuzzleInput): Promise<PuzzleRecord> {
    const prisma = getPrismaClient();
    const created = await prisma.puzzle.create({
      data: {
        puzzleType: input.puzzleType ?? DEFAULT_PUZZLE_TYPE,
        puzzleData: JSON.stringify(input.puzzleData),
        solutionHash: input.solutionHash,
        difficulty: input.difficulty ?? null,
      },
    });

    return toPuzzleRecord(created);
  }

  async countByType(puzzleType = DEFAULT_PUZZLE_TYPE): Promise<number> {
    const prisma = getPrismaClient();
    return prisma.puzzle.count({
      where: {
        puzzleType,
      },
    });
  }

  async existsBySolutionHash(solutionHash: string): Promise<boolean> {
    const prisma = getPrismaClient();
    const count = await prisma.puzzle.count({
      where: { solutionHash },
    });

    return count > 0;
  }

  async findById(id: number): Promise<PuzzleRecord | null> {
    const prisma = getPrismaClient();
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
    });

    return puzzle ? toPuzzleRecord(puzzle) : null;
  }

  async findIndexById(
    id: number,
    puzzleType = DEFAULT_PUZZLE_TYPE,
  ): Promise<number | null> {
    const prisma = getPrismaClient();
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
      select: { id: true, puzzleType: true },
    });
    if (!puzzle || puzzle.puzzleType !== puzzleType) {
      return null;
    }

    const count = await prisma.puzzle.count({
      where: {
        puzzleType,
        id: { lte: id },
      },
    });

    return count > 0 ? count : null;
  }

  async findByIndex(
    index: number,
    puzzleType = DEFAULT_PUZZLE_TYPE,
  ): Promise<PuzzleRecord | null> {
    const prisma = getPrismaClient();
    if (index < 1) {
      return null;
    }

    const [puzzle] = await prisma.puzzle.findMany({
      where: { puzzleType },
      orderBy: { id: "asc" },
      skip: index - 1,
      take: 1,
    });

    return puzzle ? toPuzzleRecord(puzzle) : null;
  }

  async listByType({
    puzzleType = DEFAULT_PUZZLE_TYPE,
    limit = 100,
  }: {
    puzzleType?: PuzzleTypeName;
    limit?: number;
  } = {}): Promise<PuzzleRecord[]> {
    const prisma = getPrismaClient();
    const rows = await prisma.puzzle.findMany({
      where: { puzzleType },
      orderBy: { id: "asc" },
      take: limit,
    });

    return rows.map(toPuzzleRecord);
  }

  async createLeaderboardScore(input: {
    puzzleId: number;
    seconds: number;
  }): Promise<LeaderboardScoreRecord> {
    const prisma = getPrismaClient();
    const created = await prisma.leaderboardScore.create({
      data: {
        puzzleId: input.puzzleId,
        seconds: input.seconds,
      },
    });

    return toLeaderboardScoreRecord(created);
  }

  async listTopLeaderboardScores(limit = 3): Promise<LeaderboardScoreRecord[]> {
    const prisma = getPrismaClient();
    const rows = await prisma.leaderboardScore.findMany({
      orderBy: [{ seconds: "asc" }, { createdAt: "asc" }],
      take: limit,
    });

    return rows.map(toLeaderboardScoreRecord);
  }

  async listTopLeaderboardScoresByPuzzleId(
    puzzleId: number,
    limit = 3,
  ): Promise<LeaderboardScoreRecord[]> {
    const prisma = getPrismaClient();
    const rows = await prisma.leaderboardScore.findMany({
      where: { puzzleId },
      orderBy: [{ seconds: "asc" }, { createdAt: "asc" }],
      take: limit,
    });

    return rows.map(toLeaderboardScoreRecord);
  }
}
