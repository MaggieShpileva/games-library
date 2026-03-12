import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { PageHeader } from '@/components/UI';
import styles from './Bullseye.module.scss';

// Центр мишени и отрезок пересечения
const TARGET = { x: 900, y: 249.5 };
const LINE_SEGMENT = { x1: 875, y1: 280, x2: 925, y2: 220 };
const PIVOT = { x: 100, y: 250 };

function parseArcPath(
  d: string
): [typeof ARC_P0, typeof ARC_P1, typeof ARC_P2, typeof ARC_P3] | null {
  // M100,250c250,-400,550,-400,800,0 (относительные c)
  const match = d
    .trim()
    .match(
      /M\s*([-\d.]+)\s*,\s*([-\d.]+)\s*c\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)/
    );
  if (!match) return null;
  const mx = Number(match[1]);
  const my = Number(match[2]);
  const c1x = Number(match[3]);
  const c1y = Number(match[4]);
  const c2x = Number(match[5]);
  const c2y = Number(match[6]);
  const cx = Number(match[7]);
  const cy = Number(match[8]);
  return [
    { x: mx, y: my },
    { x: mx + c1x, y: my + c1y },
    { x: mx + c1x + c2x, y: my + c1y + c2y },
    { x: mx + c1x + c2x + cx, y: my + c1y + c2y + cy },
  ];
}

const ARC_P0 = { x: 100, y: 250 };
const ARC_P1 = { x: 350, y: -150 };
const ARC_P2 = { x: 650, y: -150 };
const ARC_P3 = { x: 900, y: 250 };

function cubicBezier(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): { x: number; y: number; dx: number; dy: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
  const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
  const dx =
    3 * mt2 * (p1.x - p0.x) +
    6 * mt * t * (p2.x - p1.x) +
    3 * t2 * (p3.x - p2.x);
  const dy =
    3 * mt2 * (p1.y - p0.y) +
    6 * mt * t * (p2.y - p1.y) +
    3 * t2 * (p3.y - p2.y);
  return { x, y, dx, dy };
}

function getMouseSVG(
  svg: SVGSVGElement,
  e: { clientX: number; clientY: number }
) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM()?.inverse());
}

function getIntersection(
  seg1: { x1: number; y1: number; x2: number; y2: number },
  seg2: { x1: number; y1: number; x2: number; y2: number }
): { x: number; y: number; segment1: boolean; segment2: boolean } | null {
  const dx1 = seg1.x2 - seg1.x1;
  const dy1 = seg1.y2 - seg1.y1;
  const dx2 = seg2.x2 - seg2.x1;
  const dy2 = seg2.y2 - seg2.y1;
  const cx = seg1.x1 - seg2.x1;
  const cy = seg1.y1 - seg2.y1;
  const denom = dy2 * dx1 - dx2 * dy1;
  if (denom === 0) return null;
  const ua = (dx2 * cy - dy2 * cx) / denom;
  const ub = (dx1 * cy - dy1 * cx) / denom;
  return {
    x: seg1.x1 + ua * dx1,
    y: seg1.y1 + ua * dy1,
    segment1: ua >= 0 && ua <= 1,
    segment2: ub >= 0 && ub <= 1,
  };
}

type AimState = { distance: number; angleRad: number; scale: number };

const REST_AIM: AimState = { distance: 0, angleRad: 0, scale: 1 };

