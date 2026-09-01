import { Alert, Button, Card } from "@heroui/react";
import { CircleStop, PanelRightClose, PanelRightOpen, Pause, Play, RefreshCcw, RotateCcw, Sparkles, StepForward } from "lucide-react";
import { useState } from "react";

import { GameBoard } from "../components/GameBoard";
import { GameInspector } from "../components/GameInspector";
import { GameSetup } from "../components/GameSetup";
import { useGameSession } from "../session/useGameSession";

export function PlayPage() {
  const session = useGameSession();
  const { state } = session;
  const [inspectorOpen, setInspectorOpen] = useState(true);

  if (state.phase === "setup") {
    return (
      <div className="page play-landing">
        <section className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> Nine boards. One decision tree.</div>
          <h1>Think locally.<br /><span>Win globally.</span></h1>
          <p>Challenge a depth-limited minimax engine, hand the board to a friend, or watch two search strategies collide.</p>
          <div className="hero-legend"><span className="legend-x">X <small>Orange opens</small></span><i /><span className="legend-o">O <small>Green answers</small></span></div>
        </section>
        <GameSetup onStart={session.start} />
      </div>
    );
  }

  const status = state.game.result
    ? state.game.result === "draw" ? "Global draw" : `${state.game.result} controls the grid`
    : state.thinking ? `${state.game.currentPlayer} is searching` : state.searchCancelled ? `${state.game.currentPlayer} search cancelled` : state.paused && state.configuration.players[state.game.currentPlayer] === "ai" ? "AI movement paused" : `${state.game.currentPlayer} to move`;
  const isAiArena = state.configuration.mode === "ai-ai";
  const currentIsAi = state.configuration.players[state.game.currentPlayer] === "ai";

  return (
    <div className="page game-page">
      <section className="game-heading">
        <div><div className="eyebrow">{modeLabel(state.configuration.mode)}</div><h1>{status}<span className={state.thinking ? "thinking-dot" : ""} /></h1></div>
        <div className="player-statuses">
          <span className={`player-status x ${state.game.currentPlayer === "X" && !state.game.result ? "active" : ""}`}><b>X</b><small>{state.configuration.players.X}{state.configuration.depths.X ? ` · d${state.configuration.depths.X}` : ""}</small></span>
          <span className={`player-status o ${state.game.currentPlayer === "O" && !state.game.result ? "active" : ""}`}><b>O</b><small>{state.configuration.players.O}{state.configuration.depths.O ? ` · d${state.configuration.depths.O}` : ""}</small></span>
        </div>
      </section>

      {state.restored && (
        <Alert status="accent" className="restore-alert"><Alert.Indicator /><Alert.Content><Alert.Title>Match restored</Alert.Title><Alert.Description>Your unfinished game was recovered from this browser.</Alert.Description></Alert.Content><Button size="sm" variant="ghost" onPress={session.dismissRestore}>Dismiss</Button></Alert>
      )}
      {state.error && (
        <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Move interrupted</Alert.Title><Alert.Description>{state.error}</Alert.Description></Alert.Content></Alert>
      )}

      <div className="game-layout">
        <div className="board-column">
          <GameBoard state={state.game} onMove={session.play} thinking={state.thinking} />
          <div className="game-toolbar">
            {isAiArena && state.phase === "playing" && (
              <>
                <Button variant="secondary" onPress={state.paused ? session.resumeAiSearch : session.togglePause}>{state.paused ? <Play size={16} /> : <Pause size={16} />}{state.paused ? "Resume" : "Pause"}</Button>
                <Button variant="ghost" isDisabled={!state.paused || state.thinking} onPress={session.step}><StepForward size={16} />Step</Button>
                <label className="live-speed">Pace<select aria-label="AI playback speed" value={state.configuration.speedMs} onChange={(event) => session.setSpeed(Number(event.target.value))}><option value="200">Very fast</option><option value="400">Fast</option><option value="600">Normal</option><option value="800">Relaxed</option><option value="1000">Measured</option><option value="1200">Slow</option><option value="1400">Slower</option><option value="1600">Study</option></select></label>
              </>
            )}
            {state.thinking && <Button variant="danger" onPress={session.cancelAiSearch}><CircleStop size={16} />Cancel search</Button>}
            <Button
              variant="ghost"
              aria-expanded={inspectorOpen}
              aria-controls="live-inspector"
              onPress={() => setInspectorOpen((value) => !value)}
            >
              {inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              {inspectorOpen ? "Hide analysis" : "Show analysis"}
            </Button>
            <Button variant="ghost" onPress={session.restart}><RotateCcw size={16} />Restart</Button>
            <Button variant="ghost" onPress={session.newGame}><RefreshCcw size={16} />New setup</Button>
          </div>
        </div>
        <aside className="game-sidebar">
          {inspectorOpen && <div id="live-inspector"><GameInspector
            game={state.game}
            telemetry={state.telemetry}
            thinking={state.thinking}
            pausedAi={state.paused && currentIsAi && state.phase === "playing" ? {
              player: state.game.currentPlayer,
              depth: state.configuration.depths[state.game.currentPlayer] ?? 4,
              cancelled: state.searchCancelled,
              onDepthChange: (depth) => session.setAiDepth(state.game.currentPlayer, depth),
              onResume: session.resumeAiSearch,
            } : undefined}
          /></div>}
          {state.phase === "complete" && (
            <Card className="result-card" variant="secondary"><Card.Header><div className="eyebrow">Match complete</div><Card.Title>{state.game.result === "draw" ? "No line surrendered." : `${state.game.result} wins the arena.`}</Card.Title><Card.Description>The replay has been saved locally and is ready in the Replays page.</Card.Description></Card.Header><Card.Footer><Button variant="primary" onPress={session.restart}>Play again</Button><Button variant="ghost" onPress={session.newGame}>Change mode</Button></Card.Footer></Card>
          )}
          <Card className="rules-nudge" variant="transparent"><Card.Content><span>Routing rule</span><p>Your cell position sends the opponent to the matching local board. If that board is complete, they may play anywhere open.</p></Card.Content></Card>
        </aside>
      </div>
    </div>
  );
}

function modeLabel(mode: "human-ai" | "local" | "ai-ai"): string {
  return mode === "human-ai" ? "Human vs AI" : mode === "local" ? "Local duel" : "AI arena";
}
