import { Player } from './player';
import { BoardBase, BoardPiece } from './boardBase';
import {
  BIG_POSITIVE_NUMBER,
  BIG_NEGATIVE_NUMBER,
  getMockPlayerAction,
  choose,
  clone,
} from './utils';

export class PlayerAi extends Player {
  static readonly MAX_DEPTH = 4;
  private ownBoardPieceValue: number;
  private enemyBoardPiece: BoardPiece;

  constructor(boardPiece: BoardPiece, label: string) {
    super(boardPiece, label);
    this.ownBoardPieceValue = this.getBoardPieceValue(boardPiece);
    this.enemyBoardPiece =
      boardPiece === BoardPiece.PLAYER_1
        ? BoardPiece.PLAYER_2
        : BoardPiece.PLAYER_1;
  }

  private getBoardPieceValue(boardPiece: BoardPiece): number {
    if (boardPiece === BoardPiece.EMPTY) return 0;
    return boardPiece === this.boardPiece ? 1 : -1;
  }

  private getStateValue(state: BoardPiece[][]): {
    winnerBoardPiece: BoardPiece;
    chain: number;
  } {
    let winnerBoardPiece: BoardPiece = BoardPiece.EMPTY;
    let chainValue = 0;
    for (let i = 0; i < BoardBase.ROWS; i++) {
      for (let j = 0; j < BoardBase.COLUMNS; j++) {
        let tempRight = 0;
        let tempBottom = 0;
        let tempBottomRight = 0;
        let tempTopRight = 0;
        for (let k = 0; k <= 3; k++) {
          if (j + k < BoardBase.COLUMNS) {
            tempRight += this.getBoardPieceValue(state[i][j + k]);
          }
          if (i + k < BoardBase.ROWS) {
            tempBottom += this.getBoardPieceValue(state[i + k][j]);
          }
          if (i + k < BoardBase.ROWS && j + k < BoardBase.COLUMNS) {
            tempBottomRight += this.getBoardPieceValue(state[i + k][j + k]);
          }
          if (i - k >= 0 && j + k < BoardBase.COLUMNS) {
            tempTopRight += this.getBoardPieceValue(state[i - k][j + k]);
          }
        }
        chainValue += tempRight ** 3;
        chainValue += tempBottom ** 3;
        chainValue += tempBottomRight ** 3;
        chainValue += tempTopRight ** 3;

        if (Math.abs(tempRight) === 4) {
          winnerBoardPiece =
            tempRight > 0 ? this.boardPiece : this.enemyBoardPiece;
        } else if (Math.abs(tempBottom) === 4) {
          winnerBoardPiece =
            tempBottom > 0 ? this.boardPiece : this.enemyBoardPiece;
        } else if (Math.abs(tempBottomRight) === 4) {
          winnerBoardPiece =
            tempBottomRight > 0 ? this.boardPiece : this.enemyBoardPiece;
        } else if (Math.abs(tempTopRight) === 4) {
          winnerBoardPiece =
            tempTopRight > 0 ? this.boardPiece : this.enemyBoardPiece;
        }
      }
    }
    return { winnerBoardPiece, chain: chainValue };
  }

  private transformValues(
    returnValue: number,
    winnerBoardPiece: BoardPiece,
    depth: number
  ): number {
    const isWon = winnerBoardPiece === this.boardPiece;
    const isLost = winnerBoardPiece === this.enemyBoardPiece;
    let v = returnValue - depth * depth;
    if (isWon) {
      v = BIG_POSITIVE_NUMBER - 100 - depth * depth;
    } else if (isLost) {
      v = BIG_NEGATIVE_NUMBER + 100 + depth * depth;
    }
    return v;
  }

  private getMove(
    state: BoardPiece[][],
    depth: number,
    alpha: number,
    beta: number
  ): { value: number; move: number } {
    const stateValue = this.getStateValue(state);
    const isWon = stateValue.winnerBoardPiece === this.boardPiece;
    const isLost = stateValue.winnerBoardPiece === this.enemyBoardPiece;

    if (depth >= PlayerAi.MAX_DEPTH || isWon || isLost) {
      return {
        value:
          this.transformValues(
            stateValue.chain,
            stateValue.winnerBoardPiece,
            depth
          ) * this.ownBoardPieceValue,
        move: -1,
      };
    }

    return depth % 2 === 0
      ? this.minState(state, depth + 1, alpha, beta)
      : this.maxState(state, depth + 1, alpha, beta);
  }

  private maxState(
    state: BoardPiece[][],
    depth: number,
    alpha: number,
    beta: number
  ): { value: number; move: number } {
    let value = BIG_NEGATIVE_NUMBER;
    let moveQueue: number[] = [];
    for (let column = 0; column < BoardBase.COLUMNS; column++) {
      const { success: actionSuccessful, map: nextState } = getMockPlayerAction(
        state,
        this.boardPiece,
        column
      );
      if (!actionSuccessful) continue;
      const { value: nextValue } = this.getMove(nextState, depth, alpha, beta);
      if (nextValue > value) {
        value = nextValue;
        moveQueue = [column];
      } else if (nextValue === value) {
        moveQueue.push(column);
      }
      if (value > beta) {
        return { value, move: choose(moveQueue) };
      }
      alpha = Math.max(alpha, value);
    }
    return { value, move: choose(moveQueue) };
  }

  private minState(
    state: BoardPiece[][],
    depth: number,
    alpha: number,
    beta: number
  ): { value: number; move: number } {
    let value = BIG_POSITIVE_NUMBER;
    let moveQueue: number[] = [];
    for (let column = 0; column < BoardBase.COLUMNS; column++) {
      const { success: actionSuccessful, map: nextState } = getMockPlayerAction(
        state,
        this.enemyBoardPiece,
        column
      );
      if (!actionSuccessful) continue;
      const { value: nextValue } = this.getMove(nextState, depth, alpha, beta);
      if (nextValue < value) {
        value = nextValue;
        moveQueue = [column];
      } else if (nextValue === value) {
        moveQueue.push(column);
      }
      if (value < alpha) {
        return { value, move: choose(moveQueue) };
      }
      beta = Math.min(beta, value);
    }
    return { value, move: choose(moveQueue) };
  }

  async getAction(board: BoardBase): Promise<number> {
    const state = clone(board.map);
    const action = this.maxState(
      state,
      0,
      BIG_NEGATIVE_NUMBER,
      BIG_POSITIVE_NUMBER
    );
    return action.move;
  }
}
