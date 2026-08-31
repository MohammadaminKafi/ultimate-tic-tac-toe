"""Game-state models for regular and Ultimate Tic-Tac-Toe."""


class TicTacToeBoard:
    """A mutable 3-by-3 Tic-Tac-Toe board."""

    def __init__(self):
        self.table = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
        self.winner = 0
        self.game_over = False
        self.moves = 0

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
        if self.moves == 9 or self.winner != 0:
            self.game_over = True

    def check_winner(self):
        for row in range(3):
            if self.table[row][0] == self.table[row][1] == self.table[row][2] != 0:
                self.winner = self.table[row][0]
                break

        for column in range(3):
            if self.table[0][column] == self.table[1][column] == self.table[2][column] != 0:
                self.winner = self.table[0][column]
                break

        if self.table[0][0] == self.table[1][1] == self.table[2][2] != 0:
            self.winner = self.table[0][0]
        elif self.table[0][2] == self.table[1][1] == self.table[2][0] != 0:
            self.winner = self.table[0][2]

    def make_move(self, row, column, symbol):
        if self.table[row][column] != 0:
            raise Exception(f"Illegal move: [{row}, {column}] is already occupied")

        self.table[row][column] = symbol
        self.moves += 1
        self.check_winner()
        self.check_game_over()

    def reset_table(self):
        # Keep the historical reset behavior for callers that rely on it.
        self.table = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]


class UltimateTicTacToeBoard:
    """The nine local boards and routing state of an Ultimate game."""

    def __init__(self):
        self.subtable = [[TicTacToeBoard() for _ in range(3)] for _ in range(3)]
        self.subtable_winner = TicTacToeBoard()
        self.subtable_to_be_played = [None, None]
        self.winner = 0
        self.game_over = False
        self.moves_log = []

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

    def make_move(self, subtable_row, subtable_column, row, column, symbol):
        """Place a symbol and route the next turn to ``[row, column]``."""
        required = self.subtable_to_be_played
        if (
            required != [None, None]
            and required != [subtable_row, subtable_column]
            and not self.subtable[required[0]][required[1]].game_over
        ):
            raise Exception(
                "Illegal subtable to be played: must play in subtable "
                f"{required} but played in subtable {[subtable_row, subtable_column]}"
            )

        local_board = self.subtable[subtable_row][subtable_column]
        if local_board.game_over:
            raise Exception(
                "Illegal subtable to be played: subtable "
                f"{self.subtable_to_be_played} is already over"
            )

        try:
            local_board.make_move(row, column, symbol)
        except Exception as error:
            raise Exception(
                f"Illegal move in subtable {[subtable_row, subtable_column]}: {error}"
            ) from error

        self.moves_log.append([symbol, [subtable_row, subtable_column, row, column]])
        if self.subtable[row][column].game_over:
            self.subtable_to_be_played = [None, None]
        else:
            self.subtable_to_be_played = [row, column]

        if local_board.game_over:
            self.subtable_winner.make_move(subtable_row, subtable_column, local_board.winner)

        self.check_game_over()


# Backwards-compatible names from the original project.
ttt_table = TicTacToeBoard
uttt_table = UltimateTicTacToeBoard
