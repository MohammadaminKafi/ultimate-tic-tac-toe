import { Alert, Button, Card } from "@heroui/react";
import { Bot, BotIcon, Swords, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { DEEP_SEARCH_DEPTH, MAX_SEARCH_DEPTH, MIN_SEARCH_DEPTH, depthForStrength, type Strength } from "../engine/depth";
import type { GameConfiguration, GameMode, Player } from "../engine/types";
import { AppSlider } from "./AppSlider";

type Side = Player | "random";

export function GameSetup({ onStart }: { onStart: (configuration: GameConfiguration) => void }) {
  const [mode, setMode] = useState<GameMode>("human-ai");
  const [side, setSide] = useState<Side>("X");
  const [xStrength, setXStrength] = useState<Strength>("medium");
  const [oStrength, setOStrength] = useState<Strength>("medium");
  const [xAdvanced, setXAdvanced] = useState(6);
  const [oAdvanced, setOAdvanced] = useState(6);
  const [speedMs, setSpeedMs] = useState(600);

  const resolvedSide = useMemo<Player>(
    () => (side === "random" ? (Math.random() < 0.5 ? "X" : "O") : side),
    [side],
  );
  const humanAiPlayer = resolvedSide === "X" ? "O" : "X";
  const humanAiDepth = humanAiPlayer === "X" ? depthForStrength(xStrength, xAdvanced) : depthForStrength(oStrength, oAdvanced);
  const advancedWarning =
    (mode === "ai-ai" && (depthForStrength(xStrength, xAdvanced) >= DEEP_SEARCH_DEPTH || depthForStrength(oStrength, oAdvanced) >= DEEP_SEARCH_DEPTH)) ||
    (mode === "human-ai" && humanAiDepth >= DEEP_SEARCH_DEPTH);

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
        ...(players.X === "ai" ? { X: depthForStrength(xStrength, xAdvanced) } : {}),
        ...(players.O === "ai" ? { O: depthForStrength(oStrength, oAdvanced) } : {}),
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
          <div className="pace-control">
            <AppSlider label="Move pace" value={speedMs} min={200} max={1600} step={200} output={`${speedMs} ms between moves`} onChange={setSpeedMs} />
          </div>
        )}

        {advancedWarning && (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content><Alert.Title>Exact deep search</Alert.Title><Alert.Description>Depths 7–10 can take minutes or longer. The interface remains responsive, and you can cancel, adjust the depth, and retry without losing the position.</Alert.Description></Alert.Content>
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
  const depth = depthForStrength(strength, advanced);
  return (
    <fieldset className={`strength-control player-${player.toLowerCase()}`}>
      <legend><span className="profile-sigil">{player}</span><span>{player} AI profile</span><strong>Depth {depth}</strong></legend>
      <div className="strength-options">
        {(["easy", "medium", "hard", "advanced"] as const).map((value) => (
          <Button key={value} size="sm" variant={strength === value ? "secondary" : "ghost"} onPress={() => onStrength(value)}>{value}</Button>
        ))}
      </div>
      {strength === "advanced" && (
        <AppSlider
          label={`${player} exact search depth`}
          value={advanced}
          min={MIN_SEARCH_DEPTH}
          max={MAX_SEARCH_DEPTH}
          output={`Depth ${advanced}`}
          tone={player.toLowerCase() as "x" | "o"}
          onChange={onAdvanced}
        />
      )}
    </fieldset>
  );
}
