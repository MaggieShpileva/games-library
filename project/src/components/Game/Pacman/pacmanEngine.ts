export type GameParams = {
  width?: number;
  height?: number;
};

type ItemParams = Record<string, unknown> & {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  type?: number;
  color?: string;
  status?: number;
  orientation?: number;
  speed?: number;
  location?: MapInst | null;
  coord?: { x: number; y: number } | null;
  path?: unknown[];
  vector?: { x: number; y: number; change?: number } | null;
  frames?: number;
  times?: number;
  timeout?: number;
  control?: Record<string, unknown>;
  update?: () => void;
  draw?: (ctx: CanvasRenderingContext2D) => void;
};

type MapParams = Record<string, unknown> & {
  x?: number;
  y?: number;
  size?: number;
  data?: number[][];
  frames?: number;
  times?: number;
  cache?: boolean;
  update?: () => void;
  draw?: (ctx: CanvasRenderingContext2D) => void;
};

type StageParams = Record<string, unknown> & {
  index?: number;
  status?: number;
  maps?: MapInst[];
  items?: ItemInst[];
  timeout?: number;
  update?: () => boolean | void;
};

type FinderParams = {
  map: number[][];
  start: { x: number; y: number };
  end: { x: number; y: number };
  type?: 'path' | 'next';
};

type ItemInst = {
  _params: ItemParams;
  _id: number;
  _stage: StageInst | null;
  _settings: ItemParams;
  x: number;
  y: number;
  width: number;
  height: number;
  type: number;
  color: string;
  status: number;
  orientation: number;
  speed: number;
  location: MapInst | null;
  coord: { x: number; y: number; offset?: number } | null;
  path: unknown[];
  vector: { x: number; y: number; change?: number } | null;
  frames: number;
  times: number;
  timeout: number;
  control: Record<string, unknown>;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  bind: (eventType: string, callback: (e: Event) => void) => void;
};

type MapInst = {
  _params: MapParams;
  _id: number;
  _stage: StageInst | null;
  _settings: MapParams;
  x: number;
  y: number;
  size: number;
  data: number[][];
  x_length: number;
  y_length: number;
  frames: number;
  times: number;
  cache: boolean;
  imageData: ImageData | null;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  get: (x: number, y: number) => number;
  set: (x: number, y: number, value: number) => void;
  coord2position: (cx: number, cy: number) => { x: number; y: number };
  position2coord: (
    x: number,
    y: number
  ) => { x: number; y: number; offset: number };
  finder: (params: FinderParams) => { x: number; y: number; change?: number }[];
};

type StageInst = {
  _params: StageParams;
  _settings: StageParams;
  index: number;
  status: number;
  maps: MapInst[];
  items: ItemInst[];
  timeout: number;
  update: () => boolean | void;
  createItem: (options?: ItemParams) => ItemInst;
  createMap: (options?: MapParams) => MapInst;
  resetItems: () => void;
  resetMaps: () => void;
  reset: () => void;
  bind: (eventType: string, callback: (e: Event) => void) => void;
  getItemsByType: (type: number) => ItemInst[];
};

