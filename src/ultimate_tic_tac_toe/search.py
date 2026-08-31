"""Minimax search with alpha-beta pruning."""

import copy
import time

from .evaluation import uttt_heuristic
from .tree import Node, legal_moves

MIN_SCORE = -1_000_000
MAX_SCORE = 1_000_000


def minimax_alpha_beta_pruning(board, player, depth):
    """Return elapsed time, best move, alpha, and beta for a search."""
    if player not in ("X", "O"):
        raise ValueError("player must be either X or O")
    if not isinstance(depth, int) or isinstance(depth, bool) or depth < 1:
        raise ValueError("depth must be a positive integer")
    if board.game_over:
        raise ValueError("cannot search a completed game")

    start_time = time.perf_counter()
    root = Node(None, None, copy.deepcopy(board), MIN_SCORE, MAX_SCORE)
    # Evaluation only needs the most recent move. Avoid copying the full game log
    # again at every descendant in the search tree.
    root.board.moves_log = root.board.moves_log[-1:]
    best_move(root, player, depth)
    elapsed_time = time.perf_counter() - start_time
    return elapsed_time, root.best_move, root.alpha, root.beta


def best_move(root, player, depth):
    """Populate the best move and relevant bound for ``root``."""
    if player not in ("X", "O"):
        raise ValueError("player must be either X or O")
    if depth < 1:
        raise ValueError("depth must be at least 1")

    value, move = _search(
        root.board,
        player,
        depth,
        root.alpha,
        root.beta,
    )
    root.best_move = move
    if player == "X":
        root.alpha = max(root.alpha, value)
    else:
        root.beta = min(root.beta, value)


def _search(board, player, depth, alpha, beta):
    """Return the position value and best move without retaining a search tree."""
    if depth == 0 or board.game_over:
        return uttt_heuristic(board), None

    moves = legal_moves(board)
    best = None

    if player == "X":
        value = MIN_SCORE
        for move in moves:
            new_board = copy.deepcopy(board)
            new_board.make_move(*move, player, enforce_turn=False)
            candidate, _ = _search(new_board, "O", depth - 1, alpha, beta)
            if best is None or candidate > value:
                value = candidate
                best = move
            alpha = max(alpha, value)
            if alpha >= beta:
                break
    else:
        value = MAX_SCORE
        for move in moves:
            new_board = copy.deepcopy(board)
            new_board.make_move(*move, player, enforce_turn=False)
            candidate, _ = _search(new_board, "X", depth - 1, alpha, beta)
            if best is None or candidate < value:
                value = candidate
                best = move
            beta = min(beta, value)
            if alpha >= beta:
                break

    if best is None:
        return uttt_heuristic(board), None
    return value, best


# Preserve the misspelled public function used by the original project.
minimax_alphaBetaPrunning = minimax_alpha_beta_pruning
