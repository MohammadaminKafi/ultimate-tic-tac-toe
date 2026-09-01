import { Button, Card } from "@heroui/react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { evaluate, MAX_SCORE } from "../engine/evaluation";
import { applyMove, createGame } from "../engine/game";
import type { GameState, LocalResult, Move, Player } from "../engine/types";
import { GameBoard } from "./GameBoard";

export interface TutorialLesson {
  id: string;
  title: string;
  instruction: string;
  initialState: () => GameState;
  accepts: (move: Move) => boolean;
  consequence: (move: Move, state: GameState) => string;
}

const lessons: TutorialLesson[] = [
  {
    id: "open",
    title: "Make the opening move",
    instruction: "Choose any open cell. Watch the matching local board become the only active destination.",
    initialState: createGame,
    accepts: () => true,
    consequence: (move) => `You chose cell ${move.cell + 1}, so O must answer in local board ${move.cell + 1}. One mark changed both boards.`,
  },
  {
    id: "route",
    title: "Follow the route",
    instruction: "X has sent O to the center board. Try another board if you like, then make a legal reply in board 5.",
    initialState: () => applyMove(createGame(), { board: 0, cell: 4, player: "X" }),
    accepts: (move) => move.board === 4,
    consequence: (move) => `Correct. O replied in cell ${move.cell + 1}, which now routes X to local board ${move.cell + 1}.`,
  },
  {
    id: "local-win",
    title: "Claim a local board",
    instruction: "X already owns the first two cells in board 1. Complete the row with cell 3.",
    initialState: localWinScenario,
    accepts: (move) => move.board === 0 && move.cell === 2,
    consequence: () => "Three in a row claims the entire local board for X. Its move history fades behind the large winner sigil.",
  },
  {
    id: "free-choice",
    title: "Unlock free choice",
    instruction: "Play the center cell in board 1. It points to board 5—but board 5 has already been won.",
    initialState: freeChoiceScenario,
    accepts: (move) => move.board === 0 && move.cell === 4,
    consequence: (_move, state) => state.requiredBoard === null
      ? "The destination was complete, so O may choose any unfinished local board. Every open destination is highlighted."
      : "The destination should be unrestricted.",
  },
  {
    id: "global-win",
    title: "Finish the global line",
    instruction: "X owns boards 1 and 2. Win board 3 by completing its top row.",
    initialState: globalWinScenario,
    accepts: (move) => move.board === 2 && move.cell === 2,
    consequence: () => "Board 3 completes the global row. Local ownership—not individual cell count—decides the match.",
  },
  {
    id: "minimax",
    title: "Choose like minimax",
    instruction: "Compare the three candidate cells in board 3. Find the move that gives X the maximum evaluation.",
    initialState: minimaxScenario,
    accepts: (move) => move.board === 2 && [2, 4, 8].includes(move.cell),
    consequence: (move) => move.cell === 2
      ? "Exactly. The terminal win scores +1,000,000. Once alpha reaches that bound, the remaining lower branches cannot improve X’s choice and may be pruned."
      : `That move is legal, but its evaluation is lower than the immediate win in cell 3. Minimax keeps the maximum and rejects this branch.`,
  },
];

