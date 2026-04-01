import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { PageHeader } from '@/components/UI';
import styles from './TowerBlocks.module.scss';

// --- Types ---

interface BlockReturn {
  placed?: THREE.Mesh;
  chopped?: THREE.Mesh;
  plane: 'x' | 'y' | 'z';
  direction: number;
  bonus?: boolean;
}

// --- Stage (Three.js scene) ---

class Stage {
  private container: HTMLElement;
  private camera: THREE.OrthographicCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private light: THREE.DirectionalLight;
  private softLight: THREE.AmbientLight;
  private newBlocks: THREE.Group;
  private placedBlocks: THREE.Group;
  private choppedBlocks: THREE.Group;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor('#D0CBC7', 1);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight;
    const d = 20;
    this.camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      -100,
      1000
    );
    this.camera.position.set(2, 0, 2);
    this.camera.lookAt(0, 0, 0);

    this.light = new THREE.DirectionalLight(0xffffff, 0.5);
    this.light.position.set(0, 499, 0);
    this.scene.add(this.light);
    this.softLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.softLight);

    this.newBlocks = new THREE.Group();
    this.placedBlocks = new THREE.Group();
    this.choppedBlocks = new THREE.Group();
    this.scene.add(this.newBlocks);
    this.scene.add(this.placedBlocks);
    this.scene.add(this.choppedBlocks);

    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  setCamera(y: number, speed = 0.3) {
    gsap.to(this.camera.position, {
      y: y + 2,
      duration: speed,
      ease: 'power1.inOut',
    });
    const lookAtTarget = { x: 0, y: this.camera.position.y - 2, z: 0 };
    gsap.to(lookAtTarget, {
      y,
      duration: speed,
      ease: 'power1.inOut',
      onUpdate: () =>
        this.camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z),
    });
  }

  onResize = () => {
    const viewSize = 30;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
    this.renderer.setSize(w, h);
    this.camera.left = w / -viewSize;
    this.camera.right = w / viewSize;
    this.camera.top = h / viewSize;
    this.camera.bottom = h / -viewSize;
    this.camera.updateProjectionMatrix();
  };

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  getNewBlocks() {
    return this.newBlocks;
  }
  getPlacedBlocks() {
    return this.placedBlocks;
  }
  getChoppedBlocks() {
    return this.choppedBlocks;
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// --- Block ---

/** Высота, на которой стоит первая платформа (базовый блок) */
const BASE_PLATFORM_Y = 2;

class Block {
  private static readonly STATES = {
    ACTIVE: 'active',
    STOPPED: 'stopped',
    MISSED: 'missed',
  };
  private static readonly MOVE_AMOUNT = 12;

  dimension: { width: number; height: number; depth: number };
  position: { x: number; y: number; z: number };
  mesh: THREE.Mesh;
  state: string;
  index: number;
  speed: number;
  direction: number;
  colorOffset: number;
  color: THREE.ColorRepresentation;
  material: THREE.MeshToonMaterial;
  workingPlane: 'x' | 'y' | 'z';
  workingDimension: 'width' | 'height' | 'depth';
  targetBlock: Block | null;

  constructor(targetBlock: Block | null) {
    this.targetBlock = targetBlock;
    this.index = targetBlock ? targetBlock.index + 1 : 0;
    this.workingPlane = this.index % 2 ? 'x' : 'z';
    this.workingDimension = this.index % 2 ? 'width' : 'depth';

    this.dimension = {
      width: targetBlock ? targetBlock.dimension.width : 10,
      height: targetBlock ? targetBlock.dimension.height : 2,
      depth: targetBlock ? targetBlock.dimension.depth : 10,
    };
    this.position = {
      x: targetBlock ? targetBlock.position.x : 0,
      y: BASE_PLATFORM_Y + this.dimension.height * this.index,
      z: targetBlock ? targetBlock.position.z : 0,
    };
    this.colorOffset = targetBlock
      ? targetBlock.colorOffset
      : Math.round(Math.random() * 100);

    if (!targetBlock) {
      this.color = 0x333344;
    } else {
      const offset = this.index + this.colorOffset;
      const r = (Math.sin(0.3 * offset) * 55 + 200) / 255;
      const g = (Math.sin(0.3 * offset + 2) * 55 + 200) / 255;
      const b = (Math.sin(0.3 * offset + 4) * 55 + 200) / 255;
      this.color = new THREE.Color(
        r,
        g,
        b
      ) as unknown as THREE.ColorRepresentation;
    }

    // Базовый блок (index 0) — неподвижен, все остальные — двигаются до клика
    this.state = targetBlock ? Block.STATES.ACTIVE : Block.STATES.STOPPED;
    this.speed = -0.1 - this.index * 0.005;
    if (this.speed < -4) this.speed = -4;
    this.direction = this.speed;

    const geometry = new THREE.BoxGeometry(
      this.dimension.width,
      this.dimension.height,
      this.dimension.depth
    );
    geometry.applyMatrix4(
      new THREE.Matrix4().makeTranslation(
        this.dimension.width / 2,
        this.dimension.height / 2,
        this.dimension.depth / 2
      )
    );
    this.material = new THREE.MeshToonMaterial({
      color: this.color as number,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    if (this.state === Block.STATES.ACTIVE) {
      this.position[this.workingPlane] =
        Math.random() > 0.5 ? -Block.MOVE_AMOUNT : Block.MOVE_AMOUNT;
    }
  }

  reverseDirection() {
    this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
  }

  place(): BlockReturn {
    this.state = Block.STATES.STOPPED;
    const target = this.targetBlock!;
    const d = this.dimension[this.workingDimension];
    const D = target.dimension[this.workingDimension];
    // mesh.position после makeTranslation(dim/2,dim/2,dim/2) — это МИНИМАЛЬНЫЙ угол бокса (начало)
    const cur = this.position[this.workingPlane];
    const tgt = target.position[this.workingPlane];
    const curMin = cur;
    const curMax = cur + d;
    const tgtMin = tgt;
    const tgtMax = tgt + D;

    const overlapMin = Math.max(curMin, tgtMin);
    const overlapMax = Math.min(curMax, tgtMax);
    let overlap = overlapMax - overlapMin;

    const eps = 0.001;
    overlap = Math.max(0, Math.min(overlap, d));
    if (overlap < eps) {
      this.state = Block.STATES.MISSED;
      return { plane: this.workingPlane, direction: this.direction };
    }

    const blocksToReturn: BlockReturn = {
      plane: this.workingPlane,
      direction: this.direction,
    };

    const isBonus = d - overlap < 0.3;
    if (isBonus) {
      blocksToReturn.bonus = true;
      this.position.x = target.position.x;
      this.position.z = target.position.z;
      this.dimension.width = target.dimension.width;
      this.dimension.depth = target.dimension.depth;
      this.dimension[this.workingDimension] = D;
      this.position[this.workingPlane] = tgt;
    } else {
      // Поставленная часть = зона перекрытия: позиция = начало перекрытия, размер = overlap
      this.dimension[this.workingDimension] = overlap;
      this.position[this.workingPlane] = overlapMin;
    }

    const placedGeometry = new THREE.BoxGeometry(
      this.dimension.width,
      this.dimension.height,
      this.dimension.depth
    );
    placedGeometry.applyMatrix4(
      new THREE.Matrix4().makeTranslation(
        this.dimension.width / 2,
        this.dimension.height / 2,
        this.dimension.depth / 2
      )
    );
    const placedMesh = new THREE.Mesh(placedGeometry, this.material);
    placedMesh.position.set(this.position.x, this.position.y, this.position.z);
    blocksToReturn.placed = placedMesh;

    const choppedSize = d - overlap;
    if (!blocksToReturn.bonus && choppedSize >= eps) {
      const choppedDimensions = {
        width: this.dimension.width,
        height: this.dimension.height,
        depth: this.dimension.depth,
      };
      choppedDimensions[this.workingDimension] = choppedSize;

      const choppedGeometry = new THREE.BoxGeometry(
        choppedDimensions.width,
        choppedDimensions.height,
        choppedDimensions.depth
      );
      choppedGeometry.applyMatrix4(
        new THREE.Matrix4().makeTranslation(
          choppedDimensions.width / 2,
          choppedDimensions.height / 2,
          choppedDimensions.depth / 2
        )
      );
      const choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
      const choppedPosition = { ...this.position };
      // Обрезок: кусок вне перекрытия. Позиция = начало этого куска (мин. угол)
      if (cur < tgt) {
        choppedPosition[this.workingPlane] = cur;
      } else {
        choppedPosition[this.workingPlane] = overlapMax;
      }
      choppedMesh.position.set(
        choppedPosition.x,
        choppedPosition.y,
        choppedPosition.z
      );
      blocksToReturn.chopped = choppedMesh;
    }

    return blocksToReturn;
  }

  tick() {
    if (this.state === Block.STATES.ACTIVE) {
      const value = this.position[this.workingPlane];
      if (value > Block.MOVE_AMOUNT || value < -Block.MOVE_AMOUNT)
        this.reverseDirection();
      this.position[this.workingPlane] += this.direction;
      this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
    }
  }
}

// --- Game ---

const GAME_STATES = {
  LOADING: 'loading',
  PLAYING: 'playing',
  READY: 'ready',
  ENDED: 'ended',
  RESETTING: 'resetting',
} as const;

type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES];

class Game {
  private stage: Stage;
  private mainContainer: HTMLElement;
  private scoreContainer: HTMLElement;
  private instructions: HTMLElement;
  private blocks: Block[] = [];
  private state: GameState = GAME_STATES.LOADING;
  private rafId: number = 0;
  private keyHandler: (e: KeyboardEvent) => void;
  private clickHandler: () => void;
  private touchHandler: (e: TouchEvent) => void;

  private hideInstructionsClass: string;

  constructor(
    container: HTMLElement,
    gameEl: HTMLElement,
    scoreEl: HTMLElement,
    instructionsEl: HTMLElement,
    hideInstructionsClass: string
  ) {
    this.hideInstructionsClass = hideInstructionsClass;
    this.mainContainer = container;
    this.scoreContainer = scoreEl;
    this.instructions = instructionsEl;
    this.stage = new Stage(gameEl);

    this.scoreContainer.textContent = '0';

    this.addBlock();
    this.tick();

    this.updateState(GAME_STATES.READY);

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        this.onAction();
      }
    };
    this.clickHandler = () => this.onAction();
    this.touchHandler = (e: TouchEvent) => {
      e.preventDefault();
      this.onAction();
    };

    document.addEventListener('keydown', this.keyHandler);
    document.addEventListener('click', this.clickHandler);
    document.addEventListener('touchend', this.touchHandler, {
      passive: false,
    });
  }

  private updateState(newState: GameState) {
    Object.values(GAME_STATES).forEach((s) =>
      this.mainContainer.classList.remove(s)
    );
    this.mainContainer.classList.add(newState);
    this.state = newState;
  }

  private onAction() {
    switch (this.state) {
      case GAME_STATES.READY:
        this.startGame();
        break;
      case GAME_STATES.PLAYING:
        this.placeBlock();
        break;
      case GAME_STATES.ENDED:
        this.restartGame();
        break;
    }
  }

  private startGame() {
    if (this.state !== GAME_STATES.PLAYING) {
      this.scoreContainer.textContent = '0';
      this.updateState(GAME_STATES.PLAYING);
      this.addBlock();
    }
  }

  private restartGame() {
    this.updateState(GAME_STATES.RESETTING);
    const oldBlocks = this.stage.getPlacedBlocks().children.slice();
    const removeSpeed = 0.2;
    const delayAmount = 0.02;
    for (let i = 0; i < oldBlocks.length; i++) {
      const mesh = oldBlocks[i] as THREE.Mesh;
      gsap.to(mesh.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: removeSpeed,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: 'power1.in',
        onComplete: () => {
          this.stage.getPlacedBlocks().remove(mesh);
        },
      });
      gsap.to(mesh.rotation, {
        y: 0.5,
        duration: removeSpeed,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: 'power1.in',
      });
    }
    const cameraMoveSpeed = removeSpeed * 2 + oldBlocks.length * delayAmount;
    this.stage.setCamera(2, cameraMoveSpeed);

    const countdown = { value: this.blocks.length - 1 };
    gsap.to(countdown, {
      value: 0,
      duration: cameraMoveSpeed,
      onUpdate: () => {
        this.scoreContainer.textContent = String(Math.round(countdown.value));
      },
    });

    this.blocks = this.blocks.slice(0, 1);

    setTimeout(() => {
      this.startGame();
    }, cameraMoveSpeed * 1000);
  }

  private placeBlock() {
    const currentBlock = this.blocks[this.blocks.length - 1];
    const result = currentBlock.place();
    this.stage.getNewBlocks().remove(currentBlock.mesh);
    if (result.placed) this.stage.getPlacedBlocks().add(result.placed);
    if (result.chopped) {
      this.stage.getChoppedBlocks().add(result.chopped);
      const positionParams: gsap.TweenVars = {
        y: '-=30',
        ease: 'power1.in',
        onComplete: () => {
          this.stage.getChoppedBlocks().remove(result.chopped!);
        },
      };
      const rotateRandomness = 10;
      const rotationParams = {
        delay: 0.05,
        x:
          result.plane === 'z'
            ? Math.random() * rotateRandomness - rotateRandomness / 2
            : 0.1,
        z:
          result.plane === 'x'
            ? Math.random() * rotateRandomness - rotateRandomness / 2
            : 0.1,
        y: Math.random() * 0.1,
      };
      if (
        result.chopped.position[result.plane] >
        result.placed!.position[result.plane]
      ) {
        (positionParams as Record<string, string>)[result.plane] =
          '+=' + 40 * Math.abs(result.direction);
      } else {
        (positionParams as Record<string, string>)[result.plane] =
          '-=' + 40 * Math.abs(result.direction);
      }
      gsap.to(result.chopped.position, { duration: 1, ...positionParams });
      gsap.to(result.chopped.rotation, { duration: 1, ...rotationParams });
    }
    this.addBlock();
  }

  private addBlock() {
    const lastBlock = this.blocks[this.blocks.length - 1];
    if (lastBlock && lastBlock.state === 'missed') {
      this.endGame();
      return;
    }
    const newBlock = new Block(lastBlock ?? null);
    this.stage.getNewBlocks().add(newBlock.mesh);
    this.blocks.push(newBlock);
    this.scoreContainer.textContent = String(this.blocks.length - 1);
    this.stage.setCamera(this.blocks.length * 2);
    if (this.blocks.length >= 5)
      this.instructions.classList.add(this.hideInstructionsClass);
  }

  private endGame() {
    this.updateState(GAME_STATES.ENDED);
  }

  private tick = () => {
    const last = this.blocks[this.blocks.length - 1];
    if (last) last.tick();
    this.stage.render();
    this.rafId = requestAnimationFrame(this.tick);
  };

  destroy() {
    cancelAnimationFrame(this.rafId);
    document.removeEventListener('keydown', this.keyHandler);
    document.removeEventListener('click', this.clickHandler);
    document.removeEventListener('touchend', this.touchHandler);
    this.stage.dispose();
  }
}

// --- React component ---

export const TowerBlocks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const instructionsRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const gameEl = gameRef.current;
    const scoreEl = scoreRef.current;
    const instructionsEl = instructionsRef.current;

    if (!container || !gameEl || !scoreEl || !instructionsEl) {
      return;
    }

    gameInstanceRef.current = new Game(
      container,
      gameEl,
      scoreEl,
      instructionsEl,
      styles.hide
    );

    return () => {
      gameInstanceRef.current?.destroy();
      gameInstanceRef.current = null;
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Постройка башни"
        link="https://codepen.io/ste-vg/pen/ppLQNW"
      />
      <div
        ref={containerRef}
        className={styles.container}
        role="application"
        aria-label="Tower Blocks game"
      >
        <div ref={gameRef} className={styles.game} />
        <div ref={scoreRef} className={styles.score}>
          0
        </div>
        <div ref={instructionsRef} className={styles.instructions}>
          Click (or press the spacebar) to place the block
        </div>
      </div>
    </div>
  );
};
