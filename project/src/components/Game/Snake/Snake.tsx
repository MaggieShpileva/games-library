import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PageHeader } from '@/components/UI';
import styles from './Snake.module.scss';

const COLS = 20;
const ROWS = 14;
const INITIAL_SPEED_MS = 180;

type Dir = 'up' | 'down' | 'left' | 'right';
type Cell = { x: number; y: number };

const DIR_DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const randomCell = (): Cell => ({
  x: Math.floor(Math.random() * COLS),
  y: Math.floor(Math.random() * ROWS),
});

const randomFood = (snake: Cell[]): Cell => {
  const set = new Set(snake.map((c) => `${c.x},${c.y}`));
  let f = randomCell();

  while (set.has(`${f.x},${f.y}`)) {
    f = randomCell();
  }

  return f;
};

const INITIAL_SNAKE: Cell[] = [
  { x: 4, y: Math.floor(ROWS / 2) },
  { x: 3, y: Math.floor(ROWS / 2) },
  { x: 2, y: Math.floor(ROWS / 2) },
];

const cellToPosition = (c: Cell): [number, number, number] => [
  c.x + 0.5,
  0.5,
  c.y + 0.5,
];

export const Snake = () => {
  const [snake, setSnake] = useState<Cell[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Cell>(() => randomFood(INITIAL_SNAKE));
  const [nextDirection, setNextDirection] = useState<Dir>('right');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED_MS);

  const directionRef = useRef<Dir>('right');
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const snakeGroupRef = useRef<THREE.Group | null>(null);
  const foodMeshRef = useRef<THREE.Mesh | null>(null);

  const boxGeomRef = useRef<THREE.BoxGeometry | null>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const frameIdRef = useRef<number>(0);

  const reset = useCallback(() => {
    const init = [...INITIAL_SNAKE];

    setSnake(init);
    setFood(randomFood(init));
    setNextDirection('right');
    directionRef.current = 'right';

    setScore(0);
    setGameOver(false);
    setStarted(false);
    setSpeed(INITIAL_SPEED_MS);

    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    directionRef.current = nextDirection;
  }, [nextDirection]);

  useEffect(() => {
    if (!started || gameOver) return;

    const move = () => {
      setSnake((prev) => {
        const head = prev[0];
        const dir = DIR_DELTA[directionRef.current];

        const newHead: Cell = {
          x: head.x + dir.x,
          y: head.y + dir.y,
        };

        if (
          newHead.x < 0 ||
          newHead.x >= COLS ||
          newHead.y < 0 ||
          newHead.y >= ROWS
        ) {
          setGameOver(true);
          return prev;
        }

        if (prev.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const eaten = newHead.x === food.x && newHead.y === food.y;

        const next = [newHead, ...prev];

        if (!eaten) next.pop();

        if (eaten) {
          setScore((s) => s + 1);
          setFood(randomFood(next));
          setSpeed((sp) => Math.max(80, sp - 6));
        }

        return next;
      });
    };

    tickRef.current = setInterval(move, speed);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [started, gameOver, speed, food]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.key === ' ') {
          e.preventDefault();
          reset();
        }
        return;
      }

      if (!started) {
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
            e.key
          )
        ) {
          e.preventDefault();
          setStarted(true);

          if (e.key === 'ArrowUp') setNextDirection('up');
          if (e.key === 'ArrowDown') setNextDirection('down');
          if (e.key === 'ArrowLeft') setNextDirection('left');
          if (e.key === 'ArrowRight') setNextDirection('right');
        }

        return;
      }

      const map: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };

      const next = map[e.key];
      if (!next) return;

      e.preventDefault();

      const opposite: Record<Dir, Dir> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
      };

      if (next !== opposite[directionRef.current]) {
        setNextDirection(next);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver, started, reset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;

    const halfH = Math.max(ROWS / 2, COLS / 2 / aspect) + 2;
    const halfW = halfH * aspect;

    const camera = new THREE.OrthographicCamera(
      -halfW,
      halfW,
      halfH,
      -halfH,
      0.1,
      1000
    );

    camera.position.set(COLS / 2, 25, ROWS / 2);
    camera.lookAt(COLS / 2, 0, ROWS / 2);
    camera.updateProjectionMatrix();

    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);

    rendererRef.current = renderer;

    const floorGeom = new THREE.PlaneGeometry(COLS, ROWS);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f3460,
      metalness: 0.1,
      roughness: 0.8,
    });

    const floor = new THREE.Mesh(floorGeom, floorMat);

    floor.rotation.x = -Math.PI / 2;
    floor.position.set(COLS / 2, 0, ROWS / 2);

    scene.add(floor);

    const gridSize = Math.max(COLS, ROWS);

    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridSize,
      0x16213e,
      0x16213e
    );

    gridHelper.position.set(COLS / 2, 0.01, ROWS / 2);

    scene.add(gridHelper);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(COLS / 2, 30, ROWS / 2);

    scene.add(dirLight);

    const snakeGroup = new THREE.Group();
    scene.add(snakeGroup);

    snakeGroupRef.current = snakeGroup;

    const foodGeom = new THREE.SphereGeometry(0.45, 16, 16);

    const foodMat = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      metalness: 0.2,
      roughness: 0.6,
    });

    const foodMesh = new THREE.Mesh(foodGeom, foodMat);

    scene.add(foodMesh);

    foodMeshRef.current = foodMesh;

    const boxGeom = new THREE.BoxGeometry(0.9, 0.9, 0.9);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00d26a,
      metalness: 0.2,
      roughness: 0.6,
    });

    const headMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      metalness: 0.3,
      roughness: 0.5,
      emissive: 0x00aa55,
    });

    boxGeomRef.current = boxGeom;
    bodyMatRef.current = bodyMat;
    headMatRef.current = headMat;

    const onResize = () => {
      if (!container || !camera || !renderer) return;

      const w = container.clientWidth;
      const h = container.clientHeight;

      const aspect = w / h;

      const halfH = Math.max(ROWS / 2, COLS / 2 / aspect) + 2;
      const halfW = halfH * aspect;

      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;

      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', onResize);

      cancelAnimationFrame(frameIdRef.current);

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      floorGeom.dispose();
      floorMat.dispose();
      foodGeom.dispose();
      foodMat.dispose();
      boxGeom.dispose();
      bodyMat.dispose();
      headMat.dispose();
    };
  }, []);

  useEffect(() => {
    const sg = snakeGroupRef.current;
    const fm = foodMeshRef.current;
    const boxGeom = boxGeomRef.current;
    const bodyMat = bodyMatRef.current;
    const headMat = headMatRef.current;

    if (!sg || !fm || !boxGeom || !bodyMat || !headMat) return;

    sg.clear();

    snake.forEach((cell, i) => {
      const mesh = new THREE.Mesh(boxGeom, i === 0 ? headMat : bodyMat);

      const [x, y, z] = cellToPosition(cell);

      mesh.position.set(x, y, z);

      sg.add(mesh);
    });

    const [fx, , fz] = cellToPosition(food);

    fm.position.set(fx, 0.5, fz);
  }, [snake, food]);

  return (
    <div className={styles.wrapper}>
      <PageHeader title="Змейка" link="#" />

      <div className={styles.info}>
        <span>Счёт: {score}</span>

        {!started && !gameOver && (
          <span className={styles.hint}>
            Нажмите пробел или стрелку для старта
          </span>
        )}

        {gameOver && (
          <span className={styles.gameOver}>
            Игра окончена. Счёт: {score}. Нажмите пробел для новой игры.
          </span>
        )}
      </div>

      <div ref={containerRef} className={styles.canvasWrap} />

      <button type="button" className={styles.restart} onClick={reset}>
        Новая игра
      </button>
    </div>
  );
};
