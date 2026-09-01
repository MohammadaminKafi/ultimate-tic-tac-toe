import { Button, Card } from "@heroui/react";
import { Activity, Clock3, GitBranch, ScanSearch } from "lucide-react";

import { MAX_SEARCH_DEPTH, MIN_SEARCH_DEPTH } from "../engine/depth";
import type { GameState } from "../engine/types";
import type { MoveTelemetry } from "../persistence/schema";
import { AppSlider } from "./AppSlider";

interface PausedAiControl {
  player: "X" | "O";
  depth: number;
  cancelled: boolean;
  onDepthChange: (depth: number) => void;
  onResume: () => void;
}

export function GameInspector({ game, telemetry, thinking, pausedAi }: { game: GameState; telemetry: readonly MoveTelemetry[]; thinking: boolean; pausedAi?: PausedAiControl }) {
  const last = telemetry.at(-1);
  const destination = game.requiredBoard === null ? "Any open board" : `Local board ${game.requiredBoard + 1}`;
  return (
    <Card className="inspector-card" variant="default">
      <Card.Header><div className="eyebrow">Live analysis</div><Card.Title>{thinking ? "Searching…" : "Position telemetry"}</Card.Title></Card.Header>
      <Card.Content className="metric-list">
        <Metric icon={<ScanSearch />} label="Evaluation" value={last ? formatScore(last.score) : "—"} />
        <Metric icon={<GitBranch />} label="Search depth" value={last ? String(last.depth) : "—"} />
        <Metric icon={<Activity />} label="Nodes / prunes" value={last ? `${last.nodesVisited.toLocaleString()} / ${last.prunes.toLocaleString()}` : "—"} />
        <Metric icon={<Clock3 />} label="Search time" value={last ? `${last.elapsedMs.toFixed(1)} ms` : "—"} />
        <div className="route-readout"><span>Next destination</span><strong>{destination}</strong></div>
        {pausedAi && (
          <div className={`paused-ai-control player-${pausedAi.player.toLowerCase()}`}>
            <div><span>{pausedAi.cancelled ? "Search cancelled" : "Search paused"}</span><strong>{pausedAi.player} can resume from this position.</strong></div>
            <AppSlider
              label={`${pausedAi.player} live search depth`}
              value={pausedAi.depth}
              min={MIN_SEARCH_DEPTH}
              max={MAX_SEARCH_DEPTH}
              output={`Exact depth ${pausedAi.depth}`}
              tone={pausedAi.player.toLowerCase() as "x" | "o"}
              onChange={pausedAi.onDepthChange}
            />
            <Button variant="primary" size="sm" onPress={pausedAi.onResume}>Retry search</Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="metric"><span className="metric-icon">{icon}</span><span>{label}</span><strong>{value}</strong></div>;
}

function formatScore(score: number): string {
  if (score >= 1_000_000) return "+∞ · X win";
  if (score <= -1_000_000) return "−∞ · O win";
  return `${score > 0 ? "+" : ""}${score.toFixed(2)}`;
}
