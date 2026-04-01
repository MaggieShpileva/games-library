import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './SimulatorGame.module.scss';
import { PageHeader } from '@/components/UI';

const ASSETS = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233';

const PEN_NAMES = [
  'Swanky text inputs',
  'Three.js Interactive Unicorn',
  'Overly animated login box',
  'Yet another CSS grid',
  'Pure CSS Widget',
  'Pure CSS illustration',
  'Persistant cookie policy modal',
  'Overly complex 3D menu',
  'I could not stop',
  'Music player widget',
  'Gross color combinations',
  'JS scratch and sniff',
  'Canvas and audio api thingy',
  'Giant animated cat',
  'Password strength indicator',
  'One element RPG game',
  'Pure CSS MMORPG',
  'Something with Google Maps',
  'Responsive responsivity checker',
  'Kill the King',
  'Pure CSS backend',
  'Procedurally generated cupcakes',
  'Unsubmittable form',
  'Never ending loading bar',
  'Invisible check boxes',
  'HTML Scrolling marquee',
  'Directly injected CSS',
  'No element element',
  'Three.JS Shooter game',
  'SVG animations',
  'Codepen challenge',
  'Pass the pen',
  'Edible code',
  'React calendar widget',
  'Square div that look round',
  'Netscape compatible CSS game',
  'Another User Interface',
  'Self learning AI in CSS',
  'HTML alternative',
  'Codepenception',
];

