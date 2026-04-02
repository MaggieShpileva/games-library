export const LS_PREFIX = 'idleFactoryTycoon_';

export const IMG = {
  coin: 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png',
  robot:
    'https://i.ibb.co/hXhcqWY/C381-A704-8-E8-A-4-A67-8812-62-B12-AD179-CE-jpg.png',
  machine: 'https://i.ibb.co/X2TMKnH/machine.png',
  assembler: 'https://i.ibb.co/TwWNc71/Untitled-drawing-3.png',
  factory: 'https://i.ibb.co/gjB56MN/Untitled-drawing-2.png',
  shipping: 'https://i.ibb.co/rc8ZsTD/Untitled-drawing-5.png',
  shopping: 'https://i.ibb.co/yd43DTS/Untitled-drawing-6.png',
} as const;

export type GameState = {
  cash: number;
  cashPerSec: number;
  robotPrice: number;
  smallMachinePrice: number;
  levelupCost: number;
  lftMoney: number;
  lvl: number;
  lvlDisplay: number;
  factoryPrice: number;
  robotOwned: number;
  smallMachineOwned: number;
  factoryOwned: number;
  assemblerOwned: number;
  shippingCenterOwned: number;
  assemblerPrice: number;
  shippingCenterPrice: number;
  shoppingPrice: number;
  shoppingOwned: number;
  dev: boolean;
};

export const DEFAULT_GAME: GameState = {
  cash: 15,
  cashPerSec: 0,
  robotPrice: 15,
  smallMachinePrice: 100,
  levelupCost: 10000,
  lftMoney: 15,
  lvl: 1,
  lvlDisplay: 1,
  factoryPrice: 5000,
  robotOwned: 0,
  smallMachineOwned: 0,
  factoryOwned: 0,
  assemblerOwned: 0,
  shippingCenterOwned: 0,
  assemblerPrice: 500,
  shippingCenterPrice: 10000,
  shoppingPrice: 100000,
  shoppingOwned: 0,
  dev: false,
};

function ls(key: string): string | null {
  return localStorage.getItem(LS_PREFIX + key);
}

function parseNum(raw: string | null, fallback: number): number {
  if (raw == null || raw === '') return fallback;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : n;
}

export function loadGameFromStorage(): GameState {
  if (ls('save') !== '1') {
    return { ...DEFAULT_GAME };
  }

  const g: GameState = {
    cash: parseNum(ls('cash'), DEFAULT_GAME.cash),
    cashPerSec: parseNum(ls('cashPerSec'), DEFAULT_GAME.cashPerSec),
    robotPrice: parseNum(ls('robotPrice'), DEFAULT_GAME.robotPrice),
    smallMachinePrice: parseNum(
      ls('machinePrice'),
      DEFAULT_GAME.smallMachinePrice
    ),
    assemblerPrice: parseNum(ls('assemblerPrice'), DEFAULT_GAME.assemblerPrice),
    factoryPrice: parseNum(ls('factoryPrice'), DEFAULT_GAME.factoryPrice),
    shippingCenterPrice: parseNum(
      ls('shippingPrice'),
      DEFAULT_GAME.shippingCenterPrice
    ),
    shoppingPrice: parseNum(ls('shoppingPrice'), DEFAULT_GAME.shoppingPrice),
    lvl: parseNum(ls('lvl'), DEFAULT_GAME.lvl),
    lvlDisplay: parseNum(ls('lvlDis'), DEFAULT_GAME.lvlDisplay),
    robotOwned: parseNum(ls('robotOwned'), 0),
    smallMachineOwned: parseNum(ls('machineOwned'), 0),
    assemblerOwned: parseNum(ls('assemblerOwned'), 0),
    factoryOwned: parseNum(ls('factoryOwned'), 0),
    shippingCenterOwned: parseNum(ls('shippingOwned'), 0),
    shoppingOwned: parseNum(ls('shoppingOwned'), 0),
    levelupCost: parseNum(ls('levelupCost'), DEFAULT_GAME.levelupCost),
    lftMoney: parseNum(ls('lftMoney'), DEFAULT_GAME.lftMoney),
    dev: ls('dev') === '1',
  };

  if (Number.isNaN(g.shoppingPrice)) {
    g.shoppingPrice = 100000;
  }

  return g;
}

export function persistGame(g: GameState): void {
  localStorage.setItem(LS_PREFIX + 'save', '1');
  localStorage.setItem(LS_PREFIX + 'cash', String(g.cash));
  localStorage.setItem(LS_PREFIX + 'cashPerSec', String(g.cashPerSec));
  localStorage.setItem(LS_PREFIX + 'lvl', String(g.lvl));
  localStorage.setItem(LS_PREFIX + 'robotPrice', String(g.robotPrice));
  localStorage.setItem(LS_PREFIX + 'machinePrice', String(g.smallMachinePrice));
  localStorage.setItem(LS_PREFIX + 'assemblerPrice', String(g.assemblerPrice));
  localStorage.setItem(LS_PREFIX + 'factoryPrice', String(g.factoryPrice));
  localStorage.setItem(
    LS_PREFIX + 'shippingPrice',
    String(g.shippingCenterPrice)
  );
  localStorage.setItem(LS_PREFIX + 'robotOwned', String(g.robotOwned));
  localStorage.setItem(LS_PREFIX + 'machineOwned', String(g.smallMachineOwned));
  localStorage.setItem(LS_PREFIX + 'assemblerOwned', String(g.assemblerOwned));
  localStorage.setItem(LS_PREFIX + 'factoryOwned', String(g.factoryOwned));
  localStorage.setItem(
    LS_PREFIX + 'shippingOwned',
    String(g.shippingCenterOwned)
  );
  localStorage.setItem(LS_PREFIX + 'shoppingOwned', String(g.shoppingOwned));
  localStorage.setItem(LS_PREFIX + 'shoppingPrice', String(g.shoppingPrice));
  localStorage.setItem(LS_PREFIX + 'lvlDis', String(g.lvlDisplay));
  localStorage.setItem(LS_PREFIX + 'dev', g.dev ? '1' : '0');
  localStorage.setItem(LS_PREFIX + 'lftMoney', String(g.lftMoney));
  localStorage.setItem(LS_PREFIX + 'levelupCost', String(g.levelupCost));
}

