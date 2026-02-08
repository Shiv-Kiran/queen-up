"use client";

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
  return (
    <aside
      className={[
        "rounded-xl border p-4 transition-all duration-200",
        collapsed ? "w-full lg:w-16" : "w-full lg:w-72",
      ].join(" ")}
      style={{
        backgroundColor: darkMode ? "#012A52" : "#FFFFFF",
        borderColor: darkMode ? "#1E4A77" : "#D6D3B5",
        color: darkMode ? "#F5F5F5" : "#0F172A",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className={collapsed ? "sr-only" : "text-sm font-semibold uppercase tracking-wide"}>
          Tools
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-md border px-3 py-2 text-sm font-semibold transition active:scale-95"
          style={{
            borderColor: darkMode ? "#1E4A77" : "#D6D3B5",
            color: darkMode ? "#F5F5F5" : "#0F172A",
          }}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand tools sidebar" : "Collapse tools sidebar"}
        >
          {collapsed ? "▸" : "◂"}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-3">
          <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: darkMode ? "#1E4A77" : "#D6D3B5" }}>
            Timer: {formatTime(timerSeconds)}
          </div>

          <button
            type="button"
            onClick={onUndo}
            className="rounded-md border px-3 py-2 text-sm font-semibold transition active:scale-95"
            style={{ borderColor: darkMode ? "#1E4A77" : "#D6D3B5" }}
          >
            Undo
          </button>

          <button
            type="button"
            onClick={onHint}
            disabled={busy}
            className="rounded-md border px-3 py-2 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ borderColor: darkMode ? "#1E4A77" : "#D6D3B5" }}
          >
            Hint
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-md border px-3 py-2 text-sm font-semibold transition active:scale-95"
            style={{ borderColor: darkMode ? "#1E4A77" : "#D6D3B5" }}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            type="button"
            onClick={onToggleColorBlind}
            className="rounded-md border px-3 py-2 text-sm font-semibold transition active:scale-95"
            style={{ borderColor: darkMode ? "#1E4A77" : "#D6D3B5" }}
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
