"use client";

import { REGION_COLORS, THEME_COLORS } from "@/features/queens/model/theme";
import type { QueenPosition, RegionGrid } from "@/types/puzzle";

type QueensBoardProps = {
  regionGrid: RegionGrid;
  queens: Set<string>;
  revealed: Set<string>;
  selectedCell: QueenPosition;
  boardSize: number;
  darkMode: boolean;
  colorBlindMode: boolean;
  invalidMovePulse: boolean;
  onSelectCell: (cell: QueenPosition) => void;
  onToggleQueen: (cell: QueenPosition) => void;
  onKeyNav: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

function toKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function QueensBoard({
  regionGrid,
  queens,
  revealed,
  selectedCell,
  boardSize,
  darkMode,
  colorBlindMode,
  invalidMovePulse,
  onSelectCell,
  onToggleQueen,
  onKeyNav,
}: QueensBoardProps) {
  const colors = darkMode ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <div
      className={[
        "relative rounded-2xl border p-3",
        invalidMovePulse ? "animate-[board-shake_250ms_ease-in-out]" : "",
      ].join(" ")}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.surface,
        boxShadow: darkMode
          ? "0 18px 30px rgba(0,0,0,0.35)"
          : "0 14px 24px rgba(42,28,22,0.12)",
        touchAction: "pinch-zoom",
      }}
      role="application"
      aria-label="Queens puzzle board"
      tabIndex={0}
      onKeyDown={onKeyNav}
    >
      <div
        className="grid aspect-square max-w-full grid-cols-9 gap-1"
        style={{
          width: `${boardSize}px`,
        }}
        aria-live="polite"
      >
        {regionGrid.map((row, rowIndex) =>
          row.map((regionId, colIndex) => {
            const key = toKey(rowIndex, colIndex);
            const hasQueen = queens.has(key);
            const fixed = revealed.has(key);
            const selected =
              selectedCell.row === rowIndex && selectedCell.col === colIndex;

            return (
              <button
                key={key}
                type="button"
                className={[
                  "relative flex h-full min-h-[36px] items-center justify-center rounded-[8px] border border-transparent text-2xl font-black transition duration-150 ease-out",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  hasQueen ? "scale-100" : "scale-95",
                  selected ? "outline outline-2 outline-offset-0" : "",
                  fixed ? "cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
                style={{
                  backgroundColor: REGION_COLORS[regionId] ?? "#315C9A",
                  color: colors.text,
                  opacity: fixed ? 1 : 0.95,
                  boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.22)",
                  outlineColor: colors.accent,
                  borderColor: selected ? colors.accent : "transparent",
                  backgroundImage:
                    colorBlindMode && !fixed
                      ? patternForRegion(regionId)
                      : "none",
                }}
                aria-label={`Row ${rowIndex + 1} column ${colIndex + 1}, region ${
                  regionId + 1
                }${hasQueen ? ", queen placed" : ""}${fixed ? ", fixed clue" : ""}`}
                aria-pressed={hasQueen}
                disabled={false}
                onClick={() => {
                  onSelectCell({ row: rowIndex, col: colIndex });
                  onToggleQueen({ row: rowIndex, col: colIndex });
                }}
              >
                <span
                  className={hasQueen ? "animate-[queen-pop_160ms_ease-out]" : ""}
                  aria-hidden="true"
                >
                  {hasQueen ? "♛" : ""}
                </span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

function patternForRegion(regionId: number): string {
  const patterns = [
    "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(135deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(60deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(120deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(30deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(75deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
    "repeating-linear-gradient(15deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)",
  ];

  return patterns[regionId % patterns.length];
}
