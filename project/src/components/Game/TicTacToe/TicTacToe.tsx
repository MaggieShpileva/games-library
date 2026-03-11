import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/UI/PageHeader/PageHeader';
import styles from './TicTacToe.module.scss';

type CellValue = null | '1' | '2';
type Winner = null | '1' | '2' | 'tie';

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: CellValue[]): Winner {
  for (const [a, b, c] of WIN_LINES) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  if (board.every(Boolean)) return 'tie';
  return null;
}

const initialBoard: CellValue[] = Array(9).fill(null);

export const TicTacToe = () => {
  const [board, setBoard] = useState<CellValue[]>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<'1' | '2'>('1');
  const [winner, setWinner] = useState<Winner>(null);

  const handleRestart = useCallback(() => {
    setBoard(initialBoard);
    setCurrentPlayer('1');
    setWinner(null);
  }, []);

  const handleCellClick = useCallback(
    (index: number) => {
      if (winner || board[index]) return;
      const nextBoard = [...board];
      nextBoard[index] = currentPlayer;
      setBoard(nextBoard);
      const w = checkWinner(nextBoard);
      setWinner(w);
      if (!w) setCurrentPlayer(currentPlayer === '1' ? '2' : '1');
    },
    [board, currentPlayer, winner]
  );

  const endMessage =
    winner === 'tie' ? 'It is a tie!' : winner ? `Player ${winner} wins!` : '';

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Tic-Tac-Toe"
        link="https://codepen.io/ziga-miklic/pen/QWrGyW"
      />
      <div className={styles.ticTacToe}>
        {board.map((value, index) => (
          <button
            key={index}
            type="button"
            className={`${styles.cell} ${value ? styles[`player${value}`] : ''}`}
            onClick={() => handleCellClick(index)}
            disabled={!!winner || !!value}
            aria-label={
              value ? `Cell ${index}, player ${value}` : `Cell ${index}, empty`
            }
          >
            {value === '1' && <span className={styles.iconX}>×</span>}
            {value === '2' && <span className={styles.iconO}>○</span>}
          </button>
        ))}
        {winner && (
          <div className={styles.end} role="status">
            <h3>{endMessage}</h3>
            <button
              type="button"
              className={styles.restartBtn}
              onClick={handleRestart}
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
