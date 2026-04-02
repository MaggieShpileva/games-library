import { getMockPlayerAction } from './utils';

export const BoardPiece = {
  EMPTY: ' ',
  PLAYER_1: '1',
  PLAYER_2: '2',
  DRAW: 'D',
} as const;

export type BoardPiece = (typeof BoardPiece)[keyof typeof BoardPiece];

export class BoardBase {
  static readonly ROWS = 6;
  static readonly COLUMNS = 7;
  static readonly PLAYER_1_COLOR = '#ef453b';
  static readonly PLAYER_2_COLOR = '#0059ff';
  static readonly PIECE_STROKE_STYLE = 'black';
  static readonly MASK_COLOR = '#d8d8d8';
  static CANVAS_HEIGHT = 0;
  static CANVAS_WIDTH = 0;
  static PIECE_RADIUS = 0;
  static MASK_X_BEGIN = 0;
  static MASK_Y_BEGIN = 0;
  static MESSAGE_WIDTH = 0;
  static MESSAGE_X_BEGIN = 0;
  static MESSAGE_Y_BEGIN = 0;
  static SCALE = 1;

  map: BoardPiece[][];
  protected winnerBoardPiece: BoardPiece;

  constructor() {
    this.map = [];
    this.winnerBoardPiece = BoardPiece.EMPTY;
    this.initConstants();
    this.reset();
  }

  reset() {
    this.map = [];
    for (let i = 0; i < BoardBase.ROWS; i++) {
      this.map.push([]);
      for (let j = 0; j < BoardBase.COLUMNS; j++) {
        this.map[i].push(BoardPiece.EMPTY);
      }
    }
    this.winnerBoardPiece = BoardPiece.EMPTY;
  }

  initConstants() {
    BoardBase.CANVAS_HEIGHT = BoardBase.SCALE * 480;
    BoardBase.CANVAS_WIDTH = BoardBase.SCALE * 640;
    BoardBase.PIECE_RADIUS = BoardBase.SCALE * 25;
    BoardBase.MASK_X_BEGIN =
      Math.max(
        0,
        BoardBase.CANVAS_WIDTH -
          (3 * BoardBase.COLUMNS + 1) * BoardBase.PIECE_RADIUS
      ) / 2;
    BoardBase.MASK_Y_BEGIN =
      Math.max(
        0,
        BoardBase.CANVAS_HEIGHT -
          (3 * BoardBase.ROWS + 1) * BoardBase.PIECE_RADIUS
      ) / 2;
    BoardBase.MESSAGE_WIDTH = BoardBase.SCALE * 400;
    BoardBase.MESSAGE_X_BEGIN =
      (BoardBase.CANVAS_WIDTH - BoardBase.MESSAGE_WIDTH) / 2;
    BoardBase.MESSAGE_Y_BEGIN = BoardBase.SCALE * 20;
  }

  async applyPlayerAction(
    player: { boardPiece: BoardPiece },
    column: number
  ): Promise<boolean> {
    const { success: actionSuccessful, map: nextState } = getMockPlayerAction(
      this.map,
      player.boardPiece,
      column
    );
    this.map = nextState;
    return actionSuccessful;
  }

  getWinner(): BoardPiece {
    if (this.winnerBoardPiece !== BoardPiece.EMPTY) {
      return this.winnerBoardPiece;
    }
    const direction = [
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    const isWinningSequence = (
      i: number,
      j: number,
      playerPiece: BoardPiece,
      dir: number[],
      count: number
    ): boolean => {
      if (count >= 4) return true;
      if (
        i < 0 ||
        j < 0 ||
        i >= BoardBase.ROWS ||
        j >= BoardBase.COLUMNS ||
        this.map[i][j] !== playerPiece
      ) {
        return false;
      }
      return isWinningSequence(
        i + dir[0],
        j + dir[1],
        playerPiece,
        dir,
        count + 1
      );
    };
    let countEmpty = 0;
    for (let i = 0; i < BoardBase.ROWS; i++) {
      for (let j = 0; j < BoardBase.COLUMNS; j++) {
        const playerPiece = this.map[i][j];
        if (playerPiece !== BoardPiece.EMPTY) {
          for (let k = 0; k < direction.length; k++) {
            const isWon = isWinningSequence(
              i + direction[k][0],
              j + direction[k][1],
              playerPiece,
              direction[k],
              1
            );
            if (isWon) {
              return (this.winnerBoardPiece = playerPiece);
            }
          }
        } else {
          countEmpty++;
        }
      }
    }
    if (countEmpty === 0) {
      return (this.winnerBoardPiece = BoardPiece.DRAW);
    }
    return BoardPiece.EMPTY;
  }

  protected getPlayerColor(boardPiece: BoardPiece): string {
    switch (boardPiece) {
      case BoardPiece.PLAYER_1:
        return BoardBase.PLAYER_1_COLOR;
      case BoardPiece.PLAYER_2:
        return BoardBase.PLAYER_2_COLOR;
      default:
        return 'transparent';
    }
  }
}