export function firstDigit(num: number): number {
  const len = String(Math.abs(num)).length;
  const divisor = 10 ** (len - 1);
  return Math.trunc(num / divisor);
}

export function formatCashLabel(cash: number): string {
  if (cash < 1000) {
    return String(cash);
  }
  if (cash < 10000) {
    return `${firstDigit(cash)}.${Math.floor((cash / 100) % 10)}K`;
  }
  if (cash < 100000) {
    return `${firstDigit(cash)}${Math.floor((cash / 1000) % 10)}.${Math.floor((cash / 100) % 10)}K`;
  }
  if (cash < 1_000_000) {
    return `${firstDigit(cash)}${Math.floor((cash / 10000) % 10)}${Math.floor((cash / 1000) % 10)}.${Math.floor((cash / 100) % 10)}K`;
  }
  if (cash < 10_000_000) {
    return `${firstDigit(cash)}.${Math.floor((cash / 100_000) % 10)}M`;
  }
  if (cash < 100_000_000) {
    return `${firstDigit(cash)}${Math.floor((cash / 1_000_000) % 10)}.${Math.floor((cash / 100_000) % 10)}M`;
  }
  if (cash < 1_000_000_000) {
    return `${firstDigit(cash)}${Math.floor((cash / 10_000_000) % 10)}${Math.floor((cash / 1_000_000) % 10)}.${Math.floor((cash / 100_000) % 10)}M`;
  }
  if (cash >= 1_000_000_000) {
    return String(cash);
  }
  return String(cash);
}

function binaryAgent(str: string): string {
  let binString = '';
  str.split(' ').forEach((bin) => {
    binString += String.fromCharCode(parseInt(bin, 2));
  });
  return binString;
}

const DEV_OBFUSCATED =
  'MDEwMTAxMTAgMDExMDEwMTEgMDEwMTEwMTAgMDExMDExMTEgMDExMDAwMTEgMDAxMTAwMDAgMDAxMTAwMDEgMDEwMDEwMDAgMDEwMTAwMTAgMDExMDEwMTEgMDExMDEwMDAgMDExMDEwMDEgMDEwMTAwMTAgMDAxMTAwMTEgMDEwMDAwMTAgMDExMDAwMDEgMDEwMTAxMTAgMDExMDEwMTAgMDEwMDExMTAgMDExMDExMTEgMDEwMTAwMTAgMDExMDExMDAgMDExMDAxMDAgMDExMTAwMTEgMDExMDAwMDEgMDEwMDAxMTAgMDExMTAwMDAgMDEwMTAwMDEgMDEwMTAxMDEgMDEwMTAxMDAgMDAxMTAwMDAgMDAxMTEwMDE=';

export function verifyDevPassword(password: string): boolean {
  try {
    const good = btoa(escape(atob(binaryAgent(atob(DEV_OBFUSCATED)))));
    return atob(atob(unescape(atob(good)))) === password;
  } catch {
    return false;
  }
}

/** Удаляет из localStorage все ключи этой игры (префикс LS_PREFIX). */
export function clearIdleFactoryLocalStorage(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function resetStorageToDefaults(): void {
  localStorage.setItem(LS_PREFIX + 'cash', '15');
  localStorage.setItem(LS_PREFIX + 'cashPerSec', '0');
  localStorage.setItem(LS_PREFIX + 'lvl', '1');
  localStorage.setItem(LS_PREFIX + 'robotPrice', '15');
  localStorage.setItem(LS_PREFIX + 'machinePrice', '100');
  localStorage.setItem(LS_PREFIX + 'assemblerPrice', '500');
  localStorage.setItem(LS_PREFIX + 'factoryPrice', '5000');
  localStorage.setItem(LS_PREFIX + 'shippingPrice', '10000');
  localStorage.setItem(LS_PREFIX + 'robotOwned', '0');
  localStorage.setItem(LS_PREFIX + 'machineOwned', '0');
  localStorage.setItem(LS_PREFIX + 'assemblerOwned', '0');
  localStorage.setItem(LS_PREFIX + 'factoryOwned', '0');
  localStorage.setItem(LS_PREFIX + 'shippingOwned', '0');
  localStorage.setItem(LS_PREFIX + 'shoppingOwned', '0');
  localStorage.setItem(LS_PREFIX + 'shoppingPrice', '100000');
  localStorage.setItem(LS_PREFIX + 'lvlDis', '1');
  localStorage.setItem(LS_PREFIX + 'lftMoney', '15');
  localStorage.setItem(LS_PREFIX + 'levelupCost', '10000');
}
