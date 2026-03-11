import type { FC } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { Error } from './pages/Error';
import { Layout } from './components/Feature';
import { Sapper } from './components/Game/Sapper';
import { SpaceHuggers } from './components/Game/SpaceHuggers';

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
        path: 'space-huggers',
        element: <SpaceHuggers />,
      },
    ],
  },
]);

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
