import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@/components/UI';

export const Home: FC = () => {
  return (
    <ul className="list">
      <Link to="/sapper">
        <Typography variant="regular">Сапер</Typography>
      </Link>
      <Link to="/tower-blocks">
        <Typography variant="regular">Tower Blocks</Typography>
      </Link>
      <Link to="/crossy-road">
        <Typography variant="regular">Crossy Road</Typography>
      </Link>
      <Link to="/tic-tac-toe">
        <Typography variant="regular">Tic-Tac-Toe</Typography>
      </Link>
      <Link to="/stick-hero">
        <Typography variant="regular">Stick Hero</Typography>
      </Link>
      <Link to="/memory-game">
        <Typography variant="regular">Memory Game</Typography>
      </Link>
      <Link to="/bullseye">
        <Typography variant="regular">Bullseye</Typography>
      </Link>
    </ul>
  );
};
