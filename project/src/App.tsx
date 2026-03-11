import type { FC } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { Error } from './pages/Error';
import { Layout } from './components/Feature';
import { Sapper } from './components/Game/Sapper';
import { TowerBlocks } from './components/Game/TowerBlocks';
import { CrossyRoad } from './components/Game/CrossyRoad';

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
    ],
  },
]);

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
