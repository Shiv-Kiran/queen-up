import { NextRequest, NextResponse } from "next/server";
import { PuzzleService } from "@/server/services/puzzle-service";

export const runtime = "nodejs";

const service = new PuzzleService();

export async function GET(request: NextRequest) {
  try {
    const limitValue = Number.parseInt(
      request.nextUrl.searchParams.get("limit") ?? "3",
      10,
    );
    const limit = Number.isNaN(limitValue) ? 3 : limitValue;
    const data = await service.listGlobalLeaderboard(limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list leaderboard", error);
    return NextResponse.json({ error: "Failed to list leaderboard." }, { status: 500 });
  }
}
