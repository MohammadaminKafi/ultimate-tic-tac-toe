import { Alert, Button, Card } from "@heroui/react";
import { Download, FileUp, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { GameBoard } from "../components/GameBoard";
import { replayMoves } from "../engine/game";
import type { GameRecordV1 } from "../persistence/schema";
import { downloadRecords, loadBundledRecords, loadHistory, parseImportedRecords, saveRecords } from "../persistence/storage";

export function ReplaysPage() {
  const initialHistory = useRef(loadHistory()).current;
  const [bundled, setBundled] = useState<GameRecordV1[]>([]);
  const [local, setLocal] = useState<GameRecordV1[]>(initialHistory);
  const [selectedId, setSelectedId] = useState<string | null>(initialHistory[0]?.id ?? null);
  const [turn, setTurn] = useState(initialHistory[0]?.moves.length ?? 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const [message, setMessage] = useState<{ kind: "danger" | "success"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBundledRecords()
      .then((records) => {
        setBundled(records);
        setSelectedId((current) => current ?? records[0]?.id ?? null);
        setTurn((current) => current || records[0]?.moves.length || 0);
      })
      .catch((error: unknown) => setMessage({ kind: "danger", text: error instanceof Error ? error.message : "Could not load replays" }));
  }, []);

  const records = useMemo(() => [...local, ...bundled], [bundled, local]);
  const selected = records.find((record) => record.id === selectedId) ?? records[0] ?? null;
  const game = useMemo(() => replayMoves(selected?.moves.slice(0, turn) ?? []), [selected, turn]);

  useEffect(() => {
    if (!playing || !selected) return;
    if (turn >= selected.moves.length) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setTurn((value) => value + 1), speed);
    return () => window.clearTimeout(timer);
  }, [playing, selected, speed, turn]);

  const choose = (record: GameRecordV1) => {
    setSelectedId(record.id);
    setTurn(record.moves.length);
    setPlaying(false);
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parseImportedRecords(await file.text());
      const history = saveRecords(imported);
      setLocal(history);
      choose(imported[0] as GameRecordV1);
      setMessage({ kind: "success", text: `${imported.length} replay${imported.length === 1 ? "" : "s"} imported.` });
    } catch (error) {
      setMessage({ kind: "danger", text: error instanceof Error ? error.message : "The replay file is invalid" });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="page replay-page">
      <section className="page-intro"><div className="eyebrow">Position archive</div><h1>Replay the search.</h1><p>Study six historic AI matches, revisit games played here, or exchange a validated replay file.</p></section>
      {message && <Alert status={message.kind}><Alert.Indicator /><Alert.Content><Alert.Title>{message.kind === "success" ? "Replay ready" : "Import failed"}</Alert.Title><Alert.Description>{message.text}</Alert.Description></Alert.Content></Alert>}
      <div className="replay-layout">
        <aside className="replay-library">
          <div className="library-heading"><span>{records.length} matches</span><div><Button isIconOnly size="sm" variant="ghost" aria-label="Import replay" onPress={() => fileInput.current?.click()}><FileUp size={16} /></Button><Button isIconOnly size="sm" variant="ghost" aria-label="Export all local replays" isDisabled={local.length === 0} onPress={() => downloadRecords(local)}><Download size={16} /></Button></div></div>
          <input ref={fileInput} hidden type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} />
          <div className="record-list">
            {records.map((record) => (
              <button key={record.id} type="button" className={`record-item ${record.id === selected?.id ? "is-active" : ""}`} onClick={() => choose(record)}>
                <span className={`outcome outcome-${record.outcome}`}>{record.outcome === "draw" ? "—" : record.outcome}</span>
                <span><strong>{record.label ?? modeName(record.mode)}</strong><small>{record.moves.length} moves · {record.outcome === "draw" ? "Draw" : `${record.outcome} won`}</small></span>
              </button>
            ))}
          </div>
        </aside>
        <section className="replay-stage">
          {selected ? (
            <>
              <GameBoard state={game} readOnly />
              <Card className="replay-controls" variant="default"><Card.Content><div className="timeline-meta"><span>Move {turn} / {selected.moves.length}</span><strong>{turn === 0 ? "Opening position" : `${game.moves.at(-1)?.player} → board ${(game.moves.at(-1)?.board ?? 0) + 1}, cell ${(game.moves.at(-1)?.cell ?? 0) + 1}`}</strong></div><input aria-label="Replay position" type="range" min="0" max={selected.moves.length} value={turn} onChange={(event) => { setTurn(Number(event.target.value)); setPlaying(false); }} /><div className="playback-row"><Button isIconOnly variant="ghost" aria-label="First move" onPress={() => { setTurn(0); setPlaying(false); }}><SkipBack size={17} /></Button><Button variant="primary" onPress={() => setPlaying((value) => !value)}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? "Pause" : "Play"}</Button><Button isIconOnly variant="ghost" aria-label="Next move" onPress={() => { setTurn(Math.min(selected.moves.length, turn + 1)); setPlaying(false); }}><SkipForward size={17} /></Button><label>Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="1200">0.5×</option><option value="700">1×</option><option value="300">2×</option></select></label><Button variant="ghost" onPress={() => downloadRecords([selected], `${selected.id}.json`)}><Download size={16} />Export</Button></div></Card.Content></Card>
            </>
          ) : <Card><Card.Content>No replay is available.</Card.Content></Card>}
        </section>
      </div>
    </div>
  );
}

function modeName(mode: GameRecordV1["mode"]): string {
  return mode === "human-ai" ? "Human vs AI" : mode === "local" ? "Local duel" : "AI arena";
}
