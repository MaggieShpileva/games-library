/** Мини-движок шахмат без внешних библиотек. Доска: r=0 — 8-я горизонталь, f=0 — линия a. */

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type Piece = { t: PieceType; c: Color };

export type Pos = { r: number; f: number };

export type Move = {
  from: Pos;
  to: Pos;
  promotion?: PieceType;
};

export type CastlingRights = {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
};

export type GameState = {
  board: (Piece | null)[][];
  turn: Color;
  castling: CastlingRights;
  ep: Pos | null;
};

export type Board = (Piece | null)[][];

const SIZE = 8;

export function inBounds(r: number, f: number): boolean {
  return r >= 0 && r < SIZE && f >= 0 && f < SIZE;
}

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null as Piece | null)
  );
}

export function createInitialState(): GameState {
  const board = emptyBoard();
  const back: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let f = 0; f < SIZE; f++) {
    board[0][f] = { t: back[f], c: 'b' };
    board[7][f] = { t: back[f], c: 'w' };
    board[1][f] = { t: 'p', c: 'b' };
    board[6][f] = { t: 'p', c: 'w' };
  }
  return {
    board,
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    ep: null,
  };
}

function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((c) => (c ? { ...c } : null)));
}

export function posToSquare(r: number, f: number): string {
  return `${String.fromCharCode(97 + f)}${8 - r}`;
}

export function squareAttacked(
  board: Board,
  tr: number,
  tf: number,
  byColor: Color
): boolean {
  for (const df of [-1, 1]) {
    const pr = tr + (byColor === 'w' ? 1 : -1);
    const pf = tf + df;
    if (inBounds(pr, pf)) {
      const p = board[pr][pf];
      if (p && p.c === byColor && p.t === 'p') return true;
    }
  }

  const kd: [number, number][] = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  for (const [ddr, ddf] of kd) {
    const pr = tr + ddr;
    const pf = tf + ddf;
    if (inBounds(pr, pf)) {
      const p = board[pr][pf];
      if (p && p.c === byColor && p.t === 'n') return true;
    }
  }

  for (let ddr = -1; ddr <= 1; ddr++) {
    for (let ddf = -1; ddf <= 1; ddf++) {
      if (ddr === 0 && ddf === 0) continue;
      const pr = tr + ddr;
      const pf = tf + ddf;
      if (inBounds(pr, pf)) {
        const p = board[pr][pf];
        if (p && p.c === byColor && p.t === 'k') return true;
      }
    }
  }

  const orth: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [ddr, ddf] of orth) {
    let pr = tr + ddr;
    let pf = tf + ddf;
    while (inBounds(pr, pf)) {
      const p = board[pr][pf];
      if (p) {
        if (p.c === byColor && (p.t === 'r' || p.t === 'q')) return true;
        break;
      }
      pr += ddr;
      pf += ddf;
    }
  }

  const diag: [number, number][] = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [ddr, ddf] of diag) {
    let pr = tr + ddr;
    let pf = tf + ddf;
    while (inBounds(pr, pf)) {
      const p = board[pr][pf];
      if (p) {
        if (p.c === byColor && (p.t === 'b' || p.t === 'q')) return true;
        break;
      }
      pr += ddr;
      pf += ddf;
    }
  }

  return false;
}

export function findKing(board: Board, color: Color): Pos | null {
  for (let r = 0; r < SIZE; r++) {
    for (let f = 0; f < SIZE; f++) {
      const p = board[r][f];
      if (p && p.c === color && p.t === 'k') return { r, f };
    }
  }
  return null;
}

export function isInCheck(state: GameState, color: Color): boolean {
  const k = findKing(state.board, color);
  if (!k) return false;
  const opp: Color = color === 'w' ? 'b' : 'w';
  return squareAttacked(state.board, k.r, k.f, opp);
}

export function moveKey(m: Move): string {
  return `${m.from.r},${m.from.f}-${m.to.r},${m.to.f}-${m.promotion ?? ''}`;
}

export function movesEqual(a: Move, b: Move): boolean {
  return moveKey(a) === moveKey(b);
}

function addRayMoves(
  board: Board,
  r: number,
  f: number,
  color: Color,
  dirs: [number, number][],
  moves: Move[]
): void {
  for (const [ddr, ddf] of dirs) {
    let tr = r + ddr;
    let tf = f + ddf;
    while (inBounds(tr, tf)) {
      const target = board[tr][tf];
      if (!target) {
        moves.push({ from: { r, f }, to: { r: tr, f: tf } });
        tr += ddr;
        tf += ddf;
        continue;
      }
      if (target.c !== color) {
        moves.push({ from: { r, f }, to: { r: tr, f: tf } });
      }
      break;
    }
  }
}

function generatePseudoLegalMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  const { board, turn, castling, ep } = state;

  for (let r = 0; r < SIZE; r++) {
    for (let f = 0; f < SIZE; f++) {
      const piece = board[r][f];
      if (!piece || piece.c !== turn) continue;

      if (piece.t === 'p') {
        const dir = piece.c === 'w' ? -1 : 1;
        const startRank = piece.c === 'w' ? 6 : 1;
        const promoRank = piece.c === 'w' ? 0 : 7;

        const r1 = r + dir;
        if (inBounds(r1, f) && !board[r1][f]) {
          if (r1 === promoRank) {
            moves.push({ from: { r, f }, to: { r: r1, f }, promotion: 'q' });
          } else {
            moves.push({ from: { r, f }, to: { r: r1, f } });
            if (r === startRank) {
              const r2 = r + 2 * dir;
              if (inBounds(r2, f) && !board[r2][f]) {
                moves.push({ from: { r, f }, to: { r: r2, f } });
              }
            }
          }
        }

        for (const df of [-1, 1]) {
          const tr = r + dir;
          const tf = f + df;
          if (!inBounds(tr, tf)) continue;
          const target = board[tr][tf];
          if (target && target.c !== piece.c) {
            if (tr === promoRank) {
              moves.push({
                from: { r, f },
                to: { r: tr, f: tf },
                promotion: 'q',
              });
            } else {
              moves.push({ from: { r, f }, to: { r: tr, f: tf } });
            }
          } else if (ep && tr === ep.r && tf === ep.f && !target) {
            const victimR = tr + (piece.c === 'w' ? 1 : -1);
            if (inBounds(victimR, tf)) {
              const victim = board[victimR][tf];
              if (victim && victim.c !== piece.c && victim.t === 'p') {
                moves.push({ from: { r, f }, to: { r: tr, f: tf } });
              }
            }
          }
        }
        continue;
      }

      if (piece.t === 'n') {
        const jumps: [number, number][] = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (const [ddr, ddf] of jumps) {
          const tr = r + ddr;
          const tf = f + ddf;
          if (!inBounds(tr, tf)) continue;
          const target = board[tr][tf];
          if (!target || target.c !== piece.c) {
            moves.push({ from: { r, f }, to: { r: tr, f: tf } });
          }
        }
        continue;
      }

      if (piece.t === 'b') {
        addRayMoves(
          board,
          r,
          f,
          turn,
          [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
          ],
          moves
        );
        continue;
      }

      if (piece.t === 'r') {
        addRayMoves(
          board,
          r,
          f,
          turn,
          [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ],
          moves
        );
        continue;
      }

      if (piece.t === 'q') {
        addRayMoves(
          board,
          r,
          f,
          turn,
          [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ],
          moves
        );
        continue;
      }

      if (piece.t === 'k') {
        for (let ddr = -1; ddr <= 1; ddr++) {
          for (let ddf = -1; ddf <= 1; ddf++) {
            if (ddr === 0 && ddf === 0) continue;
            const tr = r + ddr;
            const tf = f + ddf;
            if (!inBounds(tr, tf)) continue;
            const target = board[tr][tf];
            if (!target || target.c !== piece.c) {
              moves.push({ from: { r, f }, to: { r: tr, f: tf } });
            }
          }
        }

        if (turn === 'w' && r === 7 && f === 4 && castling.wK) {
          if (
            !board[7][5] &&
            !board[7][6] &&
            board[7][7]?.t === 'r' &&
            board[7][7]?.c === 'w' &&
            !isInCheck(state, 'w') &&
            !squareAttacked(board, 7, 5, 'b') &&
            !squareAttacked(board, 7, 6, 'b')
          ) {
            moves.push({ from: { r: 7, f: 4 }, to: { r: 7, f: 6 } });
          }
        }
        if (turn === 'w' && r === 7 && f === 4 && castling.wQ) {
          if (
            !board[7][1] &&
            !board[7][2] &&
            !board[7][3] &&
            board[7][0]?.t === 'r' &&
            board[7][0]?.c === 'w' &&
            !isInCheck(state, 'w') &&
            !squareAttacked(board, 7, 3, 'b') &&
            !squareAttacked(board, 7, 2, 'b')
          ) {
            moves.push({ from: { r: 7, f: 4 }, to: { r: 7, f: 2 } });
          }
        }
        if (turn === 'b' && r === 0 && f === 4 && castling.bK) {
          if (
            !board[0][5] &&
            !board[0][6] &&
            board[0][7]?.t === 'r' &&
            board[0][7]?.c === 'b' &&
            !isInCheck(state, 'b') &&
            !squareAttacked(board, 0, 5, 'w') &&
            !squareAttacked(board, 0, 6, 'w')
          ) {
            moves.push({ from: { r: 0, f: 4 }, to: { r: 0, f: 6 } });
          }
        }
        if (turn === 'b' && r === 0 && f === 4 && castling.bQ) {
          if (
            !board[0][1] &&
            !board[0][2] &&
            !board[0][3] &&
            board[0][0]?.t === 'r' &&
            board[0][0]?.c === 'b' &&
            !isInCheck(state, 'b') &&
            !squareAttacked(board, 0, 3, 'w') &&
            !squareAttacked(board, 0, 2, 'w')
          ) {
            moves.push({ from: { r: 0, f: 4 }, to: { r: 0, f: 2 } });
          }
        }
      }
    }
  }

  return moves;
}

