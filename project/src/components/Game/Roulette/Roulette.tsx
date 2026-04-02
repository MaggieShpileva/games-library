import type { CSSProperties, FC } from 'react';
import clsx from 'clsx';
import { PageHeader } from '@/components/UI';
import {
  CHIP_VALUES,
  NUM_RED,
  NUMBER_BLOCKS,
  RED_BLOCKS,
  WHEEL_SECTOR_NUMBERS,
} from './rouletteConstants';
import {
  chipClassForAmount,
  type BetEntry,
  useRouletteGame,
} from './useRouletteGame';
import './Roulette-keyframes.css';
import styles from './Roulette.module.scss';

const RTL_TIGHT = new Set([2, 3, 6, 9, 11]);
const CBBB_ML21 = new Set([1, 4, 5, 7, 9, 11, 12, 15, 16, 18, 20, 22]);

function cornerBetMarginClass(count: number) {
  if (CBBB_ML21.has(count)) return styles.cbbbMl21;
  if (count === 3 || count === 14) return styles.cbbbMl205;
  if (count === 6 || count === 17) return styles.cbbbMl23;
  return undefined;
}

function BetChip({
  betList,
  numbers,
  type,
}: {
  betList: BetEntry[];
  numbers: string;
  type: string;
}) {
  const entry = betList.find((b) => b.numbers === numbers && b.type === type);
  if (!entry || entry.amt === 0) return null;
  const border = chipClassForAmount(entry.amt);
  return (
    <div
      className={clsx(
        styles.chip,
        styles[border as 'red' | 'blue' | 'orange' | 'gold']
      )}
    >
      <span className={styles.chipSpan}>{entry.amt}</span>
    </div>
  );
}

