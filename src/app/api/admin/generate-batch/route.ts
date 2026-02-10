import { NextRequest, NextResponse } from "next/server";
import {
  generateAndStoreQueensPuzzles,
  PuzzleGenerationJobError,
} from "@/server/jobs/generate-queens-puzzles-job";

export const runtime = "nodejs";

type BatchRequest = {
  count?: number;
};

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

  let body: BatchRequest = {};
  try {
    body = (await request.json()) as BatchRequest;
  } catch {
    body = {};
  }

  const count = Number.isInteger(body.count) ? Number(body.count) : 30;
  if (count < 1 || count > 100) {
    return NextResponse.json(
      { error: "Count must be between 1 and 100." },
      { status: 400 },
    );
  }

  try {
    const result = await generateAndStoreQueensPuzzles({
      count,
      seedStart: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to generate puzzle batch", error);
    if (error instanceof PuzzleGenerationJobError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
        },
        { status: 500 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to generate puzzle batch.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
