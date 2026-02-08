import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreQueensPuzzles } from "@/server/jobs/generate-queens-puzzles-job";

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
      minClues: 3,
    });

    return NextResponse.json({
      created: result.created,
      puzzleId: result.puzzleIds[0] ?? null,
    });
  } catch (error) {
    console.error("Failed to generate daily puzzle", error);
    return NextResponse.json(
      { error: "Failed to generate daily puzzle." },
      { status: 500 },
    );
  }
}