export class Game {
  width: number;
  height: number;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private stages: StageInst[] = [];
  private events: Record<string, Record<string, (e: Event) => void>> = {};
  private index = 0;
  private hander: number | undefined;
  private readonly windowHandlers: Record<string, (e: Event) => void> = {};
  private readonly canvasHandlers: Record<string, (e: Event) => void> = {};
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, params?: GameParams) {
    const settings = { width: 960, height: 640, ...params };
    this.canvas = canvas;
    this.width = settings.width;
    this.height = settings.height;
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }
    this.context = ctx;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    for (const type of Object.keys(this.windowHandlers)) {
      window.removeEventListener(type, this.windowHandlers[type]);
      delete this.windowHandlers[type];
    }
    for (const type of Object.keys(this.canvasHandlers)) {
      this.canvas.removeEventListener(type, this.canvasHandlers[type]);
      delete this.canvasHandlers[type];
    }
    this.events = {};
  }

  getPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const box = this.canvas.getBoundingClientRect();
    const clientX =
      'touches' in e && e.touches[0]
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    const clientY =
      'touches' in e && e.touches[0]
        ? e.touches[0].clientY
        : (e as MouseEvent).clientY;
    return {
      x: clientX - box.left * (this.width / box.width),
      y: clientY - box.top * (this.height / box.height),
    };
  }

  createStage(options?: StageParams): StageInst {
    const self = this;
    const Item = function ItemCtor(this: ItemInst, params?: ItemParams) {
      this._params = params || {};
      this._id = 0;
      this._stage = null;
      this._settings = {
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        type: 0,
        color: '#F00',
        status: 1,
        orientation: 0,
        speed: 0,
        location: null,
        coord: null,
        path: [],
        vector: null,
        frames: 1,
        times: 0,
        timeout: 0,
        control: {},
        update: () => {
          /* noop */
        },
        draw: () => {
          /* noop */
        },
      };
      Object.assign(this, this._settings, this._params);
    } as unknown as { new (params?: ItemParams): ItemInst };

    Item.prototype.bind = function (
      this: ItemInst,
      eventType: string,
      callback: (e: Event) => void
    ) {
      if (!self.events[eventType]) {
        self.events[eventType] = {};
        const handler = (e: Event) => {
          const position = self.getPosition(e as MouseEvent);
          self.stages[self.index].items.forEach((item) => {
            if (
              item.x <= position.x &&
              position.x <= item.x + item.width &&
              item.y <= position.y &&
              position.y <= item.y + item.height
            ) {
              const key = `s${self.index}i${item._id}`;
              if (self.events[eventType][key]) {
                self.events[eventType][key](e);
              }
            }
          });
          e.preventDefault();
        };
        self.canvasHandlers[eventType] = handler;
        self.canvas.addEventListener(eventType, handler);
      }
      self.events[eventType][`s${this._stage!.index}i${this._id}`] =
        callback.bind(this);
    };

    const Map = function MapCtor(this: MapInst, params?: MapParams) {
      this._params = params || {};
      this._id = 0;
      this._stage = null;
      this._settings = {
        x: 0,
        y: 0,
        size: 20,
        data: [],
        x_length: 0,
        y_length: 0,
        frames: 1,
        times: 0,
        cache: false,
        update: () => {
          /* noop */
        },
        draw: () => {
          /* noop */
        },
      };
      Object.assign(this, this._settings, this._params);
    } as unknown as { new (params?: MapParams): MapInst };

    Map.prototype.get = function (this: MapInst, x: number, y: number) {
      if (this.data[y] && typeof this.data[y][x] !== 'undefined') {
        return this.data[y][x];
      }
      return -1;
    };

    Map.prototype.set = function (
      this: MapInst,
      x: number,
      y: number,
      value: number
    ) {
      if (this.data[y]) {
        this.data[y][x] = value;
      }
    };

    Map.prototype.coord2position = function (
      this: MapInst,
      cx: number,
      cy: number
    ) {
      return {
        x: this.x + cx * this.size + this.size / 2,
        y: this.y + cy * this.size + this.size / 2,
      };
    };

    Map.prototype.position2coord = function (
      this: MapInst,
      x: number,
      y: number
    ) {
      const fx = (Math.abs(x - this.x) % this.size) - this.size / 2;
      const fy = (Math.abs(y - this.y) % this.size) - this.size / 2;
      return {
        x: Math.floor((x - this.x) / this.size),
        y: Math.floor((y - this.y) / this.size),
        offset: Math.sqrt(fx * fx + fy * fy),
      };
    };

    Map.prototype.finder = function (this: MapInst, params: FinderParams) {
      const defaults: FinderParams = {
        map: [],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        type: 'path',
      };
      const opt = { ...defaults, ...params };
      if (opt.map[opt.start.y][opt.start.x] || opt.map[opt.end.y][opt.end.x]) {
        return [];
      }
      let finded = false;
      const result: { x: number; y: number; change?: number }[] = [];
      const yLength = opt.map.length;
      const xLength = opt.map[0].length;
      const steps = Array(yLength)
        .fill(0)
        .map(() => Array(xLength).fill(0));

      const getValue = (x: number, y: number) => {
        if (opt.map[y] && typeof opt.map[y][x] !== 'undefined') {
          return opt.map[y][x];
        }
        return -1;
      };

      const next = (to: { x: number; y: number; change?: number }) => {
        const value = getValue(to.x, to.y);
        if (value < 1) {
          if (value === -1) {
            to.x = (to.x + xLength) % xLength;
            to.y = (to.y + yLength) % yLength;
            to.change = 1;
          }
          if (!steps[to.y][to.x]) {
            result.push(to);
          }
        }
      };

      const render = (list: { x: number; y: number }[]) => {
        const newList: { x: number; y: number }[] = [];
        const stepNext = (
          from: { x: number; y: number },
          to: { x: number; y: number; change?: number }
        ) => {
          const value = getValue(to.x, to.y);
          if (value < 1) {
            if (value === -1) {
              to.x = (to.x + xLength) % xLength;
              to.y = (to.y + yLength) % yLength;
              to.change = 1;
            }
            if (to.x === opt.end.x && to.y === opt.end.y) {
              steps[to.y][to.x] = from;
              finded = true;
            } else if (!steps[to.y][to.x]) {
              steps[to.y][to.x] = from;
              newList.push(to);
            }
          }
        };
        list.forEach((current) => {
          stepNext(current, { y: current.y + 1, x: current.x });
          stepNext(current, { y: current.y, x: current.x + 1 });
          stepNext(current, { y: current.y - 1, x: current.x });
          stepNext(current, { y: current.y, x: current.x - 1 });
        });
        if (!finded && newList.length) {
          render(newList);
        }
      };

      render([opt.start]);
      if (finded) {
        let current = opt.end;
        if (opt.type === 'path') {
          while (current.x !== opt.start.x || current.y !== opt.start.y) {
            result.unshift(current);
            current = steps[current.y][current.x] as typeof opt.end;
          }
        } else if (opt.type === 'next') {
          next({ x: current.x + 1, y: current.y });
          next({ x: current.x, y: current.y + 1 });
          next({ x: current.x - 1, y: current.y });
          next({ x: current.x, y: current.y - 1 });
        }
      }
      return result;
    };

    const Stage = function StageCtor(this: StageInst, params?: StageParams) {
      this._params = params || {};
      this._settings = {
        index: 0,
        status: 0,
        maps: [] as MapInst[],
        items: [] as ItemInst[],
        timeout: 0,
        update: () => {
          /* noop */
        },
      };
      Object.assign(this, this._settings, this._params);
    } as unknown as { new (params?: StageParams): StageInst };

    Stage.prototype.createItem = function (this: StageInst, opts?: ItemParams) {
      const item = new Item(opts);
      if (item.location && item.coord) {
        Object.assign(
          item,
          item.location.coord2position(item.coord.x, item.coord.y)
        );
      }
      item._stage = this;
      item._id = this.items.length;
      this.items.push(item);
      return item;
    };

    Stage.prototype.resetItems = function (this: StageInst) {
      this.status = 1;
      this.items.forEach((item) => {
        Object.assign(item, item._settings, item._params);
        if (item.location && item.coord) {
          Object.assign(
            item,
            item.location.coord2position(item.coord.x, item.coord.y)
          );
        }
      });
    };

    Stage.prototype.getItemsByType = function (this: StageInst, type: number) {
      return this.items.filter((item) => item.type === type);
    };

    Stage.prototype.createMap = function (this: StageInst, opts?: MapParams) {
      const map = new Map(opts);
      map.data = JSON.parse(JSON.stringify(map._params.data)) as number[][];
      map.y_length = map.data.length;
      map.x_length = map.data[0].length;
      map.imageData = null;
      map._stage = this;
      map._id = this.maps.length;
      this.maps.push(map);
      return map;
    };

    Stage.prototype.resetMaps = function (this: StageInst) {
      this.status = 1;
      this.maps.forEach((map) => {
        Object.assign(map, map._settings, map._params);
        map.data = JSON.parse(JSON.stringify(map._params.data)) as number[][];
        map.y_length = map.data.length;
        map.x_length = map.data[0].length;
        map.imageData = null;
      });
    };

    Stage.prototype.reset = function (this: StageInst) {
      Object.assign(this, this._settings, this._params);
      this.resetItems();
      this.resetMaps();
    };

    Stage.prototype.bind = function (
      this: StageInst,
      eventType: string,
      callback: (e: Event) => void
    ) {
      if (!self.events[eventType]) {
        self.events[eventType] = {};
        const handler = (e: Event) => {
          const key = `s${self.index}`;
          if (self.events[eventType][key]) {
            (self.events[eventType][key] as (ev: Event) => void)(e);
          }
          e.preventDefault();
        };
        self.windowHandlers[eventType] = handler;
        window.addEventListener(eventType, handler);
      }
      self.events[eventType][`s${this.index}`] = callback.bind(this);
    };

    const stage = new Stage(options);
    stage.index = this.stages.length;
    this.stages.push(stage);
    return stage;
  }

  setStage(index: number): StageInst {
    this.stages[this.index].status = 0;
    this.index = index;
    this.stages[this.index].status = 1;
    this.stages[this.index].reset();
    return this.stages[this.index];
  }

  nextStage(): StageInst {
    if (this.index < this.stages.length - 1) {
      return this.setStage(this.index + 1);
    }
    throw new Error('unfound new stage.');
  }

  getStages(): StageInst[] {
    return this.stages;
  }

  init(): void {
    this.index = 0;
    this.start();
  }

  start(): void {
    let f = 0;
    let timestamp = Date.now();
    const _ = this;
    const fn = () => {
      if (_.destroyed) return;
      const now = Date.now();
      if (now - timestamp < 16) {
        _.hander = requestAnimationFrame(fn);
        return;
      }
      timestamp = now;
      const stage = _.stages[_.index];
      _.context.clearRect(0, 0, _.width, _.height);
      _.context.fillStyle = '#000000';
      _.context.fillRect(0, 0, _.width, _.height);
      f++;
      if (stage.timeout) {
        stage.timeout--;
      }
      if (stage.update() !== false) {
        stage.maps.forEach((map) => {
          if (!(f % map.frames)) {
            map.times = f / map.frames;
          }
          if (map.cache) {
            if (!map.imageData) {
              _.context.save();
              map.draw(_.context);
              map.imageData = _.context.getImageData(0, 0, _.width, _.height);
              _.context.restore();
            } else {
              _.context.putImageData(map.imageData, 0, 0);
            }
          } else {
            map.update();
            map.draw(_.context);
          }
        });
        stage.items.forEach((item) => {
          if (!(f % item.frames)) {
            item.times = f / item.frames;
          }
          if (stage.status === 1 && item.status !== 2) {
            if (item.location) {
              item.coord = item.location.position2coord(item.x, item.y);
            }
            if (item.timeout) {
              item.timeout--;
            }
            item.update();
          }
          item.draw(_.context);
        });
      }
      _.hander = requestAnimationFrame(fn);
    };
    this.hander = requestAnimationFrame(fn);
  }

  stop(): void {
    if (this.hander !== undefined) {
      cancelAnimationFrame(this.hander);
    }
  }
}
