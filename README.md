# Ultimate Tic-Tac-Toe · Minimax Arena

A browser-native Ultimate Tic-Tac-Toe arena built with React, TypeScript,
HeroUI, and a depth-limited minimax AI with alpha-beta pruning. Play against
the AI, share the board locally, watch AI-versus-AI matches, or inspect saved
and historical replays.

## Features

- Human vs AI, local two-player, and AI vs AI modes
- Worker-based minimax search that keeps the interface responsive
- Easy, Medium, Hard, and exact depth 1–6 controls
- Dark-by-default quiet sci-fi interface with a persistent light theme
- Local autosave, recent replay history, and validated JSON import/export
- Six converted matches from the original Python implementation
- Responsive and keyboard-accessible nested board

## Run locally with Docker

Docker is the supported local toolchain; Node.js is not required on the host.

```bash
# Development server with hot reload
docker compose up app
# http://localhost:5173/ultimate-tic-tac-toe/

# Lint, type-check, unit/component tests, and production build
docker compose run --rm test

# Production-like static preview
docker compose up preview
# http://localhost:8080/ultimate-tic-tac-toe/

# Playwright tests against the preview service
docker compose run --rm e2e
```

If Node 22 is available, the equivalent commands are `npm ci`, `npm run dev`,
`npm run check`, and `npm run test:e2e`.

## Architecture

```text
src/
├── components/       # HeroUI shell, board, setup, and analysis UI
├── engine/           # Pure rules, heuristic, alpha-beta search, and tests
├── pages/            # Play, Replays, and Learn routes
├── persistence/      # Versioned replay validation and localStorage
├── session/          # Reducer-driven live match lifecycle
└── workers/          # Cancellable minimax Web Worker
public/replays/       # Versioned historical replay fixtures
e2e/                  # Playwright browser flows
legacy/python/        # Original Pygame project and tests
```

The web engine stores nine flat local boards. A move contains `board`, `cell`,
and `player`, all using zero-based indexes. Search is deterministic and always
iterates board and cell indexes from 0 through 8.

## Replay format

Exports use a versioned `GameRecordV1` JSON structure containing game mode,
player configuration, AI depths, final outcome, legal move sequence, and AI
telemetry. Imported files are schema-checked and fully replayed through the game
engine before being stored.

Only the 50 newest local games are retained. Active games are saved after every
move and restored on the next visit.

## Legacy Python project

The original implementation remains runnable from `legacy/python/`:

```bash
cd legacy/python
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 src/main.py
python3 -m unittest discover -s tests -v
```

## GitHub Pages

`.github/workflows/pages.yml` verifies pull requests and deploys every direct
push to `web_app`. The Vite base path is configured for:

<https://mohammadaminkafi.github.io/ultimate-tic-tac-toe/>

Before the first deployment, open **Repository Settings → Pages** and set
**Build and deployment → Source** to **GitHub Actions**. The workflow then
builds `dist/`, uploads the Pages artifact, and deploys through the
`github-pages` environment. It can also be run manually from the Actions tab
while `web_app` is selected.
