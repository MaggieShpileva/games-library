import { BoardBase, BoardPiece } from './boardBase';

export abstract class Player {
  boardPiece: BoardPiece;
  label: string;

  abstract getAction(board: BoardBase): Promise<number>;

  constructor(boardPiece: BoardPiece, label: string) {
    this.boardPiece = boardPiece;
    this.label = label;
  }
}

export class PlayerHuman extends Player {
  clickPromiseResolver: ((column: number) => void) | null = null;

  constructor(boardPiece: BoardPiece, label: string) {
    super(boardPiece, label);
  }

  doAction(column: number) {
    if (
      this.clickPromiseResolver &&
      column >= 0 &&
      column < BoardBase.COLUMNS
    ) {
      this.clickPromiseResolver(column);
    }
  }

  getAction(board: BoardBase): Promise<number> {
    void board;
    return new Promise<number>((r) => {
      this.clickPromiseResolver = r;
    });
  }
}
