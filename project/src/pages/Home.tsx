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
      <Link to="/snake">
        <Typography variant="regular">Змейка</Typography>
      </Link>
      <Link to="/old-school-racing">
        <Typography variant="regular">Old School Racing</Typography>
      </Link>
      <Link to="/coloron">
        <Typography variant="regular">Coloron</Typography>
      </Link>
      <Link to="/rock-paper-scissors">
        <Typography variant="regular">Rock Paper Scissors</Typography>
      </Link>
    </ul>
  );
};
