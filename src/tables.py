"""Compatibility imports for the original board module."""

from ultimate_tic_tac_toe.game import (
    TicTacToeBoard,
    UltimateTicTacToeBoard,
    ttt_table,
    uttt_table,
)

__all__ = ["TicTacToeBoard", "UltimateTicTacToeBoard", "ttt_table", "uttt_table"]


if __name__ == "__main__":
    board = uttt_table()
    board.print_table()
    moves = (
        (0, 0, 1, 1, "x"),
        (1, 1, 0, 0, "o"),
        (0, 0, 0, 0, "x"),
        (0, 0, 2, 2, "o"),
        (2, 2, 0, 0, "x"),
        (0, 0, 1, 0, "o"),
        (1, 0, 0, 0, "x"),
        (0, 0, 1, 2, "o"),
        (1, 2, 0, 0, "x"),
        (0, 0, 2, 0, "o"),
        (2, 0, 0, 0, "x"),
        (0, 0, 2, 1, "o"),
        (2, 1, 0, 0, "x"),
    )
    for move in moves:
        board.make_move(*move)
        board.print_table()
    print(f"winner: {board.winner}")
    print(f"game over: {board.game_over}")
    board.subtable_winner.print_table()
