import { NextResponse } from "next/server";
import { PuzzleService } from "@/server/services/puzzle-service";

const service = new PuzzleService();

export async function GET() {
  try {
    const data = await service.listPuzzleSummaries();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list puzzles", error);
    return NextResponse.json({ error: "Failed to list puzzles." }, { status: 500 });
  }
}
