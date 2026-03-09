"use client";

import { useEffect, useRef } from "react";
import { REGION_COLORS, THEME_COLORS } from "@/features/queens/model/theme";
import type { QueenPosition, RegionGrid } from "@/types/puzzle";

type QueensBoardProps = {
  regionGrid: RegionGrid;
  queens: Set<string>;
  xMarks: Set<string>;
  revealed: Set<string>;
  selectedCell: QueenPosition;
  boardSize: number;
  darkMode: boolean;
  colorBlindMode: boolean;
  invalidMovePulse: boolean;
  onSelectCell: (cell: QueenPosition) => void;
  onCycleCell: (cell: QueenPosition) => void;
  onLongPressCell: (cell: QueenPosition) => void;
  onLineMarkStart: () => void;
  onLineMarkUpdate: (cells: QueenPosition[]) => void;
  onLineMarkEnd: () => void;
  onKeyNav: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

type TouchGesture = {
  pointerId: number;
  startCell: QueenPosition;
  axis: "row" | "col" | null;
  dragStarted: boolean;
  longPressTriggered: boolean;
  allowLineMark: boolean;
};

const LONG_PRESS_MS = 360;

function toKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function QueensBoard({
  regionGrid,
  queens,
  xMarks,
  revealed,
  selectedCell,
  boardSize,
  darkMode,
  colorBlindMode,
  invalidMovePulse,
  onSelectCell,
  onCycleCell,
  onLongPressCell,
  onLineMarkStart,
  onLineMarkUpdate,
  onLineMarkEnd,
  onKeyNav,
}: QueensBoardProps) {
  const colors = darkMode ? THEME_COLORS.dark : THEME_COLORS.light;
  const gestureRef = useRef<TouchGesture | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    return () => {
      clearLongPressTimer(longPressTimeoutRef);
    };
  }, []);

  function readCellFromElement(target: EventTarget | null): QueenPosition | null {
    if (!(target instanceof Element)) {
      return null;
    }

    const cell = target.closest<HTMLElement>("[data-row][data-col]");
    if (!cell) {
      return null;
    }

    const row = Number.parseInt(cell.dataset.row ?? "", 10);
    const col = Number.parseInt(cell.dataset.col ?? "", 10);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return null;
    }

    return { row, col };
  }

  function readCellAtPoint(clientX: number, clientY: number): QueenPosition | null {
    return readCellFromElement(document.elementFromPoint(clientX, clientY));
  }

  function buildLineCells(
    startCell: QueenPosition,
    currentCell: QueenPosition,
    axis: "row" | "col",
  ): QueenPosition[] {
    if (axis === "row") {
      const from = Math.min(startCell.col, currentCell.col);
      const to = Math.max(startCell.col, currentCell.col);
      return Array.from({ length: to - from + 1 }, (_, offset) => ({
        row: startCell.row,
        col: from + offset,
      }));
    }

    const from = Math.min(startCell.row, currentCell.row);
    const to = Math.max(startCell.row, currentCell.row);
    return Array.from({ length: to - from + 1 }, (_, offset) => ({
      row: from + offset,
      col: startCell.col,
    }));
  }

  function handleTouchPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") {
      return;
    }

    const cell = readCellFromElement(event.target);
    if (!cell) {
      return;
    }

    const key = toKey(cell.row, cell.col);
    gestureRef.current = {
      pointerId: event.pointerId,
      startCell: cell,
      axis: null,
      dragStarted: false,
      longPressTriggered: false,
      allowLineMark: !revealed.has(key) && !queens.has(key),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    clearLongPressTimer(longPressTimeoutRef);

    if (!revealed.has(key)) {
      longPressTimeoutRef.current = window.setTimeout(() => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId || gesture.dragStarted) {
          return;
        }

        gesture.longPressTriggered = true;
        suppressClickRef.current = true;
        onSelectCell(cell);
        onLongPressCell(cell);
      }, LONG_PRESS_MS);
    }
  }

  function handleTouchPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerType !== "touch" || gesture.pointerId !== event.pointerId) {
      return;
    }

    if (gesture.longPressTriggered) {
      return;
    }

    const cell = readCellAtPoint(event.clientX, event.clientY);
    if (!cell) {
      return;
    }

    const rowDistance = Math.abs(cell.row - gesture.startCell.row);
    const colDistance = Math.abs(cell.col - gesture.startCell.col);
    if (rowDistance === 0 && colDistance === 0) {
      return;
    }

    clearLongPressTimer(longPressTimeoutRef);
    if (!gesture.allowLineMark) {
      return;
    }

    if (!gesture.dragStarted) {
      gesture.dragStarted = true;
      suppressClickRef.current = true;
      onLineMarkStart();
    }

    if (!gesture.axis) {
      gesture.axis = colDistance >= rowDistance ? "row" : "col";
    }

    onLineMarkUpdate(buildLineCells(gesture.startCell, cell, gesture.axis));
  }

  function finishTouchGesture(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerType !== "touch" || gesture.pointerId !== event.pointerId) {
      return;
    }

    clearLongPressTimer(longPressTimeoutRef);
    if (gesture.dragStarted) {
      onLineMarkEnd();
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    gestureRef.current = null;
  }

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
        touchAction: "none",
      }}
      role="application"
      aria-label="Queens puzzle board"
      tabIndex={0}
      onKeyDown={onKeyNav}
      onPointerDown={handleTouchPointerDown}
      onPointerMove={handleTouchPointerMove}
      onPointerUp={finishTouchGesture}
      onPointerCancel={finishTouchGesture}
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
            const hasX = !hasQueen && xMarks.has(key);
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
                  hasQueen || hasX ? "scale-100" : "scale-95",
                  selected ? "outline outline-2 outline-offset-0" : "",
                  fixed ? "cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
                style={{
                  backgroundColor: REGION_COLORS[regionId] ?? "#315C9A",
                  color: hasX ? "rgba(255,255,255,0.9)" : colors.text,
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
                }${hasQueen ? ", queen placed" : hasX ? ", x mark placed" : ""}${
                  fixed ? ", fixed clue" : ""
                }`}
                aria-pressed={hasQueen}
                data-row={rowIndex}
                data-col={colIndex}
                disabled={false}
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  onSelectCell({ row: rowIndex, col: colIndex });
                  onCycleCell({ row: rowIndex, col: colIndex });
                }}
              >
                <span
                  className={
                    hasQueen || hasX ? "animate-[queen-pop_160ms_ease-out]" : ""
                  }
                  aria-hidden="true"
                >
                  {hasQueen ? "\u265B" : hasX ? "\u2715" : ""}
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

function clearLongPressTimer(timerRef: React.MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}
