import { Alert, Button, Card } from "@heroui/react";
import { Bot, BotIcon, Swords, Users } from "lucide-react";
import { useMemo, useState } from "react";

import type { GameConfiguration, GameMode, Player } from "../engine/types";

type Side = Player | "random";
type Strength = "easy" | "medium" | "hard" | "advanced";

const depthFor = (strength: Strength, advanced: number) =>
  strength === "easy" ? 1 : strength === "medium" ? 3 : strength === "hard" ? 4 : advanced;

export function GameSetup({ onStart }: { onStart: (configuration: GameConfiguration) => void }) {
  const [mode, setMode] = useState<GameMode>("human-ai");
  const [side, setSide] = useState<Side>("X");
  const [xStrength, setXStrength] = useState<Strength>("medium");
  const [oStrength, setOStrength] = useState<Strength>("medium");
  const [xAdvanced, setXAdvanced] = useState(4);
  const [oAdvanced, setOAdvanced] = useState(4);
  const [speedMs, setSpeedMs] = useState(600);

  const resolvedSide = useMemo<Player>(
    () => (side === "random" ? (Math.random() < 0.5 ? "X" : "O") : side),
    [side],
  );
  const humanAiPlayer = resolvedSide === "X" ? "O" : "X";
  const humanAiDepth = humanAiPlayer === "X" ? depthFor(xStrength, xAdvanced) : depthFor(oStrength, oAdvanced);
  const advancedWarning =
    (mode === "ai-ai" && (depthFor(xStrength, xAdvanced) >= 5 || depthFor(oStrength, oAdvanced) >= 5)) ||
    (mode === "human-ai" && humanAiDepth >= 5);

  const launch = () => {
    const players =
      mode === "local"
        ? ({ X: "human", O: "human" } as const)
        : mode === "ai-ai"
          ? ({ X: "ai", O: "ai" } as const)
          : ({ X: resolvedSide === "X" ? "human" : "ai", O: resolvedSide === "O" ? "human" : "ai" } as const);
    onStart({
      mode,
      players,
      depths: {
        ...(players.X === "ai" ? { X: depthFor(xStrength, xAdvanced) } : {}),
        ...(players.O === "ai" ? { O: depthFor(oStrength, oAdvanced) } : {}),
      },
      speedMs,
    });
  };

  return (
    <Card className="setup-card" variant="default">
      <Card.Header>
        <div className="eyebrow">Configure match</div>
        <Card.Title>Choose your arena</Card.Title>
        <Card.Description>Every move decides where the next player must answer.</Card.Description>
      </Card.Header>
      <Card.Content className="setup-content">
        <fieldset className="choice-group">
          <legend>Mode</legend>
          <div className="choice-grid three">
            <Choice active={mode === "human-ai"} onPress={() => setMode("human-ai")} icon={<Swords />} title="Human vs AI" detail="Challenge minimax" />
            <Choice active={mode === "local"} onPress={() => setMode("local")} icon={<Users />} title="Local duel" detail="Two players" />
            <Choice active={mode === "ai-ai"} onPress={() => setMode("ai-ai")} icon={<BotIcon />} title="AI arena" detail="Watch and inspect" />
          </div>
        </fieldset>

        {mode === "human-ai" && (
          <fieldset className="choice-group">
            <legend>Your side</legend>
            <div className="segmented">
              {(["X", "O", "random"] as const).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={side === value ? "primary" : "ghost"}
                  className={side === value ? `side-selection side-${value.toLowerCase()}` : undefined}
                  onPress={() => setSide(value)}
                >
                  {value === "random" ? "Random" : `${value} · ${value === "X" ? "Orange" : "Green"}`}
                </Button>
              ))}
            </div>
          </fieldset>
        )}

        {mode !== "local" && (
          <div className="strength-grid">
            {(mode === "ai-ai" ? (["X", "O"] as Player[]) : ([resolvedSide === "X" ? "O" : "X"] as Player[])).map((player) => (
              <StrengthControl
                key={player}
                player={player}
                strength={player === "X" ? xStrength : oStrength}
                advanced={player === "X" ? xAdvanced : oAdvanced}
                onStrength={player === "X" ? setXStrength : setOStrength}
                onAdvanced={player === "X" ? setXAdvanced : setOAdvanced}
              />
            ))}
          </div>
        )}

        {mode === "ai-ai" && (
          <label className="range-control">
            <span><strong>Move pace</strong><small>{speedMs} ms between moves</small></span>
            <input type="range" min="200" max="1600" step="200" value={speedMs} onChange={(event) => setSpeedMs(Number(event.target.value))} />
          </label>
        )}

        {advancedWarning && (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content><Alert.Title>Deep search</Alert.Title><Alert.Description>Depths 5–6 can take noticeably longer, but the interface will remain responsive.</Alert.Description></Alert.Content>
          </Alert>
        )}
      </Card.Content>
      <Card.Footer>
        <Button variant="primary" size="lg" onPress={launch}><Bot size={18} /> Enter the arena</Button>
      </Card.Footer>
    </Card>
  );
}

function Choice({ active, onPress, icon, title, detail }: { active: boolean; onPress: () => void; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <button type="button" className={`mode-choice ${active ? "is-active" : ""}`} onClick={onPress}>
      {icon}<strong>{title}</strong><small>{detail}</small>
    </button>
  );
}

function StrengthControl({ player, strength, advanced, onStrength, onAdvanced }: { player: Player; strength: Strength; advanced: number; onStrength: (value: Strength) => void; onAdvanced: (value: number) => void }) {
  return (
    <fieldset className={`strength-control player-${player.toLowerCase()}`}>
      <legend>{player} AI strength</legend>
      <div className="segmented compact">
        {(["easy", "medium", "hard", "advanced"] as const).map((value) => (
          <Button key={value} size="sm" variant={strength === value ? "secondary" : "ghost"} onPress={() => onStrength(value)}>{value}</Button>
        ))}
      </div>
      {strength === "advanced" && (
        <label className="range-control"><span><strong>Depth {advanced}</strong><small>1–6 ply</small></span><input type="range" min="1" max="6" value={advanced} onChange={(event) => onAdvanced(Number(event.target.value))} /></label>
      )}
    </fieldset>
  );
}
