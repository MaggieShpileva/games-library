import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './Sapper.module.scss';
import { PageHeader } from '@/components/UI';

const ROWS = 12;
const COLS = 12;
const MINES = 10;
const TOTAL = ROWS * COLS;

const NUMBER_COLORS = [
  '#0000ff',
  '#008100',
  '#ff1300',
  '#000083',
  '#810500',
  '#2a9494',
  '#000000',
  '#808080',
];

type CellState = {
  isMine: boolean;
  neighbourCount: number;
  revealed: boolean;
  flagged: boolean;
};

const createEmptyGrid = (): CellState[] =>
  Array.from({ length: TOTAL }, () => ({
    isMine: false,
    neighbourCount: 0,
    revealed: false,
    flagged: false,
  }));

const placeMines = (excludeIndex: number): number[] => {
  const positions: number[] = [];
  while (positions.length < MINES) {
    const pos = Math.floor(Math.random() * TOTAL);
    if (pos !== excludeIndex && !positions.includes(pos)) positions.push(pos);
  }
  return positions;
};

const buildGrid = (minePositions: Set<number>): CellState[] => {
  const grid = createEmptyGrid();
  minePositions.forEach((i) => {
    grid[i].isMine = true;
  });
  for (let i = 0; i < TOTAL; i++) {
    if (grid[i].isMine) continue;
    const x = i % COLS;
    const y = Math.floor(i / COLS);
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
          const ni = ny * COLS + nx;
          if (grid[ni].isMine) count++;
        }
      }
    }
    grid[i].neighbourCount = count;
  }
  return grid;
};

