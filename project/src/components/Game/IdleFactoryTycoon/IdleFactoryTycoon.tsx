import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, PageHeader } from '@/components/UI';
import {
  clearIdleFactoryLocalStorage,
  DEFAULT_GAME,
  formatCashLabel,
  IMG,
  loadGameFromStorage,
  persistGame,
  resetStorageToDefaults,
  verifyDevPassword,
  type GameState,
} from './idleFactoryGameLogic';
import './idleFactoryTycoonGame.css';
import styles from './IdleFactoryTycoon.module.scss';

const SOURCE_PLUNK = 'https://plnkr.co/edit/Js9hLb1W7M8EGpi0?preview';

function IconStrip({
  count,
  src,
  title,
  height,
}: {
  count: number;
  src: string;
  title: string;
  height: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={`${title}-${i}`} className="smallroboticon" title={title}>
          <img src={src} alt="" style={{ height }} />
        </div>
      ))}
    </>
  );
}

export const IdleFactoryTycoon: FC = () => {
  const [game, setGame] = useState<GameState>(() => loadGameFromStorage());
  const gameRef = useRef<GameState>(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const pauseRef = useRef(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const buyRef = useRef<HTMLDialogElement>(null);
  const creditsRef = useRef<HTMLDialogElement>(null);

  const [devCashInput, setDevCashInput] = useState(String(game.cash));

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pauseRef.current) return;
      setGame((g) => ({
        ...g,
        cash: g.cash + g.cashPerSec,
        lftMoney: g.lftMoney + g.cashPerSec,
      }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      persistGame(gameRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const openMenu = useCallback(() => {
    pauseRef.current = true;
    setDevCashInput(String(gameRef.current.cash));
    menuRef.current?.showModal();
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      const r = menu.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        menu.close();
        pauseRef.current = false;
      }
    };
    menu.addEventListener('click', onClick);
    return () => menu.removeEventListener('click', onClick);
  }, []);

  const buyRobot = useCallback(() => {
    setGame((g) => {
      if (g.robotPrice > g.cash) return g;
      return {
        ...g,
        robotOwned: g.robotOwned + 1,
        cashPerSec: g.cashPerSec + 1,
        cash: g.cash - g.robotPrice,
        robotPrice: g.robotPrice + 15,
      };
    });
  }, []);

  const buyMachine = useCallback(() => {
    setGame((g) => {
      if (g.smallMachinePrice > g.cash) return g;
      return {
        ...g,
        smallMachineOwned: g.smallMachineOwned + 1,
        cashPerSec: g.cashPerSec + 5,
        cash: g.cash - g.smallMachinePrice,
        smallMachinePrice: g.smallMachinePrice + 100,
      };
    });
  }, []);

  const buyAssembler = useCallback(() => {
    setGame((g) => {
      if (g.assemblerPrice > g.cash) return g;
      return {
        ...g,
        assemblerOwned: g.assemblerOwned + 1,
        cashPerSec: g.cashPerSec + 25,
        cash: g.cash - g.assemblerPrice,
        assemblerPrice: g.assemblerPrice + 500,
      };
    });
  }, []);

  const buyFactory = useCallback(() => {
    setGame((g) => {
      if (g.factoryPrice > g.cash) return g;
      return {
        ...g,
        factoryOwned: g.factoryOwned + 1,
        cashPerSec: g.cashPerSec + 100,
        cash: g.cash - g.factoryPrice,
        factoryPrice: g.factoryPrice + 1000,
      };
    });
  }, []);

  const buyShipping = useCallback(() => {
    setGame((g) => {
      if (g.shippingCenterPrice > g.cash) return g;
      return {
        ...g,
        shippingCenterOwned: g.shippingCenterOwned + 1,
        cashPerSec: g.cashPerSec + 500,
        cash: g.cash - g.shippingCenterPrice,
        shippingCenterPrice: g.shippingCenterPrice + 10000,
      };
    });
  }, []);

  const buyShopping = useCallback(() => {
    setGame((g) => {
      if (g.shoppingPrice > g.cash) return g;
      return {
        ...g,
        shoppingOwned: g.shoppingOwned + 1,
        cashPerSec: g.cashPerSec + 5000,
        cash: g.cash - g.shippingCenterPrice,
        shoppingPrice: g.shoppingPrice + 100000,
      };
    });
  }, []);

  const levelUp = useCallback(() => {
    setGame((g) => {
      if (g.lvl !== 1 || g.cash < g.levelupCost) return g;
      const cost = 500000;
      return {
        ...g,
        lvl: g.lvl + 1,
        levelupCost: cost,
        cash: g.cash - cost,
      };
    });
  }, []);

  const lvlFdw = useCallback(() => {
    setGame((g) => {
      if (g.lvl === g.lvlDisplay) return g;
      if (g.lvlDisplay === 1 && g.lvl === 2) {
        return { ...g, lvlDisplay: g.lvlDisplay + 1 };
      }
      return g;
    });
  }, []);

  const lvlBack = useCallback(() => {
    setGame((g) => {
      if (g.lvlDisplay <= 1) return g;
      if (g.lvlDisplay === 2) {
        return { ...g, lvlDisplay: g.lvlDisplay - 1 };
      }
      return g;
    });
  }, []);

  const clearSave = useCallback(() => {
    if (!window.confirm('Are you sure you want to clear your save?')) return;
    resetStorageToDefaults();
    setGame({ ...DEFAULT_GAME });
  }, []);

  const fullReset = useCallback(() => {
    if (
      !window.confirm(
        'Сбросить прогресс? Все сохранения этой игры в браузере будут удалены.'
      )
    ) {
      return;
    }
    clearIdleFactoryLocalStorage();
    setGame({ ...DEFAULT_GAME });
    setDevCashInput(String(DEFAULT_GAME.cash));
    pauseRef.current = false;
    menuRef.current?.close();
    buyRef.current?.close();
    creditsRef.current?.close();
  }, []);

  const checkDev = useCallback(() => {
    const password = window.prompt('Enter dev password');
    if (password == null) return;
    if (verifyDevPassword(password)) {
      window.alert('Welcome');
      setGame((g) => ({ ...g, dev: true }));
    } else {
      window.alert('Goodbye');
    }
  }, []);

  const saveCashDev = useCallback(() => {
    const v = parseInt(devCashInput, 10);
    if (Number.isNaN(v)) return;
    setGame((g) => ({ ...g, cash: v, cashPerSec: 0 }));
  }, [devCashInput]);

  const exitDev = useCallback(() => {
    setGame((g) => ({ ...g, dev: false }));
  }, []);

  const buyStuff = useCallback(() => {
    menuRef.current?.close();
    pauseRef.current = true;
    buyRef.current?.showModal();
  }, []);

  const closeBuy = useCallback(() => {
    buyRef.current?.close();
    pauseRef.current = false;
  }, []);

  const continueBuy = useCallback(() => {
    window.alert('Coming soon');
    buyRef.current?.close();
    pauseRef.current = false;
  }, []);

  const openCredit = useCallback(() => {
    menuRef.current?.close();
    pauseRef.current = true;
    creditsRef.current?.showModal();
  }, []);

  const closeCredit = useCallback(() => {
    creditsRef.current?.close();
    menuRef.current?.showModal();
  }, []);

  const cashLine =
    game.cash < 1000 ? (
      <>
        <img
          src={IMG.coin}
          alt=""
          style={{ height: 20, verticalAlign: 'middle' }}
        />{' '}
        Cash = {game.cash}
      </>
    ) : (
      <>
        <img
          src={IMG.coin}
          alt=""
          style={{ height: 20, verticalAlign: 'middle' }}
        />{' '}
        Cash = {formatCashLabel(game.cash)}
      </>
    );

  const { lvl, lvlDisplay } = game;
  const storePage2 = lvlDisplay === 2;
  const showLevelUpOnStore = lvl === 1 && !storePage2;

  return (
    <div className={styles.wrapper}>
      <PageHeader title="Idle Factory Tycoon" link={SOURCE_PLUNK} />
      <div className={styles.toolbar}>
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={fullReset}
        >
          Сбросить
        </Button>
      </div>
      <div className={styles.gameContainer}>
        <div className={`${styles.gameShell} idleFactoryGame`}>
          <dialog ref={creditsRef} className="credits">
            <div className="innerCredits">
              <h3 className="creditsText">Credits</h3>
              <p className="creditsText">
                Icons — Evan
                <br className="creditsText" />
                All code — Rainier
                <br className="creditsText" />
                Play testing — Jack
                <br className="creditsText" />
                Play testing — Evan
              </p>
            </div>
            <button type="button" onClick={closeCredit}>
              Close
            </button>
          </dialog>

          <dialog ref={buyRef} className="popupBuy">
            <h2 className="creditsText">Buy in game cash</h2>
            <p className="creditsText">
              Please note that the game is still in development and any
              purchases made are only saved to your CURRENT COMPUTER! If your
              save is lost there are NO REFUNDS!
            </p>
            <fieldset>
              <legend className="creditsText">Values</legend>
              <label className="creditsText">
                <input type="radio" name="groupName" value="1" defaultChecked />{' '}
                100K Cash for $0.50
              </label>
              <br className="creditsText" />
              <label className="creditsText">
                <input type="radio" name="groupName" value="2" /> 1M Cash for $1
              </label>
              <br className="creditsText" />
              <label className="creditsText">
                <input type="radio" name="groupName" value="3" /> 100M for $5
              </label>
            </fieldset>
            <br />
            <button type="button" onClick={continueBuy}>
              Continue
            </button>
            <button type="button" onClick={closeBuy}>
              Close
            </button>
          </dialog>

          <dialog ref={menuRef} className="popup" id="menu">
            <span className="popuptext" id="myPopup">
              <h2>Menu</h2>
              <p>Cash = {game.cash}</p>
              <p>Lifetime Cash = {game.lftMoney}</p>
              <p>Cash Per Second = {game.cashPerSec}</p>
              <button type="button" onClick={clearSave}>
                Clear Save
              </button>
              <button type="button" onClick={buyStuff}>
                Buy Cash
              </button>
              <br />
              <button type="button" onClick={openCredit}>
                Credits
              </button>
              <button
                type="button"
                onClick={checkDev}
                style={{ textAlign: 'center' }}
              >
                Dev Tools
              </button>
              {game.dev && (
                <div id="devTools">
                  <p>Cash Slider</p>
                  <input
                    type="range"
                    min={0}
                    max={100000000}
                    value={Math.min(
                      100000000,
                      Math.max(0, parseInt(devCashInput, 10) || 0)
                    )}
                    onChange={(e) => setDevCashInput(e.target.value)}
                  />
                  <button type="button" onClick={saveCashDev}>
                    Save Cash
                  </button>
                  <button type="button" onClick={exitDev}>
                    Exit Dev
                  </button>
                </div>
              )}
            </span>
          </dialog>

          <div className="titleMenu">
            <h1 className="titleMain">Idle Factory Tycoon V1.1.10</h1>
            <div
              className="menuBtn"
              onClick={openMenu}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openMenu();
                }
              }}
              role="button"
              tabIndex={0}
            >
              Menu
            </div>
          </div>
          <br />
          <br />
          <p className="cash" id="cash">
            {cashLine}
          </p>

          <div id="mainFact" className="mainFact">
            <div id="smallRobotSec" className="iconSection">
              <IconStrip
                count={game.robotOwned}
                src={IMG.robot}
                title="Small Robot"
                height={50}
              />
            </div>
            <div id="smallMachineSec" className="iconSection">
              <IconStrip
                count={game.smallMachineOwned}
                src={IMG.machine}
                title="Small Machine"
                height={50}
              />
            </div>
            <div id="assemblerSec" className="iconSection">
              <IconStrip
                count={game.assemblerOwned}
                src={IMG.assembler}
                title="Assembler"
                height={50}
              />
            </div>
            <div id="factorySec" className="iconSection">
              <IconStrip
                count={game.factoryOwned}
                src={IMG.factory}
                title="Factory"
                height={50}
              />
            </div>
            <div id="shippingCenterSec" className="iconSection">
              <IconStrip
                count={game.shippingCenterOwned}
                src={IMG.shipping}
                title="Shipping Center"
                height={45}
              />
            </div>
            <div id="shoppingCenterSec" className="iconSection">
              <IconStrip
                count={game.shoppingOwned}
                src={IMG.shopping}
                title="Shopping Center"
                height={45}
              />
            </div>
          </div>

          <div className="storeOut" id="storeOut">
            <div
              className="lvlBack"
              id="lvlBack"
              onClick={lvlBack}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  lvlBack();
                }
              }}
              role="button"
              tabIndex={0}
            >
              &lt;
            </div>
            <div
              className="lvlFdw"
              id="lvlFdw"
              onClick={lvlFdw}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  lvlFdw();
                }
              }}
              role="button"
              tabIndex={0}
            >
              &gt;
            </div>
            <p id="lvlMenuSelect" className="lvlMenuSelect">
              {lvlDisplay}/{lvl}
            </p>
            <br />
            <br />
            <div id="storeIn">
              {storePage2 ? (
                <>
                  <div
                    className="item"
                    style={{ width: 124 }}
                    onClick={buyFactory}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        buyFactory();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Buy a Factory
                    <p id="factoryPrice">Price = {game.factoryPrice}</p>
                  </div>
                  <div
                    className="item"
                    style={{ width: 174 }}
                    onClick={buyShipping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        buyShipping();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Buy a Shipping Center
                    <p id="shippingCenterPrice">
                      Price = {game.shippingCenterPrice}
                    </p>
                  </div>
                  <div
                    className="item"
                    style={{ width: 174 }}
                    onClick={buyShopping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        buyShopping();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Buy a Shoping Center
                    <p id="shoppingCenterPrice">Price = {game.shoppingPrice}</p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="item"
                    style={{ width: 124 }}
                    onClick={buyRobot}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        buyRobot();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Buy Small Robot
                    <p id="robotPriceDis">Price = {game.robotPrice}</p>
                  </div>
                  <div
                    className="item"
                    style={{ width: 140 }}
                    onClick={buyMachine}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        buyMachine();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Buy Small Machine
                    <p id="smallMachinePrice">
                      Price = {game.smallMachinePrice}
                    </p>
                  </div>
                  <div
                    className="item"
                    style={{ width: 124 }}
                    onClick={buyAssembler}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        buyAssembler();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Buy Assembler
                    <p id="assemblerPriceDis">Price = {game.assemblerPrice}</p>
                  </div>
                  {showLevelUpOnStore && (
                    <div
                      className="levelUp"
                      onClick={levelUp}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          levelUp();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      Advance to a new level
                      <p id="levelupCost">Price = {game.levelupCost}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div id="info" />
        </div>
      </div>
    </div>
  );
};
