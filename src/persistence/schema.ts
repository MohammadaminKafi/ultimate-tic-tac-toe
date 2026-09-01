import { z } from "zod";
import { MAX_SEARCH_DEPTH, MIN_SEARCH_DEPTH } from "../engine/depth";

export const playerSchema = z.enum(["X", "O"]);
export const gameModeSchema = z.enum(["human-ai", "local", "ai-ai"]);
export const moveSchema = z.object({
  board: z.number().int().min(0).max(8),
  cell: z.number().int().min(0).max(8),
  player: playerSchema,
});

export const telemetrySchema = z.object({
  turn: z.number().int().positive(),
  player: playerSchema,
  move: moveSchema,
  score: z.number().finite(),
  elapsedMs: z.number().finite().nonnegative(),
  depth: z.number().int().min(MIN_SEARCH_DEPTH).max(MAX_SEARCH_DEPTH),
  nodesVisited: z.number().int().nonnegative(),
  prunes: z.number().int().nonnegative(),
});

export const gameConfigurationSchema = z.object({
  mode: gameModeSchema,
  players: z.object({ X: z.enum(["human", "ai"]), O: z.enum(["human", "ai"]) }),
  depths: z.object({
    X: z.number().int().min(MIN_SEARCH_DEPTH).max(MAX_SEARCH_DEPTH).optional(),
    O: z.number().int().min(MIN_SEARCH_DEPTH).max(MAX_SEARCH_DEPTH).optional(),
  }),
  speedMs: z.number().int().min(100).max(3000),
});

export const gameRecordSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  label: z.string().min(1).max(120).optional(),
  mode: gameModeSchema,
  players: gameConfigurationSchema.shape.players,
  depths: gameConfigurationSchema.shape.depths,
  outcome: z.enum(["X", "O", "draw"]),
  moves: z.array(moveSchema).min(1).max(81),
  telemetry: z.array(telemetrySchema),
});

export const activeGameSchema = z.object({
  version: z.literal(1),
  configuration: gameConfigurationSchema,
  moves: z.array(moveSchema).max(81),
  telemetry: z.array(telemetrySchema),
});

export type GameRecordV1 = z.infer<typeof gameRecordSchema>;
export type ActiveGameV1 = z.infer<typeof activeGameSchema>;
export type MoveTelemetry = z.infer<typeof telemetrySchema>;
