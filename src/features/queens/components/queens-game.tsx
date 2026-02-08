"use client";

import { useEffect, useMemo, useState } from "react";
import { validatePartialQueens } from "@/features/queens/engine/constraints";
import { solvePuzzle } from "@/features/queens/engine/solver";
import { QueensBoard } from "@/features/queens/components/queens-board";
import { QueensSidebar } from "@/features/queens/components/queens-sidebar";
import {
  THEME_COLORS,
  type AppPalette,
} from "@/features/queens/model/theme";
import type {
  PuzzleByIndexResponse,
  PuzzleListResponse,
  PuzzleSummaryItem,
  ValidateResponse,
} from "@/features/queens/model/api-types";
import type { PuzzleDifficultyLevel, QueenPosition } from "@/types/puzzle";

type DifficultyFilter = PuzzleDifficultyLevel | "ALL";

const DIFFICULTY_OPTIONS: DifficultyFilter[] = ["ALL", "EASY", "MEDIUM", "HARD"];

function toKey(position: QueenPosition): string {
  return `${position.row}:${position.col}`;
}

export function QueensGame() {
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [summaries, setSummaries] = useState<PuzzleSummaryItem[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleByIndexResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("ALL");
  const [queens, setQueens] = useState<QueenPosition[]>([]);
  const [, setHistory] = useState<QueenPosition[][]>([]);
  const [selectedCell, setSelectedCell] = useState<QueenPosition>({ row: 0, col: 0 });
  const [status, setStatus] = useState<{ kind: "idle" | "error" | "success"; text: string }>({
    kind: "idle",
    text: "",
  });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [invalidMovePulse, setInvalidMovePulse] = useState(false);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });

  const colors = darkMode ? THEME_COLORS.dark : THEME_COLORS.light;
  const shellStyle = useMemo(() => shellPanelStyle(colors, darkMode), [colors, darkMode]);
  const controlStyle = useMemo(() => controlButtonStyle(colors), [colors]);
  const primaryStyle = useMemo(
    () => primaryButtonStyle(colors, darkMode),
    [colors, darkMode],
  );

  useEffect(() => {
    loadPuzzleSummaries().catch((error) => {
      console.error(error);
      setLoadError("Could not load puzzle list.");
    });
  }, []);

  useEffect(() => {
    if (summaries.length === 0) {
      return;
    }

    const fromQuery = readPuzzleIndexFromUrl();
    const initialIndex = fromQuery > 0 ? fromQuery : summaries[0].index;
    setCurrentIndex(initialIndex);
  }, [summaries]);

  useEffect(() => {
    if (currentIndex < 1) {
      return;
    }

    setBusy(true);
    fetch(`/api/puzzles/by-index/${currentIndex}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch puzzle.");
        }
        return (await response.json()) as PuzzleByIndexResponse;
      })
      .then((payload) => {
        setCurrentPuzzle(payload);
        const base = payload.puzzle.revealedQueens;
        setQueens(base);
        setHistory([base]);
        setStatus({ kind: "idle", text: "" });
        setTimerSeconds(0);
        setSelectedCell({ row: 0, col: 0 });
        writePuzzleIndexToUrl(payload.index);
      })
      .catch((error) => {
        console.error(error);
        setLoadError("Could not load puzzle.");
      })
      .finally(() => {
        setBusy(false);
      });
  }, [currentIndex]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTimerSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [currentPuzzle?.id]);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const filteredSummaries = useMemo(() => {
    if (difficulty === "ALL") {
      return summaries;
    }
    return summaries.filter((item) => item.difficulty === difficulty);
  }, [difficulty, summaries]);

  useEffect(() => {
    if (filteredSummaries.length === 0) {
      return;
    }

    const hasCurrent = filteredSummaries.some((item) => item.index === currentIndex);
    if (!hasCurrent) {
      setCurrentIndex(filteredSummaries[0].index);
    }
  }, [filteredSummaries, currentIndex]);

  const revealedSet = useMemo(() => {
    return new Set((currentPuzzle?.puzzle.revealedQueens ?? []).map(toKey));
  }, [currentPuzzle]);

  const queenSet = useMemo(() => new Set(queens.map(toKey)), [queens]);
  const filteredPosition = useMemo(() => {
    if (!currentPuzzle) {
      return { pos: 0, total: filteredSummaries.length };
    }
    const pos = filteredSummaries.findIndex((item) => item.index === currentPuzzle.index);
    return { pos: pos + 1, total: filteredSummaries.length };
  }, [currentPuzzle, filteredSummaries]);

  const boardSize = useMemo(() => {
    const sidebarWidth = viewport.width >= 1024 ? (sidebarCollapsed ? 88 : 352) : 0;
    const horizontalPadding = viewport.width >= 1280 ? 128 : viewport.width >= 768 ? 76 : 34;
    const layoutWidth = Math.min(1540, viewport.width - horizontalPadding);
    const byWidth = layoutWidth - sidebarWidth - (viewport.width >= 1024 ? 36 : 0);

    const messageSpace = status.text ? 56 : 0;
    const errorSpace = loadError ? 52 : 0;
    const reservedVertical = (viewport.width >= 1024 ? 248 : 318) + messageSpace + errorSpace;
    const byHeight = viewport.height - reservedVertical;

    return Math.max(280, Math.min(860, byWidth, byHeight));
  }, [
    loadError,
    sidebarCollapsed,
    status.text,
    viewport.height,
    viewport.width,
  ]);

  async function loadPuzzleSummaries() {
    const response = await fetch("/api/puzzles", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load puzzle summaries.");
    }
    const payload = (await response.json()) as PuzzleListResponse;
    setSummaries(payload.items);
    if (payload.total === 0) {
      setLoadError("No puzzles exist yet. Run initial generation.");
    }
  }

  function commitQueens(next: QueenPosition[]) {
    setQueens(next);
    setHistory((previous) => [...previous, next]);
  }

  function handleToggleQueen(cell: QueenPosition) {
    const key = toKey(cell);
    if (revealedSet.has(key)) {
      pulseInvalid();
      return;
    }

    setStatus({ kind: "idle", text: "" });
    const hasQueen = queenSet.has(key);
    const clueInRow = (currentPuzzle?.puzzle.revealedQueens ?? []).some(
      (queen) => queen.row === cell.row,
    );
    if (!hasQueen && clueInRow) {
      pulseInvalid();
      return;
    }

    let next = queens.filter(
      (queen) =>
        !(queen.row === cell.row && queen.col === cell.col) &&
        !(!revealedSet.has(toKey(queen)) && queen.row === cell.row),
    );

    if (!hasQueen) {
      next = [...next, cell];
    }

    const regionGrid = currentPuzzle?.puzzle.regionGrid;
    if (regionGrid) {
      const partial = validatePartialQueens(next, regionGrid);
      if (!partial.isValid) {
        pulseInvalid();
      }
    }

    commitQueens(next);
  }

  function handleUndo() {
    setHistory((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const nextHistory = prev.slice(0, -1);
      const previousBoard = nextHistory[nextHistory.length - 1];
      setQueens(previousBoard);
      return nextHistory;
    });
    setStatus({ kind: "idle", text: "" });
  }

  function handleReset() {
    if (!currentPuzzle) {
      return;
    }
    const base = currentPuzzle.puzzle.revealedQueens;
    setQueens(base);
    setHistory([base]);
    setStatus({ kind: "idle", text: "" });
  }

  function handleHint() {
    if (!currentPuzzle) {
      return;
    }
    const solved = solvePuzzle(currentPuzzle.puzzle.regionGrid, queens);
    if (!solved) {
      pulseInvalid();
      setStatus({ kind: "error", text: "Current placement has no valid completion." });
      return;
    }

    const missing = solved.find((queen) => !queenSet.has(toKey(queen)));
    if (!missing) {
      return;
    }
    handleToggleQueen(missing);
  }

  async function handleCheckSolution() {
    if (!currentPuzzle) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/puzzles/${currentPuzzle.id}/validate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ queens }),
      });

      const payload = (await response.json()) as ValidateResponse | { error: string };
      if (!response.ok || !("valid" in payload)) {
        setStatus({
          kind: "error",
          text: "error" in payload ? payload.error : "Failed to validate solution.",
        });
        pulseInvalid();
        return;
      }

      if (payload.valid) {
        setStatus({ kind: "success", text: "Solved. Excellent placement." });
      } else {
        setStatus({
          kind: "error",
          text: payload.errors[0] ?? "Not solved yet. Keep iterating.",
        });
        pulseInvalid();
      }
    } catch (error) {
      console.error(error);
      setStatus({ kind: "error", text: "Failed to validate solution." });
    } finally {
      setBusy(false);
    }
  }

  function handleKeyNav(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!currentPuzzle) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedCell((current) => ({ row: Math.max(0, current.row - 1), col: current.col }));
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedCell((current) => ({ row: Math.min(8, current.row + 1), col: current.col }));
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSelectedCell((current) => ({ row: current.row, col: Math.max(0, current.col - 1) }));
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSelectedCell((current) => ({ row: current.row, col: Math.min(8, current.col + 1) }));
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      handleToggleQueen(selectedCell);
    }
  }

  function goRelative(offset: -1 | 1) {
    if (!currentPuzzle || filteredSummaries.length === 0) {
      return;
    }
    const currentPos = filteredSummaries.findIndex(
      (item) => item.index === currentPuzzle.index,
    );
    if (currentPos === -1) {
      return;
    }
    const nextPos = currentPos + offset;
    if (nextPos < 0 || nextPos >= filteredSummaries.length) {
      return;
    }
    setCurrentIndex(filteredSummaries[nextPos].index);
  }

  function pulseInvalid() {
    setInvalidMovePulse(true);
    window.setTimeout(() => setInvalidMovePulse(false), 250);
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ kind: "success", text: "Puzzle link copied." });
    } catch {
      setStatus({ kind: "error", text: "Clipboard permission denied." });
    }
  }

  return (
    <div
      className="h-[100dvh] overflow-hidden px-4 py-4 sm:px-6 sm:py-5"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1540px] flex-col gap-4">
        <header
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4"
          style={shellStyle}
        >
          <div className="flex items-center gap-4">
            <h1 className="font-display text-3xl font-semibold leading-none tracking-tight sm:text-4xl">
              Queens Puzzle
            </h1>
            <span className="font-ui text-base sm:text-lg" style={{ color: colors.textMuted }}>
              {filteredPosition.pos > 0
                ? `Puzzle #${filteredPosition.pos} of ${filteredPosition.total}`
                : "Puzzle loading"}
            </span>
          </div>

          <div className="font-ui flex items-center gap-3">
            <label htmlFor="difficulty" className="text-base font-semibold">
              Level
            </label>
            <select
              id="difficulty"
              className="rounded-lg border px-3 py-2 text-base font-semibold"
              style={controlStyle}
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loadError && (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: "#C2410C",
              backgroundColor: "rgba(194,65,12,0.20)",
            }}
          >
            {loadError}
          </div>
        )}

        <main className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 lg:grid-cols-[auto_320px] lg:justify-center">
          <section className="flex min-h-0 flex-col items-center gap-4">
            <div
              className="flex w-full items-center justify-between gap-3"
              style={{ maxWidth: `${boardSize}px` }}
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goRelative(-1)}
                  disabled={busy || filteredPosition.pos <= 1}
                  className="font-ui rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  style={controlStyle}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => goRelative(1)}
                  disabled={
                    busy ||
                    filteredPosition.pos === 0 ||
                    filteredPosition.pos >= filteredPosition.total
                  }
                  className="font-ui rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  style={controlStyle}
                >
                  Next
                </button>
              </div>

              <button
                type="button"
                onClick={handleCheckSolution}
                disabled={busy || !currentPuzzle}
                className="font-ui rounded-lg border px-5 py-2 text-base font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                style={primaryStyle}
              >
                Check Solution
              </button>
            </div>

            {currentPuzzle && (
              <QueensBoard
                regionGrid={currentPuzzle.puzzle.regionGrid}
                queens={queenSet}
                revealed={revealedSet}
                selectedCell={selectedCell}
                boardSize={boardSize}
                darkMode={darkMode}
                colorBlindMode={colorBlindMode}
                invalidMovePulse={invalidMovePulse}
                onSelectCell={setSelectedCell}
                onToggleQueen={handleToggleQueen}
                onKeyNav={handleKeyNav}
              />
            )}

            {status.text && (
              <div
                className="w-full rounded-lg border px-4 py-3 text-sm"
                style={{
                  maxWidth: `${boardSize}px`,
                  borderColor: status.kind === "success" ? "#2F9E44" : "#C2410C",
                  backgroundColor:
                    status.kind === "success"
                      ? "rgba(47,158,68,0.18)"
                      : "rgba(194,65,12,0.20)",
                }}
              >
                {status.text}
              </div>
            )}
          </section>

          <QueensSidebar
            collapsed={sidebarCollapsed}
            timerSeconds={timerSeconds}
            darkMode={darkMode}
            colorBlindMode={colorBlindMode}
            busy={busy}
            onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
            onUndo={handleUndo}
            onHint={handleHint}
            onToggleTheme={() => setDarkMode((value) => !value)}
            onToggleColorBlind={() => setColorBlindMode((value) => !value)}
          />
        </main>

        <footer
          className="font-ui flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm"
          style={shellStyle}
        >
          <span style={{ color: colors.textMuted }}>
            Use arrows + Enter/Space for keyboard play.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95"
              style={controlStyle}
            >
              Share
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95"
              style={controlStyle}
            >
              Reset
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function readPuzzleIndexFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  const value = Number.parseInt(params.get("puzzle") ?? "", 10);
  if (Number.isNaN(value) || value < 1) {
    return -1;
  }
  return value;
}

function writePuzzleIndexToUrl(index: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("puzzle", String(index));
  window.history.replaceState({}, "", url);
}

function shellPanelStyle(colors: AppPalette, darkMode: boolean) {
  return {
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    boxShadow: darkMode
      ? "0 18px 30px rgba(0,0,0,0.36)"
      : "0 14px 24px rgba(42,28,22,0.12)",
  };
}

function controlButtonStyle(colors: AppPalette) {
  return {
    borderColor: colors.controlBorder,
    backgroundColor: colors.controlBg,
    color: colors.controlText,
    boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.16)",
  };
}

function primaryButtonStyle(colors: AppPalette, darkMode: boolean) {
  return {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    color: darkMode ? "#241813" : "#FFF8ED",
    boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.16)",
  };
}
