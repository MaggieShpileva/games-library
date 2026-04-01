import type { ReactNode } from 'react';

type Cell = { r: string; c: string; cls?: string };

const St = ({
  r,
  c,
  cls = '',
  children,
}: {
  r: string;
  c: string;
  cls?: string;
  children?: ReactNode;
}) => {
  return (
    <div className={`step ${cls}`.trim()} data-r={r} data-c={c}>
      {children}
    </div>
  );
};

const Steps = ({
  items,
  prefix,
}: {
  items: readonly Cell[];
  prefix: string;
}) => {
  return (
    <>
      {items.map((cell, i) => (
        <St
          key={`${prefix}-${cell.r}-${cell.c}-${i}`}
          r={cell.r}
          c={cell.c}
          cls={cell.cls}
        />
      ))}
    </>
  );
};

const P = ({ children }: { children: ReactNode }) => (
  <div className="path">{children}</div>
);
const Br = ({ children }: { children: ReactNode }) => (
  <div className="bridge">{children}</div>
);

const LEVEL_1: Cell[] = [
  { r: '0', c: '0', cls: 'start' },
  { r: '0', c: '1' },
  { r: '1', c: '1' },
  { r: '2', c: '1' },
  { r: '3', c: '1' },
  { r: '3', c: '2' },
  { r: '3', c: '3' },
  { r: '2', c: '3' },
  { r: '2', c: '4' },
  { r: '3', c: '4' },
];

const LEVEL_2: Cell[] = [
  { r: '4', c: '4', cls: 'start' },
  { r: '4', c: '3' },
  { r: '4', c: '2' },
  { r: '3', c: '2' },
  { r: '3', c: '1' },
  { r: '3', c: '0' },
  { r: '4', c: '0' },
  { r: '4', c: '1' },
  { r: '3', c: '1' },
  { r: '3', c: '2' },
  { r: '3', c: '3' },
  { r: '4', c: '3' },
  { r: '4', c: '2' },
  { r: '3', c: '2' },
  { r: '3', c: '1' },
  { r: '4', c: '1' },
  { r: '4', c: '0' },
  { r: '3', c: '0' },
  { r: '2', c: '0' },
  { r: '1', c: '0' },
];

const LEVEL_3_BEFORE: Cell[] = [
  { r: '1', c: '1', cls: 'start' },
  { r: '1', c: '2' },
  { r: '1', c: '3' },
];

const LEVEL_3_PATH: Cell[] = [
  { r: '1', c: '4' },
  { r: '0', c: '4' },
  { r: '0', c: '3' },
  { r: '1', c: '3' },
  { r: '2', c: '3' },
  { r: '3', c: '3' },
  { r: '4', c: '3' },
  { r: '4', c: '4' },
];

const LEVEL_3_AFTER: Cell[] = [
  { r: '2', c: '3' },
  { r: '3', c: '3' },
  { r: '3', c: '2' },
  { r: '3', c: '1' },
  { r: '3', c: '0' },
  { r: '2', c: '0' },
  { r: '1', c: '0' },
];

const LEVEL_4_MAZE_PREFIX: [string, string][] = [
  ['1', '1'],
  ['1', '2'],
  ['1', '3'],
  ['2', '3'],
  ['2', '2'],
  ['1', '2'],
  ['1', '3'],
  ['2', '3'],
  ['2', '2'],
  ['1', '2'],
];

const LEVEL_4_MAZE: Cell[] = [
  ...LEVEL_4_MAZE_PREFIX.map(([r, c]) => ({ r, c })),
  ...Array.from(
    { length: 7 },
    () =>
      [
        ['1', '3'],
        ['2', '3'],
        ['2', '2'],
        ['1', '2'],
      ] as [string, string][]
  )
    .flat()
    .map(([r, c]) => ({ r, c })),
];

const L4_A: Cell[] = [
  { r: '0', c: '1' },
  { r: '0', c: '2' },
];

const L4_B: Cell[] = [
  { r: '1', c: '2' },
  { r: '2', c: '2' },
  { r: '3', c: '2' },
];

