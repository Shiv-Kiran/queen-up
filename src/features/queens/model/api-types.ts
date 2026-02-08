import type {
  PuzzleDifficultyLevel,
  QueenPosition,
  QueensPuzzlePublicData,
} from "@/types/puzzle";

export type PuzzleSummaryItem = {
  id: number;
  index: number;
  difficulty: PuzzleDifficultyLevel | null;
  createdAt: string;
};

export type PuzzleListResponse = {
  total: number;
  items: PuzzleSummaryItem[];
};

export type PuzzleByIndexResponse = {
  id: number;
  index: number;
  total: number;
  difficulty: PuzzleDifficultyLevel | null;
  createdAt: string;
  puzzle: QueensPuzzlePublicData;
};

export type ValidateResponse = {
  valid: boolean;
  errors: string[];
};

export type ValidateRequest = {
  queens: QueenPosition[];
};
