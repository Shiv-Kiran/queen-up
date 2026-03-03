import { NextRequest, NextResponse } from "next/server";
import { PuzzleService } from "@/server/services/puzzle-service";

export const runtime = "nodejs";

const service = new PuzzleService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const puzzleId = Number.parseInt(idParam, 10);
    if (Number.isNaN(puzzleId) || puzzleId < 1) {
      return NextResponse.json({ error: "Invalid puzzle id." }, { status: 400 });
    }

    const data = await service.listPuzzleLeaderboard(puzzleId, 3);
    if (!data) {
      return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list puzzle leaderboard", error);
    return NextResponse.json(
      { error: "Failed to list puzzle leaderboard." },
      { status: 500 },
    );
  }
}
