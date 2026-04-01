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
import { Coloron } from './components/Game/Coloron';
import { RockPaperScissors } from './components/Game/RockPaperScissors';
import { SkatingBunny } from './components/Game/SkatingBunny';
import { SimulatorGame } from './components/Game/SimulatorGame';
import { InfiniteRunner } from './components/Game/InfiniteRunner';
import { Platform } from './components/Game/Platform';

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
      {
        path: 'coloron',
        element: <Coloron />,
      },
      {
        path: 'rock-paper-scissors',
        element: <RockPaperScissors />,
      },
      {
        path: 'skating-bunny',
        element: <SkatingBunny />,
      },
      {
        path: 'simulator-game',
        element: <SimulatorGame />,
      },
      {
        path: 'infinite-runner',
        element: <InfiniteRunner />,
      },
      {
        path: 'platform',
        element: <Platform />,
      },
    ],
  },
]);

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
