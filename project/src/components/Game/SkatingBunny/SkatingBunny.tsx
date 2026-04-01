import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import gsap from 'gsap';
import { PageHeader } from '@/components/UI';
import {
  reflectorVertexShader,
  reflectorFragmentShader,
  simulationVertexShader,
  simulationFragmentShader,
  outlineVertexShader,
  outlineFragmentShader,
} from './shaders';
import styles from './SkatingBunny.module.scss';

class BufferSim {
  renderer: THREE.WebGLRenderer;
  shader: THREE.ShaderMaterial;
  orthoScene: THREE.Scene;
  fbos: THREE.WebGLRenderTarget[];
  current: number;
  output: THREE.WebGLRenderTarget;
  orthoCamera: THREE.OrthographicCamera;
  orthoQuad: THREE.Mesh;
  input: THREE.WebGLRenderTarget;

  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    shader: THREE.ShaderMaterial
  ) {
    this.renderer = renderer;
    this.shader = shader;
    this.orthoScene = new THREE.Scene();
    const fbo = new THREE.WebGLRenderTarget(width, height, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    });
    fbo.texture.generateMipmaps = false;
    this.fbos = [fbo, fbo.clone()];
    this.current = 0;
    this.output = this.fbos[0];
    this.input = this.fbos[0];
    this.orthoCamera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0.00001,
      1000
    );
    this.orthoQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      this.shader
    );
    this.orthoScene.add(this.orthoQuad);
  }

  render() {
    this.shader.uniforms.inputTexture.value = this.fbos[this.current].texture;
    this.input = this.fbos[this.current];
    this.current = 1 - this.current;
    this.output = this.fbos[this.current];
    this.renderer.setRenderTarget(this.output);
    this.renderer.render(this.orthoScene, this.orthoCamera);
    this.renderer.setRenderTarget(null);
  }

  dispose() {
    this.fbos[0].dispose();
    this.fbos[1].dispose();
  }
}

