import { NextRequest, NextResponse } from "next/server";
import { PuzzleService } from "@/server/services/puzzle-service";
import type { QueenPosition } from "@/types/puzzle";

export const runtime = "nodejs";

const service = new PuzzleService();

type ValidateRequestBody = {
  queens?: QueenPosition[];
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const puzzleId = Number.parseInt(idParam, 10);
    if (Number.isNaN(puzzleId) || puzzleId < 1) {
      return NextResponse.json({ error: "Invalid puzzle id." }, { status: 400 });
    }

    const body = (await request.json()) as ValidateRequestBody;
    if (!Array.isArray(body.queens)) {
      return NextResponse.json({ error: "Body must include queens array." }, { status: 400 });
    }

    const parsedQueens = body.queens.filter(
      (queen): queen is QueenPosition =>
        Number.isInteger(queen?.row) && Number.isInteger(queen?.col),
    );
    if (parsedQueens.length !== body.queens.length) {
      return NextResponse.json({ error: "Invalid queen positions." }, { status: 400 });
    }

    const result = await service.validateSubmission(puzzleId, parsedQueens);
    if (!result.found) {
      return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    return NextResponse.json({
      valid: result.valid,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Failed to validate submission", error);
    return NextResponse.json(
      { error: "Failed to validate submission." },
      { status: 500 },
    );
  }
}