const PICKERS = [
  'marie mosely',
  'tim holman',
  'chris coyier',
  'codepen',
  'jamie coulter',
  'stephen shaw',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const RESEARCH = [
  {
    index: 1,
    name: 'Learn basic HTML',
    cost: 10,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 10,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 2,
    name: 'Learn basic CSS',
    cost: 20,
    increaseCss: 10,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 3,
    name: 'Learn basic JS',
    cost: 30,
    increaseCss: 0,
    increaseJs: 10,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 4,
    name: 'Learn basic Design',
    cost: 50,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 10,
    researched: false,
  },
  {
    index: 5,
    name: 'Find inspiration',
    cost: 100,
    increaseCss: 10,
    increaseJs: 10,
    increaseHtml: 10,
    increaseDesign: 15,
    researched: false,
  },
  {
    index: 6,
    name: 'Learn HAML',
    cost: 150,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 15,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 7,
    name: 'Learn CSS animation',
    cost: 200,
    increaseCss: 15,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 8,
    name: 'Learn jQuery',
    cost: 300,
    increaseCss: 0,
    increaseJs: 15,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 9,
    name: 'Learn color theory',
    cost: 400,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 15,
    researched: false,
  },
  {
    index: 10,
    name: 'Learn how to refactor',
    cost: 600,
    increaseCss: 15,
    increaseJs: 20,
    increaseHtml: 10,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 11,
    name: 'Learn BEM',
    cost: 800,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 20,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 12,
    name: 'Read CSS Tricks articles',
    cost: 1150,
    increaseCss: 20,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 13,
    name: 'Learn ES6',
    cost: 1400,
    increaseCss: 0,
    increaseJs: 20,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 14,
    name: 'Memorise font names',
    cost: 1800,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 20,
    researched: false,
  },
  {
    index: 15,
    name: 'Watch youtube tutorials',
    cost: 2200,
    increaseCss: 10,
    increaseJs: 10,
    increaseHtml: 10,
    increaseDesign: 10,
    researched: false,
  },
  {
    index: 16,
    name: 'Learn HTML6',
    cost: 2700,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 25,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 17,
    name: 'Learn pre-processors',
    cost: 3200,
    increaseCss: 25,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 18,
    name: 'Learn react',
    cost: 3800,
    increaseCss: 0,
    increaseJs: 25,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 19,
    name: 'Photoshop course',
    cost: 4500,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 25,
    researched: false,
  },
  {
    index: 20,
    name: 'Browse Awwwards',
    cost: 5200,
    increaseCss: 10,
    increaseJs: 10,
    increaseHtml: 10,
    increaseDesign: 25,
    researched: false,
  },
  {
    index: 21,
    name: 'Browse stack overflow',
    cost: 6000,
    increaseCss: 15,
    increaseJs: 15,
    increaseHtml: 15,
    increaseDesign: 10,
    researched: false,
  },
  {
    index: 22,
    name: 'Learn angular',
    cost: 6600,
    increaseCss: 0,
    increaseJs: 25,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 23,
    name: 'Learn VR technology',
    cost: 7500,
    increaseCss: 0,
    increaseJs: 30,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 24,
    name: 'Experiment with latest tech',
    cost: 9000,
    increaseCss: 20,
    increaseJs: 20,
    increaseHtml: 20,
    increaseDesign: 10,
    researched: false,
  },
  {
    index: 25,
    name: 'take a html master class',
    cost: 11000,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 60,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 26,
    name: 'take a CSS master class',
    cost: 12000,
    increaseCss: 60,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 27,
    name: 'take a JS master class',
    cost: 13000,
    increaseCss: 0,
    increaseJs: 60,
    increaseHtml: 0,
    increaseDesign: 0,
    researched: false,
  },
  {
    index: 28,
    name: 'take a DESIGN master class',
    cost: 14000,
    increaseCss: 0,
    increaseJs: 0,
    increaseHtml: 0,
    increaseDesign: 60,
    researched: false,
  },
  {
    index: 29,
    name: 'dO SOME CODE ACADEMY',
    cost: 15000,
    increaseCss: 30,
    increaseJs: 30,
    increaseHtml: 30,
    increaseDesign: 20,
    researched: false,
  },
];

type Pen = {
  name: string;
  css: number;
  html: number;
  js: number;
  design: number;
  views: number;
  maxViews: number;
  dailyViews: number;
  comments: number;
  likes: number;
  featured: boolean;
  featuredBoosted: boolean;
  featuredCheck: boolean;
  featuredCheckCount: number;
};

const STAT_COLORS = {
  html: '#f16529',
  css: '#2965f1',
  js: '#d87b17',
  design: '#9d28e0',
};

export const SimulatorGame = () => {
  const [developerName, setDeveloperName] = useState('');
  const [inputName, setInputName] = useState('');
  const [showNameModal, setShowNameModal] = useState(true);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [featuredPenName, setFeaturedPenName] = useState('');
  const [featuredPicker, setFeaturedPicker] = useState('');
  const [showEndGame, setShowEndGame] = useState(false);
  const [showResearchProgress, setShowResearchProgress] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [bgMusicOn, setBgMusicOn] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [mashText, setMashText] = useState('Start pressing keys');
  const [showPen, setShowPen] = useState(false);
  const [showMake, setShowMake] = useState(true);

  const [developer, setDeveloper] = useState({
    name: 'Developer',
    html: 3,
    css: 3,
    js: 3,
    design: 3,
    followers: 0,
  });
  const [pen, setPen] = useState({
    name: 'Pen',
    html: 0,
    css: 0,
    js: 0,
    design: 0,
  });
  const [pens, setPens] = useState<Pen[]>([]);
  const [research, setResearch] = useState(RESEARCH.map((r) => ({ ...r })));
  const [progress, setProgress] = useState(0);
  const [day, setDay] = useState(0);
  const [dateLabel, setDateLabel] = useState(() => {
    const d = new Date();
    return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  });
  const [pips, setPips] = useState<
    Array<{
      id: number;
      type: keyof typeof STAT_COLORS;
      value: number;
      color: string;
    }>
  >([]);
  const pipIdRef = useRef(0);

  const pausedRef = useRef(true);
  const makingPenRef = useRef(true);
  const researchingRef = useRef(false);
  const timeRef = useRef(0);
  const gameLoopIdRef = useRef<number>(0);
  const gameLoopRef = useRef<() => void>(() => {});
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);
  const kSRef = useRef(0);
  const developerRef = useRef(developer);

  useEffect(() => {
    developerRef.current = developer;
  }, [developer]);

  const timerTick = 120;
  const keyTick = 110;
  const penStatAddChance = 4;
  const typeIncrement = 1.1;
  const viewDecay = 1.1;
  const maxBars = 30;
  const followerFriction = 50;
  const viewMultiplier = 1.15;
  const researchTime = 2000;
  const featuredMinStats = 500;
  const featuredBoost = 3.1;
  const featureChance = 10;
  const gameLength = 365;

  const availableResearchCount = research.filter(
    (r) => !r.researched && developer.followers >= r.cost
  ).length;

  const playSound = useCallback(
    (audio: HTMLAudioElement | null) => {
      if (audioOn && audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    },
    [audioOn]
  );

  const soundsRef = useRef<{
    bg: HTMLAudioElement | null;
    buttonClick: HTMLAudioElement | null;
    featured: HTMLAudioElement | null;
    slideSlow: HTMLAudioElement | null;
    slideFast: HTMLAudioElement | null;
    researchClick: HTMLAudioElement | null;
    researchInactive: HTMLAudioElement | null;
    researchComplete: HTMLAudioElement | null;
    featuredModal: HTMLAudioElement | null;
    statAdd: HTMLAudioElement[];
  }>({
    bg: null,
    buttonClick: null,
    featured: null,
    slideSlow: null,
    slideFast: null,
    researchClick: null,
    researchInactive: null,
    researchComplete: null,
    featuredModal: null,
    statAdd: [],
  });

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    soundsRef.current = {
      bg: null,
      buttonClick: new Audio(`${ASSETS}/Buttonclick.mp3`),
      featured: new Audio(`${ASSETS}/featured.mp3`),
      slideSlow: new Audio(`${ASSETS}/slideSlow.mp3`),
      slideFast: new Audio(`${ASSETS}/slideFast.mp3`),
      researchClick: new Audio(`${ASSETS}/researchClick.mp3`),
      researchInactive: new Audio(`${ASSETS}/researchInactive.mp3`),
      researchComplete: new Audio(`${ASSETS}/researchComplete.mp3`),
      featuredModal: new Audio(`${ASSETS}/featuredModal.mp3`),
      statAdd: Array.from(
        { length: 10 },
        () => new Audio(`${ASSETS}/statAdd.mp3`)
      ),
    };
    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
      Object.values(soundsRef.current).forEach((s) => {
        if (Array.isArray(s)) s.forEach((a) => a.pause());
        else if (s) s.pause();
      });
    };
  }, []);

  const addPip = useCallback(
    (type: keyof typeof STAT_COLORS, value: number) => {
      pipIdRef.current += 1;
      const id = pipIdRef.current;
      setPips((prev) => [
        ...prev,
        { id, type, value, color: STAT_COLORS[type] },
      ]);
      setTimeout(() => {
        setPips((prev) => prev.filter((p) => p.id !== id));
      }, 2100);
    },
    []
  );

  const keyPress = useCallback(() => {
    if (progress > 0) setMashText("that's it, keep going");
    if (progress > 20) setMashText('Now we are getting somewhere');
    if (progress > 40) setMashText('iron out those bugs');
    if (progress > 70) setMashText('Almost finished');
    if (progress > 99) setMashText('done!');

    if (
      !makingPenRef.current ||
      progress >= 100 ||
      pausedRef.current ||
      researchingRef.current
    )
      return;

    const nextProgress = Math.min(100, progress + typeIncrement);

    if (nextProgress >= 100) {
      makingPenRef.current = false;
      pausedRef.current = true;
      playSound(soundsRef.current.featured);
      setTimeout(() => playSound(soundsRef.current.slideFast), 400);
      setShowCompleteModal(true);
      setShowOverlay(true);
      setProgress(100);
      return;
    }

    setProgress(nextProgress);

    const add =
      Math.floor(Math.random() * penStatAddChance) + (penStatAddChance - 2);
    if (add !== penStatAddChance) return;

    const stat = Math.floor(Math.random() * 4) + 1;
    const sounds = soundsRef.current.statAdd;
    if (sounds.length) {
      const i = kSRef.current % sounds.length;
      playSound(sounds[i]);
      kSRef.current += 1;
    }

    setPen((prev) => {
      const next = { ...prev };
      if (stat === 1) {
        const v = Math.floor(Math.random() * developer.html) + 1;
        next.html += v;
        addPip('html', v);
      } else if (stat === 2) {
        const v = Math.floor(Math.random() * developer.css) + 1;
        next.css += v;
        addPip('css', v);
      } else if (stat === 3) {
        const v = Math.floor(Math.random() * developer.js) + 1;
        next.js += v;
        addPip('js', v);
      } else {
        const v = Math.floor(Math.random() * developer.design) + 1;
        next.design += v;
        addPip('design', v);
      }
      return next;
    });
  }, [progress, developer, addPip, playSound]);

  useEffect(() => {
    const handler = () => keyPress();
    window.addEventListener('keyup', handler);
    return () => window.removeEventListener('keyup', handler);
  }, [keyPress]);

  const handleStartMashing = () => {
    setShowPen(true);
    setShowMake(false);
    makingPenRef.current = true;
  };

  const handleNextName = () => {
    if (!inputName.trim()) return;
    playSound(soundsRef.current.buttonClick);
    setDeveloperName(inputName.trim());
    setShowNameModal(false);
    setShowIntroModal(true);
  };

  const handleGo = () => {
    playSound(soundsRef.current.buttonClick);
    setShowIntroModal(false);
    setShowOverlay(false);
    pausedRef.current = false;
    if (bgMusicOn) {
      if (!bgAudioRef.current) {
        bgAudioRef.current = new Audio(`${ASSETS}/bgG.mp3`);
      }
      const bg = bgAudioRef.current;
      bg.loop = true;
      bg.volume = 0.5;
      bg.play().catch(() => {});
    }
  };

  const handleResearchClick = () => {
    if (researchingRef.current) {
      playSound(soundsRef.current.researchInactive);
      return;
    }
    pausedRef.current = true;
    setShowOverlay(true);
    setShowResearchModal(true);
    playSound(soundsRef.current.buttonClick);
    playSound(soundsRef.current.slideFast);
  };

  const handleCloseResearch = () => {
    playSound(soundsRef.current.buttonClick);
    setShowResearchModal(false);
    setShowOverlay(false);
    pausedRef.current = false;
  };

  const handleDoResearch = (index: number) => {
    const r = research[index];
    if (
      developer.followers < r.cost ||
      r.researched ||
      researchingRef.current
    ) {
      playSound(soundsRef.current.researchInactive);
      return;
    }
    researchingRef.current = true;
    setShowResearchModal(false);
    setShowOverlay(false);
    setShowResearchProgress(true);
    playSound(soundsRef.current.researchClick);

    setTimeout(() => {
      setDeveloper((d) => ({
        ...d,
        html: d.html + r.increaseHtml,
        css: d.css + r.increaseCss,
        js: d.js + r.increaseJs,
        design: d.design + r.increaseDesign,
      }));
      setResearch((prev) =>
        prev.map((item) =>
          item.index === r.index ? { ...item, researched: true } : item
        )
      );
      setShowResearchProgress(false);
      researchingRef.current = false;
      playSound(soundsRef.current.researchComplete);
    }, researchTime);
  };

  const handleScrap = () => {
    playSound(soundsRef.current.buttonClick);
    pausedRef.current = false;
    setMashText('Start pressing keys');
    setShowCompleteModal(false);
    setShowOverlay(false);
    setProgress(0);
    setPen({ name: 'Pen', html: 0, css: 0, js: 0, design: 0 });
    makingPenRef.current = true;
  };

  const handleRelease = () => {
    playSound(soundsRef.current.buttonClick);
    playSound(soundsRef.current.slideSlow);
    pausedRef.current = false;
    setMashText('Start pressing keys');

    const p = pen;
    const newPen: Pen = {
      name: PEN_NAMES[Math.floor(Math.random() * PEN_NAMES.length)],
      css: p.css,
      html: p.html,
      js: p.js,
      design: p.design,
      views: 0,
      maxViews:
        (Math.ceil((p.css + p.js + p.html + p.design) * viewMultiplier) + 1) *
        (pens.length + 1 / 35),
      dailyViews:
        (Math.ceil((p.css + p.js + p.html + p.design) * viewMultiplier) + 1) *
        (pens.length + 1 / 35),
      comments: 0,
      likes: 0,
      featured: false,
      featuredBoosted: false,
      featuredCheck: false,
      featuredCheckCount: 0,
    };

    setPens((prev) => [newPen, ...prev]);
    setProgress(0);
    setPen({ name: 'Pen', html: 0, css: 0, js: 0, design: 0 });
    setShowCompleteModal(false);
    setShowOverlay(false);
    makingPenRef.current = true;
  };

  const handleAwesome = () => {
    playSound(soundsRef.current.buttonClick);
    setShowFeaturedModal(false);
    setShowOverlay(false);
    pausedRef.current = false;
  };

  const gameLoop = useCallback(() => {
    if (day >= gameLength) {
      pausedRef.current = true;
      setShowEndGame(true);
      setShowOverlay(true);
      return;
    }

    if (pausedRef.current) {
      gameLoopIdRef.current = requestAnimationFrame(() =>
        gameLoopRef.current()
      );
      return;
    }

    timeRef.current += 1;

    if (autoMode && timeRef.current > keyTick) {
      keyPress();
    }

    if (timeRef.current > timerTick) {
      timeRef.current = 0;
      setDay((d) => d + 1);

      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + day + 1);
      setDateLabel(
        `${MONTH_NAMES[nextDay.getUTCMonth()]} ${nextDay.getDate()}, ${nextDay.getFullYear()}`
      );

      setPens((prevPens) => {
        let dailyFollowers = 0;
        const updated = prevPens.map((p) => {
          const total = p.css + p.html + p.js + p.design;
          let featured = p.featured;
          let featuredBoosted = p.featuredBoosted;
          let featuredCheckCount = p.featuredCheckCount;

          if (total > featuredMinStats) {
            const f = Math.floor(Math.random() * featureChance);
            if (f === 0 && !p.featuredCheck && featuredCheckCount < 14) {
              featured = true;
            } else {
              featuredCheckCount += 1;
            }
          }

          let dailyViews = p.dailyViews / viewDecay;
          if (featured && !featuredBoosted) {
            dailyViews *= featuredBoost;
            featuredBoosted = true;
            pausedRef.current = true;
            setFeaturedPenName(p.name);
            setFeaturedPicker(
              PICKERS[Math.floor(Math.random() * PICKERS.length)]
            );
            setShowFeaturedModal(true);
            setShowOverlay(true);
            playSound(soundsRef.current.featuredModal);
          }

          const views = p.views + dailyViews;
          const likes = p.likes + Math.floor(dailyViews / 40);
          const comments = p.comments + Math.floor(dailyViews / 2000);
          dailyFollowers += dailyViews;

          return {
            ...p,
            views,
            dailyViews,
            likes,
            comments,
            featured,
            featuredBoosted,
            featuredCheckCount,
          };
        });

        const d = developerRef.current;
        const sum = d.html + d.css + d.js + d.design;
        const newFollowers = Math.floor(
          dailyFollowers / followerFriction / (sum / 10)
        );
        setDeveloper((dev) => ({
          ...dev,
          followers: dev.followers + newFollowers,
        }));
        return updated;
      });
    }

    gameLoopIdRef.current = requestAnimationFrame(() => gameLoopRef.current());
  }, [day, autoMode, keyPress, playSound]);

  useEffect(() => {
    gameLoopRef.current = gameLoop;
  }, [gameLoop]);

  useEffect(() => {
    gameLoopIdRef.current = requestAnimationFrame(() => gameLoopRef.current());
    return () => cancelAnimationFrame(gameLoopIdRef.current);
  }, [gameLoop]);

  useEffect(() => {
    const canvas = grainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const patternSize = 150;
    const patternAlpha = 12;
    const patternRefreshInterval = 3;
    let frame = 0;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d')!;
    const patternData = patternCtx.createImageData(patternSize, patternSize);
    const patternPixelDataLength = patternSize * patternSize * 4;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      frame += 1;
      if (frame % patternRefreshInterval === 0) {
        for (let i = 0; i < patternPixelDataLength; i += 4) {
          const v = Math.random() * 255;
          patternData.data[i] = v;
          patternData.data[i + 1] = v;
          patternData.data[i + 2] = v;
          patternData.data[i + 3] = patternAlpha;
        }
        patternCtx.putImageData(patternData, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = ctx.createPattern(patternCanvas, 'repeat')!;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const bestPen = pens.length
    ? pens.reduce((a, b) => (a.views > b.views ? a : b))
    : null;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Симулятор кодера (игра-тайкун на развитие)"
        link="https://codepen.io/jcoulterdesign/pen/YvgpZW"
      />
      <div className={styles.wrapper}>
        <img className={styles.mascot} src={`${ASSETS}/pixelTest.png`} alt="" />
        <div className={styles.floor} />
        <div
          className={styles.overlay}
          style={{ display: showOverlay ? 'block' : 'none' }}
          onClick={() => showIntroModal && handleGo()}
          onKeyDown={() => {}}
          aria-hidden
        />

        <div className={styles.options}>
          <button
            type="button"
            className={styles.optionsSf}
            onClick={() => setAudioOn((a) => !a)}
            aria-label="Sound effects"
          >
            <img src={`${ASSETS}/sfIcon.png`} alt="" />
          </button>
          <button
            type="button"
            className={styles.optionsBg}
            onClick={() => setBgMusicOn((b) => !b)}
            aria-label="Background music"
          >
            <img src={`${ASSETS}/bgIcon.png`} alt="" />
          </button>
        </div>

        {/* Name modal */}
        <div
          className={styles.nameModal}
          style={{ left: showNameModal ? '50%' : '-200%' }}
        >
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <div className={styles.modalHeader}>
            <p>Welcome</p>
            <img src={`${ASSETS}/featuredHeader.png`} alt="" />
          </div>
          <h3>Enter your name, developer</h3>
          <hr />
          <input
            type="text"
            placeholder="Your Name"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNextName()}
          />
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNextName}
          >
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            Next
          </button>
        </div>

        {/* Intro modal */}
        <div
          className={styles.introModal}
          style={{ left: showIntroModal ? '50%' : '200%' }}
        >
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <div className={styles.modalHeader}>
            <p>Welcome</p>
            <img src={`${ASSETS}/featuredHeader.png`} alt="" />
          </div>
          <h3>Welcome to codepen simulator</h3>
          <hr />
          <p className={styles.text}>
            Your aim is to see how many followers you can get in 1 year!
          </p>
          <p className={styles.text}>
            Create pens by simply typing randomly. The pen will gain stats in
            html, css, js and design based on your skill level. Use your
            followers to unlock research which improves your skills!
          </p>
          <p className={styles.text}>
            If good enough, your pen will be featured and that will boost your
            views.
          </p>
          <button type="button" className={styles.goBtn} onClick={handleGo}>
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            Let&apos;s go
          </button>
        </div>

        {/* End game */}
        <div
          className={styles.endGame}
          style={{ display: showEndGame ? 'block' : 'none' }}
        >
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <div className={styles.endGameHeader}>
            <p>Finished</p>
            <img src={`${ASSETS}/featuredHeader.png`} alt="" />
          </div>
          <h3>Congratulations! You&apos;ve done 1 year on Codepen!</h3>
          <hr />
          <h2>You managed to get</h2>
          <h1>{developer.followers.toLocaleString()}</h1>
          <p>Followers</p>
          <p>
            You released <span className={styles.penCount}>{pens.length}</span>{' '}
            pen(s)
          </p>
          {bestPen && (
            <p>
              Your most viewed pen was{' '}
              <span className={styles.mostName}>{bestPen.name}</span> which had{' '}
              <span className={styles.mostViews}>
                {Math.ceil(bestPen.views).toLocaleString()}
              </span>{' '}
              views!
            </p>
          )}
        </div>

        <div
          className={styles.researchProgress}
          style={{ display: showResearchProgress ? 'block' : 'none' }}
        >
          <h2>Researching...</h2>
          <div className={styles.bar}>
            <div className={styles.barInner} />
          </div>
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
        </div>

        {/* Featured modal */}
        <div
          className={styles.featuredModal}
          style={{ display: showFeaturedModal ? 'block' : 'none' }}
        >
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <div className={styles.modalHeader}>
            <p>Featured</p>
            <img src={`${ASSETS}/featuredHeader.png`} alt="" />
          </div>
          <h3>Your pen has been picked!</h3>
          <hr />
          <div className={styles.featuredImage}>
            <img src={`${ASSETS}/cPreview.png`} alt="" />
          </div>
          <div className={styles.featuredText}>
            <p>
              your pen &apos;
              <span className={styles.featuredName}>{featuredPenName}</span>
              &apos;
            </p>
            <p>has been picked by</p>
            <p className={styles.picker}>{featuredPicker}</p>
            <p>that should help boost your views!</p>
          </div>
          <button
            type="button"
            className={styles.awesomeBtn}
            onClick={handleAwesome}
          >
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            awesome
          </button>
        </div>

        {/* Research modal */}
        <div
          className={styles.researchModal}
          style={{
            display: showResearchModal ? 'block' : 'none',
            opacity: showResearchModal ? 1 : 0,
            height: showResearchModal ? '400px' : '40px',
            width: showResearchModal ? '920px' : '300px',
          }}
        >
          <div className={styles.researchModalHeader}>
            <p>research</p>
            <img src={`${ASSETS}/researchHeader.png`} alt="" />
          </div>
          <h3 className={styles.hide}>Improve your skills</h3>
          <hr className={styles.hide} />
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleCloseResearch}
          >
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />x
          </button>
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <div
            className={styles.researchList}
            style={{ display: showResearchModal ? 'block' : 'none' }}
          >
            {research.map((r, idx) => (
              <div
                key={r.index}
                className={`${styles.researchItem} ${
                  r.researched
                    ? styles.researched
                    : developer.followers >= r.cost
                      ? styles.available
                      : styles.unavailable
                }`}
              >
                <div className={styles.researchItemName}>
                  {r.name}
                  <div className={styles.sep} />
                </div>
                <div className={styles.stat}>
                  {r.increaseHtml > 0 && (
                    <>
                      html{' '}
                      <span className={styles.green}>+ {r.increaseHtml}</span>
                      <img src={`${ASSETS}/arrowUpStat.png`} alt="" />
                    </>
                  )}
                  {r.increaseCss > 0 && (
                    <>
                      css{' '}
                      <span className={styles.green}>+ {r.increaseCss}</span>
                      <img src={`${ASSETS}/arrowUpStat.png`} alt="" />
                    </>
                  )}
                  {r.increaseJs > 0 && (
                    <>
                      js <span className={styles.green}>+ {r.increaseJs}</span>
                      <img src={`${ASSETS}/arrowUpStat.png`} alt="" />
                    </>
                  )}
                  {r.increaseDesign > 0 && (
                    <>
                      design{' '}
                      <span className={styles.green}>+ {r.increaseDesign}</span>
                      <img src={`${ASSETS}/arrowUpStat.png`} alt="" />
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.researchButton}
                  onClick={() => handleDoResearch(idx)}
                  disabled={r.researched || developer.followers < r.cost}
                >
                  <div className={styles.pixelsTop} />
                  <div className={styles.pixelsBottom} />
                  Research <img src={`${ASSETS}/rCost.png`} alt="" />{' '}
                  <span className={styles.cost}>{r.cost.toLocaleString()}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Complete modal */}
        <div
          className={styles.completeModal}
          style={{
            display: showCompleteModal ? 'block' : 'none',
            opacity: showCompleteModal ? 1 : 0,
            height: showCompleteModal ? '370px' : '40px',
            width: showCompleteModal ? '600px' : '300px',
          }}
        >
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <div className={styles.completeModalHeader}>
            <img src={`${ASSETS}/penCompleteHeader.png`} alt="" />
            <p>pen complete</p>
          </div>
          <div
            className={styles.completeContent}
            style={{ display: showCompleteModal ? 'block' : 'none' }}
          >
            <h2>You completed a pen!</h2>
            <hr />
            <h3>lets see how you did</h3>
          </div>
          <div
            className={styles.completeStats}
            style={{ display: showCompleteModal ? 'flex' : 'none' }}
          >
            <div className={styles.statBox}>
              <h4>html</h4>
              <img src={`${ASSETS}/gHtml.png`} alt="" />
              <span>
                <span className={`${styles.swatch} ${styles.swatchHtml}`} />
                <span>{pen.html}</span>
              </span>
            </div>
            <div className={styles.statBox}>
              <h4>css</h4>
              <img src={`${ASSETS}/gCSS.png`} alt="" />
              <span>
                <span className={`${styles.swatch} ${styles.swatchCss}`} />
                <span>{pen.css}</span>
              </span>
            </div>
            <div className={styles.statBox}>
              <h4>js</h4>
              <img src={`${ASSETS}/gJS.png`} alt="" />
              <span>
                <span className={`${styles.swatch} ${styles.swatchJs}`} />
                <span>{pen.js}</span>
              </span>
            </div>
            <div className={styles.statBox}>
              <h4>Design</h4>
              <img src={`${ASSETS}/gDesign.png`} alt="" />
              <span>
                <span className={`${styles.swatch} ${styles.swatchDesign}`} />
                <span>{pen.design}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.scrapBtn}
            onClick={handleScrap}
            style={{ display: showCompleteModal ? 'flex' : 'none' }}
          >
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            scrap pen
            <img
              className={styles.icon}
              src={`${ASSETS}/scrapCross.png`}
              alt=""
            />
          </button>
          <button
            type="button"
            className={styles.releaseBtn}
            onClick={handleRelease}
            style={{ display: showCompleteModal ? 'flex' : 'none' }}
          >
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            release pen
            <img
              className={styles.icon}
              src={`${ASSETS}/releaseArrow.png`}
              alt=""
            />
          </button>
        </div>

        {/* Pen progress */}
        <div
          className={styles.pen}
          style={{ display: showPen ? 'block' : 'none' }}
        >
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <h2>progress:</h2>
          <div className={styles.date}>
            <img src={`${ASSETS}/gCalendar.png`} alt="" />
            <span>{dateLabel}</span>
          </div>
          <div className={styles.followers}>
            <img src={`${ASSETS}/followersIcon.png`} alt="" />
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            FOLLOWERS: <span>{developer.followers.toLocaleString()}</span>
          </div>
          <div className={styles.penBar}>
            <div
              className={styles.penBarProgress}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.penStat}>
            <span className={`${styles.swatch} ${styles.swatchHtml}`} />
            <span>HTML</span>
            <div className={styles.sep} />
            <span className={styles.val}>{pen.html}</span>
          </div>
          <div className={styles.penStat}>
            <span className={`${styles.swatch} ${styles.swatchCss}`} />
            <span>CSS</span>
            <div className={styles.sep} />
            <span className={styles.val}>{pen.css}</span>
          </div>
          <div className={styles.penStat}>
            <span className={`${styles.swatch} ${styles.swatchJs}`} />
            <span>JS</span>
            <div className={styles.sep} />
            <span className={styles.val}>{pen.js}</span>
          </div>
          <div className={styles.penStat}>
            <span className={`${styles.swatch} ${styles.swatchDesign}`} />
            <span>DESIGN</span>
            <div className={styles.sep} />
            <span className={styles.val}>{pen.design}</span>
          </div>
        </div>

        <div className={styles.releasedHeader}>
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <img
            className={styles.icon}
            src={`${ASSETS}/codepenIcon.png`}
            alt=""
          />
          Released Pens
          <img
            className={styles.arrow}
            src={`${ASSETS}/downArrow.png`}
            alt=""
          />
        </div>

        {pens.length === 0 ? (
          <div className={styles.releasedEmpty}>
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            <h2>You haven&apos;t released any pens yet</h2>
          </div>
        ) : (
          <div className={styles.released}>
            {pens.map((p, idx) => (
              <div key={idx} className={styles.releasedPen}>
                <div className={styles.releasedPenTop}>
                  <div className={styles.pixelsTop} />
                  <div className={styles.pixelsBottom} />
                  <span className={styles.penName}>{p.name}</span>
                  <div className={styles.star}>
                    {p.featured && <img src={`${ASSETS}/gStar.png`} alt="" />}
                  </div>
                  <div className={styles.releasedGraph}>
                    {Array.from(
                      { length: Math.min(maxBars, Math.ceil(day / 2)) },
                      (_, i) => {
                        const h = Math.min(
                          100,
                          (p.dailyViews / p.maxViews) * 100
                        );
                        return (
                          <div
                            key={i}
                            className={styles.line}
                            style={{ height: `${h}%`, top: `${100 - h}%` }}
                          />
                        );
                      }
                    )}
                  </div>
                </div>
                <div className={styles.releasedPenBottom}>
                  <div className={styles.pixelsTop} />
                  <div className={styles.pixelsBottom} />
                  <img
                    className={styles.viewsIcon}
                    src={`${ASSETS}/codepenViews.png`}
                    alt=""
                  />
                  <span>{Math.ceil(p.views).toLocaleString()}</span>
                  <div className={styles.sep} />
                  <img
                    className={styles.likesIcon}
                    src={`${ASSETS}/codepenLikes.png`}
                    alt=""
                  />
                  <span>{Math.ceil(p.likes).toLocaleString()}</span>
                  <div className={styles.sep} />
                  <img
                    className={styles.commentsIcon}
                    src={`${ASSETS}/codepenComments.png`}
                    alt=""
                  />
                  <span>{Math.ceil(p.comments).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.username}>
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <img src={`${ASSETS}/userIcon.png`} alt="" />
          <h2>{developerName || 'Developer'}</h2>
        </div>

        <div className={styles.mystats}>
          <img src={`${ASSETS}/skilsIcon.png`} alt="" />
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <h2>skills</h2>
          <div className={styles.mystatsRow}>
            <span className={`${styles.swatch} ${styles.swatchHtml}`} /> HTML:{' '}
            <span className={styles.lv}>lv</span>{' '}
            <span className={styles.val}>{developer.html}</span>
          </div>
          <div className={styles.mystatsRow}>
            <span className={`${styles.swatch} ${styles.swatchCss}`} /> CSS:{' '}
            <span className={styles.lv}>lv</span>{' '}
            <span className={styles.val}>{developer.css}</span>
          </div>
          <div className={styles.mystatsRow}>
            <span className={`${styles.swatch} ${styles.swatchJs}`} />{' '}
            JAVASCRIPT: <span className={styles.lv}>lv</span>{' '}
            <span className={styles.val}>{developer.js}</span>
          </div>
          <div className={styles.mystatsRow}>
            <span className={`${styles.swatch} ${styles.swatchDesign}`} />{' '}
            DESIGN: <span className={styles.lv}>lv</span>{' '}
            <span className={styles.val}>{developer.design}</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.researchButtonMain}
          onClick={handleResearchClick}
        >
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <span className={styles.researchCounter}>
            <span>{availableResearchCount}</span>
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
          </span>
          Research
          <img src={`${ASSETS}/buttonArrow.png`} alt="" />
        </button>

        <div className={styles.startMashing}>
          <button
            type="button"
            className={`${styles.auto} ${autoMode ? styles.autoOn : styles.autoOff}`}
            onClick={() => setAutoMode((a) => !a)}
            aria-label="Auto mode"
          >
            auto
            <img
              className={styles.cross}
              src={`${ASSETS}/autoCross.png`}
              alt=""
            />
            <img
              className={styles.tick}
              src={`${ASSETS}/autoTick.png`}
              alt=""
            />
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
          </button>
          <div className={styles.pixelsTop} />
          <div className={styles.pixelsBottom} />
          <h2>
            <span>{mashText}</span>
            <img src={`${ASSETS}/gKey.png`} alt="" />
          </h2>
        </div>

        {showMake && (
          <button
            type="button"
            className={styles.makeBtn}
            onClick={handleStartMashing}
          >
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            Start
          </button>
        )}

        {pips.map((pip) => (
          <div
            key={pip.id}
            className={`${styles.pip} ${styles[`pip${pip.type.charAt(0).toUpperCase() + pip.type.slice(1)}`]}`}
            style={{ color: pip.color }}
            data-type={pip.type}
          >
            <div className={styles.pixelsTop} />
            <div className={styles.pixelsBottom} />
            <p>{pip.value}</p>
          </div>
        ))}

        <canvas ref={grainCanvasRef} className={styles.grain} aria-hidden />
      </div>
    </div>
  );
};
