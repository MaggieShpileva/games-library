import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/UI/PageHeader/PageHeader';
import styles from './MemoryGame.module.scss';

type CardItem = { id: number; name: string; img: string };

const CARD_BACK_IMG =
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/codepen-logo.png';

const INITIAL_CARDS: CardItem[] = [
  {
    name: 'php',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/php-logo_1.png',
    id: 1,
  },
  {
    name: 'css3',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/css3-logo.png',
    id: 2,
  },
  {
    name: 'html5',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/html5-logo.png',
    id: 3,
  },
  {
    name: 'jquery',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/jquery-logo.png',
    id: 4,
  },
  {
    name: 'javascript',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/js-logo.png',
    id: 5,
  },
  {
    name: 'node',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/nodejs-logo.png',
    id: 6,
  },
  {
    name: 'photoshop',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/photoshop-logo.png',
    id: 7,
  },
  {
    name: 'python',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/python-logo.png',
    id: 8,
  },
  {
    name: 'rails',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/rails-logo.png',
    id: 9,
  },
  {
    name: 'sass',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/sass-logo.png',
    id: 10,
  },
  {
    name: 'sublime',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/sublime-logo.png',
    id: 11,
  },
  {
    name: 'wordpress',
    img: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/wordpress-logo.png',
    id: 12,
  },
];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  let counter = result.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    [result[counter], result[index]] = [result[index], result[counter]];
  }
  return result;
}

function createShuffledCards(): CardItem[] {
  return shuffle([...INITIAL_CARDS, ...INITIAL_CARDS]);
}

export const MemoryGame = () => {
  const [cards, setCards] = useState<CardItem[]>(() => createShuffledCards());
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [gameVisible, setGameVisible] = useState(true);

  const totalPairs = INITIAL_CARDS.length;
  const isWin = matchedIds.size === totalPairs;

  const handleCardClick = useCallback(
    (index: number) => {
      if (paused || pickedIndices.includes(index) || pickedIndices.length >= 2)
        return;
      const cardId = cards[index].id;
      if (matchedIds.has(cardId)) return;

      const nextPicked = [...pickedIndices, index];

      if (nextPicked.length === 1) {
        setPickedIndices(nextPicked);
        return;
      }

      const [first, second] = nextPicked;
      const match = cards[first].id === cards[second].id;

      setPickedIndices(nextPicked);

      if (match) {
        setMatchedIds((prev) => new Set(prev).add(cards[first].id));
        setPickedIndices([]);
      } else {
        setPaused(true);
        setTimeout(() => {
          setPickedIndices([]);
          setPaused(false);
        }, 600);
      }
    },
    [cards, matchedIds, paused, pickedIndices]
  );

  useEffect(() => {
    if (!isWin) return;
    const t = setTimeout(() => {
      setShowModal(true);
      setGameVisible(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [isWin]);

  const handleRestart = useCallback(() => {
    setCards(createShuffledCards());
    setPickedIndices([]);
    setMatchedIds(new Set());
    setPaused(false);
    setShowModal(false);
    setGameVisible(true);
  }, []);

  const isFlipped = (index: number) =>
    pickedIndices.includes(index) || matchedIds.has(cards[index].id);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Карточки на память"
        link="https://codepen.io/natewiley/pen/BawOqL"
      />
      <div className={styles.wrap}>
        <div
          className={styles.game}
          style={{ display: gameVisible ? undefined : 'none' }}
        >
          {cards.map((card, index) => (
            <button
              key={`${card.id}-${index}`}
              type="button"
              className={styles.card}
              onClick={() => handleCardClick(index)}
              disabled={paused}
              aria-label={isFlipped(index) ? card.name : 'Скрытая карта'}
            >
              <div
                className={`${styles.inside} ${isFlipped(index) ? styles.flipped : ''} ${matchedIds.has(card.id) ? styles.matched : ''}`}
              >
                <div className={styles.front}>
                  <img src={card.img} alt={card.name} />
                </div>
                <div className={styles.back}>
                  <img src={CARD_BACK_IMG} alt="Card back" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {showModal && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
          >
            <div className={styles.modal}>
              <button
                type="button"
                className={styles.restart}
                onClick={handleRestart}
              >
                Play Again?
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
