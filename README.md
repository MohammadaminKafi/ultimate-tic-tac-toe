# Ultimate Tic-Tac-Toe AI

A Pygame implementation of Ultimate Tic-Tac-Toe with two computer players powered by depth-limited minimax and alpha-beta pruning. The repository also includes six historical AI-versus-AI games that can be replayed in the UI.

## Game rules

The board contains nine 3-by-3 Tic-Tac-Toe boards. A move's cell determines the local board where the opponent must play next. If that destination board is already complete, the opponent may choose any unfinished board. Winning three local boards in a row wins the game; completing the global board without a winner is a draw.

## Setup

Python 3.10 or newer is recommended.

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

## Run a game

From the repository root:

```bash
python3 src/main.py
```

The default configuration runs AI versus AI, with search depths 3 and 4. Player types, colors, and search depths are kept together in `src/ultimate_tic_tac_toe/config.py`. Set either `PLAYER_ONE_IS_HUMAN` or `PLAYER_TWO_IS_HUMAN` to `True` to control that player with the mouse.

AI search becomes substantially slower as depth increases because the number of explored positions grows quickly.

## Replay a recorded game

Pass a log file to replay one move every half second:

```bash
python3 src/main.py logs/AI_log_31_01_2024_14_33_50_6vs3.txt
```

Pass `1` as a second argument to advance with key presses:

```bash
python3 src/main.py logs/AI_log_31_01_2024_14_33_50_6vs3.txt 1
```

## Project structure

```text
src/
├── main.py                         # Backwards-compatible executable
├── ai.py, heuristics.py, ...       # Backwards-compatible imports
├── icon.png
└── ultimate_tic_tac_toe/
    ├── app.py                      # Pygame UI and application loops
    ├── config.py                   # Display, player, and AI settings
    ├── evaluation.py               # Board heuristic
    ├── game.py                     # Game-state models and move rules
    ├── game_logs.py                # Existing log file format
    ├── search.py                   # Minimax with alpha-beta pruning
    └── tree.py                     # Search nodes and legal move generation
tests/                              # Engine and historical compatibility tests
logs/                               # Recorded AI-versus-AI games
```

The original public names (`uttt_table`, `ttt_table`, `uttt_heuristic`, and `minimax_alphaBetaPrunning`) remain available, so existing scripts continue to work. Clearer names are exposed alongside them for new code.

## Tests

The test suite replays every historical game and verifies game outcomes,
deterministic search behavior, corrected terminal scores, move validation, and
safe handling of the historical log format.

```bash
python3 -m unittest discover -s tests -v
```
