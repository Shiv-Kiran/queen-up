"use client";

import { useEffect, useMemo, useState } from "react";
import { validatePartialQueens } from "@/features/queens/engine/constraints";
import { solvePuzzle } from "@/features/queens/engine/solver";
import { QueensBoard } from "@/features/queens/components/queens-board";
import { QueensSidebar } from "@/features/queens/components/queens-sidebar";
import { THEME_COLORS, type AppPalette } from "@/features/queens/model/theme";
import type {
  PuzzleByIndexResponse,
  PuzzleListResponse,
  PuzzleSummaryItem,
  ValidateResponse,
} from "@/features/queens/model/api-types";
import type { PuzzleDifficultyLevel, QueenPosition, RegionGrid } from "@/types/puzzle";

type DifficultyFilter = PuzzleDifficultyLevel | "ALL";
type BoardSnapshot = {
  queens: QueenPosition[];
  manualXMarks: string[];
};

const DIFFICULTY_OPTIONS: DifficultyFilter[] = ["ALL", "EASY", "MEDIUM", "HARD"];
const DESKTOP_BREAKPOINT = 1024;

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
  const [manualXMarks, setManualXMarks] = useState<string[]>([]);
  const [, setHistory] = useState<BoardSnapshot[]>([]);
  const [selectedCell, setSelectedCell] = useState<QueenPosition>({ row: 0, col: 0 });
  const [status, setStatus] = useState<{ kind: "idle" | "error" | "success"; text: string }>({
    kind: "idle",
    text: "",
  });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [autoFillXMarks, setAutoFillXMarks] = useState(true);
  const [invalidMovePulse, setInvalidMovePulse] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });

  const isDesktop = viewport.width >= DESKTOP_BREAKPOINT;
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
        setQueens([]);
        setManualXMarks([]);
        setHistory([{ queens: [], manualXMarks: [] }]);
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

  useEffect(() => {
    if (isDesktop) {
      setMobilePanelOpen(false);
    }
  }, [isDesktop]);

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

  const revealedSet = useMemo(() => new Set<string>(), []);
  const queenSet = useMemo(() => new Set(queens.map(toKey)), [queens]);
  const manualXSet = useMemo(() => new Set(manualXMarks), [manualXMarks]);

  const autoXSet = useMemo(() => {
    if (!autoFillXMarks || !currentPuzzle) {
      return new Set<string>();
    }

    return computeAutoXMarks(currentPuzzle.puzzle.regionGrid, queens);
  }, [autoFillXMarks, currentPuzzle, queens]);

  const effectiveXSet = useMemo(() => {
    const combined = new Set<string>(manualXMarks);
    for (const key of autoXSet) {
      combined.add(key);
    }
    for (const key of queenSet) {
      combined.delete(key);
    }
    return combined;
  }, [autoXSet, manualXMarks, queenSet]);

  const filteredPosition = useMemo(() => {
    if (!currentPuzzle) {
      return { pos: 0, total: filteredSummaries.length };
    }
    const pos = filteredSummaries.findIndex((item) => item.index === currentPuzzle.index);
    return { pos: pos + 1, total: filteredSummaries.length };
  }, [currentPuzzle, filteredSummaries]);

  const boardSize = useMemo(() => {
    const outerWidth = Math.min(1380, viewport.width - (isDesktop ? 64 : 24));
    const centerAvailable = isDesktop ? outerWidth - 220 - 300 - 32 : outerWidth;
    const maxByViewport = isDesktop ? viewport.height - 320 : viewport.height - 380;
    return Math.max(280, Math.min(760, centerAvailable, maxByViewport));
  }, [isDesktop, viewport.height, viewport.width]);

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

  function commitBoard(next: BoardSnapshot) {
    setQueens(next.queens);
    setManualXMarks(next.manualXMarks);
    setHistory((previous) => [...previous, next]);
  }

  function applyPlaceQueen(
    cell: QueenPosition,
    baseQueens: QueenPosition[],
    baseXMarks: string[],
  ): BoardSnapshot {
    const key = toKey(cell);
    const nextQueens = [...baseQueens.filter((queen) => queen.row !== cell.row), cell].sort(
      (a, b) => a.row - b.row || a.col - b.col,
    );
    const nextManual = baseXMarks.filter((mark) => mark !== key);
    return {
      queens: nextQueens,
      manualXMarks: nextManual,
    };
  }

  function handleCycleCell(cell: QueenPosition) {
    if (!currentPuzzle) {
      return;
    }

    const key = toKey(cell);
    if (revealedSet.has(key)) {
      pulseInvalid();
      return;
    }

    setStatus({ kind: "idle", text: "" });

    if (queenSet.has(key)) {
      const next: BoardSnapshot = {
        queens: queens.filter((queen) => toKey(queen) !== key),
        manualXMarks: manualXMarks.filter((mark) => mark !== key),
      };
      commitBoard(next);
      return;
    }

    if (effectiveXSet.has(key)) {
      const next = applyPlaceQueen(cell, queens, manualXMarks);
      evaluatePartial(next.queens, currentPuzzle.puzzle.regionGrid);
      commitBoard(next);
      return;
    }

    if (manualXSet.has(key)) {
      const next: BoardSnapshot = {
        queens,
        manualXMarks: manualXMarks.filter((mark) => mark !== key),
      };
      commitBoard(next);
      return;
    }

    const next: BoardSnapshot = {
      queens,
      manualXMarks: [...manualXMarks, key],
    };
    commitBoard(next);
  }

  function evaluatePartial(queenPositions: QueenPosition[], regionGrid: RegionGrid) {
    const partial = validatePartialQueens(queenPositions, regionGrid);
    if (!partial.isValid) {
      pulseInvalid();
      setStatus({ kind: "error", text: partial.errors[0] ?? "Placement conflict detected." });
    }
  }

  function handleUndo() {
    setHistory((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const nextHistory = prev.slice(0, -1);
      const previousBoard = nextHistory[nextHistory.length - 1];
      setQueens(previousBoard.queens);
      setManualXMarks(previousBoard.manualXMarks);
      return nextHistory;
    });
    setStatus({ kind: "idle", text: "" });
  }

  function handleReset() {
    setQueens([]);
    setManualXMarks([]);
    setHistory([{ queens: [], manualXMarks: [] }]);
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

    const next = applyPlaceQueen(missing, queens, manualXMarks);
    commitBoard(next);
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
      handleCycleCell(selectedCell);
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
      className="min-h-[100dvh] px-3 py-4 sm:px-6 sm:py-6"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-4">
        <header
          className="mx-auto flex w-full max-w-[1220px] flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4"
          style={shellStyle}
        >
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[50px] leading-none tracking-tight max-sm:text-[44px]">
              Queens Puzzle
            </h1>
            <span className="font-ui text-lg max-sm:text-base" style={{ color: colors.textMuted }}>
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
            className="mx-auto w-full max-w-[1220px] rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: "#C2410C",
              backgroundColor: "rgba(194,65,12,0.20)",
            }}
          >
            {loadError}
          </div>
        )}

        <section className="mx-auto flex w-full max-w-[1380px] flex-col gap-4">
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            style={shellStyle}
          >
            <div className="flex flex-wrap items-center gap-2">
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

              <button
                type="button"
                onClick={() => goRelative(-1)}
                disabled={busy || filteredPosition.pos <= 1}
                className="font-ui rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                style={controlStyle}
              >
                Previous
              </button>

              <TimerBadge timerSeconds={timerSeconds} colors={colors} />

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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="font-ui rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95"
                style={controlStyle}
              >
                Share
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="font-ui rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95"
                style={controlStyle}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_auto_300px] lg:items-start">
            {isDesktop && <InstructionCard colors={colors} />}

            <div className="flex flex-col items-center gap-3">
              {currentPuzzle && (
                <QueensBoard
                  regionGrid={currentPuzzle.puzzle.regionGrid}
                  queens={queenSet}
                  xMarks={effectiveXSet}
                  revealed={revealedSet}
                  selectedCell={selectedCell}
                  boardSize={boardSize}
                  darkMode={darkMode}
                  colorBlindMode={colorBlindMode}
                  invalidMovePulse={invalidMovePulse}
                  onSelectCell={setSelectedCell}
                  onCycleCell={handleCycleCell}
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

              {!isDesktop && (
                <button
                  type="button"
                  onClick={() => setMobilePanelOpen((value) => !value)}
                  className="font-ui rounded-lg border px-4 py-2 text-base font-semibold transition active:scale-95"
                  style={controlStyle}
                  aria-expanded={mobilePanelOpen}
                  aria-controls="mobile-tools-sheet"
                >
                  {mobilePanelOpen ? "Close Tools & Instructions" : "Menu: Tools & Instructions"}
                </button>
              )}
            </div>

            {isDesktop && (
              <QueensSidebar
                collapsed={false}
                timerSeconds={timerSeconds}
                darkMode={darkMode}
                colorBlindMode={colorBlindMode}
                autoFillXMarks={autoFillXMarks}
                busy={busy}
                showTimer={false}
                showCollapseToggle={false}
                onToggleCollapse={() => undefined}
                onUndo={handleUndo}
                onHint={handleHint}
                onToggleTheme={() => setDarkMode((value) => !value)}
                onToggleColorBlind={() => setColorBlindMode((value) => !value)}
                onToggleAutoFillXMarks={() => setAutoFillXMarks((value) => !value)}
              />
            )}
          </div>
        </section>
      </div>

      {!isDesktop && mobilePanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55"
            onClick={() => setMobilePanelOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-tools-sheet"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[72vh] overflow-y-auto rounded-t-2xl border px-4 py-4"
            style={{
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              boxShadow: "0 -18px 30px rgba(0,0,0,0.45)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-ui text-lg font-semibold uppercase tracking-wide">
                Tools & Instructions
              </h3>
              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                className="font-ui rounded-lg border px-3 py-2 text-sm font-semibold transition active:scale-95"
                style={controlStyle}
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <InstructionCard colors={colors} />
              <QueensSidebar
                collapsed={false}
                timerSeconds={timerSeconds}
                darkMode={darkMode}
                colorBlindMode={colorBlindMode}
                autoFillXMarks={autoFillXMarks}
                busy={busy}
                showTimer={false}
                showCollapseToggle={false}
                onToggleCollapse={() => undefined}
                onUndo={handleUndo}
                onHint={handleHint}
                onToggleTheme={() => setDarkMode((value) => !value)}
                onToggleColorBlind={() => setColorBlindMode((value) => !value)}
                onToggleAutoFillXMarks={() => setAutoFillXMarks((value) => !value)}
              />
            </div>
          </div>
        </>
      )}
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

function TimerBadge({
  timerSeconds,
  colors,
}: {
  timerSeconds: number;
  colors: AppPalette;
}) {
  return (
    <div
      className="rounded-lg border px-3 py-2"
      style={{
        borderColor: colors.controlBorder,
        backgroundColor: colors.timerBg,
      }}
    >
      <div
        className="font-ui text-[10px] uppercase tracking-[0.18em]"
        style={{ color: colors.textMuted }}
      >
        Timer
      </div>
      <div
        className="font-display text-2xl leading-none tabular-nums"
        style={{ color: colors.timerText }}
      >
        {formatTime(timerSeconds)}
      </div>
    </div>
  );
}

function InstructionCard({ colors }: { colors: AppPalette }) {
  return (
    <aside
      className="rounded-2xl border p-4"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <h3 className="font-ui mb-3 text-lg font-semibold uppercase tracking-wide">Instructions</h3>
      <ul className="font-ui space-y-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
        <li>Single tap cycle: Empty -&gt; X -&gt; Queen -&gt; Empty.</li>
        <li>Place exactly 1 queen in each row.</li>
        <li>Place exactly 1 queen in each column.</li>
        <li>Place exactly 1 queen in each region.</li>
        <li>No queens touching, including diagonals.</li>
      </ul>
      <p className="font-ui mt-4 text-xs" style={{ color: colors.textMuted }}>
        Keyboard: Arrow keys to move, Enter/Space to cycle cell state.
      </p>
    </aside>
  );
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function computeAutoXMarks(regionGrid: RegionGrid, queens: QueenPosition[]): Set<string> {
  const occupiedRows = new Set<number>();
  const occupiedCols = new Set<number>();
  const occupiedRegions = new Set<number>();
  const queenKeys = new Set<string>();

  for (const queen of queens) {
    occupiedRows.add(queen.row);
    occupiedCols.add(queen.col);
    occupiedRegions.add(regionGrid[queen.row][queen.col]);
    queenKeys.add(toKey(queen));
  }

  const autoMarks = new Set<string>();
  for (let row = 0; row < regionGrid.length; row += 1) {
    for (let col = 0; col < regionGrid[row].length; col += 1) {
      const key = toKey({ row, col });
      if (queenKeys.has(key)) {
        continue;
      }

      const region = regionGrid[row][col];
      if (
        occupiedRows.has(row) ||
        occupiedCols.has(col) ||
        occupiedRegions.has(region)
      ) {
        autoMarks.add(key);
      }
    }
  }

  return autoMarks;
}
