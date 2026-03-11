import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PageHeader } from '@/components/UI';
import styles from './CrossyRoad.module.scss';

const minTileIndex = -8;
const maxTileIndex = 8;
const tilesPerRow = maxTileIndex - minTileIndex + 1;
const tileSize = 42;

function createTexture(
  width: number,
  height: number,
  rects: Array<{ x: number; y: number; w: number; h: number }>
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.fillStyle = 'rgba(0,0,0,0.6)';
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

const carFrontTexture = createTexture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = createTexture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = createTexture(110, 40, [
  { x: 10, y: 0, w: 50, h: 30 },
  { x: 70, y: 0, w: 30, h: 30 },
]);
const carLeftSideTexture = createTexture(110, 40, [
  { x: 10, y: 10, w: 50, h: 30 },
  { x: 70, y: 10, w: 30, h: 30 },
]);

const truckFrontTexture = createTexture(30, 30, [{ x: 5, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = createTexture(25, 30, [
  { x: 15, y: 5, w: 10, h: 10 },
]);
const truckLeftSideTexture = createTexture(25, 30, [
  { x: 15, y: 15, w: 10, h: 10 },
]);

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function createCamera(width: number, height: number) {
  const size = 300;
  const viewRatio = width / height;
  const w = viewRatio < 1 ? size : size * viewRatio;
  const h = viewRatio < 1 ? size / viewRatio : size;

  const camera = new THREE.OrthographicCamera(
    w / -2,
    w / 2,
    h / 2,
    h / -2,
    100,
    900
  );

  camera.up.set(0, 0, 1);
  camera.position.set(300, -300, 300);
  camera.lookAt(0, 0, 0);

  return camera;
}

function createWheel(x: number) {
  const wheel = new THREE.Mesh(
    new THREE.BoxGeometry(12, 33, 12),
    new THREE.MeshLambertMaterial({
      color: 0x333333,
      flatShading: true,
    })
  );
  wheel.position.x = x;
  wheel.position.z = 6;
  return wheel;
}

function createCar(
  initialTileIndex: number,
  direction: boolean,
  color: number
): THREE.Group {
  const car = new THREE.Group();
  car.position.x = initialTileIndex * tileSize;
  if (!direction) car.rotation.z = Math.PI;

  const main = new THREE.Mesh(
    new THREE.BoxGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(33, 24, 12), [
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carBackTexture,
    }),
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carFrontTexture,
    }),
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carRightSideTexture,
    }),
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carLeftSideTexture,
    }),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }),
  ]);
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  car.add(createWheel(18));
  car.add(createWheel(-18));

  return car;
}

function createTruck(
  initialTileIndex: number,
  direction: boolean,
  color: number
): THREE.Group {
  const truck = new THREE.Group();
  truck.position.x = initialTileIndex * tileSize;
  if (!direction) truck.rotation.z = Math.PI;

  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(100, 35, 35),
    new THREE.MeshLambertMaterial({
      color: 0xb4c6fc,
      flatShading: true,
    })
  );
  cargo.position.x = -15;
  cargo.position.z = 25;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), [
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: truckFrontTexture,
    }),
    new THREE.MeshLambertMaterial({ color, flatShading: true }),
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: truckLeftSideTexture,
    }),
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: truckRightSideTexture,
    }),
    new THREE.MeshPhongMaterial({ color, flatShading: true }),
    new THREE.MeshPhongMaterial({ color, flatShading: true }),
  ]);
  cabin.position.x = 35;
  cabin.position.z = 20;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truck.add(cabin);

  truck.add(createWheel(37));
  truck.add(createWheel(5));
  truck.add(createWheel(-35));

  return truck;
}

function createDirectionalLight() {
  const dirLight = new THREE.DirectionalLight();
  dirLight.position.set(-100, -100, 200);
  dirLight.up.set(0, 0, 1);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.up.set(0, 0, 1);
  dirLight.shadow.camera.left = -400;
  dirLight.shadow.camera.right = 400;
  dirLight.shadow.camera.top = 400;
  dirLight.shadow.camera.bottom = -400;
  dirLight.shadow.camera.near = 50;
  dirLight.shadow.camera.far = 400;
  return dirLight;
}

