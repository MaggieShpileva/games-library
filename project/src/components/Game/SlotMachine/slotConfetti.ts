const maxParticleCount = 150;
const particleSpeed = 2;
const colors = [
  'DodgerBlue',
  'OliveDrab',
  'Gold',
  'Pink',
  'SlateBlue',
  'LightBlue',
  'Violet',
  'PaleGreen',
  'SteelBlue',
  'SandyBrown',
  'Chocolate',
  'Crimson',
];

type Particle = {
  color: string;
  x: number;
  y: number;
  diameter: number;
  tilt: number;
  tiltAngleIncrement: number;
  tiltAngle: number;
};

let streamingConfetti = false;
let animationTimer: number | null = null;
const particles: Particle[] = [];
let waveAngle = 0;

const resetParticle = (
  particle: Particle,
  width: number,
  height: number
): Particle => {
  particle.color = colors[(Math.random() * colors.length) | 0]!;
  particle.x = Math.random() * width;
  particle.y = Math.random() * height - height;
  particle.diameter = Math.random() * 10 + 5;
  particle.tilt = Math.random() * 10 - 10;
  particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
  particle.tiltAngle = 0;
  return particle;
};

const drawParticles = (context: CanvasRenderingContext2D) => {
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i]!;
    context.beginPath();
    context.lineWidth = particle.diameter;
    context.strokeStyle = particle.color;
    const x = particle.x + particle.tilt;
    context.moveTo(x + particle.diameter / 2, particle.y);
    context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
    context.stroke();
  }
};

const updateParticles = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  waveAngle += 0.01;
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i]!;
    if (!streamingConfetti && particle.y < -15) {
      particle.y = height + 100;
    } else {
      particle.tiltAngle += particle.tiltAngleIncrement;
      particle.x += Math.sin(waveAngle);
      particle.y +=
        (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
      particle.tilt = Math.sin(particle.tiltAngle) * 15;
    }
    if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
      if (streamingConfetti && particles.length <= maxParticleCount) {
        resetParticle(particle, width, height);
      } else {
        particles.splice(i, 1);
        i--;
      }
    }
  }
};

let resizeHandler: (() => void) | null = null;
let canvasEl: HTMLCanvasElement | null = null;

export function startConfetti() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  let canvas = document.getElementById(
    'confetti-canvas'
  ) as HTMLCanvasElement | null;
  if (canvas === null) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText =
      'display:block;z-index:999999;pointer-events:none;position:fixed;top:0;left:0;width:100%;height:100%';
    document.body.appendChild(canvas);
    canvasEl = canvas;
  }
  canvas.width = width;
  canvas.height = height;

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler, true);
  }
  resizeHandler = () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };
  window.addEventListener('resize', resizeHandler, true);

  const context = canvas.getContext('2d');
  if (!context) return;

  while (particles.length < maxParticleCount) {
    particles.push(resetParticle({} as Particle, width, height));
  }
  streamingConfetti = true;

  if (animationTimer === null) {
    const runAnimation = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (particles.length === 0) {
        animationTimer = null;
      } else {
        updateParticles();
        drawParticles(context);
        animationTimer = requestAnimationFrame(runAnimation);
      }
    };
    runAnimation();
  }
}

export const stopConfetti = () => {
  streamingConfetti = false;
};

export const removeConfetti = () => {
  stopConfetti();
  particles.length = 0;
  if (animationTimer !== null) {
    cancelAnimationFrame(animationTimer);
    animationTimer = null;
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler, true);
    resizeHandler = null;
  }
  canvasEl?.remove();
  document.getElementById('confetti-canvas')?.remove();
  canvasEl = null;
};
