import { NextRequest, NextResponse } from "next/server";
import { PuzzleService } from "@/server/services/puzzle-service";

const service = new PuzzleService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ index: string }> },
) {
  try {
    const { index: indexParam } = await params;
    const index = Number.parseInt(indexParam, 10);
    if (Number.isNaN(index) || index < 1) {
      return NextResponse.json({ error: "Invalid puzzle index." }, { status: 400 });
    }

    const puzzle = await service.getPuzzleByIndex(index);
    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error("Failed to fetch puzzle", error);
    return NextResponse.json({ error: "Failed to fetch puzzle." }, { status: 500 });
  }
}