function createGrass(rowIndex: number) {
  const grass = new THREE.Group();
  grass.position.y = rowIndex * tileSize;

  const createSection = (color: number) =>
    new THREE.Mesh(
      new THREE.BoxGeometry(tilesPerRow * tileSize, tileSize, 3),
      new THREE.MeshLambertMaterial({ color })
    );

  const middle = createSection(0xbaf455);
  middle.receiveShadow = true;
  grass.add(middle);

  const left = createSection(0x99c846);
  left.position.x = -tilesPerRow * tileSize;
  grass.add(left);

  const right = createSection(0x99c846);
  right.position.x = tilesPerRow * tileSize;
  grass.add(right);

  return grass;
}

function createRoad(rowIndex: number) {
  const road = new THREE.Group();
  road.position.y = rowIndex * tileSize;

  const createSection = (color: number) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(tilesPerRow * tileSize, tileSize),
      new THREE.MeshLambertMaterial({ color })
    );

  const middle = createSection(0x454a59);
  middle.receiveShadow = true;
  road.add(middle);

  const left = createSection(0x393d49);
  left.position.x = -tilesPerRow * tileSize;
  road.add(left);

  const right = createSection(0x393d49);
  right.position.x = tilesPerRow * tileSize;
  road.add(right);

  return road;
}

function createTree(tileIndex: number, height: number) {
  const tree = new THREE.Group();
  tree.position.x = tileIndex * tileSize;

  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(15, 15, 20),
    new THREE.MeshLambertMaterial({
      color: 0x4d2926,
      flatShading: true,
    })
  );
  trunk.position.z = 10;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, height),
    new THREE.MeshLambertMaterial({
      color: 0x7aa21d,
      flatShading: true,
    })
  );
  crown.position.z = height / 2 + 20;
  crown.castShadow = true;
  crown.receiveShadow = true;
  tree.add(crown);

  return tree;
}

function createPlayer(): THREE.Group {
  const player = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(15, 15, 20),
    new THREE.MeshLambertMaterial({
      color: 'white',
      flatShading: true,
    })
  );
  body.position.z = 10;
  body.castShadow = true;
  body.receiveShadow = true;
  player.add(body);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(2, 4, 2),
    new THREE.MeshLambertMaterial({
      color: 0xf0619a,
      flatShading: true,
    })
  );
  cap.position.z = 21;
  cap.castShadow = true;
  cap.receiveShadow = true;
  player.add(cap);

  const playerContainer = new THREE.Group();
  playerContainer.add(player);

  return playerContainer;
}

type RowMetadata =
  | {
      type: 'forest';
      trees: Array<{ tileIndex: number; height: number }>;
    }
  | {
      type: 'car';
      direction: boolean;
      speed: number;
      vehicles: Array<{
        initialTileIndex: number;
        color: number;
        ref?: THREE.Group;
      }>;
    }
  | {
      type: 'truck';
      direction: boolean;
      speed: number;
      vehicles: Array<{
        initialTileIndex: number;
        color: number;
        ref?: THREE.Group;
      }>;
    };

function generateForestMetadata(): RowMetadata {
  const occupiedTiles = new Set<number>();
  const trees = Array.from({ length: 4 }, () => {
    let tileIndex: number;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));
    occupiedTiles.add(tileIndex);
    return {
      tileIndex,
      height: randomElement([20, 45, 60]),
    };
  });
  return { type: 'forest', trees };
}

function generateCarLaneMetadata(): RowMetadata {
  const direction = randomElement([true, false]);
  const speed = randomElement([125, 156, 188]);
  const occupiedTiles = new Set<number>();

  const vehicles = Array.from({ length: 3 }, () => {
    let initialTileIndex: number;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);

    return {
      initialTileIndex,
      color: randomElement([0xa52523, 0xbdb638, 0x78b14b]),
    };
  });

  return { type: 'car', direction, speed, vehicles };
}

