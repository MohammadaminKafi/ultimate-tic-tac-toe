"""Characterization tests based on games produced by the original code."""

import ast
import sys
import unittest
from pathlib import Path

PROJECT_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIRECTORY / "src"))

from ai import minimax_alphaBetaPrunning
from heuristics import uttt_heuristic
from tables import uttt_table


EXPECTED_GAMES = {
    "AI_log_31_01_2024_14_33_50_6vs3.txt": (47, 1_000_000, "X"),
    "AI_log_31_01_2024_14_37_35_6vs5.txt": (57, 1_000_000, "X"),
    "AI_log_31_01_2024_14_39_35_6vs4.txt": (59, 1_000_000, "X"),
    "AI_log_31_01_2024_14_41_24_4vs6.txt": (60, -1_000_000, "O"),
    "AI_log_31_01_2024_15_44_39_3vs4.txt": (54, 137.5, 0),
    "AI_log_31_01_2024_15_54_34_3vs4.txt": (54, 137.5, 0),
}


def replay(path):
    entries = ast.literal_eval(path.read_text().splitlines()[-1])
    board = uttt_table()
    for player, move, *_ in entries:
        board.make_move(*move, player)
    return entries, board


class HistoricalGameTests(unittest.TestCase):
    def test_recorded_games_keep_their_results_and_scores(self):
        logs_directory = PROJECT_DIRECTORY / "logs"
        for file_name, expected in EXPECTED_GAMES.items():
            with self.subTest(file_name=file_name):
                entries, board = replay(logs_directory / file_name)
                actual = (len(entries), uttt_heuristic(board), board.winner)
                self.assertEqual(actual, expected)

    def test_search_keeps_move_order_and_values(self):
        board = uttt_table()
        moves = (
            ("X", [0, 0, 1, 1]),
            ("O", [1, 1, 0, 2]),
            ("X", [0, 2, 0, 2]),
            ("O", [0, 2, 1, 1]),
        )
        for player, move in moves:
            board.make_move(*move, player)

        _, move, alpha, beta = minimax_alphaBetaPrunning(board, "X", 2)
        self.assertEqual((move, alpha, beta), ([1, 1, 0, 0], 0.0, 1_000_000))

        _, move, alpha, beta = minimax_alphaBetaPrunning(board, "O", 2)
        self.assertEqual((move, alpha, beta), ([1, 1, 2, 0], -1_000_000, -1.5))


if __name__ == "__main__":
    unittest.main()
