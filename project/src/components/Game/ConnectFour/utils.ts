import { BoardBase, BoardPiece } from './boardBase.ts';

export const BIG_POSITIVE_NUMBER = 10 ** 9 + 7;
export const BIG_NEGATIVE_NUMBER = -BIG_POSITIVE_NUMBER;

export function isCoordOnColumn(
  coord: { x: number; y: number },
  columnXBegin: number,
  radius: number
): boolean {
  const dx = coord.x - columnXBegin;
  return dx * dx <= radius * radius;
}

export function getColumnFromCoord(coord: { x: number; y: number }): number {
  for (let i = 0; i < BoardBase.COLUMNS; i++) {
    if (
      isCoordOnColumn(
        coord,
        3 * BoardBase.PIECE_RADIUS * i +
          BoardBase.MASK_X_BEGIN +
          2 * BoardBase.PIECE_RADIUS,
        BoardBase.PIECE_RADIUS
      )
    ) {
      return i;
    }
  }
  return -1;
}

export function choose<T>(choice: T[]): T {
  return choice[Math.floor(Math.random() * choice.length)];
}

export function clone<T>(array: T[][]): T[][] {
  const arr: T[][] = [];
  for (let i = 0; i < array.length; i++) arr[i] = array[i].slice();
  return arr;
}

export function getMockPlayerAction(
  map: BoardPiece[][],
  boardPiece: BoardPiece,
  column: number
): { success: boolean; map: BoardPiece[][] } {
  const clonedMap = clone(map);

  if (
    clonedMap[0][column] !== BoardPiece.EMPTY ||
    column < 0 ||
    column >= BoardBase.COLUMNS
  ) {
    return { success: false, map: clonedMap };
  }

  let isColumnEverFilled = false;
  let row = 0;
  for (let i = 0; i < BoardBase.ROWS - 1; i++) {
    if (clonedMap[i + 1][column] !== BoardPiece.EMPTY) {
      isColumnEverFilled = true;
      row = i;
      break;
    }
  }
  if (!isColumnEverFilled) row = BoardBase.ROWS - 1;

  clonedMap[row][column] = boardPiece;

  return { success: true, map: clonedMap };
}

export function animationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