function generateTruckLaneMetadata(): RowMetadata {
  const direction = randomElement([true, false]);
  const speed = randomElement([125, 156, 188]);
  const occupiedTiles = new Set<number>();

  const vehicles = Array.from({ length: 2 }, () => {
    let initialTileIndex: number;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 2);
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);
    occupiedTiles.add(initialTileIndex + 2);

    return {
      initialTileIndex,
      color: randomElement([0xa52523, 0xbdb638, 0x78b14b]),
    };
  });

  return { type: 'truck', direction, speed, vehicles };
}

function generateRow(): RowMetadata {
  const type = randomElement(['car', 'truck', 'forest']);
  if (type === 'car') return generateCarLaneMetadata();
  if (type === 'truck') return generateTruckLaneMetadata();
  return generateForestMetadata();
}

function generateRows(amount: number): RowMetadata[] {
  return Array.from({ length: amount }, () => generateRow());
}

function calculateFinalPosition(
  currentPosition: { rowIndex: number; tileIndex: number },
  moves: string[]
) {
  return moves.reduce(
    (pos, direction) => {
      if (direction === 'forward')
        return { rowIndex: pos.rowIndex + 1, tileIndex: pos.tileIndex };
      if (direction === 'backward')
        return { rowIndex: pos.rowIndex - 1, tileIndex: pos.tileIndex };
      if (direction === 'left')
        return { rowIndex: pos.rowIndex, tileIndex: pos.tileIndex - 1 };
      if (direction === 'right')
        return { rowIndex: pos.rowIndex, tileIndex: pos.tileIndex + 1 };
      return pos;
    },
    { ...currentPosition }
  );
}

function endsUpInValidPosition(
  currentPosition: { rowIndex: number; tileIndex: number },
  moves: string[],
  metadata: RowMetadata[]
): boolean {
  const finalPosition = calculateFinalPosition(currentPosition, moves);

  if (
    finalPosition.rowIndex === -1 ||
    finalPosition.tileIndex === minTileIndex - 1 ||
    finalPosition.tileIndex === maxTileIndex + 1
  ) {
    return false;
  }

  const finalRow = metadata[finalPosition.rowIndex - 1];
  if (
    finalRow &&
    finalRow.type === 'forest' &&
    finalRow.trees.some((tree) => tree.tileIndex === finalPosition.tileIndex)
  ) {
    return false;
  }

  return true;
}

