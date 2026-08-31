"""Search-tree node used by the minimax implementation."""

import copy


class Node:
    def __init__(self, index, parent, board, alpha, beta):
        self.index = index
        self.parent = parent
        self.board = board
        self.alpha = alpha
        self.beta = beta
        self.children = []
        self.score = 0
        self.visits = 0
        self.best_move = None

    def add_child(self, child):
        self.children.append(child)

    def build_all_children_to_depth(self, player_turn, depth):
        """Build the complete legal move tree to ``depth``."""
        if depth <= 0 or self.board.game_over:
            return

        for move in legal_moves(self.board):
            new_board = copy.deepcopy(self.board)
            new_board.make_move(*move, player_turn, enforce_turn=False)
            new_node = Node(len(self.children), self, new_board, self.alpha, self.beta)
            self.add_child(new_node)
            next_player = "X" if player_turn == "O" else "O"
            new_node.build_all_children_to_depth(next_player, depth - 1)


def legal_moves(board):
    """Yield legal move coordinates in the original deterministic order."""
    if board.game_over:
        return

    required = board.subtable_to_be_played
    free_choice = (
        required == [None, None]
        or board.subtable[required[0]][required[1]].game_over
    )

    if free_choice:
        for subtable_row in range(3):
            for subtable_column in range(3):
                local_board = board.subtable[subtable_row][subtable_column]
                if not local_board.game_over:
                    for row in range(3):
                        for column in range(3):
                            if local_board.table[row][column] == 0:
                                yield [subtable_row, subtable_column, row, column]
        return

    local_board = board.subtable[required[0]][required[1]]
    for row in range(3):
        for column in range(3):
            if local_board.table[row][column] == 0:
                yield [required[0], required[1], row, column]
