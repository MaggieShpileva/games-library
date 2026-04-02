import { BoardBase, BoardPiece } from './boardBase';
import { animationFrame } from './utils';
import type { Player } from './player';

function drawCircle(
  context: CanvasRenderingContext2D,
  {
    x = 0,
    y = 0,
    r = 0,
    fillStyle = '',
    strokeStyle = '',
  }: {
    x?: number;
    y?: number;
    r?: number;
    fillStyle?: string;
    strokeStyle?: string;
  }
) {
  context.save();
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI, false);
  context.fill();
  context.restore();
}

export function onresize(): { add: (callback: () => void) => void } {
  const callbacks: Array<() => void> = [];
  let running = false;

  function resize() {
    if (!running) {
      running = true;
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(runCallbacks);
      } else {
        setTimeout(runCallbacks, 66);
      }
    }
  }

  function runCallbacks() {
    callbacks.forEach((cb) => cb());
    running = false;
  }

  return {
    add(callback: () => void) {
      if (!callbacks.length) window.addEventListener('resize', resize);
      callbacks.push(callback);
    },
  };
}

export function drawMask(board: ConnectFourBoard) {
  const context = board.context;
  context.save();
  context.fillStyle = BoardBase.MASK_COLOR;
  context.beginPath();
  const doubleRadius = 2 * BoardBase.PIECE_RADIUS;
  const tripleRadius = 3 * BoardBase.PIECE_RADIUS;
  for (let y = 0; y < BoardBase.ROWS; y++) {
    for (let x = 0; x < BoardBase.COLUMNS; x++) {
      context.arc(
        tripleRadius * x + BoardBase.MASK_X_BEGIN + doubleRadius,
        tripleRadius * y + BoardBase.MASK_Y_BEGIN + doubleRadius,
        BoardBase.PIECE_RADIUS,
        0,
        2 * Math.PI
      );
      context.rect(
        tripleRadius * x + BoardBase.MASK_X_BEGIN + 2 * doubleRadius,
        tripleRadius * y + BoardBase.MASK_Y_BEGIN,
        -2 * doubleRadius,
        2 * doubleRadius
      );
    }
  }
  context.fill();
  context.restore();
}

export function clearCanvas(board: ConnectFourBoard) {
  board.context.clearRect(
    0,
    0,
    BoardBase.CANVAS_WIDTH,
    BoardBase.CANVAS_HEIGHT
  );
}

export class ConnectFourBoard extends BoardBase {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context not available');
    this.context = ctx;
    this.getBoardScale();
    this.initConstants();
    this.reset();
    this.setupResize();
  }

  getBoardScale() {
    BoardBase.SCALE = window.innerWidth < 640 ? 0.5 : 1;
  }

  setupResize() {
    let prevBoardScale = BoardBase.SCALE;
    onresize().add(() => {
      this.getBoardScale();
      if (prevBoardScale !== BoardBase.SCALE) {
        prevBoardScale = BoardBase.SCALE;
        this.initConstants();
        clearCanvas(this);
        this.render();
      }
    });
  }

  reset() {
    super.reset();
    if (this.canvas) {
      clearCanvas(this);
      this.render();
    }
  }

  initConstants() {
    super.initConstants();
    if (!this.canvas || !this.context) return;
    const dpr = self.devicePixelRatio || 1;
    this.canvas.width = BoardBase.CANVAS_WIDTH * dpr;
    this.canvas.height = BoardBase.CANVAS_HEIGHT * dpr;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.scale(dpr, dpr);
    this.canvas.style.width = `${BoardBase.CANVAS_WIDTH}px`;
    this.canvas.style.height = `${BoardBase.CANVAS_HEIGHT}px`;
  }

  private async animateAction(
    newRow: number,
    column: number,
    boardPiece: BoardPiece
  ): Promise<void> {
    const fillStyle = this.getPlayerColor(boardPiece);
    let currentY = 0;
    const doAnimation = async () => {
      clearCanvas(this);
      drawCircle(this.context, {
        x:
          3 * BoardBase.PIECE_RADIUS * column +
          BoardBase.MASK_X_BEGIN +
          2 * BoardBase.PIECE_RADIUS,
        y: currentY + BoardBase.MASK_Y_BEGIN + 2 * BoardBase.PIECE_RADIUS,
        r: BoardBase.PIECE_RADIUS,
        fillStyle,
        strokeStyle: BoardBase.PIECE_STROKE_STYLE,
      });
      this.render();
      currentY += BoardBase.PIECE_RADIUS;
    };
    while (newRow * 3 * BoardBase.PIECE_RADIUS >= currentY) {
      await animationFrame();
      await doAnimation();
    }
  }

  render() {
    drawMask(this);
    for (let y = 0; y < BoardBase.ROWS; y++) {
      for (let x = 0; x < BoardBase.COLUMNS; x++) {
        drawCircle(this.context, {
          x:
            3 * BoardBase.PIECE_RADIUS * x +
            BoardBase.MASK_X_BEGIN +
            2 * BoardBase.PIECE_RADIUS,
          y:
            3 * BoardBase.PIECE_RADIUS * y +
            BoardBase.MASK_Y_BEGIN +
            2 * BoardBase.PIECE_RADIUS,
          r: BoardBase.PIECE_RADIUS,
          fillStyle: this.getPlayerColor(this.map[y][x]),
          strokeStyle: BoardBase.PIECE_STROKE_STYLE,
        });
      }
    }
  }

  override async applyPlayerAction(
    player: Player,
    column: number
  ): Promise<boolean> {
    if (
      this.map[0][column] !== BoardPiece.EMPTY ||
      column < 0 ||
      column >= BoardBase.COLUMNS
    ) {
      return false;
    }

    let isColumnEverFilled = false;
    let row = 0;
    for (let i = 0; i < BoardBase.ROWS - 1; i++) {
      if (this.map[i + 1][column] !== BoardPiece.EMPTY) {
        isColumnEverFilled = true;
        row = i;
        break;
      }
    }
    if (!isColumnEverFilled) {
      row = BoardBase.ROWS - 1;
    }

    await this.animateAction(row, column, player.boardPiece);
    this.map[row][column] = player.boardPiece;
    await animationFrame();
    this.render();
    return true;
  }
}
