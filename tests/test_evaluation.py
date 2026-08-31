"""Regression tests for terminal and free-choice evaluation."""

import sys
import unittest
from pathlib import Path

SOURCE_DIRECTORY = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SOURCE_DIRECTORY))

from ultimate_tic_tac_toe.evaluation import _count_potential_lines, uttt_heuristic
from ultimate_tic_tac_toe.game import DRAW_SYMBOL, UltimateTicTacToeBoard


class EvaluationTests(unittest.TestCase):
    def test_empty_board_has_neutral_score(self):
        self.assertEqual(uttt_heuristic(UltimateTicTacToeBoard()), 0)

    def test_terminal_draw_has_neutral_score(self):
        board = UltimateTicTacToeBoard()
        board.game_over = True
        board.winner = 0

        self.assertEqual(uttt_heuristic(board), 0)

    def test_global_threat_cannot_pass_through_drawn_board(self):
        table = [["X", "X", DRAW_SYMBOL], [0, 0, 0], [0, 0, 0]]

        self.assertEqual(_count_potential_lines(table), (0, 0))


if __name__ == "__main__":
    unittest.main()
