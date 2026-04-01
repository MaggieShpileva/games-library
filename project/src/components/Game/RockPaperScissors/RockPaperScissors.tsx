import { useState } from 'react';
import { PageHeader } from '@/components/UI';
import styles from './RockPaperScissors.module.scss';

type Choice = 'rock' | 'paper' | 'scissors';

const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];

const getMessage = (user: Choice, computer: Choice): string => {
  if (user === computer) return 'Ничья!';
  if (
    (user === 'rock' && computer === 'scissors') ||
    (user === 'paper' && computer === 'rock') ||
    (user === 'scissors' && computer === 'paper')
  ) {
    return 'Вы победили!';
  }
  return 'Победил компьютер!';
};

const getRandomChoice = (): Choice =>
  CHOICES[Math.floor(Math.random() * CHOICES.length)];

export const RockPaperScissors = () => {
  const [outcome, setOutcome] = useState<{
    user: Choice;
    computer: Choice;
  } | null>(null);

  const handleChoice = (user: Choice) => {
    setOutcome({ user, computer: getRandomChoice() });
  };

  const handleReset = () => {
    setOutcome(null);
  };

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Камень, ножницы, бумага"
        link="https://codepen.io/alvaromontoro/pen/BaaBYyz"
      />
      <div
        className={styles.game}
        data-user={outcome?.user ?? undefined}
        data-computer={outcome?.computer ?? undefined}
      >
        <h1 className={styles.title}>Камень, ножницы, бумага</h1>

        <div className={styles.hands}>
          <div className={styles.hand} data-hand="computer">
            <div className={styles.fist} />
            <div className={`${styles.finger} ${styles.finger1}`} />
            <div className={`${styles.finger} ${styles.finger2}`} />
            <div className={`${styles.finger} ${styles.finger3}`} />
            <div className={`${styles.finger} ${styles.finger4}`} />
            <div className={styles.thumb} />
            <div className={styles.arm} />
          </div>

          <div className={styles.hand} data-hand="user">
            <div className={styles.fist} />
            <div className={`${styles.finger} ${styles.finger1}`} />
            <div className={`${styles.finger} ${styles.finger2}`} />
            <div className={`${styles.finger} ${styles.finger3}`} />
            <div className={`${styles.finger} ${styles.finger4}`} />
            <div className={styles.thumb} />
            <div className={styles.arm} />
          </div>

          <div className={styles.icons}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => handleChoice('rock')}
              title="Камень"
            >
              ✊
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => handleChoice('paper')}
              title="Бумага"
            >
              🖐️
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => handleChoice('scissors')}
              title="Ножницы"
            >
              ✌️
            </button>
          </div>
        </div>

        {outcome && (
          <div className={styles.message}>
            <h2 className={styles.messageTitle}>
              {getMessage(outcome.user, outcome.computer)}
            </h2>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
            >
              Ещё раунд
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
