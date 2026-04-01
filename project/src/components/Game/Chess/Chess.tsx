import { useCallback, useMemo, useState } from 'react';
import { Button, PageHeader } from '@/components/UI';
import {
  applyMove,
  createInitialState,
  findKing,
  getGameStatus,
  getLegalMoves,
  isInCheck,
  pieceChar,
  posToSquare,
  type GameState,
  type Move,
  type Pos,
} from './chessEngine';
import styles from './Chess.module.scss';

const SIZE = 8;

export const Chess = () => {
  const [game, setGame] = useState<GameState>(() => createInitialState());
  const [selected, setSelected] = useState<Pos | null>(null);

  const legalMoves = useMemo(() => getLegalMoves(game), [game]);

  const movesFromSquare = useCallback(
    (pos: Pos): Move[] =>
      legalMoves.filter((m) => m.from.r === pos.r && m.from.f === pos.f),
    [legalMoves]
  );

  const destinations = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(movesFromSquare(selected).map((m) => `${m.to.r},${m.to.f}`));
  }, [selected, movesFromSquare]);

  const gameStatus = useMemo(() => getGameStatus(game), [game]);
  const inCheck = useMemo(() => isInCheck(game, game.turn), [game]);

  const newGame = useCallback(() => {
    setGame(createInitialState());
    setSelected(null);
  }, []);

  const onSquareClick = useCallback(
    (r: number, f: number) => {
      if (gameStatus !== 'playing') return;

      const piece = game.board[r][f];
      const trySelect = () => {
        if (piece && piece.c === game.turn) {
          setSelected({ r, f });
        }
      };

      if (selected) {
        if (selected.r === r && selected.f === f) {
          setSelected(null);
          return;
        }

        const move = movesFromSquare(selected).find(
          (m) => m.to.r === r && m.to.f === f
        );
        if (move) {
          const next = applyMove(game, move);
          if (next) {
            setGame(next);
            setSelected(null);
            return;
          }
        }

        trySelect();
        return;
      }

      trySelect();
    },
    [game, gameStatus, selected, movesFromSquare]
  );

  const kingPos = useMemo(
    () => findKing(game.board, game.turn),
    [game.board, game.turn]
  );

  const statusText =
    gameStatus === 'checkmate'
      ? `Мат. Победили ${game.turn === 'w' ? 'чёрные' : 'белые'}.`
      : gameStatus === 'stalemate'
        ? 'Пат — ничья.'
        : inCheck
          ? `Шах ${game.turn === 'w' ? 'белым' : 'чёрным'}.`
          : `Ход ${game.turn === 'w' ? 'белых' : 'чёрных'}.`;

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Шахматы"
        link="https://ru.wikipedia.org/wiki/Шахматы"
      />
      <div className={styles.body}>
        <p className={styles.hint}>
          Кликните фигуру, затем клетку хода. Превращение пешки — в ферзя.
          Рокировка и взятие на проходе учитываются.
        </p>

        <div className={styles.toolbar}>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={newGame}
          >
            Новая партия
          </Button>
          <p className={styles.status} role="status">
            {statusText}
          </p>
        </div>

        <div className={styles.boardWrap}>
          <div className={styles.board} aria-label="Шахматная доска">
            {Array.from({ length: SIZE }, (_, r) =>
              Array.from({ length: SIZE }, (_, f) => {
                const light = (r + f) % 2 === 0;
                const p = game.board[r][f];
                const isSel = selected?.r === r && selected?.f === f;
                const dest = destinations.has(`${r},${f}`);
                const kingHere = kingPos?.r === r && kingPos?.f === f;
                const checkFlash =
                  inCheck && kingHere && gameStatus === 'playing';

                return (
                  <button
                    key={`${r}-${f}`}
                    type="button"
                    className={[
                      styles.cell,
                      light ? styles.light : styles.dark,
                      isSel ? styles.selected : '',
                      dest ? styles.canMove : '',
                      checkFlash ? styles.inCheck : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onSquareClick(r, f)}
                    aria-label={
                      p
                        ? `${posToSquare(r, f)}, ${pieceChar(p)}`
                        : posToSquare(r, f)
                    }
                  >
                    {p ? (
                      <span className={styles.piece} aria-hidden>
                        {pieceChar(p)}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
