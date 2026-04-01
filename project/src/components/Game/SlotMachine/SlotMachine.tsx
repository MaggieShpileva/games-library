import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { PageHeader } from '@/components/UI';
import { removeConfetti, startConfetti, stopConfetti } from './slotConfetti';
import styles from './SlotMachine.module.scss';

const ORG = '19612173';

const img = (imageId: string) =>
  `https://irxcm.com/RevTrax/creative/image?orgId=${ORG}&imageId=${imageId}`;

const HERO = img('11025804');
const LEVER = img('11025803');

const REEL_IMAGES: string[][] = [
  [
    img('11025797'),
    img('11025798'),
    img('11025799'),
    img('11025800'),
    img('11025801'),
  ],
  [
    img('11025799'),
    img('11025797'),
    img('11025798'),
    img('11025800'),
    img('11025801'),
  ],
  [
    img('11025801'),
    img('11025797'),
    img('11025798'),
    img('11025799'),
    img('11025800'),
  ],
];

const END_INDICES = [1, 2, 2] as const;
const ITEM_HEIGHT = 75;
const FULL_ROTATIONS = 2;

function tripleStrip(symbols: string[]): string[] {
  return [...symbols, ...symbols, ...symbols];
}

export const SlotMachine = () => {
  const [heading, setHeading] = useState('Spin to Save!');
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'won'>('idle');

  const reel0 = useRef<HTMLDivElement>(null);
  const reel1 = useRef<HTMLDivElement>(null);
  const reel2 = useRef<HTMLDivElement>(null);

  const winTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
      if (confettiStopRef.current) clearTimeout(confettiStopRef.current);
      [reel0, reel1, reel2].forEach((r) => {
        const el = r.current;
        if (el) gsap.killTweensOf(el);
      });
      removeConfetti();
    };
  }, []);

  const handleSpin = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('spinning');

    [reel0, reel1, reel2].forEach((ref, i) => {
      const el = ref.current;
      if (!el) return;
      const endIndex = END_INDICES[i];
      const finalY = -(FULL_ROTATIONS * 5 + endIndex) * ITEM_HEIGHT;
      gsap.fromTo(
        el,
        { y: 0 },
        { y: finalY, duration: 1, ease: 'back.out(1.7)' }
      );
    });

    winTimeoutRef.current = setTimeout(() => {
      setHeading('Won $0.50 Offer!');
      setPhase('won');
      startConfetti();
    }, 2400);

    confettiStopRef.current = setTimeout(() => {
      stopConfetti();
    }, 7000);
  }, [phase]);

  const handleClaim = useCallback(() => {
    window.alert('Link to $0.50 Offer');
  }, []);

  const showSpin = phase !== 'won';
  const spinDisabled = phase !== 'idle';

  return (
    <div className={styles.wrapper}>
      <PageHeader title="Слоты" link="https://codepen.io/revtrax/pen/RwKoBMO" />

      <div className={styles.slot}>
        <img src={HERO} alt="" className={styles.hero} />
        <h1 className={styles.heading}>{heading}</h1>

        <div
          className={`${styles.slotArea} ${phase === 'won' ? styles.dimmed : ''}`}
        >
          <div className={styles.slotwrapper}>
            {REEL_IMAGES.map((symbols, reelIdx) => (
              <div key={reelIdx} className={styles.reel}>
                <div
                  ref={[reel0, reel1, reel2][reelIdx]}
                  className={styles.reelStrip}
                >
                  {tripleStrip(symbols).map((src, j) => (
                    <div key={j} className={styles.reelItem}>
                      <img src={src} alt="" className={styles.symbol} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <img src={LEVER} alt="" className={styles.lever} />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${!showSpin ? styles.hidden : ''} ${
              spinDisabled ? styles.disabled : ''
            }`}
            disabled={spinDisabled}
            onClick={handleSpin}
          >
            Spin!
          </button>
          <button
            type="button"
            className={`${styles.btn} ${showSpin ? styles.hidden : ''}`}
            onClick={handleClaim}
          >
            Claim!
          </button>
        </div>
      </div>
    </div>
  );
};
