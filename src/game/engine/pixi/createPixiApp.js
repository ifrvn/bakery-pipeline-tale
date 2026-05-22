export async function createPixiApp(container, options) {
  const { Application } = await import('pixi.js');

  const width = Math.max(1, Math.floor(options?.width ?? 1));
  const height = Math.max(1, Math.floor(options?.height ?? 1));
  const dpr = Math.min(options?.dpr ?? (window.devicePixelRatio || 1), 1.5);

  let app = null;
  app = new Application();
  await app.init({
    width,
    height,
    antialias: true,
    backgroundAlpha: 0,
    resolution: dpr,
    autoDensity: true,
  });

  const view = app.canvas;
  view.style.width = '100%';
  view.style.height = '100%';
  view.style.display = 'block';
  view.style.touchAction = 'none';
  container.appendChild(view);

  function setSize(nextWidth, nextHeight, nextDpr) {
    const w = Math.max(1, Math.floor(nextWidth));
    const h = Math.max(1, Math.floor(nextHeight));
    const r = Math.min(nextDpr ?? (window.devicePixelRatio || 1), 1.5);
    app.renderer.resolution = r;
    app.renderer.resize(w, h);
  }

  function destroy() {
    try {
      app.destroy(true);
    } catch {
      try {
        app.destroy?.(true, { children: true, texture: true, baseTexture: true });
      } catch {
        app.destroy?.();
      }
    }
    view.remove();
  }

  return { app, view, setSize, destroy };
}