export const Roulette: FC = () => {
  const {
    wheelRef,
    ballTrackRef,
    pnContentRef,
    bankValue,
    currentBet,
    activeChipIndex,
    bet,
    placeBet,
    removeBet,
    spin,
    resetGame,
    bankrupt,
    winInfo,
    history,
    isSpinning,
    handleClearChipClick,
    onContextMenu,
    selectChip,
  } = useRouletteGame();

  const showSpin = currentBet > 0 && !isSpinning;

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Рулетка"
        link="https://github.com/milsaware/javascript-roulette"
      />

      <div className={styles.roulettePage}>
        <div className={styles.container}>
          {/* Колесо */}
          <div ref={wheelRef} className={styles.wheel}>
            <div className={styles.outerRim} />
            {WHEEL_SECTOR_NUMBERS.map((num, i) => {
              const a = i + 1;
              const sectStyle: CSSProperties | undefined =
                a > 1
                  ? { transform: `rotate(${(a - 1) * 9.73}deg)` }
                  : undefined;
              return (
                <div key={a} className={styles.sect} style={sectStyle}>
                  <span className={num < 10 ? styles.single : styles.double}>
                    {num}
                  </span>
                  <div
                    className={clsx(
                      styles.sectorBlock,
                      a === 1 && styles.sectorGreen,
                      a > 1 &&
                        (a % 2 === 0 ? styles.sectorRed : styles.sectorBlack)
                    )}
                  />
                </div>
              );
            })}
            <div className={styles.pocketsRim} />
            <div ref={ballTrackRef} className={styles.ballTrack}>
              <div className={styles.ball} />
            </div>
            <div className={styles.pockets} />
            <div className={styles.cone} />
            <div className={styles.turret} />
            <div className={styles.turretHandle}>
              <div className={styles.thendOne} />
              <div className={styles.thendTwo} />
            </div>
          </div>

          {/* Стол */}
          <div className={styles.bettingBoard}>
            <div className={styles.winning_lines}>
              <div className={clsx(styles.wlttb, styles.wlttbTop)}>
                {Array.from({ length: 11 }, (_, j) => {
                  const numA = 1 + 3 * j;
                  const numB = 2 + 3 * j;
                  const numC = 3 + 3 * j;
                  const numD = 4 + 3 * j;
                  const numE = 5 + 3 * j;
                  const numF = 6 + 3 * j;
                  const numStr = `${numA}, ${numB}, ${numC}, ${numD}, ${numE}, ${numF}`;
                  return (
                    <div
                      key={`top-${j}`}
                      className={styles.ttbbetblock}
                      role="presentation"
                      onClick={() => placeBet(numStr, 'double_street', 5)}
                      onContextMenu={(e) => {
                        onContextMenu(e);
                        removeBet(numStr, 'double_street');
                      }}
                    >
                      <BetChip
                        betList={bet}
                        numbers={numStr}
                        type="double_street"
                      />
                    </div>
                  );
                })}
              </div>

              {[1, 2, 3].map((d) => (
                <div
                  key={`wl-${d}`}
                  className={clsx(styles.wlttb, d >= 2 && styles.wlttbShift)}
                >
                  {Array.from({ length: 12 }, (_, j) => (
                    <div
                      key={`wl-${d}-${j}`}
                      className={styles.ttbbetblock}
                      role="presentation"
                      onClick={() => {
                        let num: string;
                        if (d === 1 || d === 2) {
                          const numA = 2 - (d - 1) + 3 * j;
                          const numB = 3 - (d - 1) + 3 * j;
                          num = `${numA}, ${numB}`;
                        } else {
                          const numA = 1 + 3 * j;
                          const numB = 2 + 3 * j;
                          const numC = 3 + 3 * j;
                          num = `${numA}, ${numB}, ${numC}`;
                        }
                        const objType = d === 3 ? 'street' : 'split';
                        const odd = d === 3 ? 11 : 17;
                        placeBet(num, objType, odd);
                      }}
                      onContextMenu={(e) => {
                        onContextMenu(e);
                        let num: string;
                        if (d === 1 || d === 2) {
                          const numA = 2 - (d - 1) + 3 * j;
                          const numB = 3 - (d - 1) + 3 * j;
                          num = `${numA}, ${numB}`;
                        } else {
                          const numA = 1 + 3 * j;
                          const numB = 2 + 3 * j;
                          const numC = 3 + 3 * j;
                          num = `${numA}, ${numB}, ${numC}`;
                        }
                        const objType = d === 3 ? 'street' : 'split';
                        removeBet(num, objType);
                      }}
                    >
                      <BetChip
                        betList={bet}
                        numbers={
                          d === 1 || d === 2
                            ? `${2 - (d - 1) + 3 * j}, ${3 - (d - 1) + 3 * j}`
                            : `${1 + 3 * j}, ${2 + 3 * j}, ${3 + 3 * j}`
                        }
                        type={d === 3 ? 'street' : 'split'}
                      />
                    </div>
                  ))}
                </div>
              ))}

              {Array.from({ length: 11 }, (_, cIdx) => {
                const d = cIdx + 1;
                return (
                  <div
                    key={`rtl-${d}`}
                    className={clsx(
                      styles.wlrtl,
                      RTL_TIGHT.has(d) ? styles.wlrtlTight : styles.wlrtlLoose
                    )}
                  >
                    {[1, 2, 3].map((j) => {
                      const numA = 3 + 3 * (d - 1) - (j - 1);
                      const numB = 6 + 3 * (d - 1) - (j - 1);
                      const num = `${numA}, ${numB}`;
                      const rtlKey = `rtlbb${j}` as keyof typeof styles;
                      return (
                        <div
                          key={`rtl-${d}-${j}`}
                          className={styles[rtlKey]}
                          role="presentation"
                          onClick={() => placeBet(num, 'split', 17)}
                          onContextMenu={(e) => {
                            onContextMenu(e);
                            removeBet(num, 'split');
                          }}
                        >
                          <BetChip betList={bet} numbers={num} type="split" />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {[1, 2].map((c) => (
                <div
                  key={`wlcb-${c}`}
                  className={clsx(styles.wlcb, c === 2 && styles.wlcbSecond)}
                >
                  {Array.from({ length: 11 }, (_, ii) => {
                    const i = ii + 1;
                    const count = c === 1 ? i : i + 11;
                    const numA = 2;
                    const numB = 3;
                    const numC = 5;
                    const numD = 6;
                    const num =
                      count >= 1 && count < 12
                        ? `${numA + (count - 1) * 3}, ${numB + (count - 1) * 3}, ${numC + (count - 1) * 3}, ${numD + (count - 1) * 3}`
                        : `${numA - 1 + (count - 12) * 3}, ${numB - 1 + (count - 12) * 3}, ${numC - 1 + (count - 12) * 3}, ${numD - 1 + (count - 12) * 3}`;
                    return (
                      <div
                        key={`cbbb-${count}`}
                        className={clsx(
                          styles.cbbb,
                          cornerBetMarginClass(count)
                        )}
                        role="presentation"
                        onClick={() => placeBet(num, 'corner_bet', 8)}
                        onContextMenu={(e) => {
                          onContextMenu(e);
                          removeBet(num, 'corner_bet');
                        }}
                      >
                        <BetChip
                          betList={bet}
                          numbers={num}
                          type="corner_bet"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className={styles.bbtop}>
              {['1 to 18', '19 to 36'].map((label, f) => {
                const num =
                  f === 0
                    ? '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18'
                    : '19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36';
                const objType = f === 0 ? 'outside_low' : 'outside_high';
                return (
                  <div
                    key={label}
                    className={styles.bbtoptwo}
                    role="presentation"
                    onClick={() => placeBet(num, objType, 1)}
                    onContextMenu={(e) => {
                      onContextMenu(e);
                      removeBet(num, objType);
                    }}
                  >
                    {label}
                    <BetChip betList={bet} numbers={num} type={objType} />
                  </div>
                );
              })}
            </div>

            <div className={styles.number_board}>
              <div
                className={styles.number_0}
                role="presentation"
                onClick={() => placeBet('0', 'zero', 35)}
                onContextMenu={(e) => {
                  onContextMenu(e);
                  removeBet('0', 'zero');
                }}
              >
                <div className={styles.nbn}>0</div>
                <BetChip betList={bet} numbers="0" type="zero" />
              </div>

              {NUMBER_BLOCKS.map((cell, a) => {
                const isColumn = cell === '2 to 1';
                const columnNum =
                  a === 12
                    ? '3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36'
                    : a === 25
                      ? '2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35'
                      : '1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34';

                return (
                  <div
                    key={`nb-${a}`}
                    className={clsx(
                      isColumn ? styles.tt1_block : styles.number_block,
                      typeof cell === 'number' &&
                        RED_BLOCKS.includes(cell) &&
                        styles.redNum,
                      typeof cell === 'number' &&
                        !RED_BLOCKS.includes(cell) &&
                        styles.blackNum
                    )}
                    role="presentation"
                    onClick={() => {
                      if (!isColumn) {
                        placeBet(String(cell), 'inside_whole', 35);
                      } else {
                        placeBet(columnNum, 'outside_column', 2);
                      }
                    }}
                    onContextMenu={(e) => {
                      onContextMenu(e);
                      if (!isColumn) {
                        removeBet(String(cell), 'inside_whole');
                      } else {
                        removeBet(columnNum, 'outside_column');
                      }
                    }}
                  >
                    <div className={styles.nbn}>{cell}</div>
                    <BetChip
                      betList={bet}
                      numbers={!isColumn ? String(cell) : columnNum}
                      type={!isColumn ? 'inside_whole' : 'outside_column'}
                    />
                  </div>
                );
              })}
            </div>

            <div className={styles.bo3_board}>
              {['1 to 12', '13 to 24', '25 to 36'].map((label, b) => {
                const num =
                  b === 0
                    ? '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12'
                    : b === 1
                      ? '13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24'
                      : '25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36';
                return (
                  <div
                    key={label}
                    className={styles.bo3_block}
                    role="presentation"
                    onClick={() => placeBet(num, 'outside_dozen', 2)}
                    onContextMenu={(e) => {
                      onContextMenu(e);
                      removeBet(num, 'outside_dozen');
                    }}
                  >
                    {label}
                    <BetChip betList={bet} numbers={num} type="outside_dozen" />
                  </div>
                );
              })}
            </div>

            <div className={styles.oto_board}>
              {(['EVEN', 'RED', 'BLACK', 'ODD'] as const).map((label, d) => {
                const num =
                  d === 0
                    ? '2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36'
                    : d === 1
                      ? '1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36'
                      : d === 2
                        ? '2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35'
                        : '1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35';
                return (
                  <div
                    key={label}
                    className={clsx(
                      styles.oto_block,
                      label === 'RED' && styles.redNum,
                      label === 'BLACK' && styles.blackNum
                    )}
                    role="presentation"
                    onClick={() => placeBet(num, 'outside_oerb', 1)}
                    onContextMenu={(e) => {
                      onContextMenu(e);
                      removeBet(num, 'outside_oerb');
                    }}
                  >
                    {label}
                    <BetChip betList={bet} numbers={num} type="outside_oerb" />
                  </div>
                );
              })}
            </div>

            <div className={styles.chipDeck}>
              {CHIP_VALUES.map((val, i) => {
                if (val === 'clear') {
                  return (
                    <div
                      key="clear"
                      className={clsx(styles.cdChip, styles.clearBet)}
                      role="presentation"
                      onClick={handleClearChipClick}
                    >
                      <span className={styles.cdChipSpan}>{val}</span>
                    </div>
                  );
                }
                const chipColour =
                  i === 0
                    ? 'red'
                    : i === 1
                      ? 'blue'
                      : i === 2
                        ? 'orange'
                        : 'gold';
                return (
                  <div
                    key={val}
                    className={clsx(
                      styles.cdChip,
                      styles[chipColour as 'red' | 'blue' | 'orange' | 'gold'],
                      activeChipIndex === i && styles.cdChipActive
                    )}
                    role="presentation"
                    onClick={() => selectChip(i)}
                  >
                    <span className={styles.cdChipSpan}>{val}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.bankContainer}>
              <div className={styles.bank}>
                <span id="bankSpan">{bankValue.toLocaleString('en-GB')}</span>
              </div>
              <div className={styles.bet}>
                <span id="betSpan">{currentBet.toLocaleString('en-GB')}</span>
              </div>
            </div>

            <div className={styles.pnBlock}>
              <div
                ref={pnContentRef}
                className={styles.pnContent}
                onWheel={(e) => {
                  e.preventDefault();
                  e.currentTarget.scrollLeft += e.deltaY;
                }}
              >
                {history.map((h, idx) => (
                  <span
                    key={`${idx}-${h.value}`}
                    className={
                      h.cls === 'pnRed'
                        ? styles.pnRed
                        : h.cls === 'pnGreen'
                          ? styles.pnGreen
                          : styles.pnBlack
                    }
                  >
                    {h.value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {showSpin && (
            <div
              className={styles.spinBtn}
              role="presentation"
              onClick={() => spin()}
            >
              spin
            </div>
          )}

          {winInfo && (
            <div className={styles.notification}>
              <span className={styles.nSpan}>
                <span
                  style={{
                    color:
                      winInfo.winningSpin === 0
                        ? 'green'
                        : NUM_RED.includes(winInfo.winningSpin)
                          ? 'red'
                          : 'black',
                  }}
                >
                  {winInfo.winningSpin}
                </span>
                <span> Win</span>
                <div className={styles.nsWin}>
                  <div className={styles.nsWinBlock}>
                    Bet: {winInfo.betTotal}
                  </div>
                  <div className={styles.nsWinBlock}>
                    Win: {winInfo.winValue}
                  </div>
                  <div className={styles.nsWinBlock}>
                    Payout: {winInfo.winValue + winInfo.betTotal}
                  </div>
                </div>
              </span>
            </div>
          )}

          {bankrupt && (
            <div className={styles.notification}>
              <span className={styles.nSpan}>Bankrupt</span>
              <div
                className={styles.nBtn}
                role="presentation"
                onClick={resetGame}
              >
                Play again
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
