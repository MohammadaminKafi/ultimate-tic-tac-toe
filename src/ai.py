"""Compatibility imports for the original AI module."""

from ultimate_tic_tac_toe.search import (
    best_move,
    minimax_alpha_beta_pruning,
    minimax_alphaBetaPrunning,
)
from tables import uttt_table

__all__ = [
    "best_move",
    "minimax_alpha_beta_pruning",
    "minimax_alphaBetaPrunning",
]


if __name__ == "__main__":
    board = uttt_table()
    board.print_table()
    board.make_move(0, 0, 0, 0, "X")
    board.make_move(0, 0, 1, 1, "O")
    board.make_move(1, 1, 2, 2, "X")
    board.make_move(2, 2, 0, 2, "O")
    board.make_move(0, 2, 0, 0, "X")
    board.make_move(0, 0, 1, 0, "O")
    board.make_move(1, 0, 2, 0, "X")
    print(minimax_alphaBetaPrunning(board, "O", 5))
