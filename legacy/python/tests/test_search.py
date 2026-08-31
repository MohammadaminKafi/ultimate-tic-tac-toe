"""Regression tests for minimax edge cases."""

import sys
import unittest
from pathlib import Path

SOURCE_DIRECTORY = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SOURCE_DIRECTORY))

from ultimate_tic_tac_toe.game import UltimateTicTacToeBoard
from ultimate_tic_tac_toe.search import (
    MAX_SCORE,
    MIN_SCORE,
    best_move,
    minimax_alpha_beta_pruning,
)
from ultimate_tic_tac_toe.tree import Node


class SearchTests(unittest.TestCase):
    def test_forced_loss_still_returns_a_legal_move(self):
        board = UltimateTicTacToeBoard()
        board.subtable_winner.table[0][:2] = ["O", "O"]
        board.subtable_winner.moves = 2
        for row, column in ((0, 0), (0, 1), (2, 0), (2, 2)):
            local_board = board.subtable[row][column]
            local_board.game_over = True
            local_board.winner = "O"

        target = board.subtable[0][2]
        target.table = [["O", "O", 0], ["O", "X", "X"], [0, "X", 0]]
        target.moves = 6
        board.subtable_to_be_played = [0, 2]

        _, move, alpha, _ = minimax_alpha_beta_pruning(board, "X", 2)

        self.assertIn(move, ([0, 2, 0, 2], [0, 2, 2, 0], [0, 2, 2, 2]))
        self.assertEqual(alpha, MIN_SCORE)

    def test_nonpositive_depth_is_rejected(self):
        board = UltimateTicTacToeBoard()
        for depth in (0, -1):
            with self.subTest(depth=depth):
                with self.assertRaisesRegex(ValueError, "positive integer"):
                    minimax_alpha_beta_pruning(board, "X", depth)

    def test_search_does_not_retain_explored_tree(self):
        board = UltimateTicTacToeBoard()
        root = Node(None, None, board, MIN_SCORE, MAX_SCORE)

        best_move(root, "X", 1)

        self.assertIsNotNone(root.best_move)
        self.assertEqual(root.children, [])


if __name__ == "__main__":
    unittest.main()