const L4_C: Cell[] = [
  { r: '3', c: '3' },
  { r: '2', c: '3' },
  { r: '1', c: '3' },
  { r: '1', c: '4' },
  { r: '2', c: '4' },
];

const L4_D: Cell[] = [
  { r: '3', c: '1' },
  { r: '3', c: '0' },
  { r: '2', c: '0' },
  { r: '2', c: '1' },
  { r: '2', c: '2' },
  { r: '1', c: '2' },
  { r: '1', c: '3' },
  { r: '0', c: '3' },
  { r: '0', c: '4' },
  { r: '1', c: '4' },
  { r: '2', c: '4' },
  { r: '3', c: '4' },
];

const L4_E: Cell[] = [
  { r: '0', c: '3' },
  { r: '0', c: '4' },
  { r: '1', c: '4' },
];

const L4_F: Cell[] = [
  { r: '1', c: '3' },
  { r: '2', c: '3' },
  { r: '2', c: '2' },
  { r: '2', c: '1' },
  { r: '2', c: '0' },
  { r: '1', c: '0' },
];

const L4_G: Cell[] = [
  { r: '2', c: '4' },
  { r: '2', c: '3' },
  { r: '2', c: '2' },
  { r: '2', c: '1' },
  { r: '2', c: '0' },
  { r: '3', c: '0' },
  { r: '4', c: '0' },
  { r: '4', c: '1' },
  { r: '4', c: '2' },
  { r: '3', c: '2' },
];

const L4_H: Cell[] = [
  { r: '2', c: '0' },
  { r: '3', c: '0' },
  { r: '4', c: '0' },
  { r: '4', c: '1' },
  { r: '4', c: '2' },
  { r: '3', c: '2' },
  { r: '2', c: '2' },
];

const L4_I: Cell[] = [
  { r: '2', c: '1' },
  { r: '2', c: '0' },
  { r: '3', c: '0' },
  { r: '4', c: '0' },
  { r: '4', c: '1' },
  { r: '4', c: '2' },
];

const L4_J: Cell[] = [
  { r: '1', c: '2' },
  { r: '0', c: '2' },
  { r: '0', c: '3' },
  { r: '1', c: '3' },
  { r: '1', c: '4' },
  { r: '0', c: '4' },
  { r: '0', c: '3' },
  { r: '1', c: '3' },
  { r: '2', c: '3' },
  { r: '2', c: '2' },
  { r: '3', c: '2' },
];

const L5_TOP: Cell[] = [
  { r: '4', c: '4', cls: 'start' },
  { r: '3', c: '4' },
];

const L5_B1: Cell[] = [
  { r: '1', c: '4' },
  { r: '0', c: '4' },
  { r: '0', c: '3' },
];

const L5_P1: Cell[] = [
  { r: '1', c: '3' },
  { r: '1', c: '4' },
  { r: '2', c: '4' },
  { r: '3', c: '4' },
  { r: '3', c: '3' },
  { r: '4', c: '3' },
  { r: '4', c: '2' },
  { r: '4', c: '1' },
];

const L5_P2: Cell[] = [
  { r: '3', c: '1' },
  { r: '3', c: '0' },
  { r: '2', c: '0' },
  { r: '1', c: '0' },
  { r: '0', c: '0' },
  { r: '0', c: '1' },
];

const L5_B2_INNER: Cell[] = [
  { r: '0', c: '3' },
  { r: '0', c: '4' },
  { r: '1', c: '4' },
  { r: '2', c: '4' },
  { r: '2', c: '3' },
];

const L5_TAIL_P: Cell[] = [
  { r: '4', c: '0' },
  { r: '3', c: '0' },
  { r: '3', c: '1' },
  { r: '4', c: '1' },
  { r: '4', c: '2' },
];

const L5_AFTER_BR: Cell[] = [
  { r: '0', c: '2' },
  { r: '0', c: '1' },
  { r: '1', c: '1' },
  { r: '1', c: '0' },
];

const L5_B4: Cell[] = [
  { r: '2', c: '0' },
  { r: '3', c: '0' },
];

const L5_B4_P: Cell[] = [
  { r: '4', c: '0' },
  { r: '4', c: '1' },
  { r: '4', c: '2' },
];

