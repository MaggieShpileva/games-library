import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PageHeader } from '@/components/UI';
import styles from './InfiniteRunner.module.scss';

const SCENE_WIDTH = 20;
const SCENE_HEIGHT = 12;
const PLATFORM_SURFACE_Y = 0;
const PLATFORM_THICKNESS = 0.5;
const PLATFORM_DEPTH = 2;
const PLAYER_SIZE = 0.8;
const GRAVITY = 0.04;
const JUMP_FORCE = 0.52;
const JUMP_HOLD_BOOST = 0.03;
const SCROLL_SPEED_BASE = 0.12;
const SPAWN_MARGIN = 3;

const PLATFORM_GAP_MIN = 1;
const PLATFORM_GAP_MAX = 2;
const PLATFORM_WIDTH_MIN = 5;
const PLATFORM_WIDTH_MAX = 8;
const PLATFORM_COLORS = [
  0x2ca8c2, 0x98cb4a, 0xf76d3c, 0xf15f74, 0x5481e6, 0xab0000, 0x19d700,
];

const random = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export type PlatformData = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  mesh: THREE.Mesh;
};

export type SparkParticle = {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  scale: number;
};

export type GameState = {
  playerX: number;
  playerY: number;
  velocityX: number;
  velocityY: number;
  platforms: PlatformData[];
  particles: SparkParticle[];
  sparkCooldown: number;
  jumpCount: number;
  jumpCountRecord: number;
  acceleration: number;
  accelerationTweening: number;
  maxDistanceBetween: number;
};

const PARTICLE_SIZE = 0.1;
const PARTICLE_COUNT_LAND = 8;
const PARTICLE_COUNT_SIDE = 12;
const PARTICLE_COUNT_RUN = 2;
const PARTICLE_MAX = 40;

const getRightmostPlatformEdge = (
  platforms: PlatformData[],
  exclude?: PlatformData
): number => {
  const list = exclude ? platforms.filter((p) => p !== exclude) : platforms;
  if (list.length === 0) return SCENE_WIDTH + SPAWN_MARGIN;
  return Math.max(...list.map((p) => p.x + p.width / 2));
};

function createPlatformMesh(
  width: number,
  height: number,
  depth: number,
  color: number,
  scene: THREE.Scene
): THREE.Mesh {
  const geom = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/** Искры только снизу слева: позиция у нижнего левого угла, разлёт влево и чуть вниз (не вверх). */
const spawnSparks = (
  scene: THREE.Scene,
  x: number,
  y: number,
  color: number,
  count: number,
  state: GameState,
  biasVx = 0,
  biasVy = 0,
  offsetX = 0,
  offsetY = 0
): void => {
  if (state.particles.length >= PARTICLE_MAX) return;
  for (let i = 0; i < count && state.particles.length < PARTICLE_MAX; i++) {
    const geom = new THREE.BoxGeometry(
      PARTICLE_SIZE,
      PARTICLE_SIZE,
      PARTICLE_SIZE * 0.5
    );
    const mat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.3 ? color : 0x181818,
      metalness: 0.4,
      roughness: 0.5,
      emissive: color,
      emissiveIntensity: 0.2,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(
      x + offsetX + random(-0.04, 0.06),
      y + offsetY + random(-0.03, 0.01),
      random(-0.08, 0.08)
    );
    scene.add(mesh);
    state.particles.push({
      mesh,
      vx: biasVx + random(-0.12, 0.06),
      vy: biasVy + random(-0.14, 0.02),
      scale: 1,
    });
  }
};

const recyclePlatform = (p: PlatformData, leftEdge: number): void => {
  const width = random(PLATFORM_WIDTH_MIN, PLATFORM_WIDTH_MAX);
  const color = randomChoice(PLATFORM_COLORS);
  p.x = leftEdge + width / 2;
  p.y = PLATFORM_SURFACE_Y - PLATFORM_THICKNESS / 2;
  p.width = width;
  p.height = PLATFORM_THICKNESS;
  p.color = color;
  p.mesh.geometry.dispose();
  (p.mesh.material as THREE.Material).dispose();
  p.mesh.geometry = new THREE.BoxGeometry(
    width,
    PLATFORM_THICKNESS,
    PLATFORM_DEPTH
  );
  p.mesh.material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.7,
  });
  p.mesh.position.set(p.x, p.y, 0);
};

