import type { FC } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { Error } from './pages/Error';
import { Layout } from './components/Feature';
import { Sapper } from './components/Game/Sapper';
import { TowerBlocks } from './components/Game/TowerBlocks';
import { CrossyRoad } from './components/Game/CrossyRoad';
import { TicTacToe } from './components/Game/TicTacToe';
import { StickHero } from './components/Game/StickHero';
import { MemoryGame } from './components/Game/MemoryGame';
import { Bullseye } from './components/Game/Bullseye';
import { Snake } from './components/Game/Snake';
import { OldSchoolRacing } from './components/Game/OldSchoolRacing';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'sapper',
        element: <Sapper />,
      },
      {
        path: 'tower-blocks',
        element: <TowerBlocks />,
      },
      {
        path: 'crossy-road',
        element: <CrossyRoad />,
      },
      {
        path: 'tic-tac-toe',
        element: <TicTacToe />,
      },
      {
        path: 'stick-hero',
        element: <StickHero />,
      },
      {
        path: 'memory-game',
        element: <MemoryGame />,
      },
      {
        path: 'bullseye',
        element: <Bullseye />,
      },
      {
        path: 'snake',
        element: <Snake />,
      },
      {
        path: 'old-school-racing',
        element: <OldSchoolRacing />,
      },
    ],
  },
]);

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
