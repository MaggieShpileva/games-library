import { BoardPiece } from './boardBase';
import type { Player } from './player';
import type { ConnectFourBoard } from './boardCanvas';

export abstract class GameBase<P extends Player = Player> {
  board: ConnectFourBoard;
  players: P[];
  currentPlayerId: number;
  isMoveAllowed = false;
  isGameWon = false;
  isGameEnded = false;

  constructor(players: P[], board: ConnectFourBoard) {
    this.board = board;
    this.players = players;
    this.currentPlayerId = 0;
    this.reset();
  }

  reset() {
    this.isMoveAllowed = false;
    this.isGameWon = false;
    this.currentPlayerId = 0;
    this.board.reset();
  }

  end() {
    this.reset();
    this.isGameEnded = true;
  }

  async start() {
    this.isMoveAllowed = true;
    while (!this.isGameWon) {
      if (this.isGameEnded) return;
      await this.move();
      const winner = this.board.getWinner();
      if (winner !== BoardPiece.EMPTY) {
        this.isGameWon = true;
        this.isMoveAllowed = false;
        this.announceWinner(winner);
        break;
      }
    }
  }

  async move() {
    if (this.isGameEnded) return;
    if (!this.isMoveAllowed) return;
    const currentPlayer = this.players[this.currentPlayerId];
    let actionSuccessful = false;
    while (!actionSuccessful) {
      if (this.isGameEnded) return;
      this.waitingForMove();
      const action = await currentPlayer.getAction(this.board);
      this.isMoveAllowed = false;
      this.beforeMoveApplied(action);
      actionSuccessful = await this.board.applyPlayerAction(
        currentPlayer,
        action
      );
      this.isMoveAllowed = true;
      if (actionSuccessful) {
        this.afterMove(action);
      }
    }
    this.currentPlayerId = this.getNextPlayer();
  }

  abstract waitingForMove(): void;
  abstract beforeMoveApplied(action: number): void;
  abstract afterMove(action: number): void;

  announceWinner(winnerPiece: BoardPiece) {
    void winnerPiece;
  }

  private getNextPlayer() {
    return this.currentPlayerId === 0 ? 1 : 0;
  }
}
