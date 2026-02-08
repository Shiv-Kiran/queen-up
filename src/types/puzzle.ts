export type QueenPosition = {
  row: number;
  col: number;
};

export type RegionGrid = number[][];

export type PuzzleDifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export type PuzzleTypeName = "QUEENS_9X9";

export type QueensPuzzleData = {
  size: 9;
  regionGrid: RegionGrid;
  revealedQueens: QueenPosition[];
  solution: QueenPosition[];
  generatedAt: string;
};

export type QueensPuzzlePublicData = Omit<QueensPuzzleData, "solution">;

export type PuzzleRecord = {
  id: number;
  puzzleType: PuzzleTypeName;
  puzzleData: QueensPuzzleData;
  solutionHash: string;
  createdAt: Date;
  difficulty: PuzzleDifficultyLevel | null;
};
