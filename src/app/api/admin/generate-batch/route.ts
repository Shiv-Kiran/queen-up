import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreQueensPuzzles } from "@/server/jobs/generate-queens-puzzles-job";

type BatchRequest = {
  count?: number;
  minClues?: number;
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
  const minClues = Number.isInteger(body.minClues) ? Number(body.minClues) : 3;
  if (count < 1 || count > 100) {
    return NextResponse.json(
      { error: "Count must be between 1 and 100." },
      { status: 400 },
    );
  }

  try {
    const result = await generateAndStoreQueensPuzzles({
      count,
      minClues,
      seedStart: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to generate puzzle batch", error);
    return NextResponse.json(
      { error: "Failed to generate puzzle batch." },
      { status: 500 },
    );
  }
}
