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
    </ul>
  );
};
