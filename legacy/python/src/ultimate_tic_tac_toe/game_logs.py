"""Read and write the project's historical game-log format."""

import ast
from datetime import datetime


def load_game_log(path):
    """Load the final serialized game from a log file."""
    game_log = None
    with open(path, "r", encoding="utf-8") as log_file:
        for line in log_file:
            if line.strip():
                # Preserve the historical list representation without executing code.
                game_log = ast.literal_eval(line)
    if not isinstance(game_log, list):
        raise ValueError("game log must contain a serialized list of moves")
    return game_log


def save_game_log(entries, player_one_is_human, player_two_is_human, depths):
    """Save moves using the same names and representation as the original app."""
    timestamp = datetime.now().strftime("%d_%m_%Y_%H_%M_%S")
    if player_one_is_human or player_two_is_human:
        file_name = f"log{timestamp}.txt"
    else:
        file_name = f"AI_log_{timestamp}_{depths[0]}vs{depths[1]}.txt"

    with open(file_name, "a", encoding="utf-8") as log_file:
        log_file.write(f"{entries}\n")
    return file_name
