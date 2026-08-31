"""Behavior tests for the game-state models."""

import sys
import unittest
from pathlib import Path

SOURCE_DIRECTORY = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SOURCE_DIRECTORY))

from tables import TicTacToeBoard, UltimateTicTacToeBoard, ttt_table, uttt_table


class TicTacToeBoardTests(unittest.TestCase):
    def test_legacy_names_remain_available(self):
        self.assertIs(ttt_table, TicTacToeBoard)
        self.assertIs(uttt_table, UltimateTicTacToeBoard)

    def test_row_wins_the_local_board(self):
        board = TicTacToeBoard()
        board.make_move(0, 0, "X")
        board.make_move(1, 0, "O")
        board.make_move(0, 1, "X")
        board.make_move(1, 1, "O")
        board.make_move(0, 2, "X")

        self.assertTrue(board.game_over)
        self.assertEqual(board.winner, "X")

    def test_occupied_cell_keeps_original_error(self):
        board = TicTacToeBoard()
        board.make_move(1, 1, "X")

        with self.assertRaisesRegex(Exception, r"Illegal move: \[1, 1\] is already occupied"):
            board.make_move(1, 1, "O")


class UltimateTicTacToeBoardTests(unittest.TestCase):
    def test_move_routes_the_next_player(self):
        board = UltimateTicTacToeBoard()
        board.make_move(0, 0, 1, 2, "X")

        self.assertEqual(board.subtable_to_be_played, [1, 2])
        self.assertEqual(board.moves_log, [["X", [0, 0, 1, 2]]])

    def test_move_on_wrong_subtable_is_rejected(self):
        board = UltimateTicTacToeBoard()
        board.make_move(0, 0, 1, 2, "X")

        with self.assertRaisesRegex(Exception, "must play in subtable"):
            board.make_move(0, 0, 0, 0, "O")


if __name__ == "__main__":
    unittest.main()
