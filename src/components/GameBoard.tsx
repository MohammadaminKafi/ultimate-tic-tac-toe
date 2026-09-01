import { WINNING_LINES, isLegalMove } from "../engine/game";
import type { GameState } from "../engine/types";

interface GameBoardProps {
  state: GameState;
  onMove?: (board: number, cell: number) => void;
  readOnly?: boolean;
  thinking?: boolean;
  allowUnavailableAttempts?: boolean;
  onUnavailableMove?: (board: number, cell: number) => void;
}

export function GameBoard({ state, onMove, readOnly = false, thinking = false, allowUnavailableAttempts = false, onUnavailableMove }: GameBoardProps) {
  const lastMove = state.moves.at(-1);
  const globalLine = WINNING_LINES.find(([a, b, c]) => {
    const value = state.localResults[a];
    return (value === "X" || value === "O") && value === state.localResults[b] && value === state.localResults[c];
  });

  return (
    <div
      className={`ultimate-board ${thinking ? "is-thinking" : ""}`}
      role="grid"
      aria-label="Ultimate Tic-Tac-Toe board"
      data-testid="ultimate-board"
    >
      {state.boards.map((board, boardIndex) => {
        const result = state.localResults[boardIndex];
        const isRequired = state.requiredBoard === null || state.requiredBoard === boardIndex;
        const inGlobalLine = (globalLine as readonly number[] | undefined)?.includes(boardIndex) ?? false;
        return (
          <section
            key={boardIndex}
            className={`local-board ${isRequired && result === null ? "is-routed" : ""} ${result ? `is-${result}` : ""} ${inGlobalLine ? "is-global-line" : ""}`}
            aria-label={`Local board ${boardIndex + 1}${result ? `, ${result === "draw" ? "drawn" : `won by ${result}`}` : ""}`}
          >
            <div className="local-grid" role="rowgroup">
              {board.map((cell, cellIndex) => {
                const legal = !readOnly && !thinking && isLegalMove(state, boardIndex, cellIndex);
                const attemptable = allowUnavailableAttempts && !readOnly && !thinking && cell === null && result === null && state.result === null;
                const isLast = lastMove?.board === boardIndex && lastMove.cell === cellIndex;
                return (
                  <button
                    key={cellIndex}
                    type="button"
                    role="gridcell"
                    className={`game-cell ${cell ? `mark-${cell.toLowerCase()}` : ""} ${isLast ? "is-last" : ""}`}
                    disabled={!legal && !attemptable}
                    aria-label={`Board ${boardIndex + 1}, cell ${cellIndex + 1}${cell ? `, ${cell}` : legal ? ", playable" : ", unavailable"}`}
                    onClick={() => legal ? onMove?.(boardIndex, cellIndex) : attemptable && onUnavailableMove?.(boardIndex, cellIndex)}
                  >
                    {cell && <span className="mark-glyph" aria-hidden="true">{cell}</span>}
                  </button>
                );
              })}
            </div>
            {result && (
              <div className={`local-result result-${result}`} aria-hidden="true">
                {result === "draw" ? <span className="draw-glyph">•••</span> : result}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
