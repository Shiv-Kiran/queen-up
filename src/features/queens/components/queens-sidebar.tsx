"use client";

import { THEME_COLORS, type AppPalette } from "@/features/queens/model/theme";

type QueensSidebarProps = {
  collapsed: boolean;
  timerSeconds: number;
  darkMode: boolean;
  colorBlindMode: boolean;
  busy: boolean;
  onToggleCollapse: () => void;
  onUndo: () => void;
  onHint: () => void;
  onToggleTheme: () => void;
  onToggleColorBlind: () => void;
};

export function QueensSidebar({
  collapsed,
  timerSeconds,
  darkMode,
  colorBlindMode,
  busy,
  onToggleCollapse,
  onUndo,
  onHint,
  onToggleTheme,
  onToggleColorBlind,
}: QueensSidebarProps) {
  const colors = darkMode ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <aside
      className={[
        "rounded-2xl border p-4 transition-all duration-200",
        collapsed ? "w-full lg:w-18" : "w-full lg:w-80",
      ].join(" ")}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.text,
        boxShadow: darkMode
          ? "0 18px 30px rgba(0,0,0,0.36)"
          : "0 14px 24px rgba(42,28,22,0.12)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className={collapsed ? "sr-only" : "font-ui text-lg font-semibold uppercase tracking-wide"}>
          Tools
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-md border px-3 py-2 text-sm font-semibold transition active:scale-95"
          style={buttonStyle(colors)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand tools sidebar" : "Collapse tools sidebar"}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: colors.controlBorder,
              backgroundColor: colors.timerBg,
            }}
          >
            <div
              className="font-ui text-[11px] uppercase tracking-[0.18em]"
              style={{ color: colors.textMuted }}
            >
              Timer
            </div>
            <div
              className="font-display mt-1 text-3xl font-semibold leading-none tabular-nums"
              style={{ color: colors.timerText }}
            >
              {formatTime(timerSeconds)}
            </div>
          </div>

          <button
            type="button"
            onClick={onUndo}
            className="rounded-lg border px-4 py-3 text-base font-semibold transition active:scale-95"
            style={buttonStyle(colors)}
          >
            Undo
          </button>

          <button
            type="button"
            onClick={onHint}
            disabled={busy}
            className="rounded-lg border px-4 py-3 text-base font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            style={buttonStyle(colors)}
          >
            Hint
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border px-4 py-3 text-base font-semibold transition active:scale-95"
            style={buttonStyle(colors)}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            type="button"
            onClick={onToggleColorBlind}
            className="rounded-lg border px-4 py-3 text-base font-semibold transition active:scale-95"
            style={buttonStyle(colors)}
          >
            {colorBlindMode ? "Color Mode" : "Color-Blind Mode"}
          </button>
        </div>
      )}
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

function buttonStyle(colors: AppPalette) {
  return {
    borderColor: colors.controlBorder,
    backgroundColor: colors.controlBg,
    color: colors.controlText,
    boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.16)",
  };
}