export const CrossyRoad = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const finalScoreRef = useRef<HTMLSpanElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const forwardRef = useRef<HTMLButtonElement>(null);
  const backwardRef = useRef<HTMLButtonElement>(null);
  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    const metadata: RowMetadata[] = [];
    const map = new THREE.Group();
    const player = createPlayer();
    const position = { currentRow: 0, currentTile: 0 };
    const movesQueue: string[] = [];
    const moveClock = new THREE.Clock(false);
    const clock = new THREE.Clock();

    const scene = new THREE.Scene();
    scene.add(player);
    scene.add(map);

    scene.add(new THREE.AmbientLight());
    const dirLight = createDirectionalLight();
    dirLight.target = player;
    player.add(dirLight);

    let camera = createCamera(width, height);
    player.add(camera);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    function addRows() {
      const newMetadata = generateRows(20);
      const startIndex = metadata.length;
      metadata.push(...newMetadata);

      newMetadata.forEach((rowData, index) => {
        const rowIndex = startIndex + index + 1;

        if (rowData.type === 'forest') {
          const row = createGrass(rowIndex);
          rowData.trees.forEach(({ tileIndex, height }) => {
            row.add(createTree(tileIndex, height));
          });
          map.add(row);
        }

        if (rowData.type === 'car') {
          const row = createRoad(rowIndex);
          rowData.vehicles.forEach((vehicle) => {
            const car = createCar(
              vehicle.initialTileIndex,
              rowData.direction,
              vehicle.color
            );
            vehicle.ref = car;
            row.add(car);
          });
          map.add(row);
        }

        if (rowData.type === 'truck') {
          const row = createRoad(rowIndex);
          rowData.vehicles.forEach((vehicle) => {
            const truck = createTruck(
              vehicle.initialTileIndex,
              rowData.direction,
              vehicle.color
            );
            vehicle.ref = truck;
            row.add(truck);
          });
          map.add(row);
        }
      });
    }

    function initializeMap() {
      metadata.length = 0;
      map.remove(...map.children);

      for (let rowIndex = 0; rowIndex > -10; rowIndex--) {
        map.add(createGrass(rowIndex));
      }
      addRows();
    }

    function initializePlayer() {
      player.position.x = 0;
      player.position.y = 0;
      player.children[0].position.z = 0;
      position.currentRow = 0;
      position.currentTile = 0;
      movesQueue.length = 0;
    }

    function queueMove(direction: string) {
      const isValid = endsUpInValidPosition(
        { rowIndex: position.currentRow, tileIndex: position.currentTile },
        [...movesQueue, direction],
        metadata
      );
      if (!isValid) return;
      movesQueue.push(direction);
    }

    function stepCompleted() {
      const direction = movesQueue.shift();
      if (direction === 'forward') position.currentRow += 1;
      if (direction === 'backward') position.currentRow -= 1;
      if (direction === 'left') position.currentTile -= 1;
      if (direction === 'right') position.currentTile += 1;

      if (position.currentRow > metadata.length - 10) addRows();

      if (scoreRef.current)
        scoreRef.current.innerText = String(position.currentRow);
    }

    function setPosition(progress: number) {
      const startX = position.currentTile * tileSize;
      const startY = position.currentRow * tileSize;
      let endX = startX;
      let endY = startY;

      if (movesQueue[0] === 'left') endX -= tileSize;
      if (movesQueue[0] === 'right') endX += tileSize;
      if (movesQueue[0] === 'forward') endY += tileSize;
      if (movesQueue[0] === 'backward') endY -= tileSize;

      player.position.x = THREE.MathUtils.lerp(startX, endX, progress);
      player.position.y = THREE.MathUtils.lerp(startY, endY, progress);
      (player.children[0] as THREE.Object3D).position.z =
        Math.sin(progress * Math.PI) * 8;
    }

    function setRotation(progress: number) {
      let endRotation = 0;
      if (movesQueue[0] === 'forward') endRotation = 0;
      if (movesQueue[0] === 'left') endRotation = Math.PI / 2;
      if (movesQueue[0] === 'right') endRotation = -Math.PI / 2;
      if (movesQueue[0] === 'backward') endRotation = Math.PI;

      const child = player.children[0] as THREE.Object3D;
      child.rotation.z = THREE.MathUtils.lerp(
        child.rotation.z,
        endRotation,
        progress
      );
    }

    function animatePlayer() {
      if (!movesQueue.length) return;
      if (!moveClock.running) moveClock.start();

      const stepTime = 0.2;
      const progress = Math.min(1, moveClock.getElapsedTime() / stepTime);

      setPosition(progress);
      setRotation(progress);

      if (progress >= 1) {
        stepCompleted();
        moveClock.stop();
      }
    }

    function animateVehicles() {
      const delta = clock.getDelta();

      metadata.forEach((rowData) => {
        if (rowData.type === 'car' || rowData.type === 'truck') {
          const beginningOfRow = (minTileIndex - 2) * tileSize;
          const endOfRow = (maxTileIndex + 2) * tileSize;

          rowData.vehicles.forEach(({ ref }) => {
            if (!ref) return;

            if (rowData.direction) {
              ref.position.x =
                ref.position.x > endOfRow
                  ? beginningOfRow
                  : ref.position.x + rowData.speed * delta;
            } else {
              ref.position.x =
                ref.position.x < beginningOfRow
                  ? endOfRow
                  : ref.position.x - rowData.speed * delta;
            }
          });
        }
      });
    }

    function hitTest() {
      const row = metadata[position.currentRow - 1];
      if (!row || (row.type !== 'car' && row.type !== 'truck')) return;

      const playerBoundingBox = new THREE.Box3();
      playerBoundingBox.setFromObject(player);

      row.vehicles.forEach(({ ref }) => {
        if (!ref) return;

        const vehicleBoundingBox = new THREE.Box3();
        vehicleBoundingBox.setFromObject(ref);

        if (playerBoundingBox.intersectsBox(vehicleBoundingBox)) {
          if (resultContainerRef.current && finalScoreRef.current) {
            resultContainerRef.current.style.visibility = 'visible';
            finalScoreRef.current.innerText = String(position.currentRow);
          }
        }
      });
    }

    function initializeGame() {
      initializePlayer();
      initializeMap();
      if (scoreRef.current) scoreRef.current.innerText = '0';
      if (resultContainerRef.current)
        resultContainerRef.current.style.visibility = 'hidden';
    }

    function animate() {
      animateVehicles();
      animatePlayer();
      hitTest();
      renderer.render(scene, camera);
    }

    initializeGame();

    const onResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      renderer.setSize(w, h);
      camera = createCamera(w, h);
      camera.up.set(0, 0, 1);
      camera.position.set(300, -300, 300);
      camera.lookAt(0, 0, 0);
      player.remove(player.children[player.children.length - 1]);
      player.add(camera);
    };

    window.addEventListener('resize', onResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        queueMove('forward');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        queueMove('backward');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        queueMove('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        queueMove('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const onForward = () => queueMove('forward');
    const onBackward = () => queueMove('backward');
    const onLeft = () => queueMove('left');
    const onRight = () => queueMove('right');

    forwardRef.current?.addEventListener('click', onForward);
    backwardRef.current?.addEventListener('click', onBackward);
    leftRef.current?.addEventListener('click', onLeft);
    rightRef.current?.addEventListener('click', onRight);
    retryRef.current?.addEventListener('click', initializeGame);

    renderer.setAnimationLoop(animate);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', handleKeyDown);
      forwardRef.current?.removeEventListener('click', onForward);
      backwardRef.current?.removeEventListener('click', onBackward);
      leftRef.current?.removeEventListener('click', onLeft);
      rightRef.current?.removeEventListener('click', onRight);
      retryRef.current?.removeEventListener('click', initializeGame);
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Crossy Road"
        link="https://codepen.io/HunorMarton/pen/JwWLJo"
      />
      <div className={styles.gameWrapper}>
        <div ref={gameContainerRef} className={styles.gameContainer}>
          <canvas ref={canvasRef} className={styles.gameCanvas} />
        </div>
        <div className={styles.controls}>
          <div className={styles.controlsGrid}>
            <button
              ref={forwardRef}
              type="button"
              className={styles.controlBtn}
              aria-label="Вперёд"
            >
              ▲
            </button>
            <button
              ref={leftRef}
              type="button"
              className={styles.controlBtn}
              aria-label="Влево"
            >
              ◀
            </button>
            <button
              ref={backwardRef}
              type="button"
              className={styles.controlBtn}
              aria-label="Назад"
            >
              ▼
            </button>
            <button
              ref={rightRef}
              type="button"
              className={styles.controlBtn}
              aria-label="Вправо"
            >
              ▶
            </button>
          </div>
        </div>
        <div ref={scoreRef} className={styles.score}>
          0
        </div>
        <div ref={resultContainerRef} className={styles.resultContainer}>
          <div className={styles.result}>
            <h1>Game Over</h1>
            <p>
              Your score: <span ref={finalScoreRef}>0</span>
            </p>
            <button ref={retryRef} type="button" className={styles.retryBtn}>
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