export const Bullseye = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const arrowsRef = useRef<SVGGElement>(null);
  const bowRef = useRef<SVGGElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const missRef = useRef<SVGGElement>(null);
  const bullseyeRef = useRef<SVGGElement>(null);
  const hitRef = useRef<SVGGElement>(null);

  const randomAngleRef = useRef(0);
  const aimStateRef = useRef<AimState>(REST_AIM);
  const looseRef = useRef<() => void>(null);
  const mouseupHandlerRef = useRef<() => void>(null);
  const [hint] = useState('Оттяни стрелу и отпусти!');
  const [aimState, setAimState] = useState<AimState>(REST_AIM);
  const [isAiming, setIsAiming] = useState(false);

  useEffect(() => {
    aimStateRef.current = aimState;
  }, [aimState]);

  const showMessage = useCallback((selector: 'miss' | 'hit' | 'bullseye') => {
    const el =
      selector === 'miss'
        ? missRef.current
        : selector === 'bullseye'
          ? bullseyeRef.current
          : hitRef.current;
    if (!el) return;
    const paths = el.querySelectorAll('path');
    gsap.killTweensOf(el);
    gsap.killTweensOf(paths);
    gsap.set(el, { opacity: 1, visibility: 'visible' });
    gsap.fromTo(
      paths,
      { rotation: -5, scale: 0, transformOrigin: 'center' },
      { scale: 1, duration: 0.5, ease: 'back.out(1.7)', stagger: 0.05 }
    );
    gsap.to(paths, {
      rotation: 20,
      scale: 0,
      duration: 0.3,
      delay: 2,
      ease: 'back.in(1.7)',
      stagger: 0.03,
    });
  }, []);

  const aim = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    const arc = arcRef.current;
    if (!svg || !arc) return;

    const point = getMouseSVG(svg, e);
    const px = Math.min(point.x, PIVOT.x - 7);
    const py = Math.max(point.y, PIVOT.y + 7);
    const dx = px - PIVOT.x;
    const dy = py - PIVOT.y;
    const angle = Math.atan2(dy, dx) + randomAngleRef.current;
    const bowAngle = angle - Math.PI;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 50);
    const scale = Math.min(Math.max(distance / 30, 1), 2);

    setAimState({ distance, angleRad: bowAngle, scale });

    const radius = distance * 9;
    const offset = {
      x: Math.cos(bowAngle) * radius,
      y: Math.sin(bowAngle) * radius,
    };
    const arcWidth = offset.x * 3;
    // Конец дуги на уровне пола (y≈330), чтобы промахнувшиеся стрелы не висели высоко
    const arcEndY = 80;
    const arcD = `M100,250c${offset.x},${offset.y},${arcWidth - offset.x},${offset.y + arcEndY},${arcWidth},${arcEndY}`;
    arc.setAttribute('d', arcD);
    arc.style.opacity = String(distance / 60);
  }, []);

  const loose = useCallback(() => {
    window.removeEventListener('mousemove', aim);
    if (mouseupHandlerRef.current) {
      window.removeEventListener('mouseup', mouseupHandlerRef.current);
      mouseupHandlerRef.current = null;
    }
    setIsAiming(false);

    const currentAim = aimStateRef.current;
    if (currentAim.distance <= 0) {
      setAimState(REST_AIM);
      return;
    }

    const arc = arcRef.current;
    const arrows = arrowsRef.current;
    if (!arc || !arrows) return;

    const arcD = arc.getAttribute('d');
    const pathPoints = arcD ? parseArcPath(arcD) : null;
    const [p0, p1, p2, p3] = pathPoints ?? [ARC_P0, ARC_P1, ARC_P2, ARC_P3];

    const tweenState = { ...currentAim };
    gsap.to(tweenState, {
      duration: 0.4,
      distance: 0,
      angleRad: 0,
      scale: 1,
      ease: 'elastic.out(1, 0.5)',
      onUpdate: () => setAimState({ ...tweenState }),
    });

    arc.style.opacity = '0';

    const newArrow = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'use'
    );
    newArrow.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#arrow');
    arrows.appendChild(newArrow);

    const duration = 0.5;
    let hitDetected = false;
    const obj = { t: 0 };

    gsap.to(obj, {
      t: 1,
      duration,
      ease: 'none',
      onUpdate: function () {
        const t = obj.t;
        const pt = cubicBezier(t, p0, p1, p2, p3);
        const rotationRad = Math.atan2(pt.dy, pt.dx);
        const rotationDeg = (rotationRad * 180) / Math.PI;
        newArrow.setAttribute('x', String(pt.x));
        newArrow.setAttribute('y', String(pt.y));
        newArrow.setAttribute(
          'transform',
          `rotate(${rotationDeg} ${pt.x} ${pt.y})`
        );

        if (hitDetected) return;
        const arrowSeg = {
          x1: pt.x,
          y1: pt.y,
          x2: pt.x + Math.cos(rotationRad) * 60,
          y2: pt.y + Math.sin(rotationRad) * 60,
        };
        const intersection = getIntersection(arrowSeg, LINE_SEGMENT);
        if (intersection?.segment1 && intersection?.segment2) {
          hitDetected = true;
          gsap.killTweensOf(obj);
          const dx = intersection.x - TARGET.x;
          const dy = intersection.y - TARGET.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const selector = dist < 7 ? 'bullseye' : 'hit';
          showMessage(selector);
        }
      },
      onComplete: () => {
        if (!hitDetected) showMessage('miss');
      },
    });
  }, [showMessage, aim]);

  useEffect(() => {
    looseRef.current = loose;
  }, [loose]);

  const draw = useCallback(
    (e: React.MouseEvent) => {
      randomAngleRef.current = Math.random() * Math.PI * 0.03 - 0.015;
      setIsAiming(true);
      window.addEventListener('mousemove', aim);
      const handler = () => looseRef.current?.();
      mouseupHandlerRef.current = handler;
      window.addEventListener('mouseup', handler);
      aim(e);
    },
    [aim]
  );

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Bullseye"
        link="https://codepen.io/pyrografix/pen/qrqpJN"
      />
      <div className={styles.gameArea}>
        <svg
          id="game"
          ref={svgRef}
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 400"
          overflow="visible"
          onMouseDown={draw}
        >
          <linearGradient id="ArcGradient">
            <stop offset="0" stopColor="#fff" stopOpacity={0.2} />
            <stop offset="50%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <path
            ref={arcRef}
            id="arc"
            fill="none"
            stroke="url(#ArcGradient)"
            strokeWidth={4}
            d="M100,250c250-400,550-400,800,0"
            style={{ pointerEvents: 'none', opacity: 0 }}
          />
          <defs>
            <g id="arrow">
              <line x2={60} fill="none" stroke="#888" strokeWidth={2} />
              <polygon fill="#888" points="64 0 58 2 56 0 58 -2" />
              <polygon fill="#88ce02" points="2 -3 -4 -3 -1 0 -4 3 2 3 5 0" />
            </g>
          </defs>
          <g id="target">
            <path
              fill="#FFF"
              d="M924.2,274.2c-21.5,21.5-45.9,19.9-52,3.2c-4.4-12.1,2.4-29.2,14.2-41c11.8-11.8,29-18.6,41-14.2 C944.1,228.3,945.7,252.8,924.2,274.2z"
            />
            <path
              fill="#F4531C"
              d="M915.8,265.8c-14.1,14.1-30.8,14.6-36,4.1c-4.1-8.3,0.5-21.3,9.7-30.5s22.2-13.8,30.5-9.7 C930.4,235,929.9,251.7,915.8,265.8z"
            />
            <path
              fill="#FFF"
              d="M908.9,258.9c-8,8-17.9,9.2-21.6,3.5c-3.2-4.9-0.5-13.4,5.6-19.5c6.1-6.1,14.6-8.8,19.5-5.6 C918.1,241,916.9,250.9,908.9,258.9z"
            />
            <path
              fill="#F4531C"
              d="M903.2,253.2c-2.9,2.9-6.7,3.6-8.3,1.7c-1.5-1.8-0.6-5.4,2-8c2.6-2.6,6.2-3.6,8-2 C906.8,246.5,906.1,250.2,903.2,253.2z"
            />
          </g>
          <g
            ref={bowRef}
            fill="none"
            strokeLinecap="round"
            style={{
              vectorEffect: 'non-scaling-stroke',
              pointerEvents: 'none',
              transform: `translate(88px, 250px) rotate(${(aimState.angleRad * 180) / Math.PI}deg) scale(${aimState.scale}, 1)`,
              transformOrigin: '0 0',
            }}
          >
            <polyline
              fill="none"
              stroke="#ddd"
              strokeLinecap="round"
              points={`0,-50 ${Math.min(12 - aimState.distance / (aimState.scale || 1), 0)},0 0,50`}
            />
            <path
              fill="none"
              stroke="#88ce02"
              strokeWidth={3}
              strokeLinecap="round"
              d="M0,50 c0-10.1,12-25.1,12-50s-12-39.9-12-50"
            />
          </g>
          <g
            style={{
              transform: `translate(100px, 250px) rotate(${(aimState.angleRad * 180) / Math.PI}deg)`,
              transformOrigin: '0 0',
            }}
          >
            <use
              x={-aimState.distance}
              y={0}
              href="#arrow"
              style={{ opacity: isAiming ? 1 : 0 }}
            />
          </g>
          <clipPath id="mask">
            <polygon
              opacity={0.5}
              points="0,0 1500,0 1500,200 970,290 950,240 925,220 875,280 890,295 920,310 0,350"
              style={{ pointerEvents: 'none' }}
            />
          </clipPath>
          <g
            ref={arrowsRef}
            clipPath="url(#mask)"
            style={{ pointerEvents: 'none' }}
          />
          <g
            ref={missRef}
            fill="#aaa"
            opacity={0}
            transform="translate(0, 0)"
            style={{ visibility: 'hidden' }}
          >
            <path d="M358 194L363 118 386 120 400 153 416 121 440 119 446 203 419 212 416 163 401 180 380 160 381 204" />
            <path d="M450 120L458 200 475 192 474 121" />
            <path d="M537 118L487 118 485 160 515 162 509 177 482 171 482 193 529 199 538 148 501 146 508 133 537 137" />
            <path d="M540 202L543 178 570 186 569 168 544 167 546 122 590 116 586 142 561 140 560 152 586 153 586 205" />
            <path d="M595,215l5-23l31,0l-5,29L595,215z M627,176l13-70l-41-0l-0,70L627,176z" />
          </g>
          <g
            ref={bullseyeRef}
            fill="#F4531C"
            opacity={0}
            style={{ visibility: 'hidden' }}
          >
            <path d="M322,159l15-21l-27-13l-32,13l15,71l41-14l7-32L322,159z M292,142h20l3,8l-16,8 L292,142z M321,182l-18,9l-4-18l23-2V182z" />
            <path d="M340 131L359 125 362 169 381 167 386 123 405 129 392 183 351 186z" />
            <path d="M413 119L402 188 450 196 454 175 422 175 438 120z" />
            <path d="M432 167L454 169 466 154 451 151 478 115 453 113z" />
            <path d="M524 109L492 112 466 148 487 155 491 172 464 167 463 184 502 191 513 143 487 141 496 125 517 126z" />
            <path d="M537 114L512 189 558 199 566 174 533 175 539 162 553 164 558 150 543 145 547 134 566 148 575 124z" />
            <path d="M577 118L587 158 570 198 587 204 626 118 606 118 598 141 590 112z" />
            <path d="M635 122L599 198 643 207 649 188 624 188 630 170 639 178 645 162 637 158 649 143 662 151 670 134z" />
            <path d="M649,220l4-21l28,4l-6,25L649,220z M681,191l40-79l-35-8L659,184L681,191z" />
          </g>
          <g
            ref={hitRef}
            fill="#ffcc00"
            opacity={0}
            transform="translate(180, -80) rotate(12)"
            style={{ visibility: 'hidden' }}
          >
            <path d="M383 114L385 195 407 191 406 160 422 155 418 191 436 189 444 112 423 119 422 141 407 146 400 113" />
            <path d="M449 185L453 113 477 112 464 186" />
            <path d="M486 113L484 130 506 130 481 188 506 187 520 131 540 135 545 119" />
            <path d="M526,195l5-20l22,5l-9,16L526,195z M558,164l32-44l-35-9l-19,51L558,164z" />
          </g>
        </svg>
      </div>
      <span className={styles.hint}>{hint}</span>
    </div>
  );
};
