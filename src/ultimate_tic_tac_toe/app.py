"""Pygame user interface and application loop."""

import sys
import time
from pathlib import Path

import pygame

from . import config
from .game import UltimateTicTacToeBoard
from .game_logs import load_game_log, save_game_log
from .search import minimax_alpha_beta_pruning


class GameApplication:
    """Own the display, current board, and live/replay loops."""

    def __init__(self):
        self.board = UltimateTicTacToeBoard()
        self.player_turn = "X"

        pygame.init()
        window_size = (config.BOARD_PIXEL_SIZE + config.SIDEBAR_WIDTH, config.BOARD_PIXEL_SIZE)
        self.screen = pygame.display.set_mode(window_size)
        pygame.display.set_caption("Ultimate Tic-Tac-Toe")
        icon_path = Path(__file__).resolve().parent.parent / "icon.png"
        pygame.display.set_icon(pygame.image.load(str(icon_path)))

        self.cell_symbol_font = pygame.font.Font(None, int(config.CELL_SIZE * 1.5))
        self.block_symbol_font = pygame.font.Font(None, int(config.CELL_SIZE * 5))
        self.text_font = pygame.font.SysFont("Arial", 30)

    def handle_click(self, position):
        if self.board.game_over:
            return
        if position[0] > config.BOARD_PIXEL_SIZE or position[1] > config.BOARD_PIXEL_SIZE:
            return

        subtable_row = position[1] // 300
        subtable_column = position[0] // 300
        row = (position[1] % 300) // 100
        column = (position[0] % 300) // 100
        print(
            f"Clicked on {position}: subtable {[subtable_row, subtable_column]}, "
            f"cell {[row, column]}"
        )

        try:
            self.board.make_move(
                subtable_row,
                subtable_column,
                row,
                column,
                self.player_turn,
            )
            self.player_turn = "O" if self.player_turn == "X" else "X"
        except Exception as error:
            print(f"Illegal move in subtable {[subtable_row, subtable_column]}: {error}")

    def draw_board(self):
        board = self.board
        required = board.subtable_to_be_played
        if required != [None, None]:
            pygame.draw.rect(
                self.screen,
                config.GRAY,
                (required[1] * 300, required[0] * 300, 300, 300),
            )

        for index in range(1, config.BOARD_SIZE):
            width = 10 if index % 3 == 0 else 3
            offset = index * config.CELL_SIZE
            pygame.draw.line(
                self.screen,
                config.WHITE,
                (0, offset),
                (config.BOARD_PIXEL_SIZE, offset),
                width,
            )
            pygame.draw.line(
                self.screen,
                config.WHITE,
                (offset, 0),
                (offset, config.BOARD_PIXEL_SIZE),
                width,
            )

        draw = 0
        for subtable_row in range(3):
            for subtable_column in range(3):
                local_board = board.subtable[subtable_row][subtable_column]
                if local_board.game_over:
                    if local_board.winner == "X":
                        color = config.FIRST_PLAYER_COLOR
                    elif local_board.winner == "O":
                        color = config.SECOND_PLAYER_COLOR
                    else:
                        color = config.WHITE
                        draw = 1
                    label = local_board.winner if not draw else "Nobody"
                    text = self.block_symbol_font.render(label, True, color)
                    self.screen.blit(text, (subtable_column * 300 + 30, subtable_row * 300))

        for subtable_row in range(3):
            for row in range(3):
                for subtable_column in range(3):
                    local_board = board.subtable[subtable_row][subtable_column]
                    for column in range(3):
                        value = local_board.table[row][column]
                        if value == 0:
                            continue
                        if local_board.game_over:
                            color = config.GRAY
                        elif value == "X":
                            color = config.FIRST_PLAYER_COLOR
                        else:
                            color = config.SECOND_PLAYER_COLOR
                        text = self.cell_symbol_font.render(value, True, color)
                        self.screen.blit(
                            text,
                            (
                                subtable_column * 300 + column * 100 + 10,
                                subtable_row * 300 + row * 100 + 5,
                            ),
                        )

        if board.game_over:
            if board.winner == "X":
                color = config.FIRST_PLAYER_COLOR
            elif board.winner == "O":
                color = config.SECOND_PLAYER_COLOR
            text = self.text_font.render(f"{board.winner} wins!", True, color)
            self.screen.blit(text, (config.BOARD_PIXEL_SIZE + 20, 20))

    def write_replay_details(self, player, move, elapsed_time, heuristic_value):
        details = (
            (f"Player: {player}", 100),
            (f"Move: {move}", 150),
            (f"Time elapsed: {elapsed_time}", 200),
            (f"Heuristic value: {heuristic_value}", 250),
        )
        for label, vertical_position in details:
            text = self.text_font.render(label, True, config.WHITE)
            self.screen.blit(text, (config.BOARD_PIXEL_SIZE + 20, vertical_position))

    @staticmethod
    def _process_quit_events():
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

    @staticmethod
    def _wait_for_key():
        waiting = True
        keep_step_through = True
        while waiting:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                if event.type == pygame.KEYDOWN:
                    waiting = False
                else:
                    keep_step_through = False
        return keep_step_through

    def run_replay(self, log_path, step_through=False):
        entries = load_game_log(log_path)
        turn_number = 0

        while True:
            self._process_quit_events()
            if turn_number < len(entries):
                entry = entries[turn_number]
                self.player_turn = entry[0]
                move = entry[1]
                self.handle_click(
                    (
                        move[1] * 300 + move[3] * 100 + 50,
                        move[0] * 300 + move[2] * 100 + 50,
                    )
                )
                turn_number += 1

            if step_through:
                step_through = self._wait_for_key()
            else:
                time.sleep(0.5)

            current_entry = entries[turn_number - 1]
            self.screen.fill(config.BLACK)
            self.draw_board()
            heuristic_value = current_entry[3] if current_entry[0] == "X" else current_entry[4]
            self.write_replay_details(
                current_entry[0],
                current_entry[1],
                current_entry[2],
                heuristic_value,
            )
            pygame.display.update()

    def run_live_game(self):
        player_one_is_human = config.PLAYER_ONE_IS_HUMAN
        player_two_is_human = config.PLAYER_TWO_IS_HUMAN
        log_saved = False
        if not player_one_is_human and not player_two_is_human:
            ai_log = []

        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                if event.type == pygame.MOUSEBUTTONDOWN:
                    human_turn = (
                        self.player_turn == "X" and player_one_is_human
                    ) or (
                        self.player_turn == "O" and player_two_is_human
                    )
                    if human_turn:
                        self.handle_click(pygame.mouse.get_pos())

            if self.board.game_over and not log_saved:
                log_saved = True
                entries = (
                    self.board.moves_log
                    if player_one_is_human or player_two_is_human
                    else ai_log
                )
                save_game_log(
                    entries,
                    player_one_is_human,
                    player_two_is_human,
                    (config.AI_ONE_DEPTH, config.AI_TWO_DEPTH),
                )

            if not self.board.game_over:
                is_ai_turn = (
                    self.player_turn == "X" and not player_one_is_human
                ) or (
                    self.player_turn == "O" and not player_two_is_human
                )
                if is_ai_turn:
                    depth = config.AI_ONE_DEPTH if self.player_turn == "X" else config.AI_TWO_DEPTH
                    elapsed, move, alpha, beta = minimax_alpha_beta_pruning(
                        self.board,
                        self.player_turn,
                        depth,
                    )
                    ai_log.append([self.player_turn, move, elapsed, alpha, beta])
                    print(
                        f"AI took {elapsed} seconds to make a move in subtable "
                        f"{move[0:2]} at cell {move[2:4]}"
                    )
                    self.handle_click(
                        (
                            move[1] * 300 + move[3] * 100 + 50,
                            move[0] * 300 + move[2] * 100 + 50,
                        )
                    )

            self.screen.fill(config.BLACK)
            self.draw_board()
            pygame.display.update()


def main(arguments=None):
    arguments = sys.argv[1:] if arguments is None else arguments
    application = GameApplication()
    if arguments:
        step_through = len(arguments) == 2 and arguments[1] == "1"
        application.run_replay(arguments[0], step_through)
    else:
        application.run_live_game()
