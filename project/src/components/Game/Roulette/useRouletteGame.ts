import { useCallback, useEffect, useRef, useState } from 'react';
import { CHIP_VALUES, NUM_RED, WHEEL_NUMBERS_AC } from './rouletteConstants';

export type BetEntry = {
  amt: number;
  type: string;
  odds: number;
  numbers: string;
};

export function chipClassForAmount(amt: number): string {
  if (amt < 5) return 'red';
  if (amt < 10) return 'blue';
  if (amt < 100) return 'orange';
  return 'gold';
}

export function useRouletteGame() {
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballTrackRef = useRef<HTMLDivElement>(null);
  const ballStopStyleRef = useRef<HTMLStyleElement | null>(null);
  const pnContentRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [bankValue, setBankValue] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [wager, setWager] = useState(5);
  const [lastWager, setLastWager] = useState(5);
  const [bet, setBet] = useState<BetEntry[]>([]);
  const [numbersBet, setNumbersBet] = useState<number[]>([]);
  const [activeChipIndex, setActiveChipIndex] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bankrupt, setBankrupt] = useState(false);
  const [winInfo, setWinInfo] = useState<{
    winningSpin: number;
    winValue: number;
    betTotal: number;
  } | null>(null);
  const [history, setHistory] = useState<{ value: number; cls: string }[]>([]);

  const pushTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
  }, []);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current = [];
      if (ballStopStyleRef.current?.parentNode) {
        ballStopStyleRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!winInfo) return;
    const t = setTimeout(() => setWinInfo(null), 4000);
    return () => clearTimeout(t);
  }, [winInfo]);

  const resetGame = useCallback(() => {
    setBankValue(1000);
    setCurrentBet(0);
    setWager(5);
    setLastWager(5);
    setBet([]);
    setNumbersBet([]);
    setActiveChipIndex(1);
    setIsSpinning(false);
    setBankrupt(false);
    setWinInfo(null);
    setHistory([]);
  }, []);

  const gameOver = useCallback(() => {
    setBankrupt(true);
  }, []);

  const removeChipsVisual = useCallback(() => {
    setBet([]);
    setNumbersBet([]);
  }, []);

  const spinWheelAnim = useCallback(
    (winningSpin: number) => {
      const wheel = wheelRef.current;
      const ballTrack = ballTrackRef.current;
      if (!wheel || !ballTrack) return;

      let degree = 0;
      for (let i = 0; i < WHEEL_NUMBERS_AC.length; i++) {
        if (WHEEL_NUMBERS_AC[i] === winningSpin) {
          degree = i * 9.73 + 362;
        }
      }

      if (ballStopStyleRef.current?.parentNode) {
        ballStopStyleRef.current.remove();
      }

      wheel.style.cssText = 'animation: wheelRotate 5s linear infinite;';
      ballTrack.style.cssText = 'animation: ballRotate 1s linear infinite;';

      pushTimeout(() => {
        ballTrack.style.cssText = 'animation: ballRotate 2s linear infinite;';
        const style = document.createElement('style');
        style.textContent = `@keyframes ballStop { from { transform: rotate(0deg); } to { transform: rotate(-${degree}deg); } }`;
        document.head.appendChild(style);
        ballStopStyleRef.current = style;
      }, 2000);

      pushTimeout(() => {
        ballTrack.style.cssText = 'animation: ballStop 3s linear;';
      }, 6000);

      pushTimeout(() => {
        ballTrack.style.cssText = `transform: rotate(-${degree}deg);`;
      }, 9000);

      pushTimeout(() => {
        wheel.style.cssText = '';
        if (ballStopStyleRef.current?.parentNode) {
          ballStopStyleRef.current.remove();
          ballStopStyleRef.current = null;
        }
      }, 10000);
    },
    [pushTimeout]
  );

  const placeBet = useCallback(
    (numbers: string, type: string, odds: number) => {
      setLastWager(wager);
      const effectiveWager = bankValue < wager ? bankValue : wager;
      if (effectiveWager <= 0) return;

      setBankValue((v) => v - effectiveWager);
      setCurrentBet((c) => c + effectiveWager);

      setBet((prev) => {
        const idx = prev.findIndex(
          (b) => b.numbers === numbers && b.type === type
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            amt: next[idx].amt + effectiveWager,
          };
          return next;
        }
        return [...prev, { amt: effectiveWager, type, odds, numbers }];
      });

      setNumbersBet((prev) => {
        const set = new Set(prev);
        numbers.split(',').forEach((s) => {
          const n = Number(s.trim());
          if (!Number.isNaN(n)) set.add(n);
        });
        return Array.from(set);
      });
    },
    [bankValue, wager]
  );

  const removeBet = useCallback(
    (numbers: string, type: string) => {
      const takeWager = wager === 0 ? 100 : wager;
      const idx = bet.findIndex(
        (b) => b.numbers === numbers && b.type === type
      );
      if (idx < 0) return;
      const row = bet[idx];
      if (row.amt === 0) return;
      const take = row.amt > takeWager ? takeWager : row.amt;
      setBankValue((v) => v + take);
      setCurrentBet((c) => c - take);
      setBet((prev) => {
        const i = prev.findIndex(
          (b) => b.numbers === numbers && b.type === type
        );
        if (i < 0) return prev;
        const r = prev[i];
        const t = r.amt > takeWager ? takeWager : r.amt;
        if (r.amt === t) return prev.filter((_, j) => j !== i);
        const next = [...prev];
        next[i] = { ...r, amt: r.amt - t };
        return next;
      });
    },
    [bet, wager]
  );

  const handleClearChipClick = useCallback(() => {
    setBankValue((v) => v + currentBet);
    setCurrentBet(0);
    removeChipsVisual();
  }, [currentBet, removeChipsVisual]);

  const spin = useCallback(() => {
    const winningSpin = Math.floor(Math.random() * 37);
    const betSnapshot = [...bet];
    const numbersBetSnapshot = [...numbersBet];
    const bankAtSpin = bankValue;

    setIsSpinning(true);
    spinWheelAnim(winningSpin);

    pushTimeout(() => {
      let nextBank = bankAtSpin;
      let winValue = 0;
      let betTotal = 0;

      if (numbersBetSnapshot.includes(winningSpin)) {
        for (const b of betSnapshot) {
          const nums = b.numbers.split(',').map(Number);
          if (nums.includes(winningSpin)) {
            nextBank += b.odds * b.amt + b.amt;
            winValue += b.odds * b.amt;
            betTotal += b.amt;
          }
        }
        if (winValue > 0) {
          setWinInfo({ winningSpin, winValue, betTotal });
        }
      }

      setBankValue(nextBank);
      setCurrentBet(0);

      const pnClass = NUM_RED.includes(winningSpin)
        ? 'pnRed'
        : winningSpin === 0
          ? 'pnGreen'
          : 'pnBlack';
      setHistory((h) => [...h, { value: winningSpin, cls: pnClass }]);

      pushTimeout(() => {
        const el = pnContentRef.current;
        if (el) el.scrollLeft = el.scrollWidth;
      }, 0);

      removeChipsVisual();
      setWager(lastWager);
      setIsSpinning(false);

      if (nextBank === 0) {
        gameOver();
      }
    }, 10000);
  }, [
    bet,
    bankValue,
    numbersBet,
    spinWheelAnim,
    pushTimeout,
    removeChipsVisual,
    lastWager,
    gameOver,
  ]);

  const selectChip = useCallback((index: number) => {
    if (index === 4) return;
    const raw = CHIP_VALUES[index];
    if (typeof raw === 'number') {
      setActiveChipIndex(index);
      setWager(raw);
    }
  }, []);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return {
    wheelRef,
    ballTrackRef,
    pnContentRef,
    bankValue,
    currentBet,
    wager,
    setWager,
    activeChipIndex,
    setActiveChipIndex,
    bet,
    placeBet,
    removeBet,
    spin,
    resetGame,
    bankrupt,
    setBankrupt,
    winInfo,
    history,
    isSpinning,
    handleClearChipClick,
    onContextMenu,
    selectChip,
    gameOver,
  };
}
