export type Player = "X" | "O";
export type Cell = Player | null;
export type LocalResult = Player | "draw" | null;
export type GameResult = Player | "draw" | null;
export type GameMode = "human-ai" | "local" | "ai-ai";

export interface Move {
  board: number;
  cell: number;
  player: Player;
}

export interface GameState {
  boards: Cell[][];
  localResults: LocalResult[];
  requiredBoard: number | null;
  currentPlayer: Player;
  result: GameResult;
  moves: Move[];
}

export interface SearchTelemetry {
  move: Move;
  score: number;
  elapsedMs: number;
  depth: number;
  nodesVisited: number;
  prunes: number;
}

export interface PlayerConfiguration {
  X: "human" | "ai";
  O: "human" | "ai";
}

export interface GameConfiguration {
  mode: GameMode;
  players: PlayerConfiguration;
  depths: Partial<Record<Player, number>>;
  speedMs: number;
}
