"""Game-state models for regular and Ultimate Tic-Tac-Toe."""


BOARD_DIMENSION = 3
PLAYER_SYMBOLS = frozenset(("X", "O"))
DRAW_SYMBOL = "D"


def _validate_coordinate(value, name):
    if not isinstance(value, int) or isinstance(value, bool):
        raise TypeError(f"{name} must be an integer")
    if not 0 <= value < BOARD_DIMENSION:
        raise ValueError(f"{name} must be between 0 and {BOARD_DIMENSION - 1}")


class TicTacToeBoard:
    """A mutable 3-by-3 Tic-Tac-Toe board."""

    def __init__(self, allowed_symbols=PLAYER_SYMBOLS, winning_symbols=PLAYER_SYMBOLS):
        self.table = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
        self.winner = 0
        self.game_over = False
        self.moves = 0
        self._allowed_symbols = frozenset(allowed_symbols)
        self._winning_symbols = frozenset(winning_symbols)

    def print_table(self):
        """Print the board using the original console representation."""
        print("----------")
        for row in self.table:
            for column, value in enumerate(row):
                print(" " if value == 0 else value, end=" ")
                if column != 2:
                    print("|", end=" ")
            print("\n----------")

    def check_game_over(self):
        if self.moves >= BOARD_DIMENSION**2 or self.winner != 0:
            self.game_over = True

    def check_winner(self):
        for row in range(3):
            if (
                self.table[row][0]
                == self.table[row][1]
                == self.table[row][2]
                and self.table[row][0] in self._winning_symbols
            ):
                self.winner = self.table[row][0]
                break

        for column in range(3):
            if (
                self.table[0][column]
                == self.table[1][column]
                == self.table[2][column]
                and self.table[0][column] in self._winning_symbols
            ):
                self.winner = self.table[0][column]
                break

        if (
            self.table[0][0] == self.table[1][1] == self.table[2][2]
            and self.table[0][0] in self._winning_symbols
        ):
            self.winner = self.table[0][0]
        elif (
            self.table[0][2] == self.table[1][1] == self.table[2][0]
            and self.table[0][2] in self._winning_symbols
        ):
            self.winner = self.table[0][2]

    def make_move(self, row, column, symbol):
        _validate_coordinate(row, "row")
        _validate_coordinate(column, "column")
        if symbol not in self._allowed_symbols:
            allowed = ", ".join(sorted(self._allowed_symbols))
            raise ValueError(f"symbol must be one of: {allowed}")
        if self.game_over:
            raise ValueError("Illegal move: the board is already over")
        if self.table[row][column] != 0:
            raise ValueError(f"Illegal move: [{row}, {column}] is already occupied")

        self.table[row][column] = symbol
        self.moves += 1
        self.check_winner()
        self.check_game_over()

    def reset_table(self):
        self.table = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
        self.winner = 0
        self.game_over = False
        self.moves = 0


class UltimateTicTacToeBoard:
    """The nine local boards and routing state of an Ultimate game."""

    def __init__(self):
        self.subtable = [
            [TicTacToeBoard() for _ in range(BOARD_DIMENSION)]
            for _ in range(BOARD_DIMENSION)
        ]
        self.subtable_winner = TicTacToeBoard(
            allowed_symbols=PLAYER_SYMBOLS | {DRAW_SYMBOL},
            winning_symbols=PLAYER_SYMBOLS,
        )
        self.subtable_to_be_played = [None, None]
        self.winner = 0
        self.game_over = False
        self.moves_log = []
        self.next_player = "X"

    def print_table(self):
        """Print all nine local boards as one board."""
        print(16 * "* ")
        for subtable_row in range(3):
            for cell_row in range(3):
                print("* ", end=" ")
                for subtable_column in range(3):
                    for cell_column in range(3):
                        value = self.subtable[subtable_row][subtable_column].table[
                            cell_row
                        ][cell_column]
                        print(" " if value == 0 else value, end=" ")
                    print(" * ", end=" ")
                if cell_row != 2:
                    print("\n", end="")
            print("\n" + 16 * "* ")

    def check_game_over(self):
        if self.subtable_winner.game_over:
            self.game_over = True
            self.winner = self.subtable_winner.winner

    def make_move(
        self,
        subtable_row,
        subtable_column,
        row,
        column,
        symbol,
        *,
        enforce_turn=True,
    ):
        """Place a symbol and route the next turn to ``[row, column]``."""
        _validate_coordinate(subtable_row, "subtable_row")
        _validate_coordinate(subtable_column, "subtable_column")
        _validate_coordinate(row, "row")
        _validate_coordinate(column, "column")
        if symbol not in PLAYER_SYMBOLS:
            raise ValueError("symbol must be either X or O")
        if self.game_over:
            raise ValueError("Illegal move: the game is already over")
        if enforce_turn and symbol != self.next_player:
            raise ValueError(
                f"Illegal turn: expected {self.next_player} but received {symbol}"
            )

        required = self.subtable_to_be_played
        if (
            required != [None, None]
            and required != [subtable_row, subtable_column]
            and not self.subtable[required[0]][required[1]].game_over
        ):
            raise ValueError(
                "Illegal subtable to be played: must play in subtable "
                f"{required} but played in subtable {[subtable_row, subtable_column]}"
            )

        local_board = self.subtable[subtable_row][subtable_column]
        if local_board.game_over:
            raise ValueError(
                "Illegal subtable to be played: subtable "
                f"{self.subtable_to_be_played} is already over"
            )

        try:
            local_board.make_move(row, column, symbol)
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"Illegal move in subtable {[subtable_row, subtable_column]}: {error}"
            ) from error

        self.moves_log.append([symbol, [subtable_row, subtable_column, row, column]])
        self.next_player = "O" if symbol == "X" else "X"
        if self.subtable[row][column].game_over:
            self.subtable_to_be_played = [None, None]
        else:
            self.subtable_to_be_played = [row, column]

        if local_board.game_over:
            result = local_board.winner or DRAW_SYMBOL
            self.subtable_winner.make_move(subtable_row, subtable_column, result)

        self.check_game_over()


# Backwards-compatible names from the original project.
ttt_table = TicTacToeBoard
uttt_table = UltimateTicTacToeBoard
