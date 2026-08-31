import { Card } from "@heroui/react";
import { Activity, Clock3, GitBranch, ScanSearch } from "lucide-react";

import type { GameState } from "../engine/types";
import type { MoveTelemetry } from "../persistence/schema";

export function GameInspector({ game, telemetry, thinking }: { game: GameState; telemetry: readonly MoveTelemetry[]; thinking: boolean }) {
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
