"""Minimax search with alpha-beta pruning."""

import copy
import time

from .evaluation import uttt_heuristic
from .tree import Node, legal_moves

MIN_SCORE = -1_000_000
MAX_SCORE = 1_000_000


def minimax_alpha_beta_pruning(board, player, depth):
    """Return elapsed time, best move, alpha, and beta for a search."""
    start_time = time.time()
    root = Node(None, None, copy.deepcopy(board), MIN_SCORE, MAX_SCORE)
    best_move(root, player, depth)
    elapsed_time = time.time() - start_time
    return elapsed_time, root.best_move, root.alpha, root.beta


def best_move(root, player, depth):
    """Populate the best move and bounds for ``root`` recursively."""
    for move in legal_moves(root.board):
        new_board = copy.deepcopy(root.board)
        new_board.make_move(*move, player)
        new_node = Node(len(root.children), root, new_board, root.alpha, root.beta)
        root.add_child(new_node)

        if depth - 1 != 0 and not new_board.game_over:
            next_player = "X" if player == "O" else "O"
            best_move(new_node, next_player, depth - 1)
            candidate_values = (new_node.alpha, new_node.beta)
        else:
            value = uttt_heuristic(new_board)
            candidate_values = (value,)

        if player == "X":
            previous_alpha = root.alpha
            root.alpha = max(root.alpha, *candidate_values)
            if previous_alpha != root.alpha:
                root.best_move = move
        else:
            previous_beta = root.beta
            root.beta = min(root.beta, *candidate_values)
            if previous_beta != root.beta:
                root.best_move = move

        if root.alpha >= root.beta:
            return


# Preserve the misspelled public function used by the original project.
minimax_alphaBetaPrunning = minimax_alpha_beta_pruning