export const Sapper = () => {
  const [grid, setGrid] = useState<CellState[]>(() => createEmptyGrid());
  const [minePositions, setMinePositions] = useState<Set<number> | null>(null);
  const [mode, setMode] = useState<'mine' | 'flag'>('mine');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>(
    'playing'
  );
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const started = startTime !== null;
  const minesLeft = MINES - flagsPlaced;
  const nonMineRevealed = useMemo(() => {
    return grid.filter((c) => !c.isMine && c.revealed).length;
  }, [grid]);
  const nonMineCount = TOTAL - (minePositions?.size ?? MINES);
  const isWon =
    gameStatus === 'playing' &&
    minePositions !== null &&
    nonMineRevealed === nonMineCount;
  const status: 'playing' | 'won' | 'lost' = isWon ? 'won' : gameStatus;

  useEffect(() => {
    if (!started || status !== 'playing') return;
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000
    );
    return () => clearInterval(t);
  }, [started, startTime, status]);

  const reset = useCallback(() => {
    setGrid(createEmptyGrid());
    setMinePositions(null);
    setGameStatus('playing');
    setFlagsPlaced(0);
    setStartTime(null);
    setElapsed(0);
  }, []);

  const reveal = useCallback(
    (i: number) => {
      if (status !== 'playing') return;
      const cell = grid[i];
      if (cell.revealed || cell.flagged) return;

      if (minePositions === null) return;

      if (cell.isMine) {
        setGameStatus('lost');
        setGrid((prev) =>
          prev.map((c, idx) =>
            c.isMine || idx === i ? { ...c, revealed: true } : c
          )
        );
        return;
      }

      setGrid((prev) => {
        const next = prev.map((c) => ({ ...c }));
        if (cell.neighbourCount === 0) {
          const revealZero = (idx: number) => {
            const c = next[idx];
            if (c.revealed || c.flagged || c.isMine) return;
            next[idx] = { ...c, revealed: true };
            if (c.neighbourCount === 0) {
              const x = idx % COLS;
              const y = Math.floor(idx / COLS);
              for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS)
                    revealZero(ny * COLS + nx);
                }
              }
            }
          };
          revealZero(i);
        } else {
          next[i] = { ...next[i], revealed: true };
        }
        return next;
      });
    },
    [status, grid, minePositions]
  );

  const toggleFlag = useCallback(
    (i: number) => {
      if (status !== 'playing') return;
      const cell = grid[i];
      if (cell.revealed) return;
      setGrid((prev) =>
        prev.map((c, idx) => (idx === i ? { ...c, flagged: !c.flagged } : c))
      );
      setFlagsPlaced((f) => (grid[i].flagged ? f - 1 : f + 1));
    },
    [status, grid]
  );

  const handleCellClick = useCallback(
    (i: number) => {
      if (status !== 'playing') return;
      if (minePositions === null) {
        const mines = placeMines(i);
        setMinePositions(new Set(mines));
        setStartTime(Date.now());
        const newGrid = buildGrid(new Set(mines));
        if (mode === 'flag') {
          newGrid[i] = { ...newGrid[i], flagged: true };
          setGrid(newGrid);
          setFlagsPlaced(1);
        } else {
          const cell = newGrid[i];
          if (cell.neighbourCount === 0) {
            const revealZero = (idx: number) => {
              if (newGrid[idx].revealed) return;
              newGrid[idx] = { ...newGrid[idx], revealed: true };
              if (newGrid[idx].neighbourCount === 0) {
                const x = idx % COLS;
                const y = Math.floor(idx / COLS);
                for (let dx = -1; dx <= 1; dx++)
                  for (let dy = -1; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS)
                      revealZero(ny * COLS + nx);
                  }
              }
            };
            revealZero(i);
          } else {
            newGrid[i] = { ...newGrid[i], revealed: true };
          }
          setGrid(newGrid);
        }
        return;
      }
      if (mode === 'flag') {
        toggleFlag(i);
      } else {
        reveal(i);
      }
    },
    [status, mode, minePositions, reveal, toggleFlag]
  );

  const handleCellContextMenu = useCallback(
    (e: React.MouseEvent, i: number) => {
      e.preventDefault();
      if (status !== 'playing') return;
      toggleFlag(i);
    },
    [status, toggleFlag]
  );

  const timerStr = String(Math.min(999, elapsed)).padStart(3, '0');
  const counterStr =
    minesLeft >= 0
      ? String(minesLeft).padStart(3, '0')
      : `-${String(-minesLeft).padStart(2, '0')}`;

  const counterEmoji =
    status === 'lost'
      ? '😣'
      : status === 'won'
        ? '😎'
        : minesLeft > MINES
          ? '🖕'
          : minesLeft === MINES
            ? '😕'
            : minesLeft === MINES - 1
              ? '🤓'
              : minesLeft >= Math.round((MINES * 3) / 4)
                ? '😃'
                : minesLeft >= Math.round((MINES * 2) / 3)
                  ? '😊'
                  : minesLeft >= Math.round(MINES / 2)
                    ? '🙂'
                    : minesLeft >= Math.round(MINES / 3)
                      ? '😏'
                      : minesLeft >= 1
                        ? '😐'
                        : '🤔';

  return (
    <div className={styles.container}>
      <PageHeader
        title="Сапер"
        link="https://codepen.io/bali_balo/pen/BLJONZ"
      />
      <div className={styles.wrapper}>
        <div className={styles.actionSelector}>
          <label
            className={clsx(mode === 'mine' && styles.actionActive)}
            onClick={() => setMode('mine')}
          >
            ⛏
          </label>
          <label
            className={clsx(mode === 'flag' && styles.actionActive)}
            onClick={() => setMode('flag')}
          >
            🚩
          </label>
        </div>

        <div className={styles.infos}>
          <div className={styles.counter} title={String(minesLeft)}>
            <span className={styles.counterEmoji}>{counterEmoji}</span>
            <span className={styles.counterValue}>{counterStr}</span>
          </div>
          <div className={styles.timer}>
            <span className={styles.digit}>{timerStr[0]}</span>
            <span className={styles.digit}>{timerStr[1]}</span>
            <span className={styles.digit}>{timerStr[2]}</span>
          </div>
        </div>

        <div className={styles.grid}>
          {grid.map((cell, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className={clsx(
                styles.cell,
                cell.revealed && styles.cellRevealed,
                cell.revealed && cell.isMine && styles.cellMine,
                cell.revealed &&
                  !cell.isMine &&
                  cell.neighbourCount > 0 &&
                  styles.cellNumber
              )}
              style={
                cell.revealed && !cell.isMine && cell.neighbourCount > 0
                  ? {
                      ['--num-color' as string]:
                        NUMBER_COLORS[cell.neighbourCount - 1],
                    }
                  : undefined
              }
              onClick={() => handleCellClick(i)}
              onContextMenu={(e) => handleCellContextMenu(e, i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCellClick(i);
                }
              }}
            >
              {cell.revealed && cell.isMine && '💣'}
              {cell.revealed &&
                !cell.isMine &&
                cell.neighbourCount > 0 &&
                cell.neighbourCount}
              {cell.flagged && !cell.revealed && '🚩'}
            </div>
          ))}

          {status === 'lost' && (
            <button
              type="button"
              className={styles.overlay}
              onClick={reset}
              tabIndex={-1}
            >
              Ooohhh 🙁
              <br />
              Click to try again
            </button>
          )}
          {status === 'won' && (
            <button
              type="button"
              className={clsx(styles.overlay, styles.overlayVictory)}
              onClick={reset}
              tabIndex={-1}
            >
              👌👀✔💯💯💯
              <br />
              Click to restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