export const InfiniteRunner = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerMeshRef = useRef<THREE.Mesh | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const keysRef = useRef({ UP: false, SPACE: false, W: false });
  const draggingRef = useRef(false);
  const rafRef = useRef<number>(0);
  const scoreLabelRef = useRef<HTMLDivElement>(null);
  const recordLabelRef = useRef<HTMLDivElement>(null);
  /** Избегаем прямой ссылки на `gameLoop` внутри того же `useCallback` (react-hooks/immutability). */
  const gameLoopRef = useRef<() => void>(() => {});

  const gameLoop = useCallback(() => {
    const state = stateRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const playerMesh = playerMeshRef.current;

    if (!state || !scene || !camera || !renderer || !playerMesh) return;

    const keys = keysRef.current;
    const dragging = draggingRef.current;
    const speed = SCROLL_SPEED_BASE + state.acceleration * 0.04;
    if (state.sparkCooldown > 0) state.sparkCooldown -= 1;

    // Physics
    state.velocityY -= GRAVITY;
    state.playerX += state.velocityX;
    state.playerY += state.velocityY;

    // Respawn when fall or leave left
    if (state.playerY < -2 || state.playerX + PLAYER_SIZE / 2 < -2) {
      state.playerX = 4;
      state.playerY = SCENE_HEIGHT - 1;
      state.velocityX = 0;
      state.velocityY = 0;
      state.jumpCount = 0;
      state.acceleration = 0;
      state.accelerationTweening = 0;
      state.maxDistanceBetween = 6;
      let leftEdge = 4;
      for (let i = 0; i < state.platforms.length; i++) {
        const p = state.platforms[i];
        const w = random(PLATFORM_WIDTH_MIN, PLATFORM_WIDTH_MAX);
        const c = randomChoice(PLATFORM_COLORS);
        p.width = w;
        p.color = c;
        p.x = leftEdge + w / 2;
        p.y = PLATFORM_SURFACE_Y - PLATFORM_THICKNESS / 2;
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        p.mesh.geometry = new THREE.BoxGeometry(
          w,
          PLATFORM_THICKNESS,
          PLATFORM_DEPTH
        );
        p.mesh.material = new THREE.MeshStandardMaterial({
          color: c,
          metalness: 0.2,
          roughness: 0.7,
        });
        p.mesh.position.set(p.x, p.y, 0);
        leftEdge =
          p.x +
          p.width / 2 +
          random(PLATFORM_GAP_MIN, state.maxDistanceBetween);
      }
    }

    if (
      (keys.UP || keys.SPACE || keys.W || dragging) &&
      state.velocityY > 0 &&
      state.velocityY < 0.4
    ) {
      state.velocityY += JUMP_HOLD_BOOST;
    }

    // Difficulty
    switch (state.jumpCount) {
      case 10:
        state.accelerationTweening = 1;
        state.maxDistanceBetween = 8;
        break;
      case 25:
        state.accelerationTweening = 2;
        state.maxDistanceBetween = 10;
        break;
      case 40:
        state.accelerationTweening = 3;
        state.maxDistanceBetween = 12;
        break;
    }
    state.acceleration +=
      (state.accelerationTweening - state.acceleration) * 0.01;

    // Collision with platforms
    const playerLeft = state.playerX - PLAYER_SIZE / 2;
    const playerRight = state.playerX + PLAYER_SIZE / 2;
    const playerBottom = state.playerY - PLAYER_SIZE / 2;
    const playerTop = state.playerY + PLAYER_SIZE / 2;

    for (const platform of state.platforms) {
      const plLeft = platform.x - platform.width / 2;
      const plRight = platform.x + platform.width / 2;
      const plTop = platform.y + platform.height / 2;
      const plBottom = platform.y - platform.height / 2;

      const overlapX = playerRight > plLeft && playerLeft < plRight;
      const overlapY = playerBottom < plTop && playerTop > plBottom;

      if (overlapX && overlapY) {
        const landingFromAbove =
          state.velocityY <= 0 && playerBottom <= plTop + 0.1;

        if (landingFromAbove) {
          const justLanded = state.velocityY < 0;
          if (justLanded) {
            spawnSparks(
              scene,
              state.playerX,
              plTop,
              platform.color,
              PARTICLE_COUNT_LAND,
              state,
              -0.1,
              0.06,
              -PLAYER_SIZE / 2 + 0.1,
              0.03
            );
          }
          if (state.sparkCooldown <= 0) {
            spawnSparks(
              scene,
              state.playerX,
              plTop,
              platform.color,
              PARTICLE_COUNT_RUN,
              state,
              -0.28 - speed * 0.55,
              -0.05,
              -PLAYER_SIZE / 2 + 0.06,
              -0.02
            );
            state.sparkCooldown = 2;
          }
          state.playerY = plTop + PLAYER_SIZE / 2;
          state.velocityY = 0;
        }

        const hitFromLeft =
          playerRight > plLeft && playerLeft < plLeft && state.velocityX >= 0;

        if (hitFromLeft) {
          state.playerX = plLeft - PLAYER_SIZE / 2 - 0.1;
          state.velocityY = -0.4 - state.acceleration * 0.15;
          state.velocityX = -0.8 - state.acceleration * 0.15;
          spawnSparks(
            scene,
            state.playerX,
            state.playerY - PLAYER_SIZE / 2,
            platform.color,
            PARTICLE_COUNT_SIDE,
            state,
            -0.22,
            -0.08,
            -PLAYER_SIZE / 2 + 0.08,
            -0.02
          );
        } else if (
          landingFromAbove &&
          (keys.UP || keys.SPACE || keys.W || dragging)
        ) {
          state.velocityY = JUMP_FORCE;
          state.jumpCount++;
          if (state.jumpCount > state.jumpCountRecord) {
            state.jumpCountRecord = state.jumpCount;
          }
        }
      }
    }

    // Update sparks
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.scale *= 0.88;
      p.mesh.scale.setScalar(p.scale);
      if (p.scale < 0.08) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        state.particles.splice(i, 1);
      }
    }

    // Move platforms left (scroll); recycle when fully off left
    for (let i = 0; i < state.platforms.length; i++) {
      const p = state.platforms[i];
      p.x -= speed;
      p.mesh.position.x = p.x;

      if (p.x + p.width / 2 < -SPAWN_MARGIN) {
        const rightEdge = getRightmostPlatformEdge(state.platforms, p);
        const spawnLeft =
          Math.max(SCENE_WIDTH + SPAWN_MARGIN, rightEdge) +
          random(PLATFORM_GAP_MIN, state.maxDistanceBetween);
        recyclePlatform(p, spawnLeft);
      }
    }

    playerMesh.position.set(state.playerX, state.playerY, 0);

    if (scoreLabelRef.current) {
      scoreLabelRef.current.textContent = `Прыжки: ${state.jumpCount}`;
    }
    if (recordLabelRef.current) {
      recordLabelRef.current.textContent = `Рекорд: ${state.jumpCountRecord}`;
    }

    renderer.render(scene, camera);
    rafRef.current = requestAnimationFrame(() => {
      gameLoopRef.current();
    });
  }, []);

  useEffect(() => {
    gameLoopRef.current = gameLoop;
  }, [gameLoop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3e3e3);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const viewHeight = SCENE_HEIGHT + 2;
    const viewWidth = viewHeight * aspect;
    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      100
    );
    camera.position.set(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, 15);
    camera.lookAt(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, 0);
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    container.setAttribute('tabindex', '0');

    const onCanvasPointerDown = () => {
      container.focus();
      draggingRef.current = true;
    };
    const onCanvasPointerUp = () => {
      draggingRef.current = false;
    };
    renderer.domElement.addEventListener('mousedown', onCanvasPointerDown);
    renderer.domElement.addEventListener('touchstart', onCanvasPointerDown, {
      passive: true,
    });
    window.addEventListener('mouseup', onCanvasPointerUp);
    window.addEventListener('touchend', onCanvasPointerUp);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(SCENE_WIDTH / 2, SCENE_HEIGHT, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const playerGeom = new THREE.BoxGeometry(
      PLAYER_SIZE,
      PLAYER_SIZE,
      PLAYER_SIZE
    );
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      metalness: 0.3,
      roughness: 0.6,
    });
    const playerMesh = new THREE.Mesh(playerGeom, playerMat);
    playerMesh.castShadow = true;
    scene.add(playerMesh);
    playerMeshRef.current = playerMesh;

    const platforms: PlatformData[] = [];
    let nextLeftEdge = 4;

    for (let i = 0; i < 5; i++) {
      const width = random(PLATFORM_WIDTH_MIN, PLATFORM_WIDTH_MAX);
      const color = randomChoice(PLATFORM_COLORS);
      const mesh = createPlatformMesh(
        width,
        PLATFORM_THICKNESS,
        PLATFORM_DEPTH,
        color,
        scene
      );
      const centerX = i === 0 ? 4 : nextLeftEdge + width / 2;
      const platform: PlatformData = {
        x: centerX,
        y: PLATFORM_SURFACE_Y - PLATFORM_THICKNESS / 2,
        width,
        height: PLATFORM_THICKNESS,
        color,
        mesh,
      };
      mesh.position.set(platform.x, platform.y, 0);
      platforms.push(platform);
      nextLeftEdge =
        platform.x +
        platform.width / 2 +
        random(PLATFORM_GAP_MIN, PLATFORM_GAP_MAX);
    }

    stateRef.current = {
      playerX: 4,
      playerY: SCENE_HEIGHT - 1,
      velocityX: 0,
      velocityY: 0,
      platforms,
      particles: [],
      sparkCooldown: 0,
      jumpCount: 0,
      jumpCountRecord: 0,
      acceleration: 0,
      accelerationTweening: 0,
      maxDistanceBetween: 6,
    };

    const onResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / h;
      const viewHeight = SCENE_HEIGHT + 2;
      const viewWidth = viewHeight * aspect;
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    rafRef.current = requestAnimationFrame(() => {
      gameLoopRef.current();
    });

    return () => {
      renderer.domElement.removeEventListener('mousedown', onCanvasPointerDown);
      renderer.domElement.removeEventListener(
        'touchstart',
        onCanvasPointerDown
      );
      window.removeEventListener('mouseup', onCanvasPointerUp);
      window.removeEventListener('touchend', onCanvasPointerUp);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      playerGeom.dispose();
      playerMat.dispose();
      platforms.forEach((p) => {
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        scene.remove(p.mesh);
      });
      stateRef.current?.particles.forEach((p) => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
      });
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      playerMeshRef.current = null;
      stateRef.current = null;
    };
  }, [gameLoop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
      }
      if (e.code === 'Space') keysRef.current.SPACE = true;
      if (e.code === 'ArrowUp') keysRef.current.UP = true;
      if (e.code === 'KeyW') keysRef.current.W = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') keysRef.current.SPACE = false;
      if (e.code === 'ArrowUp') keysRef.current.UP = false;
      if (e.code === 'KeyW') keysRef.current.W = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', onKeyDown);
      container.addEventListener('keyup', onKeyUp);
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (container) {
        container.removeEventListener('keydown', onKeyDown);
        container.removeEventListener('keyup', onKeyUp);
      }
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Infinite Runner"
        link="https://codepen.io/EduardoLopes/pen/vYWpLQ"
      />
      <div className={styles.scoreRow}>
        <span ref={recordLabelRef} className={styles.record}>
          Рекорд: 0
        </span>
        <span ref={scoreLabelRef} className={styles.score}>
          Прыжки: 0
        </span>
      </div>
      <div ref={containerRef} className={styles.gameContainer} />
      <div className={styles.controls}>
        <p>
          Прыжок: <b>КЛИК</b>, <b>ПРОБЕЛ</b>, <b>↑</b> или <b>W</b> (удерживайте
          для высокого прыжка).
        </p>
      </div>
    </div>
  );
};