function applyMoveUnchecked(state: GameState, m: Move): GameState {
  const board = cloneBoard(state.board);
  const turn: Color = state.turn === 'w' ? 'b' : 'w';
  const castling = { ...state.castling };
  let ep: Pos | null = null;

  const moving = board[m.from.r][m.from.f]!;

  if (moving.t === 'k' && Math.abs(m.to.f - m.from.f) === 2) {
    board[m.to.r][m.to.f] = moving;
    board[m.from.r][m.from.f] = null;
    if (moving.c === 'w') {
      castling.wK = false;
      castling.wQ = false;
      if (m.to.f === 6) {
        board[7][7] = null;
        board[7][5] = { t: 'r', c: 'w' };
      } else {
        board[7][0] = null;
        board[7][3] = { t: 'r', c: 'w' };
      }
    } else {
      castling.bK = false;
      castling.bQ = false;
      if (m.to.f === 6) {
        board[0][7] = null;
        board[0][5] = { t: 'r', c: 'b' };
      } else {
        board[0][0] = null;
        board[0][3] = { t: 'r', c: 'b' };
      }
    }
    return { board, turn, castling, ep };
  }

  if (
    moving.t === 'p' &&
    state.ep &&
    m.to.r === state.ep.r &&
    m.to.f === state.ep.f &&
    !board[m.to.r][m.to.f]
  ) {
    board[m.from.r][m.from.f] = null;
    const victimR = m.to.r + (moving.c === 'w' ? 1 : -1);
    board[victimR][m.to.f] = null;
    board[m.to.r][m.to.f] = { t: m.promotion ?? 'q', c: moving.c };

    if (moving.c === 'w') {
      if (m.from.r === 7 && m.from.f === 0) castling.wQ = false;
      if (m.from.r === 7 && m.from.f === 7) castling.wK = false;
    } else {
      if (m.from.r === 0 && m.from.f === 0) castling.bQ = false;
      if (m.from.r === 0 && m.from.f === 7) castling.bK = false;
    }
    return { board, turn, castling, ep };
  }

  const captured = board[m.to.r][m.to.f];
  board[m.from.r][m.from.f] = null;

  if (moving.t === 'p' && Math.abs(m.to.r - m.from.r) === 2) {
    ep = { r: (m.from.r + m.to.r) / 2, f: m.from.f };
  }

  let newPiece: Piece = moving;
  if (moving.t === 'p' && (m.to.r === 0 || m.to.r === 7)) {
    newPiece = { t: m.promotion ?? 'q', c: moving.c };
  }

  board[m.to.r][m.to.f] = newPiece;

  if (moving.t === 'k') {
    if (moving.c === 'w') {
      castling.wK = false;
      castling.wQ = false;
    } else {
      castling.bK = false;
      castling.bQ = false;
    }
  }

  if (moving.t === 'r') {
    if (moving.c === 'w') {
      if (m.from.r === 7 && m.from.f === 0) castling.wQ = false;
      if (m.from.r === 7 && m.from.f === 7) castling.wK = false;
    } else {
      if (m.from.r === 0 && m.from.f === 0) castling.bQ = false;
      if (m.from.r === 0 && m.from.f === 7) castling.bK = false;
    }
  }

  if (captured?.t === 'r') {
    if (m.to.r === 7 && m.to.f === 0) castling.wQ = false;
    if (m.to.r === 7 && m.to.f === 7) castling.wK = false;
    if (m.to.r === 0 && m.to.f === 0) castling.bQ = false;
    if (m.to.r === 0 && m.to.f === 7) castling.bK = false;
  }

  return { board, turn, castling, ep };
}

export function getLegalMoves(state: GameState): Move[] {
  const pseudo = generatePseudoLegalMoves(state);
  const legal: Move[] = [];
  const side = state.turn;
  for (const m of pseudo) {
    const next = applyMoveUnchecked(state, m);
    if (!isInCheck(next, side)) {
      legal.push(m);
    }
  }
  return legal;
}

export function applyMove(state: GameState, m: Move): GameState | null {
  const legal = getLegalMoves(state);
  if (!legal.some((x) => movesEqual(x, m))) return null;
  return applyMoveUnchecked(state, m);
}

export function getGameStatus(
  state: GameState
): 'playing' | 'checkmate' | 'stalemate' {
  const moves = getLegalMoves(state);
  if (moves.length > 0) return 'playing';
  if (isInCheck(state, state.turn)) return 'checkmate';
  return 'stalemate';
}

const PIECE_CHARS: Record<Color, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export function pieceChar(p: Piece): string {
  return PIECE_CHARS[p.c][p.t];
}
