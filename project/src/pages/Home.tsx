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
        <Typography variant="regular">Постройка башни</Typography>
      </Link>
      <Link to="/crossy-road">
        <Typography variant="regular">Crossy Road (3D)</Typography>
      </Link>
      <Link to="/tic-tac-toe">
        <Typography variant="regular">Крестики-нолики</Typography>
      </Link>
      <Link to="/stick-hero">
        <Typography variant="regular">Stick Hero</Typography>
      </Link>
      <Link to="/memory-game">
        <Typography variant="regular">Карточки на память</Typography>
      </Link>
      <Link to="/bullseye">
        <Typography variant="regular">Стрельба из лука</Typography>
      </Link>
      <Link to="/snake">
        <Typography variant="regular">Змейка</Typography>
      </Link>
      <Link to="/old-school-racing">
        <Typography variant="regular">Олдскул гоночки</Typography>
      </Link>
      <Link to="/coloron">
        <Typography variant="regular">
          Мячик прыгает по разноцветным блокам
        </Typography>
      </Link>
      <Link to="/rock-paper-scissors">
        <Typography variant="regular">Камень, ножницы, бумага</Typography>
      </Link>
      <Link to="/skating-bunny">
        <Typography variant="regular">Казуалка с катанием на льду</Typography>
      </Link>
      <Link to="/simulator-game">
        <Typography variant="regular">
          Симулятор кодера (игра-тайкун на развитие)
        </Typography>
      </Link>
      <Link to="/infinite-runner">
        <Typography variant="regular">Прыжки по платформам</Typography>
      </Link>
      <Link to="/platform">
        <Typography variant="regular">Проходим мышкой лабиринты</Typography>
      </Link>
      <Link to="/slot-machine">
        <Typography variant="regular">Слоты</Typography>
      </Link>
      <Link to="/math-game">
        <Typography variant="regular">Математика (для умных)</Typography>
      </Link>
      <Link to="/quiz">
        <Typography variant="regular">Система квиза</Typography>
      </Link>
      <Link to="/scratch">
        <Typography variant="regular">Скретч</Typography>
      </Link>
      <Link to="/jumper">
        <Typography variant="regular">Перепрыгивать препятствия</Typography>
      </Link>
    </ul>
  );
};