export const SkatingBunny = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const winWidth = container.clientWidth;
    const winHeight = container.clientHeight;
    const bgrColor = 0x332e2e;
    const floorSize = 30;

    const scene = new THREE.Scene();
    const fog = new THREE.Fog(bgrColor, 13, 20);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(
      60,
      winWidth / winHeight,
      1,
      100
    );
    camera.position.set(1, 5, 14);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(new THREE.Color(bgrColor));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(winWidth, winHeight);
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.localClippingEnabled = true;

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const heroOldUVPos = new THREE.Vector2(0.5, 0.5);
    const heroNewUVPos = new THREE.Vector2(0.5, 0.5);
    const heroSpeed = new THREE.Vector2(0, 0);
    const targetHeroUVPos = new THREE.Vector2(0.5, 0.5);
    const targetHeroAbsMousePos = new THREE.Vector2(0, 0);

    let rabbit: THREE.Group | null = null;
    let rabbitBody: THREE.Mesh;
    let earRight: THREE.Mesh;
    let earLeft: THREE.Mesh;
    let carrot: THREE.Group;
    let floor: Reflector;
    let line: THREE.Line;
    let floorSimMat: THREE.ShaderMaterial;
    let bufferSim: BufferSim;
    let primMat: THREE.MeshToonMaterial;
    let bonusMat: THREE.MeshToonMaterial;
    let outlineMat: THREE.ShaderMaterial;
    let light: THREE.DirectionalLight;

    let heroAngularSpeed = 0;
    let heroOldRot = 0;
    let heroDistance = 0;
    let isJumping = false;
    let isExploding = false;
    const jumpParams = { jumpProgress: 0, landProgress: 0 };
    const particles1: THREE.Mesh[] = [];
    const particles2: THREE.Mesh[] = [];

    function createSim() {
      floorSimMat = new THREE.ShaderMaterial({
        uniforms: {
          inputTexture: { value: null as THREE.Texture | null },
          time: { value: 0 },
          blade1PosOld: { value: new THREE.Vector2(0.5, 0.5) },
          blade1PosNew: { value: new THREE.Vector2(0.5, 0.5) },
          strength: { value: 0 },
        },
        vertexShader: simulationVertexShader,
        fragmentShader: simulationFragmentShader,
      });
      bufferSim = new BufferSim(renderer, 1024, 1024, floorSimMat);
    }

    function createMaterials() {
      primMat = new THREE.MeshToonMaterial({ color: 0x7beeff });
      bonusMat = new THREE.MeshToonMaterial({ color: 0xff3434 });
      outlineMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x000000) },
          size: { value: 0.02 },
          time: { value: 0 },
        },
        vertexShader: outlineVertexShader,
        fragmentShader: outlineFragmentShader,
        side: THREE.BackSide,
      });
    }

    function createFloor() {
      const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
      floor = new Reflector(floorGeometry, {
        color: new THREE.Color(bgrColor),
        textureWidth: 1024,
        textureHeight: 1024,
      });
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.8; // уровень льда ниже, объекты на месте
      floor.receiveShadow = true;

      const renderTarget = floor.getRenderTarget();
      const mat = floor.material as THREE.ShaderMaterial;
      const textureMatrix = mat.uniforms.textureMatrix;

      const lib = (THREE as unknown as { UniformsLib: Record<string, object> })
        .UniformsLib;
      const merged = THREE.UniformsUtils.merge([
        (lib?.common ?? {}) as Record<string, THREE.IUniform<unknown>>,
        (lib?.shadowmap ?? {}) as Record<string, THREE.IUniform<unknown>>,
        (lib?.lights ?? {}) as Record<string, THREE.IUniform<unknown>>,
        mat.uniforms,
        { tScratches: { value: bufferSim.output.texture } },
      ]) as { [key: string]: THREE.IUniform<unknown> };

      mat.lights = true;
      mat.uniforms = merged;
      mat.uniforms.tDiffuse.value = renderTarget.texture;
      mat.uniforms.textureMatrix.value = textureMatrix.value;
      mat.vertexShader = reflectorVertexShader;
      mat.fragmentShader = reflectorFragmentShader;

      scene.add(floor);
    }

    function createLine() {
      const material = new THREE.LineDashedMaterial({
        color: 0x7beeff,
        dashSize: 0.2,
        gapSize: 0.1,
      });
      const points = [
        new THREE.Vector3(0, 0.2, 0),
        new THREE.Vector3(3, 0.2, 3),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      line = new THREE.Line(geometry, material);
      scene.add(line);
    }

    function createLight() {
      scene.add(new THREE.AmbientLight(0xffffff));
      light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(1, 5, 1);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 12;
      light.shadow.camera.left = -12;
      light.shadow.camera.right = 12;
      light.shadow.camera.bottom = -12;
      light.shadow.camera.top = 12;
      scene.add(light);
    }

    function createParticles() {
      const particleGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2, 1, 1, 1);
      for (let i = 0; i < 20; i++) {
        const m = new THREE.Mesh(particleGeom, bonusMat);
        particles1.push(m);
        m.scale.set(0, 0, 0);
        m.renderOrder = 1;
        m.frustumCulled = false;
        scene.add(m);
      }
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(particleGeom, primMat);
        particles2.push(m);
        m.scale.set(0, 0, 0);
        m.renderOrder = 1;
        m.frustumCulled = false;
        scene.add(m);
      }
    }

    function createCharacters() {
      // Кролик — куб
      const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), primMat);
      rabbit = new THREE.Group();
      rabbit.add(box);
      rabbitBody = box;
      earLeft = earRight = box;
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(rabbit);

      // Морковка — красный конус
      carrot = new THREE.Group();
      const carrotCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 1.2, 12),
        bonusMat.clone()
      );
      carrotCone.position.set(0, 0.6, 0);
      carrotCone.rotation.x = Math.PI / 2;
      carrotCone.castShadow = true;
      carrotCone.renderOrder = 2;
      carrotCone.frustumCulled = false;
      carrot.add(carrotCone);
      carrot.renderOrder = 1;
      carrot.frustumCulled = false;
      carrot.scale.set(1, 1, 1);
      carrot.visible = true;
      scene.add(carrot);
      spawnCarrot();
    }

    function getShortestAngle(v: number) {
      let a = v % (Math.PI * 2);
      if (a < -Math.PI) a += Math.PI * 2;
      else if (a > Math.PI) a -= Math.PI * 2;
      return a;
    }

    function constrain(v: number, vMin: number, vMax: number) {
      return Math.min(vMax, Math.max(vMin, v));
    }

    function raycast() {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([floor]);
      if (intersects.length > 0 && intersects[0].uv) {
        targetHeroUVPos.x = intersects[0].uv.x;
        targetHeroUVPos.y = intersects[0].uv.y;
      }
    }

    function jump() {
      if (!rabbit) return;
      const r = rabbit;
      isJumping = true;
      const turns = Math.floor(heroSpeed.length() * 5) + 1;
      const jumpDuration = 0.5 + turns * 0.2;
      const targetRot =
        heroAngularSpeed > 0 ? Math.PI * 2 * turns : -Math.PI * 2 * turns;

      gsap.to(rabbitBody.rotation, {
        duration: jumpDuration,
        ease: 'none',
        y: targetRot,
        onComplete: () => {
          rabbitBody.rotation.y = 0;
        },
      });

      gsap.to([earLeft.rotation, earRight.rotation], {
        duration: jumpDuration * 0.8,
        ease: 'power4.out',
        x: Math.PI / 4,
      });
      gsap.to([earLeft.rotation, earRight.rotation], {
        duration: jumpDuration * 0.2,
        delay: jumpDuration * 0.8,
        ease: 'power4.in',
        x: 0,
      });

      gsap.to(jumpParams, {
        duration: jumpDuration * 0.5,
        ease: 'power2.out',
        jumpProgress: 0.5,
        onUpdate: () => {
          const sin = Math.sin(jumpParams.jumpProgress * Math.PI);
          r.position.y = Math.pow(sin, 4) * turns;
        },
      });
      gsap.to(jumpParams, {
        duration: jumpDuration * 0.5,
        ease: 'power2.in',
        delay: jumpDuration * 0.5,
        jumpProgress: 1,
        onUpdate: () => {
          const sin = Math.sin(jumpParams.jumpProgress * Math.PI);
          r.position.y = Math.pow(sin, 1) * turns;
        },
        onComplete: () => {
          r.position.y = 0;
          jumpParams.jumpProgress = 0;
          isJumping = false;
        },
      });
    }

    function checkCollision() {
      if (isExploding || !rabbit || !carrot) return;
      const distVec = rabbit.position.clone().sub(carrot.position);
      if (distVec.length() <= 1) {
        carrot.visible = false;
        explode(carrot.position.clone());
      }
    }

    function explode(pos: THREE.Vector3) {
      isExploding = true;

      particles1.forEach((m) => {
        m.position.copy(pos);
        m.scale.set(2, 2, 2);
        gsap.to(m.position, {
          x: pos.x + (-0.5 + Math.random()) * 1.5,
          y: pos.y + (0.5 + Math.random()) * 1.5,
          z: pos.z + (-0.5 + Math.random()) * 1.5,
          duration: 1,
          ease: 'power4.out',
        });
        gsap.to(m.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1,
          ease: 'power4.out',
          onComplete: () => {
            spawnCarrot();
            isExploding = false;
          },
        });
      });
      particles2.forEach((m) => {
        m.position.copy(pos);
        m.scale.set(2, 2, 2);
        gsap.to(m.position, {
          x: pos.x + (-0.5 + Math.random()) * 1.5,
          y: pos.y + (0.5 + Math.random()) * 1.5,
          z: pos.z + (-0.5 + Math.random()) * 1.5,
          duration: 1,
          ease: 'power4.out',
        });
        gsap.to(m.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1,
          ease: 'power4.out',
          onComplete: () => {
            spawnCarrot();
            isExploding = false;
          },
        });
      });
    }

    function spawnCarrot() {
      if (!carrot) return;
      const px = (Math.random() - 0.5) * 0.3;
      const py = (Math.random() - 0.5) * 0.3;
      const h = 0.2 + Math.random() * 1;
      carrot.position.set(px * floorSize, h, py * floorSize);
      carrot.scale.set(0.35, 0.35, 0.35);
      carrot.visible = true;
      carrot.traverse((obj) => {
        obj.visible = true;
      });
      carrot.updateMatrixWorld(true);

      gsap.to(carrot.scale, {
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)',
        x: 1,
        y: 1,
        z: 1,
      });
    }

    function updateGame(dt: number) {
      if (!rabbit || !line) return;

      const constrainUVPosX = constrain(targetHeroUVPos.x - 0.5, -0.3, 0.3);
      const constrainUVPosY = constrain(targetHeroUVPos.y - 0.5, -0.3, 0.3);
      targetHeroAbsMousePos.x = constrainUVPosX * floorSize;
      targetHeroAbsMousePos.y = -constrainUVPosY * floorSize;

      const dx = targetHeroAbsMousePos.x - rabbit.position.x;
      const dy = targetHeroAbsMousePos.y - rabbit.position.z;
      const angle = Math.atan2(dy, dx);
      heroDistance = Math.sqrt(dx * dx + dy * dy);
      const ax = dx * dt * 0.5;
      const ay = dy * dt * 0.5;

      heroSpeed.x += ax;
      heroSpeed.y += ay;
      heroSpeed.x *= Math.pow(dt, 0.005);
      heroSpeed.y *= Math.pow(dt, 0.005);

      rabbit.position.x += heroSpeed.x;
      rabbit.position.z += heroSpeed.y;
      const targetRot = -angle + Math.PI / 2;

      if (heroDistance > 0.3) {
        rabbit.rotation.y +=
          getShortestAngle(targetRot - rabbit.rotation.y) * 3 * dt;
      }
      heroAngularSpeed = getShortestAngle(rabbit.rotation.y - heroOldRot);
      heroOldRot = rabbit.rotation.y;

      if (!isJumping) {
        earLeft.rotation.x = earRight.rotation.x = -heroSpeed.length() * 2;
      }

      const posAttr = line.geometry.attributes.position;
      if (posAttr) {
        const p = posAttr.array as Float32Array;
        p[0] = targetHeroAbsMousePos.x;
        p[2] = targetHeroAbsMousePos.y;
        p[3] = rabbit.position.x;
        p[4] = rabbit.position.y;
        p[5] = rabbit.position.z;
        posAttr.needsUpdate = true;
      }
      line.computeLineDistances();

      heroNewUVPos.set(
        0.5 + rabbit.position.x / floorSize,
        0.5 - rabbit.position.z / floorSize
      );

      floorSimMat.uniforms.blade1PosNew.value.copy(heroNewUVPos);
      floorSimMat.uniforms.blade1PosOld.value.copy(heroOldUVPos);
      floorSimMat.uniforms.strength.value = isJumping
        ? 0
        : 1 / (1 + heroSpeed.length() * 10);
      bufferSim.render();
      (floor.material as THREE.ShaderMaterial).uniforms.tScratches.value =
        bufferSim.output.texture;
      heroOldUVPos.copy(heroNewUVPos);

      if (carrot) carrot.rotation.y += dt;
      outlineMat.uniforms.time.value = clock.getElapsedTime();
      checkCollision();
    }

    function draw() {
      const dt = Math.min(clock.getDelta(), 0.3);
      updateGame(dt);
      renderer.render(scene, camera);
    }

    createSim();
    createMaterials();
    createLight();
    createFloor();
    createLine();
    createParticles();
    createCharacters();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (floor) raycast();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
        if (floor) raycast();
      }
    };

    const onPointerDown = () => {
      if (rabbit && !isJumping) jump();
    };

    window.addEventListener('resize', onResize);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', onPointerDown);

    let frameId: number;
    function loop() {
      draw();
      frameId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('mousedown', onPointerDown);
      canvas.removeEventListener('touchstart', onPointerDown);
      cancelAnimationFrame(frameId);
      bufferSim.dispose();
      renderer.dispose();
      if (floor && 'dispose' in floor && typeof floor.dispose === 'function') {
        floor.dispose();
      }
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Казуалка с катанием на льду"
        link="https://codepen.io/Yakudoo/pen/poqazQo"
      />
      <div ref={containerRef} className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.webgl} />
      </div>
      <div className={styles.instructions} id="instructions">
        Нажмите, чтобы прыгнуть
      </div>
    </div>
  );
};
