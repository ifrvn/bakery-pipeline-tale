import { createPixiApp } from '../engine/pixi/createPixiApp';

function createResizeObserver(container, onResize) {
  const ro = new ResizeObserver(() => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    onResize(width, height);
  });
  ro.observe(container);
  return ro;
}

function normalizeSceneController(sceneCtl) {
  return {
    api: sceneCtl?.api ?? null,
    setSize: (...args) => sceneCtl?.setSize?.(...args),
    update: (...args) => sceneCtl?.update?.(...args),
    dispose: (...args) => sceneCtl?.dispose?.(...args),
  };
}

export async function createGameApp(container, createScene) {
  const rect = container.getBoundingClientRect();
  let width = Math.max(1, Math.floor(rect.width));
  let height = Math.max(1, Math.floor(rect.height));
  let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  const pixi = await createPixiApp(container, { width, height, dpr });
  const app = pixi.app;

  const sceneCtlRaw = await Promise.resolve(createScene({ width, height, dpr, app }));
  const sceneCtl = normalizeSceneController(sceneCtlRaw);

  function setSize(nextWidth, nextHeight) {
    width = nextWidth;
    height = nextHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    sceneCtl.setSize(width, height, dpr);
    pixi.setSize(width, height, dpr);
  }

  const ro = createResizeObserver(container, setSize);
  setSize(width, height);

  let running = false;
  app.ticker.stop();

  function onTick() {
    if (!running) return;
    const dt = Math.min((app.ticker.deltaMS || 0) / 1000, 0.05);
    sceneCtl.update(dt);
  }

  app.ticker.add(onTick);

  function start() {
    if (running) return;
    running = true;
    app.ticker.start();
  }

  function stop() {
    running = false;
    app.ticker.stop();
  }

  function dispose() {
    stop();
    ro.disconnect();
    sceneCtl.dispose();
    pixi.destroy();
  }

  return {
    start,
    stop,
    dispose,
    sceneCtl,
  };
}
