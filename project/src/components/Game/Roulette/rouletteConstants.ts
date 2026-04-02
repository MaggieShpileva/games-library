/** Логика и порядок чисел совпадают с milsaware/javascript-roulette (GPL-3.0). */

export const NUM_RED: readonly number[] = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

export const WHEEL_NUMBERS_AC: readonly number[] = [
  0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23,
  8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32,
];

/** Порядок секторов на колесе (визуал). */
export const WHEEL_SECTOR_NUMBERS: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export type NumberBlockCell = number | '2 to 1';

export const NUMBER_BLOCKS: readonly NumberBlockCell[] = [
  3,
  6,
  9,
  12,
  15,
  18,
  21,
  24,
  27,
  30,
  33,
  36,
  '2 to 1',
  2,
  5,
  8,
  11,
  14,
  17,
  20,
  23,
  26,
  29,
  32,
  35,
  '2 to 1',
  1,
  4,
  7,
  10,
  13,
  16,
  19,
  22,
  25,
  28,
  31,
  34,
  '2 to 1',
];

export const RED_BLOCKS: readonly number[] = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

export const CHIP_VALUES: readonly (number | 'clear')[] = [
  1,
  5,
  10,
  100,
  'clear',
];