const L5_B4_MID: Cell[] = [
  { r: '3', c: '1' },
  { r: '4', c: '1' },
  { r: '4', c: '0' },
];

const L5_B3: Cell[] = [
  { r: '3', c: '0' },
  { r: '2', c: '0' },
  { r: '1', c: '0' },
];

export const PlatformBoard = () => {
  return (
    <div className="center">
      <input type="checkbox" id="level-one" />
      <div className="level" data-l="1">
        <Steps items={LEVEL_1} prefix="l1" />
        <St r="4" c="4" cls="finish">
          <label className="goal" htmlFor="level-one" />
        </St>
      </div>

      <input type="checkbox" id="level-two" />
      <div className="level">
        <Steps items={LEVEL_2} prefix="l2" />
        <St r="1" c="1" cls="finish">
          <label className="goal" htmlFor="level-two" />
        </St>
      </div>

      <input type="checkbox" id="level-three" />
      <div className="level">
        <Steps items={LEVEL_3_BEFORE} prefix="l3a" />
        <P>
          <Steps items={LEVEL_3_PATH} prefix="l3p" />
        </P>
        <Steps items={LEVEL_3_AFTER} prefix="l3b" />
        <St r="0" c="0" cls="finish">
          <label className="goal" htmlFor="level-three" />
        </St>
      </div>

      <input type="checkbox" id="level-four" />
      <div className="level">
        <St r="0" c="0" cls="start" />
        <P>
          <Steps items={L4_A} prefix="l4a" />
          <P>
            <Steps items={L4_B} prefix="l4b" />
            <P>
              <Steps items={L4_C} prefix="l4c" />
            </P>
            <Steps items={L4_D} prefix="l4d" />
          </P>
          <Steps items={L4_E} prefix="l4e" />
          <P>
            <Steps items={L4_F} prefix="l4f" />
          </P>
          <Steps items={L4_G} prefix="l4g" />
        </P>
        <St r="1" c="0" />
        <P>
          <Steps items={LEVEL_4_MAZE} prefix="l4m" />
        </P>
        <Steps items={L4_H} prefix="l4h" />
        <P>
          <Steps items={L4_I} prefix="l4i" />
        </P>
        <Steps items={L4_J} prefix="l4j" />
        <St r="4" c="4" cls="finish">
          <label className="goal" htmlFor="level-four" />
        </St>
      </div>

      <input type="checkbox" id="level-five" />
      <div className="level">
        <Steps items={L5_TOP} prefix="l5t" />
        <St r="2" c="4">
          <label className="button" htmlFor="bridge-one" />
        </St>
        <Br>
          <input type="checkbox" id="bridge-one" />
          <Steps items={L5_B1} prefix="l5b1" />
          <P>
            <Steps items={L5_P1} prefix="l5p1" />
            <P>
              <Steps items={L5_P2} prefix="l5p2" />
              <P>
                <St r="0" c="2" />
                <Br>
                  <input type="checkbox" id="bridge-two" />
                  <Steps items={L5_B2_INNER} prefix="l5b2" />
                </Br>
              </P>
              <St r="1" c="1" />
              <St r="1" c="0">
                <label className="button" htmlFor="bridge-three" />
              </St>
            </P>
            <Steps items={L5_TAIL_P} prefix="l5tp" />
            <St r="4" c="3">
              <label className="button" htmlFor="bridge-four" />
            </St>
          </P>
          <Steps items={L5_AFTER_BR} prefix="l5abr" />
          <Br>
            <input type="checkbox" id="bridge-four" />
            <Steps items={L5_B4} prefix="l5b4" />
            <P>
              <Steps items={L5_B4_P} prefix="l5b4p" />
            </P>
            <Steps items={L5_B4_MID} prefix="l5b4m" />
            <Br>
              <input type="checkbox" id="bridge-three" />
              <Steps items={L5_B3} prefix="l5b3" />
              <St r="0" c="0">
                <label className="button" htmlFor="bridge-two" />
              </St>
            </Br>
          </Br>
        </Br>
        <St r="2" c="2" cls="finish">
          <label className="goal" htmlFor="level-five" />
        </St>
      </div>

      <input type="checkbox" id="finish" />
    </div>
  );
};
