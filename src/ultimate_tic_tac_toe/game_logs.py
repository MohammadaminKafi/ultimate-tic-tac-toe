"""Read and write the project's historical game-log format."""

from datetime import datetime


def load_game_log(path):
    """Load the final serialized game from a log file."""
    with open(path, "r") as log_file:
        for line in log_file:
            # Logs are Python list representations in the original file format.
            game_log = eval(line)  # noqa: S307
    return game_log


def save_game_log(entries, player_one_is_human, player_two_is_human, depths):
    """Save moves using the same names and representation as the original app."""
    timestamp = datetime.now().strftime("%d_%m_%Y_%H_%M_%S")
    if player_one_is_human or player_two_is_human:
        file_name = f"log{timestamp}.txt"
    else:
        file_name = f"AI_log_{timestamp}_{depths[0]}vs{depths[1]}.txt"

    with open(file_name, "a") as log_file:
        log_file.write(f"{entries}\n")
    return file_name
