"""Heuristic evaluation used by the minimax search."""

WINNING_LINES = (
    ((0, 0), (0, 1), (0, 2)),
    ((1, 0), (1, 1), (1, 2)),
    ((2, 0), (2, 1), (2, 2)),
    ((0, 0), (1, 0), (2, 0)),
    ((0, 1), (1, 1), (2, 1)),
    ((0, 2), (1, 2), (2, 2)),
    ((0, 0), (1, 1), (2, 2)),
    ((0, 2), (1, 1), (2, 0)),
)

SUBTABLE_WIN_WEIGHT = 13
SUBTABLE_LOSS_WEIGHT = -12
GAME_PROGRESS_WEIGHT = 1 / 4
FREE_CHOICE_WEIGHT = 10
LOCAL_THREAT_WEIGHT = 5
LOCAL_DANGER_WEIGHT = -5
GLOBAL_THREAT_WEIGHT = 13
GLOBAL_DANGER_WEIGHT = -14
CELL_WEIGHT = 1


def _count_potential_lines(table):
    x_lines = 0
    o_lines = 0
    for line in WINNING_LINES:
        values = [table[row][column] for row, column in line]
        if values.count("X") == 2 and values.count(0) == 1:
            x_lines += 1
        elif values.count("O") == 2 and values.count(0) == 1:
            o_lines += 1
    return x_lines, o_lines


def _position_weight(row, column, center_bonus=False):
    if row == column == 1:
        return 4 if center_bonus else 3
    if abs(row - column) == 1:
        return 2 if center_bonus else 1
    return 3 if center_bonus else 2


def uttt_heuristic(board, log_enabled=0):
    """Score ``board`` from X's perspective using the original weights."""
    if board.game_over:
        if board.winner == "X":
            return 1_000_000
        if board.winner == "O":
            return -1_000_000
        return 0

    subtables_won_x = 0
    subtables_lost_x = 0
    subtables_over = 0
    potential_wins = 0
    potential_losses = 0
    total_cell_value_x = 0
    total_cell_value_o = 0

    for subtable_row in range(3):
        for subtable_column in range(3):
            local_board = board.subtable[subtable_row][subtable_column]
            if local_board.game_over:
                board_weight = _position_weight(subtable_row, subtable_column)
                if local_board.winner == "X":
                    subtables_won_x += board_weight
                elif local_board.winner == "O":
                    subtables_lost_x += board_weight
                subtables_over += 1
                continue

            wins, losses = _count_potential_lines(local_board.table)
            potential_wins += wins
            potential_losses += losses

            for row in range(3):
                for column in range(3):
                    value = local_board.table[row][column]
                    value_weight = _position_weight(
                        row,
                        column,
                        center_bonus=subtable_row == subtable_column == 1,
                    )
                    if value == "X":
                        total_cell_value_x += value_weight
                    elif value == "O":
                        total_cell_value_o += value_weight

    free_choice_for_x = 0
    if board.subtable_to_be_played == [None, None] and board.moves_log:
        free_choice_for_x = -1 if board.moves_log[-1][0] == "X" else 1

    global_wins, global_losses = _count_potential_lines(board.subtable_winner.table)

    score = (
        SUBTABLE_WIN_WEIGHT * subtables_won_x
        + SUBTABLE_LOSS_WEIGHT * subtables_lost_x
        + FREE_CHOICE_WEIGHT * free_choice_for_x
        + LOCAL_THREAT_WEIGHT * potential_wins
        + LOCAL_DANGER_WEIGHT * potential_losses
        + GLOBAL_THREAT_WEIGHT * global_wins
        + GLOBAL_DANGER_WEIGHT * global_losses
        + CELL_WEIGHT * (total_cell_value_x - total_cell_value_o)
    )

    if log_enabled == 1:
        print(
            f"won_subtable: {SUBTABLE_WIN_WEIGHT} * {subtables_won_x} + \n"
            f"lost_subtable:                  {SUBTABLE_LOSS_WEIGHT} * {subtables_lost_x} + \n"
            f"subtable_to_be_played_is_over:  {free_choice_for_x} + \n"
            f"potential_win:                  {LOCAL_THREAT_WEIGHT} * {potential_wins} + \n"
            f"potential_lost:                 {LOCAL_DANGER_WEIGHT} * {potential_losses} + \n"
            f"potential_win_table:            {GLOBAL_THREAT_WEIGHT} * {global_wins} + \n"
            f"potential_lost_table:           {GLOBAL_DANGER_WEIGHT} * {global_losses} \n"
            "                    "
        )

    return GAME_PROGRESS_WEIGHT * (subtables_over + 1) * score