export function LearnWalkthrough() {
  const navigate = useNavigate();
  const [lessonIndex, setLessonIndex] = useState(0);
  const [game, setGame] = useState<GameState>(() => lessons[0]!.initialState());
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState("Make the highlighted action to reveal its consequence.");
  const [candidateScores, setCandidateScores] = useState<Array<{ cell: number; score: number }> | null>(null);
  const lesson = lessons[lessonIndex]!;

  const progress = ((lessonIndex + (complete ? 1 : 0)) / lessons.length) * 100;
  const candidateMoves = useMemo(
    () => lesson.id === "minimax" ? [2, 4, 8].map((cell) => ({ board: 2, cell, player: "X" as Player })) : [],
    [lesson.id],
  );

  const resetLesson = (index = lessonIndex) => {
    const nextLesson = lessons[index]!;
    setLessonIndex(index);
    setGame(nextLesson.initialState());
    setComplete(false);
    setFeedback("Make the highlighted action to reveal its consequence.");
    setCandidateScores(null);
  };

  const attemptMove = (board: number, cell: number) => {
    if (complete) return;
    const move: Move = { board, cell, player: game.currentPlayer };
    if (!lesson.accepts(move)) {
      setFeedback(lesson.id === "route"
        ? "That board is unavailable. The previous move’s cell points to board 5."
        : "That move is legal in the game, but it does not complete this lesson’s objective. Try the instructed cell.");
      return;
    }

    if (lesson.id === "minimax") {
      const scores = candidateMoves.map((candidate) => ({ cell: candidate.cell, score: evaluate(applyMove(game, candidate)) }));
      setCandidateScores(scores);
      const isBest = cell === 2;
      if (isBest) setGame(applyMove(game, move));
      setComplete(isBest);
      setFeedback(lesson.consequence(move, game));
      return;
    }

    const next = applyMove(game, move);
    setGame(next);
    setComplete(true);
    setFeedback(lesson.consequence(move, next));
  };

  const unavailableAttempt = () => {
    setFeedback("That board is unavailable. The previous move routes you to the highlighted local board.");
  };

  return (
    <section className="walkthrough" id="guided-lessons" aria-labelledby="walkthrough-title">
      <div className="walkthrough-progress">
        <div><span>Guided lesson {lessonIndex + 1} of {lessons.length}</span><strong>{Math.round(progress)}% complete</strong></div>
        <div className="progress-track" role="progressbar" aria-label="Tutorial progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><i style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="walkthrough-layout">
        <Card className="lesson-panel" variant="default">
          <Card.Header><div className="eyebrow"><Sparkles size={14} /> {lesson.id.replace("-", " ")}</div><Card.Title id="walkthrough-title">{lesson.title}</Card.Title><Card.Description>{lesson.instruction}</Card.Description></Card.Header>
          <Card.Content>
            <div className={`consequence-panel ${complete ? "is-complete" : ""}`} aria-live="polite">
              <span>{complete ? <Check size={15} /> : <ArrowRight size={15} />}{complete ? "Consequence" : "Coach"}</span>
              <p>{feedback}</p>
            </div>
            {candidateScores && (
              <div className="candidate-tree" aria-label="Candidate evaluations">
                <div className="tree-root">X maximizes</div>
                {candidateScores.map(({ cell, score }, index) => <div key={cell} className={score === MAX_SCORE ? "is-best" : "is-pruned"}><span>Cell {cell + 1}</span><strong>{score === MAX_SCORE ? "+1,000,000" : score.toFixed(2)}</strong><small>{score === MAX_SCORE ? "chosen" : index > 0 ? "lower branch" : "candidate"}</small></div>)}
              </div>
            )}
          </Card.Content>
          <Card.Footer className="lesson-actions">
            <Button variant="ghost" isDisabled={lessonIndex === 0} onPress={() => resetLesson(lessonIndex - 1)}><ArrowLeft size={16} />Back</Button>
            <Button variant="ghost" onPress={() => resetLesson()}><RotateCcw size={15} />Retry</Button>
            {lessonIndex < lessons.length - 1
              ? <Button variant="primary" isDisabled={!complete} onPress={() => resetLesson(lessonIndex + 1)}>Next lesson<ArrowRight size={16} /></Button>
              : <Button variant="primary" isDisabled={!complete} onPress={() => navigate("/")}>Start a match<ArrowRight size={16} /></Button>}
          </Card.Footer>
        </Card>

        <div className="tutorial-board-wrap">
          <GameBoard
            state={game}
            onMove={attemptMove}
            allowUnavailableAttempts={lesson.id === "route"}
            onUnavailableMove={unavailableAttempt}
          />
        </div>
      </div>
    </section>
  );
}

function scenario(currentPlayer: Player, requiredBoard: number | null, localResults: LocalResult[] = Array<LocalResult>(9).fill(null)): GameState {
  return { ...createGame(), currentPlayer, requiredBoard, localResults: [...localResults] };
}

function localWinScenario(): GameState {
  const state = scenario("X", 0);
  state.boards[0] = ["X", "X", null, null, "O", null, null, null, "O"];
  return state;
}

function freeChoiceScenario(): GameState {
  const state = scenario("X", 0, [null, null, null, null, "O", null, null, null, null]);
  state.boards[4] = ["O", "O", "O", "X", null, null, null, "X", null];
  return state;
}

function globalWinScenario(): GameState {
  const state = scenario("X", 2, ["X", "X", null, null, null, null, null, null, null]);
  state.boards[0] = ["X", "X", "X", null, null, null, null, null, null];
  state.boards[1] = ["X", "X", "X", null, null, null, null, null, null];
  state.boards[2] = ["X", "X", null, "O", null, null, null, "O", null];
  return state;
}

function minimaxScenario(): GameState {
  const state = globalWinScenario();
  state.boards[2] = ["X", "X", null, "O", null, null, "O", null, null];
  return state;
}
