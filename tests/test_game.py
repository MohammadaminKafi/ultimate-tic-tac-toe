"""Behavior tests for the game-state models."""

import sys
import unittest
from pathlib import Path

SOURCE_DIRECTORY = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SOURCE_DIRECTORY))

from tables import TicTacToeBoard, UltimateTicTacToeBoard, ttt_table, uttt_table
from ultimate_tic_tac_toe.game import DRAW_SYMBOL


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

    def test_move_after_game_over_is_rejected(self):
        board = TicTacToeBoard()
        for row, column, player in (
            (0, 0, "X"),
            (1, 0, "O"),
            (0, 1, "X"),
            (1, 1, "O"),
            (0, 2, "X"),
        ):
            board.make_move(row, column, player)

        with self.assertRaisesRegex(ValueError, "already over"):
            board.make_move(2, 2, "O")

    def test_reset_clears_all_state(self):
        board = TicTacToeBoard()
        for row, column, player in (
            (0, 0, "X"),
            (1, 0, "O"),
            (0, 1, "X"),
            (1, 1, "O"),
            (0, 2, "X"),
        ):
            board.make_move(row, column, player)

        board.reset_table()

        self.assertEqual(board.table, [[0, 0, 0], [0, 0, 0], [0, 0, 0]])
        self.assertEqual(board.moves, 0)
        self.assertEqual(board.winner, 0)
        self.assertFalse(board.game_over)

    def test_coordinates_and_symbols_are_validated(self):
        board = TicTacToeBoard()
        with self.assertRaises(ValueError):
            board.make_move(-1, 0, "X")
        with self.assertRaises(ValueError):
            board.make_move(0, 0, "?")


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

    def test_players_must_alternate(self):
        board = UltimateTicTacToeBoard()
        board.make_move(0, 0, 1, 2, "X")

        with self.assertRaisesRegex(ValueError, "expected O"):
            board.make_move(1, 2, 0, 0, "X")

    def test_drawn_local_board_is_blocked_on_global_board(self):
        board = UltimateTicTacToeBoard()
        moves = (
            (0, 0, "X"),
            (0, 1, "O"),
            (0, 2, "X"),
            (1, 1, "O"),
            (1, 0, "X"),
            (1, 2, "O"),
            (2, 1, "X"),
            (2, 0, "O"),
            (2, 2, "X"),
        )
        for row, column, player in moves:
            board.subtable_to_be_played = [0, 0]
            board.make_move(0, 0, row, column, player)

        self.assertEqual(board.subtable[0][0].winner, 0)
        self.assertEqual(board.subtable_winner.table[0][0], DRAW_SYMBOL)

    def test_move_after_global_game_over_is_rejected(self):
        board = UltimateTicTacToeBoard()
        board.game_over = True

        with self.assertRaisesRegex(ValueError, "already over"):
            board.make_move(0, 0, 0, 0, "X")


if __name__ == "__main__":
    unittest.main()
