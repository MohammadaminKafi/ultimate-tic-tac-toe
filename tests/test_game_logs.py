"""Tests for safe handling of the historical game-log format."""

import sys
import tempfile
import unittest
from pathlib import Path

SOURCE_DIRECTORY = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SOURCE_DIRECTORY))

from ultimate_tic_tac_toe.game_logs import load_game_log


class GameLogTests(unittest.TestCase):
    def test_loads_historical_list_representation(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "game.txt"
            path.write_text("[['X', [0, 0, 1, 1]]]\n", encoding="utf-8")

            self.assertEqual(load_game_log(path), [["X", [0, 0, 1, 1]]])

    def test_does_not_execute_log_contents(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / "executed"
            path = Path(directory) / "malicious.txt"
            path.write_text(
                f"__import__('pathlib').Path({str(marker)!r}).touch()\n",
                encoding="utf-8",
            )

            with self.assertRaises((ValueError, SyntaxError)):
                load_game_log(path)
            self.assertFalse(marker.exists())

    def test_rejects_empty_log(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "empty.txt"
            path.write_text("", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "serialized list"):
                load_game_log(path)


if __name__ == "__main__":
    unittest.main()
