import { NextRequest, NextResponse } from "next/server";
import {
  generateAndStoreQueensPuzzles,
  PuzzleGenerationJobError,
} from "@/server/jobs/generate-queens-puzzles-job";

export const runtime = "nodejs";

function utcDateSeed(date: Date): number {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return Number.parseInt(`${year}${month}${day}`, 10);
}

export async function POST(request: NextRequest) {
  const token = process.env.PUZZLE_ADMIN_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server is missing PUZZLE_ADMIN_TOKEN." },
      { status: 500 },
    );
  }

  const received = request.headers.get("x-admin-token");
  if (!received || received !== token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await generateAndStoreQueensPuzzles({
      count: 1,
      seedStart: utcDateSeed(new Date()),
      maxAttemptsPerPuzzle: 2500,
      maxOuterAttempts: 3000,
    });
    const puzzle = result.puzzles[0] ?? null;

    return NextResponse.json({
      created: result.created,
      puzzleId: puzzle?.id ?? null,
      stats: result.stats,
      puzzle,
    });
  } catch (error) {
    console.error("Failed to generate daily puzzle", error);
    if (error instanceof PuzzleGenerationJobError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
        },
        { status: 500 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to generate daily puzzle.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
