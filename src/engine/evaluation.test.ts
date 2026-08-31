import { createGame } from "./game";
import { evaluate, evaluationInternals, MAX_SCORE, MIN_SCORE } from "./evaluation";

describe("position evaluation", () => {
  it("scores an empty board and a draw neutrally", () => {
    expect(evaluate(createGame())).toBe(0);
    expect(evaluate({ ...createGame(), result: "draw" })).toBe(0);
  });

  it("uses fixed terminal scores", () => {
    expect(evaluate({ ...createGame(), result: "X" })).toBe(MAX_SCORE);
    expect(evaluate({ ...createGame(), result: "O" })).toBe(MIN_SCORE);
  });

  it("does not count a threat through a drawn local board", () => {
    expect(evaluationInternals.countPotentialLines(["X", "X", "draw", null, null, null, null, null, null])).toEqual([0, 0]);
  });
});
